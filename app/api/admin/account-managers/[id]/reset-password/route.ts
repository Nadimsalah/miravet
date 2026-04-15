import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { password } = await req.json()

        if (!id || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Update user in auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: password,
            // Ensure email is confirmed and they are not banned
            email_confirm: true,
            ban_duration: 'none'
        })

        if (authError) throw authError

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully'
        })
    } catch (error: any) {
        console.error('Reset Password Manager Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
