"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MapPin,
    Building2,
    Mail,
    Phone,
    Eye,
    ChevronLeft,
    Users,
    MessageSquare,
    ShoppingBag,
    ExternalLink,
    MoreVertical,
    Crown
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function MyClientsPage() {
    const { t, setLanguage, language } = useLanguage()
    const router = useRouter()
    const [resellers, setResellers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [targetRevenue, setTargetRevenue] = useState(200000)

    // Force French for manager dashboard
    useEffect(() => {
        setLanguage("fr")
        if (typeof window !== "undefined") {
            localStorage.setItem("language", "fr")
        }
    }, [setLanguage])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user
            if (!user) {
                setLoading(false)
                router.push("/manager/login")
                return
            }

            // 1. Fetch Resellers and Profile in parallel
            const [resellersData, profileData] = await Promise.all([
                fetch(`/api/manager/resellers?amId=${user.id}`).then(r => r.json()),
                supabase.from('profiles').select('prime_target_revenue').eq('id', user.id).single()
            ])

            if (resellersData.error) throw new Error(resellersData.error)

            // Set dynamic goal
            if (profileData.data?.prime_target_revenue) {
                setTargetRevenue(profileData.data.prime_target_revenue)
            }

            const data = resellersData
            setResellers(data.resellers)

            // 2. Fetch Orders for Revenue Calculation (Smart Discovery)
            if (data.resellers && data.resellers.length > 0) {
                const resellerIds = data.resellers.map((r: any) => r.id)
                const resellerEmails = data.resellers.map((r: any) => r.user?.email).filter(Boolean)
                const hasGlobalDigital = data.resellers.some((r: any) =>
                    r.company_name?.toUpperCase().includes('DIGITAUX') ||
                    r.company_name?.toUpperCase().includes('DIGITAL GLOBAL')
                )

                let query = supabase
                    .from('orders')
                    .select('total, status, reseller_id, customer_email')

                // Build the OR logic
                const orParts = []
                if (resellerIds.length > 0) orParts.push(`reseller_id.in.(${resellerIds.join(',')})`)
                if (resellerEmails.length > 0) {
                    const emailsStr = resellerEmails.map((e: string) => `"${e}"`).join(',')
                    orParts.push(`customer_email.in.(${emailsStr})`)
                }
                if (hasGlobalDigital) orParts.push(`reseller_id.is.null`)

                if (orParts.length > 0) {
                    query = query.or(orParts.join(','))
                } else {
                    setTotalRevenue(0)
                    return
                }

                const { data: orders, error: ordersError } = await query

                if (ordersError) {
                    console.error("Error fetching orders for revenue:", ordersError)
                } else {
                    const revenue = orders
                        ?.filter((o: any) => o.status === 'delivered')
                        .reduce((acc, curr) => acc + (curr.total || 0), 0) || 0
                    setTotalRevenue(revenue)
                }
            } else {
                setTotalRevenue(0)
            }

        } catch (error: any) {
            console.error("Load error:", error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const filtered = resellers.filter(r =>
        r.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const isFrench = language === "fr"

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 font-sans space-y-8 max-w-[1600px] mx-auto">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/5">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-medium tracking-tight">
                        <Users className="w-4 h-4" />
                        <span>{t("manager.resellers.title")}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
                        {t("manager.resellers.title")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-xl">
                        {t("manager.resellers.subtitle")}
                    </p>
                </div>

                <div className="relative w-full md:w-[320px] group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                        type="text"
                        placeholder={t("manager.resellers.search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border-black/10 dark:border-white/10 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                </div>
            </header>

            {/* Revenue Goal Widget */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-2xl hover:shadow-violet-500/25 transition-all group">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-black/10 rounded-full blur-2xl" />

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-white/80">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                <Crown className="w-4 h-4" />
                            </div>
                            <span className="font-bold tracking-wide uppercase text-xs">{t("manager.resellers.revenue_goal")}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter">{t("manager.resellers.revenue_goal")}</h2>
                        <p className="text-white/80 max-w-md text-lg leading-relaxed font-medium">
                            {t("manager.resellers.current_revenue")}: <span className="text-white font-bold">{formatPrice(targetRevenue)} MAD</span>
                        </p>
                    </div>

                    <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-inner">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-sm font-medium text-white/60 block mb-1">{t("manager.resellers.progress")}</span>
                                <div className="text-2xl sm:text-3xl font-black flex items-baseline gap-1.5">
                                    {formatPrice(totalRevenue)} <span className="text-base sm:text-lg text-white/60 font-medium">/ {formatPrice(targetRevenue)} MAD</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-emerald-400">
                                    {Math.min((totalRevenue / targetRevenue) * 100, 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm p-1">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.6)] transition-all duration-1000 ease-out relative"
                                style={{ width: `${Math.min((totalRevenue / targetRevenue) * 100, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-between text-xs font-medium text-white/40">
                            <span>0 MAD</span>
                            <span>
                                {isFrench ? "Objectif : " : "Target: "}
                                {(targetRevenue / 1000).toFixed(0)}k MAD
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-[280px] bg-white/40 dark:bg-black/20 rounded-[2.5rem] border border-white/20 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((r) => (
                        <div key={r.id} className="group relative bg-white dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/20 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden flex flex-col justify-between">

                            {/* Card Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30">
                                        {r.company_name.charAt(0).toUpperCase()}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full -mr-2 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem>
                                                <Mail className="w-4 h-4 mr-2" />
                                                {isFrench ? "Envoyer un email" : "Email Client"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Phone className="w-4 h-4 mr-2" />
                                                {isFrench ? "Appeler le client" : "Call Client"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <h3 className="font-black text-xl text-foreground tracking-tight line-clamp-1" title={r.company_name}>
                                        {r.company_name}
                                    </h3>
                                    <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {r.user.name}
                                    </p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg truncate">
                                        <Mail className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate" title={r.user?.email}>
                                            {r.user?.email || (isFrench ? "Aucun email" : "No email")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg">
                                        <Phone className="w-4 h-4 flex-shrink-0" />
                                        <span>{r.phone || r.user?.phone || (isFrench ? "Non renseigné" : "N/A")}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-2 rounded-lg">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{r.city || "Unknown City"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="relative z-10 pt-4 border-t border-black/5 dark:border-white/5 flex gap-3">
                                <Link href={`/manager/resellers/${r.id}`} className="flex-1">
                                    <Button className="w-full rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                                        {t("manager.resellers.view_profile")}
                                    </Button>
                                </Link>
                                <Link href={`/manager/orders?resellerId=${r.id}`}>
                                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                                        <ShoppingBag className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground">{t("manager.resellers.no_resellers")}</h3>
                        <p className="text-muted-foreground max-w-md mt-2">
                            {t("manager.resellers.no_resellers")}
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setSearchQuery("")}
                            className="mt-4 text-primary font-bold"
                        >
                            Clear Search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
