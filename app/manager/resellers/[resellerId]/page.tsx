"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    ChevronLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    ShoppingBag,
    TrendingUp,
    MessageSquare,
    History,
    Save,
    Eye,
    CheckCircle2,
    Clock,
    Loader2,
    FileText,
    Globe,
    Search
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { formatPrice } from "@/lib/utils"

export default function ResellerProfilePage() {
    const { resellerId } = useParams()
    const router = useRouter()
    const { language, setLanguage } = useLanguage()
    const [reseller, setReseller] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [amId, setAmId] = useState<string | null>(null)
    const [orderSearchQuery, setOrderSearchQuery] = useState("")

    const isFrench = language === "fr"

    // Force French for manager views
    useEffect(() => {
        setLanguage("fr")
        if (typeof window !== "undefined") {
            localStorage.setItem("language", "fr")
        }
    }, [setLanguage])

    useEffect(() => {
        if (resellerId) loadData()
    }, [resellerId])

    async function loadData() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Unauthorized")
            setAmId(user.id)

            // 1. Fetch Reseller Details with Profile and Customer fallbacks
            const { data: rawRes, error: resError } = await supabase
                .from('resellers')
                .select('*, user:profiles(name, email, phone)')
                .eq('id', resellerId)
                .single()

            if (resError) throw resError

            // Fetch customer record for fallbacks
            const { data: customer } = await supabase
                .from('customers')
                .select('*')
                .eq('id', rawRes.user_id)
                .maybeSingle()

            const mergedReseller = {
                ...rawRes,
                company_name: rawRes.company_name && rawRes.company_name !== 'Personal Account' ? rawRes.company_name : (customer?.company_name || rawRes.company_name),
                city: rawRes.city || customer?.city || "Morocco",
                phone: rawRes.phone || customer?.phone || rawRes.user?.phone || "N/A"
            }
            setReseller(mergedReseller)

            // 2. Fetch Reseller Orders (Matching by reseller_id OR customer_id)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .or(`reseller_id.eq.${resellerId},customer_id.eq.${rawRes.user_id}`)
                .order('created_at', { ascending: false })

            if (ordersError) throw ordersError
            setOrders(ordersData)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!reseller) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-xl">
                {isFrench ? "Revendeur introuvable ou accès refusé." : "Reseller not found or access denied."}
            </div>
        )
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <nav className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-8">
                    <Link href="/">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                    </Link>
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div className="flex items-center gap-6">
                        <Link
                            href="/manager/resellers"
                            className="text-sm font-bold text-primary"
                        >
                            {isFrench ? "Mes clients" : "My Resellers"}
                        </Link>
                        <Link
                            href="/manager/orders"
                            className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                        >
                            {isFrench ? "Commandes" : "Orders"}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                <div className="flex items-center gap-2 mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-primary transition-colors p-0 hover:bg-transparent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest ml-1">
                            {isFrench ? "Retour à la liste" : "Back to List"}
                        </span>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    {/* Left Column: Profile Info & Stats */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-4xl mb-4 border border-primary/10 shadow-inner">
                                    {reseller.company_name.charAt(0)}
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{reseller.company_name}</h1>
                                <p className="text-slate-500 font-medium">{reseller.user?.name}</p>
                                <Badge className="mt-4 bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg px-3 py-1 font-bold capitalize">{reseller.status}</Badge>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                {reseller.ice && (
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="p-2 bg-slate-50 rounded-lg"><FileText className="w-4 h-4 text-slate-400" /></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ICE</span>
                                            <span className="text-sm font-mono font-bold">{reseller.ice}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            Email
                                        </span>
                                        <span className="text-sm font-medium">{reseller.user?.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            {isFrench ? "Téléphone" : "Phone"}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {reseller.phone || (isFrench ? "Non renseigné" : "N/A")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            {isFrench ? "Ville" : "City"}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {reseller.city || (isFrench ? "Maroc" : "Morocco")}
                                        </span>
                                    </div>
                                </div>
                                {reseller.website && (
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <Globe className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                {isFrench ? "Site Web" : "Website"}
                                            </span>
                                            <a href={reseller.website.startsWith('http') ? reseller.website : `https://${reseller.website}`} target="_blank" className="text-sm font-medium text-primary hover:underline truncate max-w-[150px]">
                                                {reseller.website}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
                            <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">
                                {isFrench ? "Indicateurs de performance" : "Performance Highlights"}
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-3xl font-black mb-1">MAD {formatPrice(totalRevenue)}</p>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        {isFrench ? "Chiffre d’affaires total" : "Lifetime Revenue"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black mb-1">{orders.length}</p>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                        <ShoppingBag className="w-3 h-3 text-blue-400" />
                                        {isFrench ? "Total des commandes" : "Total Orders"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black mb-1">{pendingOrders}</p>
                                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        {isFrench ? "Pipeline actif" : "Active Pipeline"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order History */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="font-bold text-xl flex items-center gap-3 whitespace-nowrap">
                                    <History className="w-6 h-6 text-primary" />
                                    {isFrench ? "Historique des commandes" : "Order History"}
                                </h2>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder={isFrench ? "Rechercher N° commande ou montant..." : "Search REF or Total..."}
                                        value={orderSearchQuery}
                                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                                        className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                            <th className="py-5 px-8">REF</th>
                                            <th className="py-5 px-6">{isFrench ? "Statut" : "Status"}</th>
                                            <th className="py-5 px-6">Total</th>
                                            <th className="py-5 px-6">Date</th>
                                            <th className="py-5 px-8 text-right">{isFrench ? "Voir" : "View"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders
                                            .filter(o =>
                                                o.order_number.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                                o.total.toString().includes(orderSearchQuery)
                                            )
                                            .map((o) => (
                                                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-5 px-8 font-bold text-slate-900">{o.order_number}</td>
                                                    <td className="py-5 px-6">
                                                        <Badge variant="outline" className="rounded-lg capitalize font-bold text-[10px]">{o.status}</Badge>
                                                    </td>
                                                    <td className="py-5 px-6 font-black text-slate-900">MAD {formatPrice(o.total)}</td>
                                                    <td className="py-5 px-6 text-sm text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                                                    <td className="py-5 px-8 text-right">
                                                        <Link href={`/manager/orders/${o.id}`}>
                                                            <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-primary">
                                                                <Eye className="w-5 h-5" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-slate-400 italic">No orders recorded for this reseller.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Note: I'm not adding internal notes here yet as they are order-specific in my schema, 
                            but we could add general reseller notes if needed. For now, AMs see notes inside orders. */}
                    </div>
                </div>
            </main>
        </div>
    )
}
