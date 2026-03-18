import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { getAdminSettings } from './supabase-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseServiceRole)

// Configure VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@dedali.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export async function sendPushNotification(payload: {
    title: string
    body: string
    url?: string
    tag?: string
}) {
    try {
        // 0. Check global setting
        const settings = await getAdminSettings()
        if (settings.push_notifications_enabled !== "true") {
            return { message: 'Push notifications are globally disabled in settings' }
        }

        // 1. Fetch all subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')

        if (error) throw error

        if (!subscriptions || subscriptions.length === 0) {
            return { message: 'No subscribers found' }
        }

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/admin/orders',
            tag: payload.tag || 'new-order'
        })

        const notifications = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }

            try {
                await webpush.sendNotification(pushSubscription, notificationPayload)
                return { success: true, endpoint: sub.endpoint }
            } catch (err: any) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    console.log('Push subscription expired:', sub.endpoint)
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                }
                return { success: false, endpoint: sub.endpoint, error: err.message }
            }
        })

        const results = await Promise.all(notifications)
        const successCount = results.filter(r => r.success).length

        return {
            success: true,
            sent: successCount,
            total: subscriptions.length
        }
    } catch (error: any) {
        console.error('Push Notification Error:', error)
        return { error: error.message }
    }
}
