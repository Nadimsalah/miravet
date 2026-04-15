import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params
        const { note, accountManagerId } = await req.json()

        if (!note || !accountManagerId) {
            return NextResponse.json({ error: 'Note and Account Manager ID required' }, { status: 400 })
        }

        // 1. Verify alignment
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('reseller_id')
            .eq('id', orderId)
            .single()

        if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

        // Check user role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', accountManagerId)
            .single()

        const role = profile?.role || ''
        const isAdmin = role === 'ADMIN'
        const isManager = role === 'ACCOUNT_MANAGER'

        if (!isAdmin) {
            // If Direct Order (no reseller), allow Managers to annotate
            if (!order.reseller_id && isManager) {
                // Allow
            } else if (order.reseller_id) {
                // If Reseller Order, MUST be assigned
                const { data: assignment, error: assignError } = await supabaseAdmin
                    .from('account_manager_assignments')
                    .select('id')
                    .eq('account_manager_id', accountManagerId)
                    .eq('reseller_id', order.reseller_id)
                    .is('soft_deleted_at', null)
                    .single()

                if (assignError || !assignment) return NextResponse.json({ error: 'Unauthorized: You are not assigned to this reseller.' }, { status: 403 })
            } else {
                // No reseller_id AND not account manager? (e.g. Reseller trying to note?)
                // Generally block unless it's their own order? 
                // For now, assume only Admins/Managers interact here.
                if (!isManager) return NextResponse.json({ error: 'Unauthorized: Only Staff can add notes.' }, { status: 403 })
            }
        }

        // 2. Add note
        const { data: newNote, error: noteError } = await supabaseAdmin
            .from('order_internal_notes')
            .insert({
                order_id: orderId,
                author_id: accountManagerId,
                note: note
            })
            .select()
            .single()

        if (noteError) throw noteError

        return NextResponse.json({ success: true, note: newNote })
    } catch (error: any) {
        console.error('Add Note Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params
        // Check assignment same as above if needed, or rely on RLS if we had sessions
        // For now, simple fetch (Admins and assigned AMs only according to logic)

        const { data, error } = await supabaseAdmin
            .from('order_internal_notes')
            .select(`
                *,
                author:profiles (name)
            `)
            .eq('order_id', orderId)
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json({ notes: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
