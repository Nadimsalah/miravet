"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Ban,
    UserCheck,
    Briefcase,
    TrendingUp,
    DollarSign,
    Users,
    ChevronRight,
    ShoppingBag,
    Eye,
    MapPin,
    ArrowLeft,
    Shield,
    Wallet
} from "lucide-react"
import { getCustomers, updateCustomerStatus, type Customer } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export default function ResellersPage() {
    const { t, setLanguage } = useLanguage()
    const [resellers, setResellers] = useState<Customer[]>([])
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
        loadResellers()
    }, [])

    async function loadResellers() {
        setLoading(true)
        try {
            // 1. Fetch all resellers joined with profiles
            const { data: resellersData, error: resError } = await supabase
                .from('resellers')
                .select(`
                    *,
                    user:profiles!user_id(name, email, role)
                `)
                .order('created_at', { ascending: false })

            if (resError) throw resError

            // 2. Fetch customer records to get total_spent
            const { data: customersData } = await supabase
                .from('customers')
                .select('id, total_spent')
                .in('id', (resellersData || []).map(r => r.user_id))

            // 3. Fetch assignments
            const { data: assignments } = await supabase
                .from('account_manager_assignments')
                .select(`
                    customer_id,
                    reseller_id,
                    account_manager:profiles!account_manager_id(name)
                `)
                .is('soft_deleted_at', null)

            // 4. Merge all data
            const mergedResellers = (resellersData || []).map((r: any) => {
                const customer = customersData?.find(c => c.id === r.user_id)
                const assignment = assignments?.find((a: any) => a.customer_id === r.user_id || a.reseller_id === r.id)
                
                return {
                    id: r.user_id, // Keep user_id as main ID for compatibility
                    reseller_id_db: r.id,
                    name: r.user?.name || "Unknown",
                    email: r.user?.email || "N/A",
                    role: r.user?.role || "reseller",
                    status: r.status,
                    company_name: r.company_name,
                    ice: r.ice,
                    city: r.city,
                    total_spent: customer?.total_spent || 0,
                    account_manager_name: (assignment as any)?.account_manager?.name,
                    created_at: r.created_at
                }
            })

            // Optional: Still filter out some if really needed, but the user wants to see them.
            // Let's keep them all for now.
            setResellers(mergedResellers as any)
        } catch (error: any) {
            console.error('Error loading resellers:', error)
            toast.error(t("admin.resellers.error_loading"))
        } finally {
            setLoading(false)
        }
    }

    const filteredResellers = resellers
        .filter(reseller => {
            const matchesSearch =
                reseller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reseller.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus =
                activeTab !== "pending" || reseller.status === "pending"

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            if (activeTab === "top-spend") {
                return (b.total_spent || 0) - (a.total_spent || 0)
            }
            return 0 // Keep default order for 'all'
        })

    // Calculate aggregated stats
    const totalSpend = resellers.reduce((acc, r) => acc + (r.total_spent || 0), 0)
    const totalProfit = totalSpend * 0.28 // Mocking 28% margin for now

    // Calculate counts by type
    const totalResellers = resellers.filter(r => (r as any).reseller_type === 'reseller' || !(r as any).reseller_type).length
    const totalPartners = resellers.filter(r => (r as any).reseller_type === 'partner').length
    const totalWholesalers = resellers.filter(r => (r as any).reseller_type === 'wholesaler').length

    const overviewStats = [
        { label: t("admin.resellers.total_resellers"), value: totalResellers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: t("admin.resellers.total_partners"), value: totalPartners, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: t("admin.resellers.total_wholesalers"), value: totalWholesalers, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ]

    const stats = [
        { label: t("admin.resellers.partner_network"), value: resellers.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: t("admin.resellers.total_spend"), value: `${t("common.currency")} ${formatPrice(totalSpend)}`, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-5 rounded-[2rem] border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("admin.resellers.title")}</h1>
                            <p className="text-sm text-muted-foreground font-medium">{t("admin.resellers.subtitle").replace("{count}", resellers.length.toString())}</p>
                        </div>
                    </div>
                </header>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {overviewStats.map((stat, i) => (
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

                {/* Top Metrics */}
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

                {/* Filters & Actions */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8">
                    <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl w-full xl:w-auto">
                        {[
                            { id: "all", label: t("admin.resellers.all_partners") },
                            { id: "pending", label: t("admin.resellers.pending_approval") },
                            { id: "top-spend", label: t("admin.resellers.top_spend") }
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
                                placeholder={t("admin.resellers.search_placeholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Resellers List - Table View */}
                <div className="glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    <th className="py-6 px-8">{t("admin.resellers.reseller_identity")}</th>
                                    <th className="py-6 px-6">{t("admin.resellers.company_ice")}</th>
                                    <th className="py-6 px-6">{t("admin.resellers.performance")}</th>
                                    <th className="py-6 px-6">{t("admin.resellers.location")}</th>
                                    <th className="py-6 px-6">{t("admin.resellers.account_manager")}</th>
                                    <th className="py-6 px-8 text-right">{t("admin.resellers.nexus_profile")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-muted-foreground animate-pulse font-bold">{t("admin.resellers.loading")}</td>
                                    </tr>
                                ) : filteredResellers.length > 0 ? (
                                    filteredResellers.map((reseller) => (
                                        <tr key={reseller.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-black text-lg border border-white/10 shadow-inner">
                                                        {reseller.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <p className="font-bold text-foreground text-base tracking-tight">{reseller.name}</p>
                                                            {(reseller as any).reseller_type && (
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(reseller as any).reseller_type === 'partner' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                                    (reseller as any).reseller_type === 'wholesaler' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                                    }`}>
                                                                    {(reseller as any).reseller_type === 'partner' ? t("admin.resellers.partner") :
                                                                        (reseller as any).reseller_type === 'wholesaler' ? t("admin.resellers.wholesaler") :
                                                                            t("admin.resellers.reseller")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                            <Mail className="w-3 h-3" />
                                                            {reseller.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{reseller.company_name || t("admin.resellers.personal_account")}</p>
                                                    <p className="text-xs font-mono text-muted-foreground uppercase mt-1 tracking-tighter">{t("admin.resellers.ice")}: {reseller.ice || t("admin.resellers.na")}</p>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex gap-6">
                                                    <div className={activeTab === 'top-spend' ? 'scale-110 transition-transform origin-left' : ''}>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t("admin.resellers.total_spend")}</p>
                                                        <p className={`font-black text-sm ${activeTab === 'top-spend' ? 'text-primary' : 'text-foreground'}`}>
                                                            {t("common.currency")} {formatPrice(reseller.total_spent || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <MapPin className="w-4 h-4 text-primary/60" />
                                                    {reseller.city || t("admin.resellers.unknown")}
                                                </div>
                                            </td>
                                            <td className="py-6 px-6">
                                                {(reseller as any).account_manager_name ? (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold whitespace-nowrap">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        {(reseller as any).account_manager_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40 italic">{t("admin.resellers.unassigned")}</span>
                                                )}
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link href={`/admin/resellers/${reseller.id}`}>
                                                        <Button variant="ghost" className="rounded-xl h-12 gap-2 px-5 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all font-bold">
                                                            <Eye className="w-4 h-4" />
                                                            {t("admin.resellers.view_profile")}
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl group-hover:bg-red-500/10 hover:text-red-500">
                                                        <Ban className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-40 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-white/5 rounded-full text-muted-foreground/20">
                                                    <Users className="w-16 h-16" />
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground">{t("admin.resellers.no_resellers")}</h3>
                                                <p className="text-muted-foreground max-w-xs text-center">{t("admin.resellers.no_resellers_description")}</p>
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
