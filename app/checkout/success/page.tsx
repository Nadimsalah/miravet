"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
    CheckCircle2, ShoppingBag, ArrowRight, Share2, 
    Download, Heart, Package, Truck, Phone
} from "lucide-react"
import { motion } from "framer-motion"
import { formatPrice } from "@/lib/utils"

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}>
            <CheckoutSuccessContent />
        </Suspense>
    )
}

function CheckoutSuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="py-6 border-b border-slate-100 bg-white">
                <div className="container max-w-4xl mx-auto px-4 flex justify-center">
                    <Link href="/">
                        <Image src="/logo.png" alt="Miravet" width={180} height={54} className="h-12 w-auto" />
                    </Link>
                </div>
            </header>

            <main className="flex-1 container max-w-2xl mx-auto px-4 py-12 sm:py-20 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Commande Confirmée !</h1>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
                        Merci pour votre confiance. Votre commande est en cours de traitement par notre équipe.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ID de commande</p>
                            <p className="font-mono font-bold text-slate-900">#{orderId?.slice(0, 8).toUpperCase() || 'N/A'}</p>
                        </div>
                        <div className="h-px w-10 bg-slate-200 hidden sm:block" />
                        <div className="text-center sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Statut</p>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase">
                                <div className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                                En attente
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Boutique
                            </Button>
                        </Link>
                        <Link href="/reseller/dashboard" className="w-full">
                            <Button className="w-full h-14 rounded-2xl bg-black hover:bg-slate-900 text-white font-black shadow-xl">
                                Suivre ma commande
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Additional Info Cards */}
                <div className="grid sm:grid-cols-3 gap-6 mt-12">
                     <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-900">Livraison 24h-48h</p>
                     </div>
                     <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Phone className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-900">Support Client Pro</p>
                     </div>
                     <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                            <Heart className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-900">Garantie Miravet</p>
                     </div>
                </div>
            </main>

            <footer className="py-12 bg-white border-t border-slate-100 mt-auto">
                <div className="container max-w-4xl mx-auto px-4 text-center">
                    <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} Miravet Premium. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    )
}
