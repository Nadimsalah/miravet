"use client"

import { useState, useEffect } from "react"
import { Bell, Shield, Smartphone, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getAdminSettings } from "@/lib/supabase-api"

function urlBase64ToUint8Array(base64String: any) {
    if (typeof base64String !== 'string') {
        throw new Error("VAPID public key must be a string");
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function checkSettings() {
            // 1. Only run on client and if supported
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.log('Push notifications not supported on this browser')
                return
            }

            // 2. Fetch global setting
            const adminSettings = await getAdminSettings()
            if (adminSettings.push_notifications_enabled !== "true") {
                return
            }

            // 3. Check current permission
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => setShowPrompt(true), 3000)
                return () => clearTimeout(timer)
            }
        }

        checkSettings()

        // Listen for manual trigger
        const handleManualTrigger = () => setShowPrompt(true)
        window.addEventListener('show-push-prompt', handleManualTrigger)
        return () => window.removeEventListener('show-push-prompt', handleManualTrigger)
    }, [])

    async function subscribeToPush() {
        setIsLoading(true)
        try {
            // 1. Request permission
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                throw new Error('Permission not granted')
            }

            // 2. Register and wait for service worker
            await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            })

            // Ensure it's active before subscribing
            const registration = await navigator.serviceWorker.ready;

            // 3. Subscribe to push manager
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) {
                throw new Error('VAPID public key is not configured')
            }

            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            }

            const subscription = await registration.pushManager.subscribe(subscribeOptions)

            // 4. Send subscription to server
            const response = await fetch('/api/admin/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            if (!response.ok) {
                throw new Error('Failed to save subscription on server')
            }

            toast.success("Push notifications enabled!")
            setShowPrompt(false)
        } catch (error: any) {
            console.error('Subscription failed:', error)
            toast.error(error.message || "Failed to enable notifications")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent className="sm:max-w-md glass-strong border-white/10 rounded-3xl overflow-hidden shadow-2xl p-0">
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex flex-col items-center text-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                            <Bell className="w-10 h-10 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-background flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div>
                        <DialogTitle className="text-2xl font-black text-foreground mb-2">
                            Orders Notifications
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Wanna receive order notifications on your mobile? Get instant alerts for new orders with details and pricing.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <Smartphone className="w-8 h-8 text-primary shrink-0" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <p className="font-bold text-foreground mb-1">Mobile Push Technology</p>
                            Works on Android (Chrome) and iOS 16.4+ (Safari when added to Home Screen).
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={subscribeToPush}
                            className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : null}
                            {isLoading ? 'Enabling...' : 'Yes, Notify Me!'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowPrompt(false)}
                            className="w-full rounded-xl text-muted-foreground hover:text-foreground"
                            disabled={isLoading}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
