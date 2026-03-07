"use client"

import React, { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingBag,
  Minus,
  Plus,
  X,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Trash2,
  Tag,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { getCurrentUserRole, getCurrentResellerTier, getAdminSettings, ResellerTier } from "@/lib/supabase-api"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CartItemSkeleton } from "@/components/ui/store-skeletons"



export default function CartPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const { items: cartItems, removeItem, updateQuantity, isInitialized } = useCart()
  const { t, language } = useLanguage()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
  const [shippingEnabled, setShippingEnabled] = useState(true)

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

  // Cart calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const price = (isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price
    return sum + price * item.quantity
  }, 0)
  const discount = promoApplied ? subtotal * 0.2 : 0
  const total = subtotal - discount

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "ARGAN20") {
      setPromoApplied(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? "glass-strong py-2" : "bg-transparent py-4"
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src="/logo.png"
                alt="Didali Store"
                width={120}
                height={34}
                className="h-8 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>



            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {cartItems.length}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('cart.continue_shopping')}
        </Link>

        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="glass-strong rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">{t('cart.your_cart_empty')}</h1>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
              {t('cart.empty_desc')}
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 w-full sm:w-auto">
                {t('cart.start_shopping')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('cart.shopping_cart')}</h1>
                <span className="text-sm sm:text-base text-muted-foreground">{cartItems.length} {t('cart.items')}</span>
              </div>

              {!isInitialized ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <CartItemSkeleton key={i} />
                ))
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="glass rounded-xl sm:rounded-2xl p-3 sm:p-6 group hover:shadow-xl transition-all">
                    {/* ... item content ... */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Product Image */}
                      <div className="relative flex-shrink-0">
                        <div className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 aspect-square sm:aspect-auto rounded-xl overflow-hidden bg-muted">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 line-clamp-2">
                              {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                            </h3>
                            {item.size && <p className="text-xs sm:text-sm text-muted-foreground">Size: {item.size}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                            onClick={() => removeItem(item.id, item.size)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-transparent"
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-bold text-foreground">
                              {t('common.currency')} {formatPrice(((isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price) * item.quantity)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {t('common.currency')} {formatPrice((isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24 space-y-5 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{t('cart.order_summary')}</h2>
                {/* Promo Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('cart.promo_code')}</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('cart.enter_code')}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="rounded-full bg-background/50"
                    />
                    <Button
                      variant="outline"
                      onClick={applyPromo}
                      disabled={promoApplied}
                      className="rounded-full bg-transparent"
                    >
                      {promoApplied ? t('cart.applied') : t('cart.apply')}
                    </Button>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">{t('cart.discount_applied')}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-foreground/80">
                    <span>{t('cart.subtotal')}</span>
                    <span className="font-medium">{t('common.currency')} {formatPrice(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-primary">
                      <span>Discount (20%)</span>
                      <span className="font-medium">-{t('common.currency')} {formatPrice(discount)}</span>
                    </div>
                  )}

                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold text-foreground">
                  <span>{t('cart.total')}</span>
                  <span>{t('common.currency')} {formatPrice(total)}</span>
                </div>

                {/* Checkout Button */}
                <Link href="/checkout" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all text-base h-12"
                  >
                    {t('cart.proceed_checkout')}
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span>{t('cart.trust.secure')}</span>
                  </div>
                  {shippingEnabled && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <span>{t('cart.trust.shipping')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
        }
      </main >


      {/* Footer */}
      <footer className="bg-background border-t border-border/40 py-16 sm:py-20 relative overflow-hidden mt-12 print:hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-4 lg:col-span-5 space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="Didali Store"
                  width={142}
                  height={40}
                  className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-muted-foreground/80 max-w-sm leading-relaxed text-sm text-left">
                Didali Store - Your trusted partner for IT hardware and solutions in Morocco. Empowering businesses with technology.
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="text-left">
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/our-story" className="hover:text-primary transition-colors block py-1">Our Story</Link></li>
                  <li><Link href="/sustainability" className="hover:text-primary transition-colors block py-1">Sustainability</Link></li>
                  <li><Link href="/press" className="hover:text-primary transition-colors block py-1">Press</Link></li>
                  <li><Link href="/careers" className="hover:text-primary transition-colors block py-1">Careers</Link></li>
                </ul>
              </div>

              <div className="text-left">
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Support</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/contact" className="hover:text-primary transition-colors block py-1">Contact Us</Link></li>
                  <li><Link href="/shipping-info" className="hover:text-primary transition-colors block py-1">Shipping Info</Link></li>
                  <li><Link href="/track-order" className="hover:text-primary transition-colors block py-1">Track Order</Link></li>
                  <li><Link href="/faq" className="hover:text-primary transition-colors block py-1">FAQ</Link></li>
                </ul>
              </div>

              <div className="text-left">
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Legal</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/privacy-policy" className="hover:text-primary transition-colors block py-1">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors block py-1">Terms of Service</Link></li>
                  <li><Link href="/refund-policy" className="hover:text-primary transition-colors block py-1">Refund Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors block py-1">Cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Didali Store. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
