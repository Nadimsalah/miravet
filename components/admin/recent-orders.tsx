"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { getOrders, type Order } from "@/lib/supabase-api"
import { useLanguage } from "@/components/language-provider"
import { formatPrice } from "@/lib/utils"

export function RecentOrders() {
    const { t } = useLanguage()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadRecentOrders() {
            try {
                const response = await getOrders({ limit: 5 })
                // getOrders returns { data, count }
                setOrders(response.data || [])
            } catch (error) {
                console.error("Failed to load recent orders:", error)
            } finally {
                setLoading(false)
            }
        }
        loadRecentOrders()
    }, [])

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
            case "cancelled": return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    const getStatusLabel = (status: string) => {
        const key = `order.status.${status.toLowerCase()}`
        return t(key)
    }

    return (
        <div className="glass rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{t("admin.dashboard.recent_orders.title")}</h3>
                <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        {t("admin.dashboard.recent_orders.view_all")}
                    </Button>
                </Link>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground animate-pulse">
                        {t("admin.dashboard.recent_orders.loading")}
                    </div>
                ) : orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order.id} className="bg-background/50 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-foreground">#{order.order_number}</div>
                                    <div className="text-xs text-muted-foreground">{order.customer_name}</div>
                                    <div className="text-[10px] text-muted-foreground/60 truncate max-w-[150px]">{order.customer_email}</div>
                                </div>
                                <Badge variant="outline" className={`border-0 ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="font-semibold text-foreground">MAD {formatPrice(order.total)}</div>
                                <Link href={`/admin/orders/${order.id}`}>
                                    <Button size="sm" variant="outline" className="h-8 text-xs">View</Button>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        {t("admin.dashboard.recent_orders.empty")}
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50 text-left">
                            <th className="pb-3 text-sm font-medium text-muted-foreground pl-2">
                                {t("admin.dashboard.recent_orders.col_order_id")}
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                                {t("admin.dashboard.recent_orders.col_customer")}
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                                {t("admin.dashboard.recent_orders.col_email")}
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">
                                {t("admin.dashboard.recent_orders.col_amount")}
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">
                                {t("admin.dashboard.recent_orders.col_status")}
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground text-right pr-2">
                                {t("admin.dashboard.recent_orders.col_action")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground animate-pulse">
                                    {t("admin.dashboard.recent_orders.loading")}
                                </td>
                            </tr>
                        ) : orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id} className="group hover:bg-primary/5 transition-colors">
                                    <td className="py-4 pl-2 font-medium text-foreground text-xs sm:text-base">{order.order_number}</td>
                                    <td className="py-4 text-foreground/80 hidden sm:table-cell">{order.customer_name}</td>
                                    <td className="py-4 text-sm text-muted-foreground max-w-[200px] truncate hidden md:table-cell">{order.customer_email}</td>
                                    <td className="py-4 font-semibold text-foreground text-xs sm:text-base">MAD {formatPrice(order.total)}</td>
                                    <td className="py-4">
                                        <Badge variant="outline" className={`border-0 ${getStatusColor(order.status)} text-[10px] sm:text-xs`}>
                                            {getStatusLabel(order.status)}
                                        </Badge>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10">
                                                <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                    {t("admin.dashboard.recent_orders.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
