import { NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push-notifications'

export async function POST(req: Request) {
    try {
        const { title, body, url, tag } = await req.json()

        const result = await sendPushNotification({
            title: title || 'Test Notification 🔔',
            body: body || 'This is a test notification from Miravet.',
            url: url || '/admin/dashboard',
            tag: tag || 'test-push'
        })

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            sent: result.sent,
            total: result.total
        })
    } catch (error: any) {
        console.error('Push Notification Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
