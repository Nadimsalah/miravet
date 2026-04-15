"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { type Customer, type Order, getCustomerById, getCustomerOrders } from "@/lib/supabase-api"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, ShoppingBag, CreditCard, User, Building2, FileText, Globe, MapPin, LogOut, Eye, Phone, Mail, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

export default function ResellerDashboard() {
    const { t, language, setLanguage } = useLanguage()
    const router = useRouter()

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<Customer | null>(null)
    const [manager, setManager] = useState<any>(null)
    const [orders, setOrders] = useState<Order[]>([])

    const isArabic = language === "ar"

    useEffect(() => {
        const checkUser = async () => {
            try {
                // 1. Get Auth User
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                // 2. Check role — try profiles table first, then JWT metadata
                const { data: profileRow } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                const role = profileRow?.role || user.user_metadata?.role || ''
                const normalizedRole = role.toUpperCase()

                if (normalizedRole === 'DELIVERY_MAN') {
                    router.push('/logistique/dashboard')
                    return
                }
                if (normalizedRole === 'ACCOUNT_MANAGER') {
                    router.push('/manager/resellers')
                    return
                }

                // 3. Try to get Customer Profile from customers table
                let customerProfile = await getCustomerById(user.id)

                // 4. If no customer record, build profile from JWT user_metadata (trigger may have failed)
                if (!customerProfile) {
                    const meta = user.user_metadata || {}
                    customerProfile = {
                        id: user.id,
                        name: meta.full_name || user.email?.split('@')[0] || '',
                        email: user.email || '',
                        phone: meta.phone || null,
                        role: meta.role || 'reseller_pending',
                        company_name: meta.company_name || null,
                        ice: meta.ice || null,
                        website: meta.website || null,
                        city: meta.city || null,
                        status: 'pending',
                        total_orders: 0,
                        total_spent: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as any
                }

                setProfile(customerProfile)

                // 5. Get Account Manager (only if resellers table has entry)
                const { data: resellerData } = await supabase
                    .from('resellers')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (resellerData) {
                    const { data: assignmentData } = await supabase
                        .from('account_manager_assignments')
                        .select('account_manager_id')
                        .eq('reseller_id', resellerData.id)
                        .is('soft_deleted_at', null)
                        .maybeSingle()

                    if (assignmentData) {
                        const { data: managerData } = await supabase
                            .from('profiles')
                            .select('name, email, phone')
                            .eq('id', assignmentData.account_manager_id)
                            .maybeSingle()

                        setManager(managerData)
                    }
                }

                // 6. Get Orders
                if (user.id) {
                    const ordersData = await getCustomerOrders(user.id)
                    setOrders(ordersData)
                }

            } catch (error) {
                console.error("Error loading dashboard:", error)
            } finally {
                setIsLoading(false)
            }
        }

        checkUser()
    }, [router])


    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        toast.success(t("reseller.dashboard.signed_out"))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Status Badge Color Helper
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusLabel = (status: string) => {
        const statusKey = `order.status.${status.toLowerCase()}`
        const translated = t(statusKey)
        // If translation exists, use it; otherwise capitalize first letter
        return translated !== statusKey ? translated : status.charAt(0).toUpperCase() + status.slice(1)
    }


    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                {/* Header Section */}
                <header className="glass-strong p-6 sm:p-8 rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 mb-6 animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-white/10 shrink-0">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                {profile?.company_name || t("reseller.dashboard.title")}
                            </h1>
                            <p className="text-muted-foreground font-medium mt-1">
                                {t("reseller.dashboard.welcome_back").replace("{name}", profile?.name || user?.email || "")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href="/" className="flex-1 md:flex-none">
                            <Button className="w-full rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                                <ShoppingBag className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                                {t("reseller.dashboard.browse_catalog")}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="rounded-2xl h-14 px-6 bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                {profile?.status === 'pending' && (
                    <div className="glass-strong mb-10 p-5 rounded-3xl border border-yellow-200/60 bg-yellow-50/80 flex items-start gap-4 text-yellow-900 animate-in fade-in slide-in-from-top-6 duration-700">
                        <div className="mt-1">
                            <ShieldAlert className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="space-y-1 text-left">
                            <p className="font-semibold">
                                {language === "ar"
                                    ? "حسابك قيد المراجعة"
                                    : "Your reseller account is pending activation"}
                            </p>
                            <p className="text-sm text-yellow-800/80">
                                {language === "ar"
                                    ? "نحن نراجع معلومات شركتك حاليًا. ستتلقى إشعارًا بمجرد تفعيل حسابك ويمكنك حينها البدء في الاستفادة من أسعار الموزعين."
                                    : "We are currently reviewing your company information. You will be notified once your account is activated and you can start using reseller pricing."}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Metrics & Profile */}
                    <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass rounded-[2rem] p-6 border-white/10 shadow-xl group hover:border-primary/30 transition-all">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="text-3xl font-black text-foreground tabular-nums">{orders.length}</div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    {t("reseller.dashboard.total_orders")}
                                </div>
                            </div>
                            <div className="glass rounded-[2rem] p-6 border-white/10 shadow-xl group hover:border-green-500/30 transition-all">
                                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums truncate whitespace-nowrap">
                                    {formatPrice(orders.reduce((sum, o) => sum + Number(o.total), 0))} <span className="text-xs">MAD</span>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                    {t("reseller.dashboard.total_value")}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info Card */}
                        <div className="glass-strong rounded-[2.5rem] p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                            <h3 className="text-lg font-bold text-foreground flex items-center gap-3 mb-8">
                                <Building2 className="w-5 h-5 text-primary" />
                                {t("reseller.dashboard.organization_profile")}
                            </h3>

                            <div className="space-y-6">
                                <div className="text-left">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{t("reseller.dashboard.company_name")}</label>
                                    <div className="text-lg font-bold text-foreground">
                                        {profile?.company_name || <span className="text-muted-foreground/30 italic">{t("reseller.dashboard.not_set")}</span>}
                                    </div>
                                </div>

                                <div className="text-left">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{t("reseller.dashboard.business_identification")}</label>
                                    <div className="text-lg font-mono text-foreground tracking-widest bg-white/5 py-2 px-4 rounded-xl border border-white/5 inline-block min-w-40 text-center">
                                        {profile?.ice || "XXXXXXXXXXX"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="text-left">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{t("reseller.dashboard.location")}</label>
                                        <div className="flex items-center gap-2 font-bold text-foreground">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            {profile?.city || "N/A"}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2">{t("reseller.dashboard.site")}</label>
                                        <div className="flex items-center gap-2 font-bold text-primary truncate">
                                            <Globe className="w-4 h-4" />
                                            {profile?.website ? (
                                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" className="hover:underline">{t("reseller.dashboard.view")}</a>
                                            ) : "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Integrated Account Manager Info */}
                            <div className="mt-10 pt-8 border-t border-white/5 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary/20 rounded-full" />

                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 text-left">
                                    {t("reseller.dashboard.dedicated_account_manager")}
                                </h4>

                                {manager ? (
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl border border-white/5 shadow-inner">
                                            {manager.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-black text-foreground mb-1 leading-none">{manager.name}</div>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                                    <Mail className="w-4 h-4 text-primary/60" />
                                                    {manager.email}
                                                </div>
                                                {manager.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-primary font-bold">
                                                        <Phone className="w-4 h-4" />
                                                        {manager.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-dashed text-center">
                                        <p className="text-sm text-muted-foreground italic font-medium">
                                            {t("reseller.dashboard.no_account_manager")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Order History */}
                    <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-6 duration-700 delay-200">
                        <div className="glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-primary" />
                                    {t("reseller.dashboard.transaction_history")}
                                </h3>
                                <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 px-4 py-1.5 rounded-xl">
                                    {orders.length} {orders.length === 1 ? t("reseller.dashboard.order") : t("reseller.dashboard.orders")}
                                </Badge>
                            </div>

                            <div className="flex-1">
                                {orders.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 text-muted-foreground/40">
                                            <Package className="w-12 h-12" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-foreground mb-3">
                                            {t("reseller.dashboard.no_transactions")}
                                        </h4>
                                        <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed font-medium">
                                            {t("reseller.dashboard.initialize_desc")}
                                        </p>
                                        <Link href="/">
                                            <Button size="lg" variant="outline" className="rounded-2xl h-14 px-10 border-white/10 hover:bg-white/5 font-bold tracking-wide">
                                                {t("reseller.dashboard.start_now")}
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-4 p-4">
                                            {orders.map((order) => (
                                                <div key={order.id} className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4 hover:border-primary/30 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="font-mono text-sm font-bold text-foreground block">#{order.order_number}</span>
                                                            <div className="text-xs font-medium text-muted-foreground mt-1">
                                                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                                        <div>
                                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{t("reseller.dashboard.total")}</div>
                                                            <div className="font-black text-xl text-foreground whitespace-nowrap">
                                                                {formatPrice(order.total)} <span className="text-[10px] text-muted-foreground">MAD</span>
                                                            </div>
                                                        </div>
                                                        <Link href={`/reseller/orders/${order.id}`}>
                                                            <Button size="sm" className="rounded-xl h-9 px-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none">
                                                                {t("reseller.dashboard.view_order")}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto p-4 sm:p-8">
                                            <table className="w-full text-left border-separate border-spacing-y-4">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                        <th className="pb-4 px-4 text-left">{t("reseller.dashboard.reference_id")}</th>
                                                        <th className="pb-4 px-4 text-left">{t("reseller.dashboard.timestamp")}</th>
                                                        <th className="pb-4 px-4 text-left">{t("reseller.dashboard.fulfillment")}</th>
                                                        <th className="pb-4 px-4 text-right">{t("reseller.dashboard.volume")}</th>
                                                        <th className="pb-4 px-4 text-center">{t("reseller.dashboard.action")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order, idx) => (
                                                        <tr key={order.id} className="group transition-all hover:-translate-y-1">
                                                            <td className="bg-white/5 py-5 px-4 rounded-l-[1.5rem] border-y border-l border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] text-left">
                                                                <span className="font-mono text-xs font-bold text-foreground">#{order.order_number}</span>
                                                            </td>
                                                            <td className={`bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-left"}`}>
                                                                <div className="text-sm font-semibold text-foreground/80">
                                                                    {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                            </td>
                                                            <td className={`bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] ${isArabic ? "text-right" : "text-left"}`}>
                                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)} shrink-0`}>
                                                                    {getStatusLabel(order.status)}
                                                                </span>
                                                            </td>
                                                            <td className="bg-white/5 py-5 px-4 border-y border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] text-right">
                                                            <span className="font-black text-foreground whitespace-nowrap">
                                                                    {formatPrice(order.total)} <span className="text-[10px] text-muted-foreground mr-1">MAD</span>
                                                                </span>
                                                            </td>
                                                            <td className="bg-white/5 py-5 px-4 rounded-r-[1.5rem] border-y border-r border-white/5 group-hover:border-primary/20 group-hover:bg-primary/[0.02] text-center">
                                                                <Link href={`/reseller/orders/${order.id}`}>
                                                                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/20 text-primary transition-all group-hover:scale-110">
                                                                        <Eye className="w-5 h-5" />
                                                                    </Button>
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
