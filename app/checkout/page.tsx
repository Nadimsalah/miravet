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
    ChevronLeft, CreditCard, Truck, ShieldCheck, 
    Lock, CheckCircle2, AlertCircle, ShoppingBag, 
    Phone, Mail, User, MapPin, Building2, Package, FileText
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

    useEffect(() => {
        async function loadUserData() {
            const [tier, uid] = await Promise.all([
                getCurrentResellerTier(),
                getCurrentUserId()
            ])
            setResellerTier(tier)
            setUserId(uid)

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

    const shipping = 50 // Fixed for now
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
                // If it's an RLS error, we should probably warn the user but the API might have handled it
                throw new Error(data.error || "Une erreur est survenue lors de la validation de votre commande.")
            }

            // Success!
            clearCart()
            router.push(`/checkout/success?orderId=${data.orderId}`)
        } catch (error: any) {
            console.error("Checkout error:", error)
            toast.error(error.message || "Erreur lors de la commande")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-200 py-6">
                <div className="container max-w-6xl mx-auto px-4 flex items-center justify-between">
                    <Link href="/cart" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-black transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        Retour au panier
                    </Link>
                    <Link href="/">
                        <Image src="/logo.png" alt="Miravet" width={100} height={30} className="h-7 w-auto" />
                    </Link>
                    <div className="w-24 hidden sm:block" />
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-4 py-8 sm:py-12">
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Left: Shipping Info */}
                    <div className="lg:col-span-7 space-y-8">
                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h1 className="text-xl font-black text-slate-900">Information de Livraison</h1>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-400">Nom Complet</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            id="fullName" name="fullName" required 
                                            placeholder="Ex: Ahmed Alaoui"
                                            value={formData.fullName} onChange={handleInputChange}
                                            className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">E-mail</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input 
                                                id="email" name="email" type="email" required
                                                placeholder="ahmed@example.com"
                                                value={formData.email} onChange={handleInputChange}
                                                className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-400">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input 
                                                id="phone" name="phone" type="tel" required
                                                placeholder="06 00 00 00 00"
                                                value={formData.phone} onChange={handleInputChange}
                                                className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-400">Ville / Governorate</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            id="city" name="city" required
                                            placeholder="Ex: Casablanca"
                                            value={formData.city} onChange={handleInputChange}
                                            className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-400">Adresse de Livraison</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                        <Input 
                                            id="address" name="address" required
                                            placeholder="Rue, Appt, Bureau, etc."
                                            value={formData.address} onChange={handleInputChange}
                                            className="h-20 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium align-top"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <h1 className="text-xl font-black text-slate-900">Paiement</h1>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-4 border-2 border-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <Truck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Paiement à la livraison (Cash)</p>
                                        <p className="text-xs text-slate-500">Payez en espèces dès réception de votre colis.</p>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                            </div>
                        </section>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                                
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" />
                                    Résumé de la commande
                                </h2>

                                <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {cartItems.map((item) => {
                                        const price = (resellerTier && item.resellerPrice) ? item.resellerPrice : item.price
                                        return (
                                            <div key={item.id} className="flex gap-4 items-center">
                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-white/5">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{language === 'ar' && item.nameAr ? item.nameAr : item.name}</p>
                                                    <p className="text-[10px] text-white/40 uppercase font-black">{formatPrice(price)} MAD / unité</p>
                                                </div>
                                                <p className="text-sm font-black whitespace-nowrap">{formatPrice(price * item.quantity)} MAD</p>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/10 text-sm">
                                    <div className="flex justify-between text-white/50">
                                        <span>Sous-total</span>
                                        <span className="font-bold text-white">{formatPrice(subtotal)} MAD</span>
                                    </div>
                                    <div className="flex justify-between text-white/50">
                                        <span>Frais de livraison</span>
                                        <span className="font-bold text-emerald-400">+{formatPrice(shipping)} MAD</span>
                                    </div>
                                    {wantsInvoice && (
                                        <div className="flex justify-between text-emerald-400">
                                            <span>Remise Facturation (5%)</span>
                                            <span className="font-bold">-{formatPrice(discount)} MAD</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-base font-black">Total à payer</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-primary">{formatPrice(total)}</span>
                                            <span className="text-xs ml-1 opacity-50">MAD</span>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-16 rounded-2xl mt-8 bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Traitement...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>Valider ma commande</span>
                                            <ChevronLeft className="w-5 h-5 rotate-180" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Guard/Trust */}
                            <div 
                                onClick={() => setWantsInvoice(!wantsInvoice)}
                                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-4 ${wantsInvoice ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${wantsInvoice ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Demander une Facture</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        En choisissant l'option facture, vous bénéficiez d'une remise exceptionnelle de 5% sur votre commande.
                                    </p>
                                </div>
                                <div className={`ml-auto w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${wantsInvoice ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                                    {wantsInvoice && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}
