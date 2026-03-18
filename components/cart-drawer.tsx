"use client"

import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { formatPrice } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function CartDrawer() {
    const { items, removeItem, updateQuantity, cartCount, isCartOpen, setIsCartOpen } = useCart()
    const { language, t } = useLanguage()
    const router = useRouter()
    const isArabic = language === 'ar'

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleCheckout = () => {
        setIsCartOpen(false)
        router.push("/checkout")
    }

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l border-slate-100 shadow-2xl">
                <SheetHeader className="p-6 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-black flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            Mon Panier
                        </SheetTitle>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-500">
                            {cartCount} articles
                        </span>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6 no-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <ShoppingBag className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Votre panier est vide</h3>
                                <p className="text-sm text-slate-400">Découvrez nos produits premium vétérinaires.</p>
                            </div>
                            <Button variant="outline" className="rounded-full px-8 border-slate-200" onClick={() => setIsCartOpen(false)}>
                                Continuer les achats
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={`${item.id}-${item.size}`} className="flex gap-4 group">
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1 pr-4">
                                                {isArabic && item.nameAr ? item.nameAr : item.name}
                                            </h4>
                                            <button 
                                                onClick={() => removeItem(item.id, item.size)}
                                                className="p-1 hover:text-red-500 text-slate-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs font-black text-primary">{formatPrice(item.price)} MAD</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center bg-slate-50 rounded-lg p-0.5">
                                            <button 
                                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.size)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-500"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                                className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-500"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{formatPrice(item.price * item.quantity)} MAD</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <SheetFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-col sm:flex-col gap-4">
                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-slate-500">Sous-total</span>
                                <span className="text-xl font-black text-slate-900">{formatPrice(subtotal)} MAD</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button 
                                    className="w-full h-14 rounded-2xl bg-black hover:bg-slate-900 text-white font-black text-base shadow-xl shadow-black/10 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                    onClick={handleCheckout}
                                >
                                    <span>Passer à la caisse</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white font-bold"
                                    onClick={() => setIsCartOpen(false)}
                                >
                                    Continuer mes achats
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
