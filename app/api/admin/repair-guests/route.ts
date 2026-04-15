import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
    try {
        console.log('Starting Repair Job...')
        const logs = []
        logs.push('Starting Guest Account Repair...')

        // 1. Get all orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')

        if (ordersError) throw ordersError;

        logs.push(`Found ${orders?.length || 0} orders to scan.`)

        let fixedCount = 0;
        let createdCount = 0;

        for (const order of orders || []) {
            // Check if we need to fix this order
            // Fix if:
            // 1. No customer_id
            // 2. HAS customer_id but that customer doesn't exist (integrity check)

            let shouldProcess = !order.customer_id;

            if (!shouldProcess) {
                // Verify existence
                const { data: check } = await supabaseAdmin
                    .from('customers')
                    .select('id')
                    .eq('id', order.customer_id)
                    .maybeSingle()
                if (!check) shouldProcess = true;
            }

            if (shouldProcess) {
                logs.push(`Processing unlinked Order ${order.order_number} (${order.customer_email})`)

                const normalizedEmail = order.customer_email.toLowerCase().trim()

                // Check if customer exists by email
                const { data: customer } = await supabaseAdmin
                    .from('customers')
                    .select('*')
                    .eq('email', normalizedEmail)
                    .maybeSingle()

                if (!customer) {
                    logs.push(`  Creating new guest record for ${normalizedEmail}`)
                    const { data: newCust, error: createError } = await supabaseAdmin
                        .from('customers')
                        .insert({
                            name: order.customer_name,
                            email: normalizedEmail,
                            phone: order.customer_phone,
                            role: 'customer',
                            status: 'active',
                            total_orders: 1,
                            total_spent: order.total
                        })
                        .select()
                        .single()

                    if (newCust) {
                        await supabaseAdmin.from('orders').update({ customer_id: newCust.id }).eq('id', order.id)
                        createdCount++;
                    } else {
                        logs.push(`  Failed to create customer: ${createError?.message}`)
                    }
                } else {
                    logs.push(`  Linking to existing customer ${customer.id}`)
                    await supabaseAdmin.from('orders').update({ customer_id: customer.id }).eq('id', order.id)
                    fixedCount++;
                }
            }
        }

        // 2. Recalculate Stats for ALL customers to be safe
        logs.push('Recalculating global stats...')
        const { data: allCustomers } = await supabaseAdmin.from('customers').select('id')
        if (allCustomers) {
            for (const c of allCustomers) {
                const { data: cOrders } = await supabaseAdmin.from('orders').select('total').eq('customer_id', c.id)
                if (cOrders) {
                    const totalOrders = cOrders.length;
                    const totalSpent = cOrders.reduce((sum, o) => sum + Number(o.total), 0)
                    await supabaseAdmin.from('customers').update({ total_orders: totalOrders, total_spent: totalSpent }).eq('id', c.id)
                }
            }
        }

        logs.push(`Repair Complete. Created ${createdCount} new profiles. Linked ${fixedCount} existing profiles.`)

        return NextResponse.json({ success: true, logs })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
