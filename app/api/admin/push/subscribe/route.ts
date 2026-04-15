import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Use service role for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceRole)

export async function POST(req: Request) {
    try {
        const subscription = await req.json()
        const userAgent = req.headers.get('user-agent')

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: subscription.endpoint,
                p256dh: subscription.keys?.p256dh,
                auth: subscription.keys?.auth,
                user_agent: userAgent
            }, {
                onConflict: 'endpoint'
            })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Push Subscription Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
