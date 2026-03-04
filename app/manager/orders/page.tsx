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
import { getActiveDeliveryMen } from "@/app/actions/logisticiens"

export default function MyOrdersPage() {
    const { t, setLanguage } = useLanguage()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [amId, setAmId] = useState<string | null>(null)

    // Delivery Assignment State
    const [deliveryMen, setDeliveryMen] = useState<any[]>([])
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [selectedDeliveryId, setSelectedDeliveryId] = useState("")
    const [dmSearchQuery, setDmSearchQuery] = useState("")
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

        if (statusLower === 'shipped') {
            setSelectedOrder(order)
            setIsDeliveryModalOpen(true)
            if (deliveryMen.length === 0) {
                const { success, data, error } = await getActiveDeliveryMen()
                console.log("Fetching delivery men result:", { success, count: data?.length, error })
                if (success && data) {
                    setDeliveryMen(data)
                } else {
                    console.error("Failed to load delivery men:", error)
                    toast.error("Impossible de charger les logisticiens")
                }
            }
            return
        }

        await performStatusUpdate(order.id, statusLower)
    }

    const performStatusUpdate = async (orderId: string, status: string, deliveryManId?: string) => {
        setIsUpdating(true)
        try {
            const { success, error } = await updateOrderStatusAdmin(orderId, status, amId!, deliveryManId)
            if (error || !success) throw new Error(error || "Update failed")

            toast.success(`Statut mis à jour : ${status}`)
            setIsDeliveryModalOpen(false)
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

            {/* Delivery Assignment Modal */}
            {/* Rebuilt Assign Driver Modal */}
            <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
                <DialogContent className="rounded-[3rem] p-0 overflow-hidden max-w-[95%] sm:max-w-[500px] border-none shadow-2xl bg-white">
                    {/* Header Section */}
                    <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                                <Truck className="w-8 h-8 text-white" />
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight mb-2">Assigner un Logisticien</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-medium">
                                Sélectionnez le chauffeur qui prendra en charge la commande <span className="text-white font-black">#{selectedOrder?.order_number}</span>
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Search Section */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 transition-transform group-focus-within:scale-110" />
                            <Input
                                placeholder="Rechercher par nom ou ville..."
                                value={dmSearchQuery}
                                onChange={(e) => setDmSearchQuery(e.target.value)}
                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                            />
                        </div>

                        {/* Drivers List */}
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar py-2">
                            {deliveryMen
                                .filter(m =>
                                    (m.name || "").toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
                                    (m.city || "").toLowerCase().includes(dmSearchQuery.toLowerCase())
                                )
                                .map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedDeliveryId(m.id)}
                                        className={`w-full text-left p-5 rounded-[2rem] border-2 transition-all duration-300 flex items-center gap-4 relative group ${selectedDeliveryId === m.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.02] z-10'
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all shadow-sm ${selectedDeliveryId === m.id
                                            ? 'bg-white text-indigo-600 rotate-3'
                                            : 'bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:-rotate-3'
                                            }`}>
                                            {(m.name || "?").charAt(0).toUpperCase()}
                                        </div>

                                        {/* Driver Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-black text-lg truncate ${selectedDeliveryId === m.id ? 'text-white' : 'text-slate-900'
                                                }`}>
                                                {m.name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${selectedDeliveryId === m.id ? 'text-indigo-100' : 'text-slate-400'
                                                    }`}>
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {m.city || "Ville N/A"}
                                                </div>
                                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${selectedDeliveryId === m.id ? 'text-indigo-100' : 'text-slate-400'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${selectedDeliveryId === m.id ? 'bg-white' : 'bg-emerald-500'}`} />
                                                    Disponible
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selection mark */}
                                        {selectedDeliveryId === m.id && (
                                            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}

                            {deliveryMen.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                        <Truck className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-400 font-bold">Aucun logisticien disponible</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="p-8 pt-0">
                        <Button
                            className={`w-full h-16 rounded-[2rem] font-black text-xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${!selectedDeliveryId
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                                }`}
                            disabled={!selectedDeliveryId || isUpdating}
                            onClick={() => performStatusUpdate(selectedOrder?.id, 'shipped', selectedDeliveryId)}
                        >
                            {isUpdating ? (
                                <Loader2 className="w-7 h-7 animate-spin" />
                            ) : (
                                <>
                                    <span>Confirmer l'expédition</span>
                                    <ChevronRight className="w-6 h-6" />
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
