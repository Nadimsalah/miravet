"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Mail,
    Ban,
    Users,
    DollarSign,
    MapPin,
    ShoppingBag
} from "lucide-react"
import { getOrders, type Customer } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export default function CustomersPage() {
    const { t, setLanguage } = useLanguage()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("all") // all, top-spend

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    useEffect(() => {
        loadGuestData()
    }, [])

    async function loadGuestData() {
        setLoading(true)
        // 1. Fetch Guest Orders for virtual profiles (users who order without an account)
        const { data: guestOrders } = await getOrders({ guest_only: true, limit: 2000 })

        // 2. Fetch all registered user emails to filter them out
        const { data: registeredUsers } = await supabase
            .from('profiles')
            .select('email')

        const registeredEmails = new Set((registeredUsers || []).map(u => u.email?.toLowerCase().trim()))

        const guestMap = new Map<string, any>()

        // Aggregate orders by email to create virtual customer profiles (Digital Clients)
        guestOrders?.forEach((order: any) => {
            const email = order.customer_email.toLowerCase().trim()

            // ONLY show them if they don't have a registered account
            if (!registeredEmails.has(email) && !guestMap.has(email)) {
                guestMap.set(email, {
                    id: `guest-${email}`, // Virtual ID
                    name: order.customer_name,
                    email: email,
                    phone: order.customer_phone,
                    city: order.city,
                    total_spent: 0,
                    total_orders: 0,
                    last_order: order.order_number,
                    created_at: order.created_at
                })
            }

            if (guestMap.has(email)) {
                const guest = guestMap.get(email)
                guest.total_spent += order.total
                guest.total_orders += 1
            }
        })

        setCustomers(Array.from(guestMap.values()))
        setLoading(false)
    }

    const filteredCustomers = customers
        .filter(customer => {
            const matchesSearch =
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (customer.phone && customer.phone.includes(searchQuery)) ||
                (customer.last_order && customer.last_order.toLowerCase().includes(searchQuery.toLowerCase()))

            return matchesSearch
        })
        .sort((a, b) => {
            if (activeTab === "top-spend") {
                return (b.total_spent || 0) - (a.total_spent || 0)
            }
            return 0
        })

    const totalSpend = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0)

    const stats = [
        { label: t("admin.customers.guest_database"), value: customers.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: t("admin.customers.total_guest_spend"), value: `MAD ${totalSpend.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-5 rounded-[2rem] border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("admin.customers.title")}</h1>
                            <p className="text-sm text-muted-foreground font-medium">{t("admin.customers.subtitle").replace("{count}", customers.length.toString())}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-strong rounded-[2rem] p-6 border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-xl font-black text-foreground">{stat.value}</h3>
                                </div>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-32 h-32" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8">
                    <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl w-full xl:w-auto">
                        {[
                            { id: "all", label: t("admin.customers.all_guests") },
                            { id: "top-spend", label: t("admin.customers.top_spend") }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-[400px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t("admin.customers.search_placeholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden mb-20">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 p-4">
                        {loading ? (
                            <div className="text-center py-20 animate-pulse text-muted-foreground font-bold">{t("admin.customers.loading")}</div>
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <div key={customer.id} className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 font-black text-lg border border-white/10 flex-shrink-0">
                                            {customer.name && customer.name.length > 0 ? customer.name.charAt(0) : 'G'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-foreground text-lg tracking-tight truncate">{customer.name || t("admin.customers.guest_user")}</p>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate">
                                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate">{customer.email}</span>
                                                </div>
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                        <span className="w-3.5 h-3.5 flex items-center justify-center font-mono flex-shrink-0">#</span>
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("admin.customers.spend")}</p>
                                            <p className="font-black text-sm text-foreground">MAD {formatPrice(customer.total_spent || 0)}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{customer.total_orders || 0} {t("admin.customers.orders")}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("admin.customers.last_order")}</p>
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-block border border-primary/20">
                                                {customer.last_order || t("admin.customers.na")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 text-primary/60" />
                                            {customer.city || t("admin.customers.unknown")}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl">
                                            <Ban className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">{t("admin.customers.no_guests")}</div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    <th className="py-6 px-8">{t("admin.customers.customer_identity")}</th>
                                    <th className="py-6 px-6">{t("admin.customers.performance")}</th>
                                    <th className="py-6 px-6">{t("admin.customers.last_order")}</th>
                                    <th className="py-6 px-6">{t("admin.customers.location")}</th>
                                    <th className="py-6 px-8 text-right">{t("admin.customers.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-muted-foreground animate-pulse font-bold">{t("admin.customers.loading")}</td>
                                    </tr>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 font-black text-lg border border-white/10 shadow-inner">
                                                        {customer.name && customer.name.length > 0 ? customer.name.charAt(0) : 'G'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-base tracking-tight">{customer.name || t("admin.customers.guest_user")}</p>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                <Mail className="w-3 h-3" />
                                                                {customer.email}
                                                            </div>
                                                            {customer.phone && (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                                    <span className="w-3 h-3 flex items-center justify-center font-mono">#</span>
                                                                    {customer.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex gap-6">
                                                    <div className={activeTab === 'top-spend' ? 'scale-110 transition-transform origin-left' : ''}>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("admin.customers.total_spent")}</p>
                                                        <p className={`font-black text-sm ${activeTab === 'top-spend' ? 'text-primary' : 'text-foreground'}`}>
                                                            MAD {formatPrice(customer.total_spent || 0)}
                                                        </p>
                                                        <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                                            {customer.total_orders || 0} {t("admin.customers.orders")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono text-xs font-bold border border-primary/20">
                                                        {customer.last_order || t("admin.customers.na")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <MapPin className="w-4 h-4 text-primary/60" />
                                                    {customer.city || t("admin.customers.unknown")}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl group-hover:bg-red-500/10 hover:text-red-500">
                                                        <Ban className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-white/5 rounded-full text-muted-foreground/20">
                                                    <Users className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground">{t("admin.customers.no_guests_found")}</h3>
                                                <p className="text-muted-foreground max-w-xs text-center">{t("admin.customers.no_guests_description")}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
