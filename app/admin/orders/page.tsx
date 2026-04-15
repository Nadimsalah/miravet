"use client"

import { useState, useEffect, Suspense } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getOrders, type Order } from "@/lib/supabase-api"
import { Notifications } from "@/components/admin/notifications"
import {
    Search,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    ShoppingBag,
    X
} from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
            <AdminOrdersContent />
        </Suspense>
    )
}

function AdminOrdersContent() {
    const { t, setLanguage, language } = useLanguage()
    const searchParams = useSearchParams()
    const customerId = searchParams.get('customer_id')
    const [activeTab, setActiveTab] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const [orders, setOrders] = useState<Order[]>([])
    const [totalOrders, setTotalOrders] = useState(0)
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<DateRange | undefined>()

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    useEffect(() => {
        // Reset page active tab changes
        setCurrentPage(1)
    }, [activeTab, customerId, date])

    useEffect(() => {
        async function loadOrders() {
            setLoading(true)
            const offset = (currentPage - 1) * ITEMS_PER_PAGE
            const { data, count } = await getOrders({
                status: activeTab === "All" ? undefined : activeTab.toLowerCase(),
                customer_id: customerId || undefined,
                limit: ITEMS_PER_PAGE,
                offset: offset,
                startDate: date?.from,
                endDate: date?.to
            })
            setOrders(data)
            setTotalOrders(count)
            setLoading(false)
        }
        loadOrders()
    }, [activeTab, customerId, currentPage, date])

    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE)

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const tabs = ["All", "Processing", "Delivered", "Pending", "Cancelled"] as const

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase()

        if (language === "fr") {
            switch (s) {
                case "pending": return "En attente"
                case "processing": return "En traitement"
                case "shipped": return "Expédiée"
                case "delivered": return "Livrée"
                case "cancelled": return "Annulée"
                default: return s.charAt(0).toUpperCase() + s.slice(1)
            }
        }

        switch (s) {
            case "pending": return "Pending"
            case "processing": return "Processing"
            case "shipped": return "Shipped"
            case "delivered": return "Delivered"
            case "cancelled": return "Cancelled"
            default: return s.charAt(0).toUpperCase() + s.slice(1)
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{t("admin.orders.title")}</h1>
                            <p className="text-xs text-muted-foreground">{t("admin.orders.subtitle")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Notifications />
                    </div>
                </header>

                {/* Filters & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/40 backdrop-blur-md p-1 rounded-2xl border border-white/5">
                        {/* Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-xl overflow-x-auto max-w-full no-scrollbar w-full sm:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                        }`}
                                >
                                    {t(`admin.orders.status.${tab.toLowerCase()}` as any)}
                                </button>
                            ))}
                        </div>

                        {/* Search & Date */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("admin.orders.search_placeholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 rounded-xl bg-white/5 border-white/10 focus:bg-white/10 h-10"
                                />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-fit justify-start text-left font-normal rounded-xl bg-white/5 border-white/10 hover:bg-white/10 h-10",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} -{" "}
                                                    {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDate(undefined)}
                                    className="h-10 w-10 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="glass-strong rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-foreground">#{order.order_number}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{order.customer_name}</div>
                                                <div className="text-[10px] text-muted-foreground/60">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <Badge variant="outline" className={`border ${getStatusColor(order.status)} text-[10px]`}>
                                                {getStatusLabel(order.status)}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{t("admin.orders.table.total")}</div>
                                                <div className="font-bold text-foreground">MAD {formatPrice(order.total)}</div>
                                            </div>
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <Button size="sm" variant="outline" className="h-8 text-xs bg-white/5 hover:bg-white/10 border-white/10">
                                                    {t("admin.orders.view_details")}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    {loading ? t("admin.orders.loading") : t("admin.orders.no_orders_match")}
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-left">
                                        <th className="py-4 pl-4 sm:pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.orders.table.order")}</th>
                                        <th className="py-4 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("admin.orders.table.date")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t("admin.orders.table.customer")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("admin.orders.table.items")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.orders.table.total")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.orders.table.status")}</th>
                                        <th className="py-4 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.orders.table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map((order) => (
                                            <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-3 sm:py-4 pl-4 sm:pl-6">
                                                    <span className="font-semibold text-foreground text-xs sm:text-sm">{order.order_number}</span>
                                                    <div className="md:hidden text-[10px] text-muted-foreground mt-0.5">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-foreground/80 hidden md:table-cell">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-medium text-foreground hidden sm:table-cell">
                                                    {order.customer_name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                                                    {order.customer_email}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-bold text-foreground">MAD {formatPrice(order.total)}</td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="outline" className={`border ${getStatusColor(order.status)} text-[10px] sm:text-xs py-0.5 px-2`}>
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary lg:hidden">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                {loading ? t("admin.orders.loading") : t("admin.orders.no_orders_match")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {t("admin.orders.showing")
                                    .replace("{current}", `${Math.min(filteredOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0, totalOrders)}-${Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)}`)
                                    .replace("{total}", totalOrders.toString())}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-transparent border-white/10 hover:bg-white/10 disabled:opacity-30"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1 || loading}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-transparent border-white/10 hover:bg-white/10 disabled:opacity-30"
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages || loading}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
