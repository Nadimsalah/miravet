import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const accountManagerId = req.headers.get('x-account-manager-id') || searchParams.get('amId')

        if (!accountManagerId) {
            return NextResponse.json({ error: 'Account Manager ID required' }, { status: 400 })
        }

        // Fetch assigned IDs with metadata to identify "Global Digital" assignments
        console.log('Fetching orders for AM:', accountManagerId)
        const { data: assignments, error: amError } = await supabaseAdmin
            .from('account_manager_assignments')
            .select(`
                reseller_id, 
                customer_id,
                reseller:resellers(company_name)
            `)
            .eq('account_manager_id', accountManagerId)
            .is('soft_deleted_at', null)

        if (amError) throw amError

        console.log('AM Assignments:', JSON.stringify(assignments))

        const resellerIds = assignments?.map((r: any) => r.reseller_id).filter(Boolean) || []
        const customerIds = assignments?.map((r: any) => r.customer_id).filter(Boolean) || []

        // Special logic: If assigned to "CLIENTS DIGITAUX", also fetch guest orders (reseller_id IS NULL)
        const isGlobalDigitalManager = assignments?.some((r: any) =>
            r.reseller?.company_name?.toUpperCase().includes('DIGITAUX') ||
            r.reseller?.company_name?.toUpperCase().includes('DIGITAL GLOBAL')
        )

        console.log('Is Global Manager:', isGlobalDigitalManager)

        if (resellerIds.length === 0 && customerIds.length === 0 && !isGlobalDigitalManager) {
            console.log('No assignments found for AM')
            return NextResponse.json({ orders: [] })
        }

        // Fetch emails associated with resellers
        let resellerEmails: string[] = []
        if (resellerIds.length > 0) {
            const { data: resellerProfiles } = await supabaseAdmin
                .from('resellers')
                .select('user_id, profile:profiles(email)')
                .in('id', resellerIds)

            resellerEmails = resellerProfiles
                ?.map((r: any) => r.profile?.email)
                .filter(Boolean) || []
        }

        // Build the query
        let query = supabaseAdmin
            .from('orders')
            .select(`
                *,
                reseller:resellers (*)
            `)
            .order('created_at', { ascending: false })

        // Combine all filters using OR
        const orConditions: string[] = []

        if (resellerIds.length > 0) {
            orConditions.push(`reseller_id.in.(${resellerIds.join(',')})`)
        }

        if (customerIds.length > 0) {
            orConditions.push(`customer_id.in.(${customerIds.join(',')})`)
        }

        if (resellerEmails.length > 0) {
            const emailsStr = resellerEmails.map(e => `"${e}"`).join(',')
            orConditions.push(`customer_email.in.(${emailsStr})`)
        }

        // If global, include null reseller_id
        if (isGlobalDigitalManager) {
            orConditions.push(`reseller_id.is.null`)
        }

        console.log('OR Conditions:', orConditions.join(','))

        if (orConditions.length > 0) {
            query = query.or(orConditions.join(','))
        } else {
            return NextResponse.json({ orders: [] })
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ orders: data })
    } catch (error: any) {
        console.error('Fetch Orders Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
