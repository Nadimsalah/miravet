import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const accountManagerId = req.headers.get('x-account-manager-id') || searchParams.get('amId')

        if (!accountManagerId) {
            return NextResponse.json({ error: 'Account Manager ID required' }, { status: 400 })
        }

        // Fetch active assignments for this account manager
        const { data: assignments, error: assignError } = await supabaseAdmin
            .from('account_manager_assignments')
            .select('reseller_id')
            .eq('account_manager_id', accountManagerId)
            .is('soft_deleted_at', null)

        if (assignError) throw assignError

        const resellerIds = assignments?.map(a => a.reseller_id) || []

        // Fetch resellers details
        const { data: rawResellers, error } = await supabaseAdmin
            .from('resellers')
            .select(`
                *,
                user:profiles!user_id (name, email, phone)
            `)
            .in('id', resellerIds)

        if (error) throw error

        // Fetch customer records to bridge potential sync gaps
        const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('id, city, company_name, phone')
            .in('id', rawResellers.map(r => r.user_id))

        // Merge data for resilience
        const resellers = rawResellers.map(r => {
            const customer = customers?.find(c => c.id === r.user_id)
            return {
                ...r,
                company_name: r.company_name && r.company_name !== 'Personal Account' ? r.company_name : (customer?.company_name || r.company_name),
                city: r.city || customer?.city || "Unknown",
                phone: r.phone || customer?.phone || r.user?.phone || "N/A"
            }
        })

        return NextResponse.json({ resellers })
    } catch (error: any) {
        console.error('Fetch Resellers Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
