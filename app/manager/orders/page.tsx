"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Filter,
    ShoppingBag,
    ChevronLeft,
    Eye,
    ArrowUpDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    Truck,
    AlertCircle,
    MoreHorizontal
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MapPin } from "lucide-react"
import { updateOrderStatusAdmin } from "@/app/actions/admin-orders"

export default function MyOrdersPage() {
    const { t, setLanguage } = useLanguage()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [amId, setAmId] = useState<string | null>(null)

    const [isUpdating, setIsUpdating] = useState(false)

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Unauthorized")
            setAmId(user.id)

            const res = await fetch(`/api/manager/orders?amId=${user.id}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setOrders(data.orders)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (order: any, newStatus: string) => {
        const statusLower = newStatus.toLowerCase()
        if (statusLower === order.status) return
        await performStatusUpdate(order.id, statusLower)
    }

    const performStatusUpdate = async (orderId: string, status: string, deliveryManId?: string) => {
        setIsUpdating(true)
        try {
            const { success, error } = await updateOrderStatusAdmin(orderId, status, amId!, deliveryManId)
            if (error || !success) throw new Error(error || "Update failed")

            toast.success(`Statut mis à jour : ${status}`)

            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(false)
        }
    }

    const filtered = orders.filter(o => {


        const matchesSearch =
            o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || o.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />
            case 'processing': return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
            default: return <AlertCircle className="w-4 h-4 text-slate-400" />
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-6 rounded-[2rem] border border-white/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("manager.orders.title")}</h1>
                        <p className="text-sm text-slate-500">{t("manager.orders.subtitle")}</p>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-20">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-slate-50 p-1 rounded-xl">
                        {[
                            { key: 'all', label: t("manager.orders.filter_all") },
                            { key: 'pending', label: t("manager.orders.filter_pending") },
                            { key: 'processing', label: t("manager.orders.filter_processing") },
                            { key: 'shipped', label: t("manager.orders.filter_shipped") },
                            { key: 'delivered', label: t("manager.orders.filter_delivered") }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder={t("manager.orders.search_placeholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-10 rounded-xl bg-slate-50 border-0 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <th className="py-5 px-8">{t("manager.orders.order_number")}</th>
                                <th className="py-5 px-6">{t("manager.orders.customer")}</th>
                                <th className="py-5 px-6">{t("manager.orders.status")}</th>
                                <th className="py-5 px-6">{t("manager.orders.total")}</th>
                                <th className="py-5 px-6">{t("manager.orders.date")}</th>
                                <th className="py-5 px-8 text-right">{t("manager.orders.view")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center text-slate-400 animate-pulse font-medium">{t("manager.orders.loading")}</td></tr>
                            ) : filtered.length > 0 ? (
                                filtered.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-5 px-8">
                                            <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{o.order_number}</p>
                                        </td>
                                        <td className="py-5 px-6">
                                            <p className="font-medium text-slate-700">{o.reseller?.company_name || "Direct Customer"}</p>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(o.status)}
                                                <span className="text-sm font-bold capitalize">{t(`status.${o.status}`)}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 font-black text-slate-900">
                                            MAD {formatPrice(o.total)}
                                        </td>
                                        <td className="py-5 px-6 text-sm text-slate-500">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                        {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                                                            <DropdownMenuItem
                                                                key={s}
                                                                onClick={() => handleUpdateStatus(o, s)}
                                                                className="capitalize text-xs font-bold"
                                                            >
                                                                {t(`status.${s}`)}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Link href={`/manager/orders/${o.id}`}>
                                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                                        <Eye className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-40 text-center">
                                        <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900">{t("manager.orders.no_orders")}</h3>
                                        <p className="text-sm text-slate-500">{t("manager.orders.no_orders")}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
