"use client"

import { useState, useEffect } from "react"
import { Bell, ShoppingBag, User, Package, Clock, CheckCircle2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { getOrders, type Order } from "@/lib/supabase-api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        async function loadNotifications() {
            try {
                // Fetch recent orders as proxy for notifications
                const response = await getOrders({ limit: 5 })
                const orders = response.data || []

                const mappedNotifications = orders.map((order: Order) => ({
                    id: order.id,
                    type: 'order',
                    title: 'New Order Received',
                    description: `Order ${order.order_number} from ${order.customer_name}`,
                    time: order.created_at,
                    status: order.status,
                    link: `/admin/orders/${order.id}`
                }))

                setNotifications(mappedNotifications)
                // For now, consider all fetched as "unread" in this session for demo purposes
                setUnreadCount(mappedNotifications.length)
            } catch (error) {
                console.error("Failed to load notifications:", error)
            } finally {
                setLoading(false)
            }
        }

        loadNotifications()
    }, [])

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingBag className="w-4 h-4 text-primary" />
            case 'user': return <User className="w-4 h-4 text-blue-500" />
            case 'product': return <Package className="w-4 h-4 text-orange-500" />
            default: return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-primary/10 transition-colors">
                    <Bell className="w-5 h-5 text-red-500" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-destructive text-[10px] font-bold text-white rounded-full ring-2 ring-background flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 mr-4 sm:mr-0 p-0 glass-strong border-white/10 rounded-3xl overflow-hidden shadow-2xl" align="end">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h4 className="font-bold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => setUnreadCount(0)}
                            className="text-[10px] font-semibold text-primary hover:underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                            Loading notifications...
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.link}
                                    className="p-4 flex gap-3 hover:bg-white/5 transition-colors group block"
                                >
                                    <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground leading-none">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notif.time), { addSuffix: true })}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${notif.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                                'bg-primary/10 text-primary'
                                                }`}>
                                                {notif.status}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <CheckCircle2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm font-medium text-foreground">All caught up!</p>
                            <p className="text-xs text-muted-foreground mt-1">No new notifications at the moment.</p>
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <Link href="/admin/orders" className="block p-3 text-center text-xs font-semibold hover:bg-white/5 border-t border-white/5 transition-colors">
                        View all orders
                    </Link>
                )}
            </PopoverContent>
        </Popover>
    )
}
