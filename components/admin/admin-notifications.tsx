"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { ShoppingCart } from "lucide-react"

export function AdminNotifications() {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio("/sounds/purchase.mp3")

        // Subscribe to NEW orders
        const channel = supabase
            .channel('admin-order-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    const newOrder = payload.new

                    // 1. Play "Cha-ching" sound
                    if (audioRef.current) {
                        audioRef.current.play().catch(e => console.log("Audio play blocked by browser. Interact with page first."))
                    }

                    // 2. Show Premium Toast
                    toast.custom((t) => (
                        <div className="bg-primary hover:bg-primary/90 text-primary-foreground p-6 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/20 animate-in slide-in-from-top-full duration-500">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce">
                                <ShoppingCart className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xl font-black mb-1">NEW ORDER! 🛍️</p>
                                <p className="text-sm opacity-90 font-medium">
                                    Order #{newOrder.order_number} received from {newOrder.customer_name || 'Guest'}
                                </p>
                                <p className="text-lg font-bold mt-1">MAD {newOrder.total}</p>
                            </div>
                            <button
                                onClick={() => {
                                    toast.dismiss(t)
                                    window.location.href = `/admin/orders/${newOrder.id}`
                                }}
                                className="px-6 py-2 rounded-xl bg-white text-primary font-black text-sm hover:scale-105 transition-transform"
                            >
                                View
                            </button>
                        </div>
                    ), {
                        duration: 10000, // Show for 10 seconds
                        position: 'top-center'
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return null // Invisible component
}
