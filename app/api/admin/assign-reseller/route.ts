import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
    try {
        const { accountManagerId, resellerId } = await req.json()

        if (!resellerId) {
            return NextResponse.json({ error: 'Missing resellerId' }, { status: 400 })
        }

        // 1. Soft delete existing assignments for this reseller if any
        const { error: deleteError } = await supabaseAdmin
            .from('account_manager_assignments')
            .update({ soft_deleted_at: new Date().toISOString() })
            .eq('reseller_id', resellerId)
            .is('soft_deleted_at', null)

        if (deleteError) throw deleteError

        // 2. Create or Update assignment if accountManagerId is provided
        let data = null
        if (accountManagerId) {
            const { data: assignData, error: assignError } = await supabaseAdmin
                .from('account_manager_assignments')
                .upsert({
                    account_manager_id: accountManagerId,
                    reseller_id: resellerId,
                    soft_deleted_at: null // Reactivate if it was soft-deleted
                }, {
                    onConflict: 'account_manager_id,reseller_id'
                })
                .select()
                .single()

            if (assignError) throw assignError
            data = assignData
        }

        return NextResponse.json({
            success: true,
            message: accountManagerId ? 'Reseller assigned successfully' : 'Reseller unassigned successfully',
            assignment: data
        })
    } catch (error: any) {
        console.error('Assign Reseller Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
