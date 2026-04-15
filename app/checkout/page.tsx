"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Phone, Mail, User, MapPin, Building2, Package, FileText, Loader2, 
    Lock, ShoppingBag, ChevronLeft, Truck, CreditCard, CheckCircle2, ShieldCheck
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { getCurrentUserId, getCurrentResellerTier, type ResellerTier } from "@/lib/supabase-api"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function CheckoutPage() {
    const { items: cartItems, clearCart, isInitialized } = useCart()
    const router = useRouter()
    const { language } = useLanguage()
    
    const [loading, setLoading] = useState(false)
    const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
    const [userId, setUserId] = useState<string | null>(null)
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        address: ""
    })
    const [wantsInvoice, setWantsInvoice] = useState(false)
    const [adminSettings, setAdminSettings] = useState<Record<string, string>>({})
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
    const [activeStep, setActiveStep] = useState(1) // 1: Shipping, 2: Payment/Review

    useEffect(() => {
        async function loadUserData() {
            const [tier, uid, settings] = await Promise.all([
                getCurrentResellerTier(),
                getCurrentUserId(),
                supabase.from('admin_settings').select('key, value').then(res => {
                    const obj: Record<string, string> = {}
                    res.data?.forEach(item => obj[item.key] = item.value || "")
                    return obj
                })
            ])
            setResellerTier(tier)
            setUserId(uid)
            setAdminSettings(settings)

            if (uid) {
                // 1. Fetch from profiles
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', uid)
                    .single()
                
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: profile.name || prev.fullName,
                        email: profile.email || prev.email,
                        phone: profile.phone || prev.phone,
                        city: profile.city || prev.city,
                        address: profile.address || prev.address || ""
                    }))
                }

                // 2. Fallback/Augment from resellers table if applicable
                if (tier) {
                    const { data: reseller } = await supabase
                        .from('resellers')
                        .select('*')
                        .eq('user_id', uid)
                        .maybeSingle()
                    
                    if (reseller) {
                        setFormData(prev => ({
                            ...prev,
                            // Use reseller phone/address if profile was empty
                            phone: prev.phone || reseller.phone || "",
                            city: prev.city || reseller.city || "",
                            address: prev.address || reseller.address || reseller.company_name || ""
                        }))
                    }
                }
            }
        }
        loadUserData()
    }, [])

    useEffect(() => {
        if (isInitialized && cartItems.length === 0 && !loading) {
            router.push("/cart")
        }
    }, [cartItems, loading, isInitialized, router])

    if (!isInitialized) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    }

    // AUTH REQUIREMENT: Show login/signup prompt if no userId
    if (!userId && !loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12">
                <div className="max-w-md w-full text-center space-y-8 glass-strong p-8 sm:p-12 rounded-[2.5rem] shadow-2xl">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                        <Lock className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4">Connexion Requise</h1>
                        <p className="text-slate-500 font-medium">
                            Vous devez créer un compte ou vous connecter pour passer une commande sur Miravet.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                        <Button asChild size="lg" className="h-14 rounded-2xl bg-black hover:bg-slate-900 text-white font-black text-lg">
                            <Link href="/reseller/register?redirect=/checkout">Créer un compte</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                            <Link href="/login?redirect=/checkout">Se connecter</Link>
                        </Button>
                    </div>
                    
                    <p className="text-xs text-slate-400">
                        En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                    </p>
                </div>
            </div>
        )
    }

    const subtotal = cartItems.reduce((sum, item) => {
        const price = (resellerTier && item.resellerPrice) ? item.resellerPrice : item.price
        return sum + price * item.quantity
    }, 0)

    const deliveryFeesEnabled = adminSettings.delivery_fees_enabled === "true"
    const shipping = deliveryFeesEnabled ? parseFloat(adminSettings.delivery_fee_amount || "0") : 0
    const discount = wantsInvoice ? (subtotal * 0.05) : 0 // 5% discount for invoice
    const total = subtotal + shipping - discount

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    customerId: userId,
                    cart: {
                        items: cartItems,
                        subtotal,
                        shipping,
                        discount,
                        total,
                        wantsInvoice
                    },
                    paymentMethod: "cod" // Cash on delivery by default
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue lors de la validation de votre commande.")
            }

            clearCart()
            router.push(`/checkout/success?orderId=${data.orderId}`)
        } catch (error: any) {
            console.error("Checkout error:", error)
            toast.error(error.message || "Erreur lors de la commande")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Minimal Modern Header */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 py-4 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/cart" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <Link href="/" className="flex items-center justify-center">
                        <Image src="/logo.png" alt="Miravet" width={140} height={42} className="h-8 sm:h-10 w-auto" />
                    </Link>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest hidden sm:inline">Paiement Sécurisé</span>
                    </div>
                </div>
            </header>

            {/* Mobile Order Summary Toggle */}
            <div className="lg:hidden sticky top-[65px] z-40 bg-[#0f172a] text-white border-b border-indigo-500/20">
                <button 
                    type="button"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-slate-800"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-bold">
                            {isSummaryExpanded ? "Masquer le résumé" : "Afficher le résumé"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-indigo-400">{formatPrice(total)} MAD</span>
                        <motion.div
                            animate={{ rotate: isSummaryExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </motion.div>
                    </div>
                </button>
                
                <AnimatePresence>
                    {isSummaryExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-6 space-y-4 overflow-hidden border-t border-white/5 bg-slate-900/50"
                        >
                            <div className="pt-4 space-y-3">
                                {cartItems.map((item) => {
                                    const price = (resellerTier && item.resellerPrice) ? item.resellerPrice : item.price
                                    return (
                                        <div key={item.id} className="flex gap-4 items-center">
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{language === 'ar' && item.nameAr ? item.nameAr : item.name}</p>
                                                <p className="text-[10px] text-white/40">{item.quantity} x {formatPrice(price)} MAD</p>
                                            </div>
                                            <p className="text-xs font-black">{formatPrice(price * item.quantity)} MAD</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
                                <div className="flex justify-between text-white/50">
                                    <span>Sous-total</span>
                                    <span>{formatPrice(subtotal)} MAD</span>
                                </div>
                                {deliveryFeesEnabled && (
                                    <div className="flex justify-between text-white/50">
                                        <span>Frais de livraison</span>
                                        <span className="text-emerald-400">+{formatPrice(shipping)} MAD</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-16 items-start">
                    
                    {/* Left Side: Steps & Form */}
                    <div className="space-y-10">
                        {/* Stepper HUD */}
                        <div className="flex items-center gap-4 mb-2">
                             {[1, 2].map((step) => (
                                <div key={step} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${activeStep === step ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                        {step}
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${activeStep === step ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {step === 1 ? "Informations" : "Paiement"}
                                    </span>
                                    {step === 1 && <div className="w-12 h-[2px] bg-slate-100 mx-2" />}
                                </div>
                             ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeStep === 1 ? (
                                <motion.section 
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    <div className="glass-strong rounded-[2.5rem] p-8 sm:p-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Détails de Livraison</h1>
                                                <p className="text-sm text-slate-400 font-medium">Où devons-nous envoyer votre commande ?</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="space-y-3">
                                                <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Nom Complet</Label>
                                                <div className="relative group">
                                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                    <Input 
                                                        id="fullName" name="fullName" required 
                                                        placeholder="Ahmed Alaoui"
                                                        value={formData.fullName} onChange={handleInputChange}
                                                        className="h-16 pl-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold text-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">E-mail</Label>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input 
                                                            id="email" name="email" type="email" required
                                                            placeholder="ahmed@example.com"
                                                            value={formData.email} onChange={handleInputChange}
                                                            className="h-16 pl-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold text-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Téléphone</Label>
                                                    <div className="relative group">
                                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input 
                                                            id="phone" name="phone" type="tel" required
                                                            placeholder="06 00 00 00 00"
                                                            value={formData.phone} onChange={handleInputChange}
                                                            className="h-16 pl-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold text-lg"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Ville</Label>
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input 
                                                            id="city" name="city" required
                                                            placeholder="Casablanca"
                                                            value={formData.city} onChange={handleInputChange}
                                                            className="h-16 pl-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold text-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Adresse Précise</Label>
                                                    <div className="relative group">
                                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input 
                                                            id="address" name="address" required
                                                            placeholder="N°, Rue, Quartier"
                                                            value={formData.address} onChange={handleInputChange}
                                                            className="h-16 pl-16 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold text-lg"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invoice Toggle */}
                                        <div 
                                            onClick={() => setWantsInvoice(!wantsInvoice)}
                                            className={`mt-8 bg-white rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-4 ${wantsInvoice ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${wantsInvoice ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-900">Demander une Facture</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    En choisissant l'option facture, vous bénéficiez d'une remise exceptionnelle de 5% sur votre commande.
                                                </p>
                                            </div>
                                            <div className={`ml-auto w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${wantsInvoice ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                                                {wantsInvoice && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-12 flex justify-end">
                                            <Button 
                                                type="button" 
                                                onClick={() => setActiveStep(2)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 h-16 text-lg font-black shadow-xl shadow-indigo-600/20 group"
                                            >
                                                Continuer 
                                                <ChevronLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.section>
                            ) : (
                                <motion.section 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="glass-strong rounded-[2.5rem] p-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mode de Paiement</h2>
                                                <p className="text-sm text-slate-400 font-medium">Toutes nos commandes sont payées à la livraison.</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-3xl p-6 border-2 border-indigo-600/20 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                    <Truck className="w-8 h-8 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900">Paiement Cash à la livraison</p>
                                                    <p className="text-xs text-slate-500 font-medium">Simple, sûr et rapide.</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-100">
                                            <button 
                                                type="button" 
                                                onClick={() => setActiveStep(1)}
                                                className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors"
                                            >
                                                Retour aux infos
                                            </button>
                                            
                                            <div className="flex items-center gap-4 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-2xl">
                                                <ShieldCheck className="w-5 h-5" />
                                                <span className="text-sm font-black uppercase tracking-widest">Transaction Gratuite</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="lg:hidden mt-8">
                                        <Button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full h-18 rounded-[2rem] bg-[#0f172a] text-white font-black text-xl shadow-2xl shadow-black/20"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmer ma Commande"}
                                        </Button>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Side: Order Summary Card (Desktop) */}
                    <div className="hidden lg:block sticky top-32">
                        <div className="glass-strong rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl" />
                            
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5" />
                                Votre Commande
                            </h2>

                            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                {cartItems.map((item) => {
                                    const price = (resellerTier && item.resellerPrice) ? item.resellerPrice : item.price
                                    return (
                                        <div key={item.id} className="flex gap-5 items-center group">
                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-900 line-clamp-2 leading-relaxed mb-1">
                                                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold tracking-widest">{formatPrice(price)} MAD</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">{formatPrice(price * item.quantity)}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-100">
                                <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
                                    <span className="uppercase tracking-widest">Sous-total</span>
                                    <span className="text-slate-900">{formatPrice(subtotal)} MAD</span>
                                </div>
                                {deliveryFeesEnabled && (
                                    <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
                                        <span className="uppercase tracking-widest">Livraison</span>
                                        <span className="text-emerald-500">+{formatPrice(shipping)} MAD</span>
                                    </div>
                                )}
                                {wantsInvoice && (
                                    <div className="flex justify-between items-center text-xs font-black text-emerald-500 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                        <span className="uppercase tracking-widest">Remise Facture (5%)</span>
                                        <span>-{formatPrice(discount)} MAD</span>
                                    </div>
                                )}
                                
                                <div className="pt-6">
                                    <div className="flex justify-between items-end mb-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total à payer</span>
                                            <p className="text-4xl font-black text-[#0f172a] tracking-tight">{formatPrice(total)}</p>
                                        </div>
                                        <span className="text-xs font-black text-slate-400 mb-1">MAD</span>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={loading || activeStep === 1}
                                        className={`w-full h-20 rounded-3xl text-lg font-black shadow-2xl transition-all flex items-center justify-center gap-3 ${activeStep === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#0f172a] text-white hover:bg-slate-800 shadow-indigo-600/10 active:scale-[0.98]'}`}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Confirmer la Commande</span>
                                                <ChevronLeft className="w-5 h-5 rotate-180" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-600/60 justify-center">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Checkout Sécurisé</span>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}
