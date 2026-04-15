import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { managerId, newGoal } = body

        if (!managerId || newGoal === undefined) {
            return NextResponse.json(
                { error: 'Missing managerId or newGoal' },
                { status: 400 }
            )
        }

        // Update the profile using supabaseAdmin
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ prime_target_revenue: newGoal })
            .eq('id', managerId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
