"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ShoppingBag, Minus, Plus, ArrowLeft, ShieldCheck,
  Truck, Trash2, ArrowRight, Tag, Package
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { getCurrentUserRole, getCurrentResellerTier, getAdminSettings, ResellerTier } from "@/lib/supabase-api"
import { CartItemSkeleton } from "@/components/ui/store-skeletons"
import { motion, AnimatePresence } from "framer-motion"

export default function CartPage() {
  const { items: cartItems, removeItem, updateQuantity, isInitialized } = useCart()
  const { t, language } = useLanguage()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
  const [shippingEnabled, setShippingEnabled] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [role, tier, settings] = await Promise.all([
        getCurrentUserRole(),
        getCurrentResellerTier(),
        getAdminSettings()
      ])
      setUserRole(role)
      setResellerTier(tier)
      setShippingEnabled(settings.shipping_enabled !== 'false')
    }
    fetchData()
  }, [])

  const isResellerAccount = resellerTier !== null

  const subtotal = cartItems.reduce((sum, item) => {
    const price = (isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price
    return sum + price * item.quantity
  }, 0)

  const total = subtotal

  const handleRemove = (id: string, size?: string) => {
    setRemovingId(id)
    setTimeout(() => {
      removeItem(id, size)
      setRemovingId(null)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0">
              <Image src="/logo.png" alt="Miravet" width={180} height={54} className="h-12 w-auto" />
            </Link>
            <Link href="/cart">
              <Button variant="ghost" className="relative rounded-full gap-2 px-3" size="sm">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartItems.length}
                    </span>
                  )}
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Continuer mes achats
        </Link>

        {cartItems.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-12 text-center max-w-lg mx-auto"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Votre panier est vide</h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Explorez notre catalogue et ajoutez des produits à votre panier pour passer commande.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 font-bold">
              <Link href="/">Découvrir les produits</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Mon Panier</h1>
                <span className="text-sm text-muted-foreground bg-secondary/40 px-3 py-1 rounded-full font-medium">
                  {cartItems.length} article{cartItems.length > 1 ? 's' : ''}
                </span>
              </div>

              {!isInitialized ? (
                [...Array(2)].map((_, i) => <CartItemSkeleton key={i} />)
              ) : (
                <AnimatePresence>
                  {cartItems.map((item) => {
                    const unitPrice = (isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price
                    const isRemoving = removingId === item.id
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: isRemoving ? 0 : 1, x: isRemoving ? -30 : 0 }}
                        exit={{ opacity: 0, x: -30, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="glass rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex gap-4">
                          {/* Image */}
                          <Link href={`/product/${item.id}`} className="shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-secondary/30 relative border border-white/5 hover:scale-105 transition-transform">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                              {!item.inStock && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                  <span className="text-white text-[10px] font-bold">Rupture</span>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Details */}
                          <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-auto">
                              <div className="flex-1 min-w-0">
                                <Link href={`/product/${item.id}`}>
                                  <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
                                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                  </h3>
                                </Link>
                                {item.size && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Taille: <span className="font-medium">{item.size}</span>
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 rounded-full shrink-0 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground/50 transition-all"
                                onClick={() => handleRemove(item.id, item.size)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Qty + Price */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 border border-white/5">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 rounded-lg hover:bg-white/10"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 rounded-lg hover:bg-white/10"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="text-right">
                                <p className="font-black text-base sm:text-lg text-foreground whitespace-nowrap">
                                  {formatPrice(unitPrice * item.quantity)} <span className="text-xs font-normal text-muted-foreground">MAD</span>
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatPrice(unitPrice)} MAD / unité
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-2xl p-6 lg:sticky lg:top-24 space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Récapitulatif
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total ({cartItems.reduce((s, i) => s + i.quantity, 0)} articles)</span>
                    <span className="font-medium text-foreground">{formatPrice(subtotal)} MAD</span>
                  </div>
                  {shippingEnabled && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison</span>
                      <span className="font-medium text-emerald-500">Calculée à la commande</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-foreground">{formatPrice(total)}</span>
                      <span className="text-xs text-muted-foreground ml-1">MAD</span>
                    </div>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button
                    size="lg"
                    className="w-full h-13 rounded-xl font-black text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group"
                  >
                    Passer la commande
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                {/* Trust badges */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  {[
                    { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, label: "Paiement 100% sécurisé" },
                    { icon: <Truck className="w-4 h-4 text-blue-500" />, label: "Livraison partout au Maroc" },
                    { icon: <Tag className="w-4 h-4 text-primary" />, label: "Meilleurs prix garantis" },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="w-8 h-8 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
                        {b.icon}
                      </div>
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
