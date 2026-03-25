"use client"

import { useState, useEffect, useRef } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { 
    getSupplierById, 
    getSupplierPurchases, 
    getSupplierMetrics, 
    createSupplierPurchase,
    getProducts,
    type Supplier,
    type SupplierPurchase,
    type Product
} from "@/lib/supabase-api"
import {
    ArrowLeft,
    Plus,
    Search,
    Building2,
    Calendar,
    Phone,
    Mail,
    MapPin,
    History as HistoryIcon,
    TrendingUp,
    ShoppingBag,
    Package,
    Loader2,
    CheckCircle2,
    PlusCircle,
    BadgeDollarSign,
    ExternalLink,
    Eye,
    X,
    XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

export default function SupplierProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { t, language } = useLanguage()
    const id = params.id as string

    const [supplier, setSupplier] = useState<Supplier | null>(null)
    const [purchases, setPurchases] = useState<SupplierPurchase[]>([])
    const [metrics, setMetrics] = useState({ totalPurchased: 0, totalSpent: 0, totalSold: 0, currentStock: 0 })
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'history' | 'products'>('history')

    // Purchase Modal State
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [productSearch, setProductSearch] = useState("")
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedViewPurchase, setSelectedViewPurchase] = useState<SupplierPurchase | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [purchaseForm, setPurchaseForm] = useState({
        quantity: 1,
        purchasePrice: 0,
        profitMargin: 0,
        finalPrice: 0,
        blNumber: "",
        invoiceNumber: "",
        paymentMethod: "cash" as "cash" | "cheque" | "card" | "transfer",
        paymentModality: "",
        notes: ""
    })

    // Pre-fill form when product is selected
    useEffect(() => {
        if (selectedProduct) {
            const cost = selectedProduct.purchase_price || 0
            const margin = selectedProduct.profit_margin_percentage || 0
            const price = selectedProduct.price || 0
            
            setPurchaseForm(prev => ({
                ...prev,
                purchasePrice: cost,
                profitMargin: margin,
                finalPrice: price
            }))
        }
    }, [selectedProduct])

    const handlePurchasePriceChange = (v: string) => {
        const cost = parseFloat(v) || 0
        setPurchaseForm(prev => ({ ...prev, purchasePrice: cost }))
        if (cost && purchaseForm.profitMargin) {
            const p = cost + (cost * purchaseForm.profitMargin / 100)
            setPurchaseForm(prev => ({ ...prev, purchasePrice: cost, finalPrice: parseFloat(p.toFixed(2)) }))
        } else if (cost > 0 && purchaseForm.finalPrice) {
            const margin = ((purchaseForm.finalPrice - cost) / cost) * 100
            setPurchaseForm(prev => ({ ...prev, purchasePrice: cost, profitMargin: parseFloat(margin.toFixed(0)) }))
        }
    }

    const handleProfitMarginChange = (v: string) => {
        const margin = parseFloat(v) || 0
        setPurchaseForm(prev => ({ ...prev, profitMargin: margin }))
        if (margin && purchaseForm.purchasePrice) {
            const p = purchaseForm.purchasePrice + (purchaseForm.purchasePrice * margin / 100)
            setPurchaseForm(prev => ({ ...prev, profitMargin: margin, finalPrice: parseFloat(p.toFixed(2)) }))
        }
    }

    const handleFinalPriceChange = (v: string) => {
        const p = parseFloat(v) || 0
        setPurchaseForm(prev => ({ ...prev, finalPrice: p }))
        if (p && purchaseForm.purchasePrice && purchaseForm.purchasePrice > 0) {
            const margin = ((p - purchaseForm.purchasePrice) / purchaseForm.purchasePrice) * 100
            setPurchaseForm(prev => ({ ...prev, finalPrice: p, profitMargin: parseFloat(margin.toFixed(0)) }))
        }
    }

    useEffect(() => {
        if (id) loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        try {
            const [supplierData, purchasesData, metricsData] = await Promise.all([
                getSupplierById(id),
                getSupplierPurchases(id),
                getSupplierMetrics(id)
            ])

            if (supplierData) {
                setSupplier(supplierData)
                setPurchases(purchasesData)
                setMetrics(metricsData as any)
            } else {
                toast.error("Fournisseur non trouvé")
                router.push("/admin/suppliers")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Product search debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (productSearch.trim().length >= 2) {
                setIsSearching(true)
                try {
                    const data = await getProducts({ search: productSearch, limit: 10, supplier_id: id })
                    setSearchResults(data)
                } catch (e) {
                    console.error(e)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [productSearch])

    const handleAddPurchase = async () => {
        if (!selectedProduct) {
            toast.error("Veuillez sélectionner un produit")
            return
        }
        if (purchaseForm.quantity <= 0) {
            toast.error("La quantité doit être supérieure à 0")
            return
        }

        setSubmitting(true)
        try {
            // Update product supplier if not set
            if (!selectedProduct.supplier_id) {
                await supabase
                    .from('products')
                    .update({ supplier_id: id })
                    .eq('id', selectedProduct.id)
            }

            await createSupplierPurchase({
                supplier_id: id,
                product_id: selectedProduct.id,
                quantity: purchaseForm.quantity,
                purchase_price: purchaseForm.purchasePrice,
                profit_margin_percentage: purchaseForm.profitMargin,
                price: purchaseForm.finalPrice,
                bl_number: purchaseForm.blNumber,
                invoice_number: purchaseForm.invoiceNumber,
                payment_method: purchaseForm.paymentMethod,
                payment_modality: purchaseForm.paymentModality,
                notes: purchaseForm.notes
            })

            toast.success("Achat enregistré et stock mis à jour")
            setIsPurchaseModalOpen(false)
            // Reset form
            setSelectedProduct(null)
            setProductSearch("")
            setPurchaseForm({ 
                quantity: 1, 
                purchasePrice: 0, 
                profitMargin: 0, 
                finalPrice: 0, 
                blNumber: "",
                invoiceNumber: "",
                paymentMethod: "cash",
                paymentModality: "",
                notes: "" 
            })
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'enregistrement")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Chargement du profil...</p>
            </div>
        )
    }

    if (!supplier) return null

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 space-y-8">
                {/* Header & Back */}
                <div className="flex flex-col gap-6">
                    <Link href="/admin/suppliers">
                        <Button variant="ghost" className="w-fit gap-2 -ml-4 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            Retour aux fournisseurs
                        </Button>
                    </Link>

                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20 ring-4 ring-slate-50">
                                <Building2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{supplier.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <Calendar className="w-4 h-4" />
                                        Depuis {new Date(supplier.created_at).toLocaleDateString()}
                                    </div>
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Mail className="w-4 h-4" />
                                            {supplier.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 flex items-center gap-3 transition-all active:scale-95 z-10"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Nouvel Achat
                        </Button>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
                    </header>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-primary/20 transition-all">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalPurchased}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Produits achetés</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-green-500/20 transition-all">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{metrics.totalSold}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Vendu</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-orange-500/20 transition-all">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{metrics.currentStock}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Stock Actuel</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-primary/20 transition-all">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <BadgeDollarSign className="w-6 h-6" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums truncate">{formatPrice(metrics.totalSpent)} MAD</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Dépensé</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Tabs & Lists */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Rechercher par produit, BL, Facture, ou notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-400 font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-4">
                                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                    <button 
                                        onClick={() => setActiveTab('history')}
                                        className={`px-6 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <HistoryIcon className="w-4 h-4" />
                                        Historique ({purchases.length})
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('products')}
                                        className={`px-6 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-2 ${activeTab === 'products' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Package className="w-4 h-4" />
                                        Produits ({ (metrics as any).products?.length || 0 })
                                    </button>
                                </div>
                                <Button 
                                    onClick={() => setIsPurchaseModalOpen(true)}
                                    className="rounded-2xl font-black bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center gap-2 group h-11 px-6 w-full sm:w-auto"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                    Nouvel Approvisionnement
                                </Button>
                            </div>
                            
                            <div className="flex-1">
                                {activeTab === 'history' ? (
                                    <>
                                        {purchases.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-muted-foreground/30 mb-4">
                                                    <ShoppingBag className="w-10 h-10" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">Aucun achat enregistré pour ce fournisseur.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto p-4 sm:p-8">
                                                <table className="w-full text-left border-separate border-spacing-y-4">
                                                    <thead>
                                                        <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                            <th className="pb-4 px-4">Produit</th>
                                                            <th className="pb-4 px-4">Documents</th>
                                                            <th className="pb-4 px-4">Quantité</th>
                                                            <th className="pb-4 px-4">Prix d'achat</th>
                                                            <th className="pb-4 px-4">Paiement</th>
                                                            <th className="pb-4 px-4">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {purchases
                                                            .filter(p => {
                                                                const q = searchTerm.toLowerCase();
                                                                return (p.product?.title?.toLowerCase().includes(q) ||
                                                                        p.bl_number?.toLowerCase().includes(q) ||
                                                                        p.invoice_number?.toLowerCase().includes(q) ||
                                                                        p.notes?.toLowerCase().includes(q));
                                                            })
                                                            .map((p) => (
                                                            <tr key={p.id} className="group transition-all hover:-translate-y-1">
                                                                <td className="bg-slate-50/50 py-4 px-4 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                                                            <Image 
                                                                                src={p.product?.images?.[0] || "/placeholder.svg"} 
                                                                                alt={p.product?.title || ""} 
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        </div>
                                                                        <div className="font-bold text-slate-900 line-clamp-1">{p.product?.title}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <div className="flex flex-col gap-1">
                                                                        {p.bl_number && <div className="text-[10px] font-bold text-slate-500 tabular-nums">BL: {p.bl_number}</div>}
                                                                        {p.invoice_number && <div className="text-[10px] font-bold text-primary tabular-nums">Fact: {p.invoice_number}</div>}
                                                                        {!p.bl_number && !p.invoice_number && <div className="text-[10px] text-slate-400/50 italic">Aucun document</div>}
                                                                    </div>
                                                                </td>
                                                                <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <span className="font-bold text-slate-900 tabular-nums">{p.quantity} units</span>
                                                                </td>
                                                                <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <span className="font-black text-primary tabular-nums">{formatPrice(p.purchase_price)} MAD</span>
                                                                </td>
                                                                <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase text-slate-900">{p.payment_method || 'N/A'}</span>
                                                                        {p.payment_modality && <span className="text-[9px] text-slate-500 italic truncate max-w-[100px]">{p.payment_modality}</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="bg-slate-50/50 py-4 px-4 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="text-sm font-bold text-slate-500 tabular-nums">
                                                                            {new Date(p.created_at).toLocaleDateString()}
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setSelectedViewPurchase(p)
                                                                                setIsDetailsOpen(true)
                                                                            }}
                                                                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                                        >
                                                                            <Eye className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="overflow-x-auto p-4 sm:p-8">
                                        <table className="w-full text-left border-separate border-spacing-y-4">
                                            <thead>
                                                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                    <th className="pb-4 px-4">Produit</th>
                                                    <th className="pb-4 px-4">Performance</th>
                                                    <th className="pb-4 px-4">Stock</th>
                                                    <th className="pb-4 px-4">Prix</th>
                                                    <th className="pb-4 px-4">Investi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {((metrics as any).products || [])
                                                    .filter((p: any) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((p: any) => (
                                                    <tr key={p.id} className="group transition-all hover:-translate-y-1">
                                                        <td className="bg-slate-50/50 py-4 px-4 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                            <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4">
                                                                <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                                                    <Image src={p.image || "/placeholder.svg"} alt={p.title} fill className="object-cover" />
                                                                </div>
                                                                <div className="font-bold text-slate-900 line-clamp-1 hover:text-primary transition-colors">{p.title}</div>
                                                            </Link>
                                                        </td>
                                                        <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                            <div className="flex flex-col">
                                                                <div className="text-[10px] font-bold text-slate-500 tabular-nums">Acheté: {p.totalPurchased}</div>
                                                                <div className="text-[10px] font-bold text-green-500 tabular-nums">Vendu: {p.totalSold}</div>
                                                            </div>
                                                        </td>
                                                        <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-black tabular-nums ${p.currentStock < 5 ? "text-red-500" : "text-slate-900"}`}>{p.currentStock}</span>
                                                                <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                                                                    <div 
                                                                        className={`h-full ${p.currentStock < 5 ? "bg-red-500" : "bg-primary"}`}
                                                                        style={{ width: `${Math.min(100, (p.currentStock / (p.totalPurchased || 1)) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="bg-slate-50/50 py-4 px-4 border-y border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                            <span className="font-bold text-slate-500 tabular-nums">{formatPrice(p.purchasePrice)}</span>
                                                        </td>
                                                        <td className="bg-slate-50/50 py-4 px-4 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                                                            <span className="font-black text-primary tabular-nums">{formatPrice(p.totalSpent)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {!(metrics as any).products?.length && (
                                                    <tr>
                                                        <td colSpan={5} className="py-20 text-center text-muted-foreground italic">Aucun produit lié à ce fournisseur</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Contact & Products */}
                    <div className="space-y-6">
                        {/* Top Products / Inventory */}
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    Inventaire Actuel
                                </h3>
                                <button 
                                    onClick={() => setActiveTab('products')}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Voir tout
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {(metrics as any).products?.slice(0, 10).map((p: any) => (
                                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                                        <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                            <Image 
                                                src={p.image || "/placeholder.svg"} 
                                                alt={p.title} 
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 truncate text-sm">{p.title}</div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                                                    Stock: <span className={p.currentStock < 5 ? "text-red-500" : "text-green-500"}>{p.currentStock}</span>
                                                </div>
                                                <div className="text-[10px] font-black text-primary tabular-nums">
                                                    {formatPrice(p.purchasePrice)} MAD
                                                </div>
                                            </div>
                                            {/* Stock progress bar */}
                                            <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${p.currentStock < 5 ? "bg-red-500" : "bg-primary"}`}
                                                    style={{ width: `${Math.min(100, (p.currentStock / (p.totalPurchased || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {!(metrics as any).products?.length && (
                                    <p className="text-center py-8 text-sm text-slate-400 italic">Aucun produit inventorié</p>
                                )}
                            </div>
                        </section>

                        {/* Contact Info */}
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Informations de contact</h3>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
                                    <div className="flex items-center gap-3 font-bold text-slate-900">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <a href={`tel:${supplier.phone}`} className="hover:text-primary transition-colors">{supplier.phone || "Non renseigné"}</a>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                                    <div className="flex items-center gap-3 font-bold text-slate-900">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <a href={`mailto:${supplier.email}`} className="truncate hover:text-primary transition-colors">{supplier.email || "Non renseigné"}</a>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse</label>
                                    <div className="flex items-center gap-3 font-bold text-slate-900 text-sm leading-relaxed">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        {supplier.address || "Non renseignée"}
                                    </div>
                                </div>
                            </div>

                            {supplier.notes && (
                                <div className="pt-8 border-t border-slate-100 space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes internes</label>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                                        "{supplier.notes}"
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Purchase Modal */}
                <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
                    <DialogContent className="sm:max-w-[600px] border border-slate-200 bg-white p-0 rounded-[3rem] shadow-2xl overflow-hidden">
                        <div className="p-8 max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    Nouvel Approvisionnement
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Formulaire pour ajouter un nouvel approvisionnement de produit pour ce fournisseur.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-8">
                                {/* Product Selection */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Sélectionner un produit</label>
                                        <Link href="/admin/products/new" target="_blank" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            <Plus className="w-3 h-3" />
                                            Créer un nouveau produit
                                        </Link>
                                    </div>
                                    
                                    {!selectedProduct ? (
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                autoFocus
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                                placeholder="Rechercher par nom ou SKU..."
                                                className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium text-lg shadow-inner text-slate-900"
                                            />
                                            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />}
                                            
                                            {/* Search Results Dropdown */}
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
                                                        {searchResults.map(p => (
                                                            <div 
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setSelectedProduct(p)
                                                                    setSearchResults([])
                                                                    setProductSearch("")
                                                                }}
                                                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary hover:text-white transition-all cursor-pointer group/item"
                                                            >
                                                                <div className="w-14 h-14 relative rounded-xl overflow-hidden border border-white/5 shrink-0">
                                                                    <Image src={p.images[0] || "/placeholder.svg"} alt={p.title} fill className="object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-white truncate">{p.title}</div>
                                                                    <div className="text-xs text-white/50">SKU: {p.sku || "N/A"} • Stock: {p.stock}</div>
                                                                </div>
                                                                <ArrowLeft className="w-5 h-5 rotate-180 opacity-0 group-hover/item:opacity-100 transition-all group-hover/item:translate-x-1" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/20 relative animate-in zoom-in-95 duration-300">
                                            <div className="w-16 h-16 relative rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                                                <Image src={selectedProduct.images[0] || "/placeholder.svg"} alt={selectedProduct.title} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-lg text-black truncate">{selectedProduct?.title}</div>
                                                <div className="text-sm font-bold text-primary flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Produit sélectionné
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => setSelectedProduct(null)}
                                                className="w-10 h-10 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                            >
                                                <XCircle className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Quantité</label>
                                        <Input 
                                            type="number" 
                                            value={purchaseForm.quantity} 
                                            onChange={e => setPurchaseForm({...purchaseForm, quantity: parseInt(e.target.value) || 0})}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Prix d'achat (MAD)</label>
                                        <Input 
                                            type="number" 
                                            value={purchaseForm.purchasePrice} 
                                            onChange={e => handlePurchasePriceChange(e.target.value)}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Marge (%)</label>
                                        <Input 
                                            type="number" 
                                            value={purchaseForm.profitMargin} 
                                            onChange={e => handleProfitMarginChange(e.target.value)}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Prix de vente final (MAD)</label>
                                        <Input 
                                            type="number" 
                                            value={purchaseForm.finalPrice} 
                                            onChange={e => handleFinalPriceChange(e.target.value)}
                                            className="h-14 rounded-2xl bg-primary/5 border-primary/20 text-lg font-black text-primary shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-4 bg-primary rounded-full" />
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bon de Livraison (BL)</label>
                                        </div>
                                        <Input 
                                            value={purchaseForm.blNumber} 
                                            onChange={e => setPurchaseForm({...purchaseForm, blNumber: e.target.value})}
                                            placeholder="N° BL"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facture</label>
                                        </div>
                                        <Input 
                                            value={purchaseForm.invoiceNumber} 
                                            onChange={e => setPurchaseForm({...purchaseForm, invoiceNumber: e.target.value})}
                                            placeholder="N° Facture"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Mode de Paiement</label>
                                        <div className="relative">
                                            <select 
                                                value={purchaseForm.paymentMethod}
                                                onChange={e => setPurchaseForm({...purchaseForm, paymentMethod: e.target.value as any})}
                                                className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="cheque">Chèque</option>
                                                <option value="card">Carte</option>
                                                <option value="transfer">Virement</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <HistoryIcon className="w-5 h-5 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Modalité</label>
                                        <Input 
                                            value={purchaseForm.paymentModality} 
                                            onChange={e => setPurchaseForm({...purchaseForm, paymentModality: e.target.value})}
                                            placeholder="Ex: 30 jours"
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-lg font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Notes</label>
                                    <textarea 
                                        value={purchaseForm.notes} 
                                        onChange={e => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                                        placeholder="Ex: Arrivage lot B24, conditions spéciales..."
                                        className="w-full h-24 p-4 rounded-3xl bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary focus:outline-none resize-none text-sm placeholder:text-slate-400 shadow-inner text-slate-700"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-10 flex gap-4 border-t border-slate-100 pt-8 bg-slate-50/50 p-8">
                                <Button variant="ghost" onClick={() => setIsPurchaseModalOpen(false)} className="h-14 rounded-2xl flex-1 font-black text-slate-500 hover:bg-white hover:text-slate-700">
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={handleAddPurchase} 
                                    disabled={submitting || !selectedProduct} 
                                    className="h-14 rounded-2xl flex-1 font-black shadow-xl shadow-primary/40 bg-primary hover:bg-primary/90 text-white transition-all transform hover:scale-[1.02] active:scale-95 text-lg"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            Enregistrer
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl bg-white border-slate-200 p-0 overflow-hidden rounded-[2.5rem] shadow-none">
                    <DialogTitle className="sr-only">Détails de l'Approvisionnement - {selectedViewPurchase?.product?.title}</DialogTitle>
                    <DialogDescription className="sr-only">Vue détaillée d'une transaction d'approvisionnement passée.</DialogDescription>
                    {selectedViewPurchase && (
                        <div className="flex flex-col">
                            {/* Header Text */}
                            <div className="p-8 pb-6 flex items-start justify-between relative">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Détails de l'Approvisionnement</div>
                                    <h2 className="text-3xl font-black text-slate-900">{selectedViewPurchase?.product?.title}</h2>
                                    <div className="inline-block bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 text-primary font-black text-[10px] uppercase tracking-wider">
                                        {selectedViewPurchase?.created_at ? new Date(selectedViewPurchase.created_at).toLocaleDateString() : ""}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setIsDetailsOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100/80 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors z-50 shadow-sm backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Full Image */}
                            <div className="px-8">
                                <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/50">
                                    <Image 
                                        src={selectedViewPurchase.product?.images?.[0] || "/placeholder.svg"} 
                                        alt={selectedViewPurchase.product?.title || ""} 
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>

                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Quantité</div>
                                        <div className="text-xl font-black text-slate-900">{selectedViewPurchase.quantity} units</div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Prix d'Achat</div>
                                        <div className="text-xl font-black text-primary">{formatPrice(selectedViewPurchase.purchase_price)} MAD</div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Ligne</div>
                                        <div className="text-xl font-black text-slate-900">{formatPrice(selectedViewPurchase.quantity * selectedViewPurchase.purchase_price)} MAD</div>
                                    </div>
                                </div>

                                {/* Documents & Payment */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-primary pl-3">Documents de Traçabilité</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium tracking-tight">Bon de Livraison (BL)</span>
                                                <span className="font-bold text-slate-900 tracking-wider">#{selectedViewPurchase?.bl_number || "—"}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium tracking-tight">Facture N°</span>
                                                <span className="font-black text-primary tracking-wider">#{selectedViewPurchase?.invoice_number || "—"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-green-500 pl-3">Paiement & Règlement</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium tracking-tight">Méthode</span>
                                                <span className="font-black text-slate-900 uppercase">{selectedViewPurchase?.payment_method || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-sm text-slate-500 font-medium tracking-tight">Modalité</span>
                                                <span className="text-sm font-bold text-slate-700 italic truncate max-w-[150px]">{selectedViewPurchase?.payment_modality || "Comptant"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-orange-500 pl-3">Notes & Commentaires</h4>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[100px]">
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {selectedViewPurchase.notes || "Aucune note particulière pour cet approvisionnement."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                                <Button 
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="rounded-2xl px-10 h-12 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold transition-all shadow-sm"
                                >
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

