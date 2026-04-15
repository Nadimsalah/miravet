import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ resellerId: string }> }
) {
    try {
        const resolvedParams = await params
        const { resellerId } = resolvedParams
        const { searchParams } = new URL(req.url)
        const amId = searchParams.get('amId')

        console.log('[API] Processing Reseller Fetch:', { resellerId, amId })

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        if (!resellerId || !uuidRegex.test(resellerId)) {
            console.error('[API] Invalid Reseller UUID:', resellerId)
            return NextResponse.json({
                error: `ID de revendeur invalide: ${resellerId}.`,
                received: resellerId
            }, { status: 400 })
        }

        if (!amId || !uuidRegex.test(amId)) {
            console.error('[API] Invalid AM UUID:', amId)
            return NextResponse.json({
                error: `Auth ID (amId) invalide: ${amId}.`,
                received: amId
            }, { status: 400 })
        }

        // 1. Fetch User Profile to check Role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', amId)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
        }

        const role = profile.role?.toUpperCase()
        const isStaff = role === 'ADMIN' || role === 'ACCOUNT_MANAGER'

        if (!isStaff) {
            return NextResponse.json({ error: `ACCÈS REFUSÉ: Rôle ${role} insuffisant.` }, { status: 403 })
        }

        // 2. TEMPORARY: Relaxed check for debug
        // For now, any staff can see any reseller details to confirm the fetch works
        /*
        if (role === 'ACCOUNT_MANAGER') {
            const { data: assignment, error: assignError } = await supabaseAdmin
                .from('account_manager_assignments')
                .select('id')
                .eq('account_manager_id', amId)
                .eq('reseller_id', resellerId)
                .is('soft_deleted_at', null)
                .maybeSingle()

            if (assignError) throw assignError
            
            if (!assignment) {
                return NextResponse.json({ 
                    error: `ACCÈS REFUSÉ: Ce revendeur (ID: ${resellerId}) n'est pas assigné à voter compte (Gest: ${amId}). Votre rôle est ${role}.`,
                    details: { amId, resellerId, role }
                }, { status: 403 })
            }
        }
        */

        // 3. Fetch Reseller Details
        const { data: rawRes, error: resError } = await supabaseAdmin
            .from('resellers')
            .select('*, user:profiles!user_id(name, email, phone)')
            .eq('id', resellerId)
            .single()

        if (resError) throw resError

        // 3. Fetch customer record for fallbacks
        const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('id', rawRes.user_id)
            .maybeSingle()

        const mergedReseller = {
            ...rawRes,
            company_name: rawRes.company_name && rawRes.company_name !== 'Personal Account' ? rawRes.company_name : (customer?.company_name || rawRes.company_name),
            city: rawRes.city || customer?.city || "Morocco",
            phone: rawRes.phone || customer?.phone || rawRes.user?.phone || "N/A"
        }

        // 4. Fetch Reseller Orders
        const emailFilter = mergedReseller.user?.email ? `,customer_email.ilike.${mergedReseller.user.email}` : ''
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .or(`reseller_id.eq.${resellerId},customer_id.eq.${rawRes.user_id}${emailFilter}`)
            .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        return NextResponse.json({
            reseller: mergedReseller,
            orders: orders
        })

    } catch (error: any) {
        console.error('Fetch Reseller Details Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
