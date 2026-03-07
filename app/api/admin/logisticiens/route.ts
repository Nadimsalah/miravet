import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
    try {
        const { email, phone, password, name, city } = await req.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields (email, password, name)' }, { status: 400 })
        }

        // 1. Create User in Supabase Auth
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'DELIVERY_MAN',
                city: city,
                phone: phone
            }
        })

        if (authError) throw authError

        // 2. Explicitly insert into profiles
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: userData.user.id,
            name: name,
            role: 'DELIVERY_MAN',
            city: city,
            phone: phone,
            email: email
        })

        if (profileError) throw profileError

        return NextResponse.json({
            success: true,
            message: 'Logisticien créé avec succès',
            user: userData.user
        })
    } catch (error: any) {
        console.error('Create Logisticien Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', 'DELIVERY_MAN')

        if (error) throw error

        return NextResponse.json({ success: true, deliveryMen: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
