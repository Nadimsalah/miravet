'use server'

import { supabaseAdmin } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAdmin(orderId: string, status: string, actorId?: string | null, deliveryManId?: string) {
    console.log(`[Admin Action] Updating order ${orderId} to status: ${status} by ${actorId || 'system'}`)

    if (!orderId) return { error: "Order ID is required" }

    try {
        // 1. Get Old Status for Log
        let oldStatus = 'unknown'
        try {
            const { data: oldOrder, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single()

            if (fetchError) {
                console.error('[Admin Action] Error fetching old status:', fetchError)
            } else {
                oldStatus = oldOrder?.status || 'unknown'
            }
        } catch (err) {
            console.error('[Admin Action] Exception fetching old status:', err)
        }

        // 2. Update Order Status
        const updateData: any = {
            status: status,
            updated_at: new Date().toISOString()
        }

        if (deliveryManId) {
            updateData.delivery_man_id = deliveryManId
            updateData.delivery_assigned_at = new Date().toISOString()
        }

        const { data: updateResults, error } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()

        if (error) {
            console.error('[Admin Action] Error updating order status:', error)
            return { error: error.message }
        }

        if (!updateResults || updateResults.length === 0) {
            console.warn('[Admin Action] No rows were updated. Check if the SUPABASE_SERVICE_ROLE_KEY is correctly set in .env.local.')
            return { error: "Update failed. No changes were applied (possible permission issue or missing service key)." }
        }

        const data = updateResults[0]
        console.log('[Admin Action] Update successful. New data:', data)

        // 3. Manually Insert Log (Trusting the provided actorId)
        if (actorId) {
            try {
                const { error: logError } = await supabaseAdmin.from('order_status_logs').insert({
                    order_id: orderId,
                    changed_by: actorId,
                    old_status: oldStatus,
                    new_status: status
                })
                if (logError) console.error('[Admin Action] Error inserting log:', logError)
            } catch (logEx) {
                console.error('[Admin Action] Exception inserting log:', logEx)
            }
        }

        try {
            revalidatePath('/admin/orders/[id]')
            revalidatePath('/manager/orders/[orderId]')
        } catch (revalError) {
            console.error('[Admin Action] Revalidation failed (non-critical):', revalError)
        }

        return { success: true, data }
    } catch (e: any) {
        console.error('[Admin Action] CRITICAL Unexpected error:', e)
        return { error: e.message || 'An unexpected error occurred' }
    }
}

export async function getOrderDetailsAdmin(orderId: string) {
    console.log(`[Admin Action] Fetching order details for: ${orderId}`)
    try {
        // Fetch Order with relations
        console.log('[Admin Action] querying orders table...')
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                reseller:resellers (
                    id,
                    company_name,
                    profile:profiles (name, email, phone)
                )
            `)
            .eq('id', orderId)
            .single()

        if (orderError) throw orderError
        if (!order) throw new Error('Order not found')

        // Fetch Items
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select(`
                *,
                product:products (
                    id,
                    warehouse_id
                )
            `)
            .eq('order_id', orderId)

        if (itemsError) throw itemsError

        // Fetch Notes
        let notes: any[] = []
        try {
            const { data: notesData, error: notesError } = await supabaseAdmin
                .from('order_internal_notes')
                .select('*, author:profiles(name)')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false })

            if (notesError) {
                console.error('[Admin Action] Error fetching notes:', notesError.message)
            } else {
                notes = notesData || []
            }
        } catch (err) {
            console.error('[Admin Action] Exception fetching notes:', err)
        }

        // Fetch Logs
        let logs: any[] = []
        try {
            const { data: logsData, error: logsError } = await supabaseAdmin
                .from('order_status_logs')
                .select('*, changed_by_user:profiles(name)')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false })

            if (logsError) {
                console.error('[Admin Action] Error fetching logs:', logsError.message)
            } else {
                logs = logsData || []
            }
        } catch (err) {
            console.error('[Admin Action] Exception fetching logs:', err)
        }

        // ----------------------------------------------------
        // BUILD VIEW MODEL (Flattened & Guaranteed Data)
        // ----------------------------------------------------

        // 1. Determine Company Name & Reseller Name
        let companyName = "Direct Customer"
        let resellerName = "None"

        // Logical Flow:
        // A. Has Direct Reseller Link -> Use it
        // B. Has Reseller ID but Link Failed -> Manual Fetch
        // C. Smart Discovery via Email -> If email matches a Reseller profile, use that info
        // D. Fallback -> Customer Name

        if (order.reseller) {
            companyName = order.reseller.company_name || "Un-named Company"
            const pName = Array.isArray(order.reseller.profile)
                ? order.reseller.profile[0]?.name
                : order.reseller.profile?.name
            resellerName = pName || "Unknown Reseller"
        } else if (order.reseller_id) {
            // Fallback for ID-only case
            try {
                const { data: rData } = await supabaseAdmin
                    .from('resellers')
                    .select('company_name, profile:profiles(name)')
                    .eq('id', order.reseller_id)
                    .single()
                if (rData) {
                    companyName = rData.company_name || "Un-named Company"
                    // Fix: Profile handling
                    const profile: any = rData.profile
                    const pName = Array.isArray(profile)
                        ? profile[0]?.name
                        : profile?.name
                    resellerName = pName || "Unknown Reseller"
                    order.reseller = rData
                }
            } catch (err) { console.error("Fallback fetch failed", err) }
        } else if (order.customer_email) {
            // Smart Discovery: Check if the customer_email belongs to a reseller
            try {
                // 1. Find profile by email
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', order.customer_email)
                    .single()

                if (profile) {
                    // 2. Find reseller by user_id (profile id)
                    const { data: rData } = await supabaseAdmin
                        .from('resellers')
                        .select('id, company_name, profile:profiles(name)')
                        .eq('user_id', profile.id)
                        .single()

                    if (rData) {
                        companyName = rData.company_name || "Un-named Company"
                        const profile: any = rData.profile
                        const pName = Array.isArray(profile)
                            ? profile[0]?.name
                            : profile?.name
                        resellerName = pName || "Unknown Reseller"
                        order.reseller = rData
                    } else if (order.customer_name) {
                        companyName = order.customer_name
                    }
                } else if (order.customer_name) {
                    companyName = order.customer_name
                }
            } catch (err) {
                if (order.customer_name) companyName = order.customer_name
            }
        } else if (order.customer_name) {
            companyName = order.customer_name
        }

        // 2. Format Items
        const formattedItems = items.map((item: any) => ({
            ...item,
            image_url: item.product_image || null,
            final_price: item.price,
            warehouse_name: (item.product as any)?.warehouse?.name || (item.product as any)?.warehouse_id || "N/A"
        }))

        // 3. Return Clean Object
        return {
            success: true,
            data: {
                ...order,
                display_company_name: companyName,
                display_reseller_name: resellerName,
                items: formattedItems,
                notes,
                auditLogs: logs
            }
        }

    } catch (e: any) {
        console.error('[Admin Action] Error fetching order details:', e)
        return { error: e.message || 'Failed to fetch order details' }
    }
}
