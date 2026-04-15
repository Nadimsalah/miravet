import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params
        const { status, accountManagerId } = await req.json()

        if (!status || !accountManagerId) {
            return NextResponse.json({ error: 'Status and Account Manager ID required' }, { status: 400 })
        }

        // 1. Verify this AM is assigned to the reseller of this order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, reseller_id, customer_id')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        let effectiveResellerId = order.reseller_id

        // If reseller_id is missing, try to find it via customer_id
        if (!effectiveResellerId && order.customer_id) {
            const { data: resellerData } = await supabaseAdmin
                .from('resellers')
                .select('id')
                .eq('user_id', order.customer_id)
                .maybeSingle()

            if (resellerData) {
                effectiveResellerId = resellerData.id
            }
        }

        if (!effectiveResellerId) {
            return NextResponse.json({ error: 'Order is not associated with a reseller' }, { status: 403 })
        }

        const { data: assignment, error: assignError } = await supabaseAdmin
            .from('account_manager_assignments')
            .select('id')
            .eq('account_manager_id', accountManagerId)
            .eq('reseller_id', effectiveResellerId)
            .is('soft_deleted_at', null)
            .maybeSingle()

        if (assignError || !assignment) {
            return NextResponse.json({ error: 'Unauthorized: Not assigned to this reseller' }, { status: 403 })
        }

        // 2. Update status (trigger will log the change)
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single()

        if (updateError) {
            // Handle the common "changed_by" constraint error if migrations weren't run
            if (updateError.message.includes('changed_by')) {
                return NextResponse.json({
                    error: 'Database Update Failed: The audit log requires a "changed_by" ID. Please follow the instructions to run the fix_status_log_constraint.sql migration.',
                    code: 'MIGRATION_REQUIRED'
                }, { status: 500 })
            }
            throw updateError
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated',
            order: updatedOrder
        })
    } catch (error: any) {
        console.error('Update Order Status Error:', error)
        return NextResponse.json({
            error: error.message,
            details: error.details || null
        }, { status: 500 })
    }
}
