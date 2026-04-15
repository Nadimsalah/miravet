import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
    try {
        const { email, password, name, phone } = await req.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create user in auth.users
        const normalizedEmail = email.trim().toLowerCase()
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'ACCOUNT_MANAGER',
                phone: phone
            }
        })

        if (authError) throw authError

        // Note: The public.profiles record is created automatically by the database trigger
        // we defined in the migration.

        return NextResponse.json({
            success: true,
            message: 'Account Manager created successfully',
            user: userData.user
        })
    } catch (error: any) {
        console.error('Create Account Manager Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
