"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProductById, getProducts, getCurrentUserRole, getCurrentResellerTier, type Product, ResellerTier } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ShoppingBag, Star, Minus, Plus, Truck, ShieldCheck, RotateCcw, Check, Sparkles, Search, AlertTriangle } from "lucide-react"
import { ProductDetailsSkeleton } from "@/components/ui/store-skeletons"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const router = useRouter()
  const { addItem, cartCount } = useCart()
  const { t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [productData, roleData, tierData] = await Promise.all([
        getProductById(productId),
        getCurrentUserRole(),
        getCurrentResellerTier()
      ])

      setProduct(productData)
      setUserRole(roleData)
      setResellerTier(tierData)

      if (productData) {
        // Fetch related products from same category
        const related = await getProducts({
          category: productData.category,
          limit: 4,
          status: 'active'
        })
        // Filter out current product
        setRelatedProducts(related.filter(p => p.id !== productData.id))
      }

      setLoading(false)
    }
    if (productId) {
      loadData()
    }
  }, [productId])

  // Scroll to top on mount or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    setSelectedImage(0)
    setQuantity(1)
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass-strong py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="w-32 h-10 bg-muted shimmer rounded-lg" />
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-muted shimmer rounded-full" />
                <div className="w-10 h-10 bg-muted shimmer rounded-full" />
              </div>
            </div>
          </div>
        </header>
        <ProductDetailsSkeleton />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Produit non trouvé</h2>
          <Button asChild variant="outline">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    )
  }

  const displayTitle = product.title
  const displayDescription = product.description || ""
  const displayBenefits = product.benefits || []
  const displayIngredients = product.ingredients || ""
  const displayHowToUse = product.how_to_use || ""

  const inStock = product.stock > 0
  const stockLevel = product.stock
  const stockStatus = stockLevel > 5 ? 'in_stock' : stockLevel > 0 ? 'low_stock' : 'out_of_stock'
  const productImages = (product.images && product.images.length > 0) ? product.images : ["/placeholder.svg?height=600&width=600"]
  const rating = 5.0
  const reviewsCount = 127 // Placeholder

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src="/logo.png"
                alt="Didali Store"
                width={120}
                height={34}
                className="h-8 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-primary/5 hover:text-primary transition-all group"
                >
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform">
                    {cartCount}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb - Hidden on mobile for cleaner look */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/#shop" className="hover:text-primary transition-colors">Boutique</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{displayTitle}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images - Mobile Slide / Desktop Grid */}
          <div className="space-y-4 -mx-4 sm:mx-0">
            {/* Mobile: Horizontal Snap Scroll */}
            <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 gap-4 px-4">
              {productImages.map((image, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[85vw] aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-white/10 glass-strong">
                  <Image
                    src={image}
                    alt={`${displayTitle} ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>

            {/* Desktop: Featured Image */}
            <div className="hidden sm:block glass rounded-3xl overflow-hidden aspect-square relative shadow-2xl group">
              <Image
                src={productImages[selectedImage]}
                alt={displayTitle}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>

            {/* Desktop: Thumbnails */}
            <div className="hidden sm:grid grid-cols-4 gap-3 sm:gap-4">
              {productImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`glass rounded-2xl overflow-hidden aspect-square transition-all ${selectedImage === idx ? "ring-2 ring-primary scale-95 opacity-100" : "hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${idx + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight leading-tight">
                {displayTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/5">
                  <span className="text-xs font-bold text-primary">{rating}</span>
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="text-[10px] text-muted-foreground ml-1">({reviewsCount})</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${stockStatus === 'in_stock'
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : stockStatus === 'low_stock'
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}>
                  {stockStatus === 'in_stock' && <Check className="w-3 h-3" />}
                  {stockStatus === 'low_stock' && <AlertTriangle className="w-3 h-3" />}
                  {t(`product.${stockStatus}`)}
                </div>
              </div>

              <div className="flex items-baseline gap-3 sm:gap-4 mb-6 sm:mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
                {/* Dynamic Price Display */}
                {resellerTier ? (
                  (() => {
                    const tier = resellerTier || 'reseller'
                    const tierPrice =
                      tier === 'wholesaler'
                        ? product.wholesaler_price
                        : tier === 'partner'
                          ? product.partner_price
                          : product.reseller_price

                    if (tierPrice) {
                      const label =
                        tier === 'wholesaler'
                          ? 'Prix Grossiste'
                          : tier === 'partner'
                            ? 'Prix Partenaire'
                            : 'Prix Revendeur'

                      return (
                        <>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                              {label}
                            </span>
                            <span className="text-3xl sm:text-4xl font-extrabold text-primary">
                              {t('common.currency')} {formatPrice(tierPrice / 1.2)} <span className="text-sm font-normal text-muted-foreground align-middle">HT</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              (+ 20% TVA)
                            </span>
                          </div>
                          <div className="flex flex-col items-start border-l pl-4 border-primary/20">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                              Standard
                            </span>
                            <span className="text-lg text-muted-foreground line-through decoration-destructive/30 decoration-2">
                              {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] align-middle">TTC</span>
                            </span>
                          </div>
                        </>
                      )
                    }

                    return (
                      <>
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary">
                          {t('common.currency')} {formatPrice(product.price)} <span className="text-sm font-normal text-muted-foreground align-middle">TTC</span>
                        </span>
                        {(product.compare_at_price ?? 0) > 0 && (
                          <span className="text-xl text-muted-foreground line-through decoration-destructive/30 decoration-2">
                            {t('common.currency')} {formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </>
                    )
                  })()
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary">
                      {t('common.currency')} {formatPrice(product.price)} <span className="text-sm font-normal text-muted-foreground align-middle">TTC</span>
                    </span>
                    {(product.compare_at_price ?? 0) > 0 && (
                      <span className="text-xl text-muted-foreground line-through decoration-destructive/30 decoration-2">
                        {t('common.currency')} {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              className="text-muted-foreground leading-relaxed mb-10 text-lg border-l-4 border-primary/20 pl-6 italic prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: displayDescription }}
            />

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-foreground mb-4 uppercase tracking-widest text-primary/80">
                {t('product.quantity')}
              </label>
              <div className="flex items-center gap-4 bg-secondary/30 w-fit p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-background shadow-sm transition-all text-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1) {
                      setQuantity(val)
                    }
                  }}
                  className="w-16 text-center font-bold text-lg text-foreground bg-transparent border-none h-auto p-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-background shadow-sm transition-all text-foreground"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="flex-1 h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => {
                  const tier = resellerTier || 'reseller'
                  const tierPrice =
                    resellerTier
                      ? tier === 'wholesaler'
                        ? product.wholesaler_price
                        : tier === 'partner'
                          ? product.partner_price
                          : product.reseller_price
                      : undefined

                  addItem({
                    id: product.id,
                    name: product.title,
                    nameAr: product.title_ar || undefined,
                    price: Number(product.price),
                    image: productImages[0],
                    quantity: quantity,
                    inStock: inStock,
                    resellerPrice: tierPrice ?? product.reseller_price ?? undefined
                  })
                  router.push("/cart")
                }}
              >
                <ShoppingBag className="w-6 h-6 mr-3" />
                {t('product.add_to_cart')}
              </Button>
            </div>

            {/* Accordion Details */}
            <Accordion type="single" collapsible className="space-y-4 mb-16">
              {product.benefits && product.benefits.length > 0 && (
                <AccordionItem value="benefits" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      {t('product.features')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2">
                    <ul className="grid gap-4">
                      {displayBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-4 text-muted-foreground group">
                          <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0 transition-transform group-hover:scale-150" />
                          <span className="text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.ingredients && (
                <AccordionItem value="ingredients" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    {t('product.specifications')}
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2 text-muted-foreground leading-relaxed text-lg">
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: displayIngredients }} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {product.how_to_use && (
                <AccordionItem value="how-to-use" className="glass rounded-3xl border-white/5 overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-5 hover:no-underline font-bold text-xl text-foreground">
                    {t('product.warranty')}
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-2 text-muted-foreground leading-relaxed text-lg">
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: displayHowToUse }} />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Truck, text: t('cart.trust.shipping') },
                { icon: ShieldCheck, text: t('cart.trust.secure') },
                { icon: RotateCcw, text: t('cart.trust.returns') },
              ].map((item, idx) => (
                <div key={idx} className="glass-subtle p-6 rounded-3xl text-center hover:bg-white/5 transition-colors">
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground leading-tight">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 sm:mt-32">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                  {t('product.you_may_also_like')}
                </h2>
                <p className="text-muted-foreground max-w-xl text-lg">
                  Équipez-vous avec le meilleur matériel informatique de notre collection.
                </p>
              </div>
              <Button variant="ghost" className="hidden sm:flex rounded-full text-primary hover:bg-primary/5" asChild>
                <Link href="/#shop">Voir tous les produits</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="glass rounded-3xl p-3 sm:p-5 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full shadow-lg shadow-black/5"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 sm:mb-6 bg-muted relative">
                    <Image
                      src={(item.images && item.images[0]) || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Discount Badge Removed */}
                  </div>
                  <h3 className="font-bold text-foreground text-sm sm:text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-base sm:text-xl font-bold text-primary">
                        {t('common.currency')} {formatPrice(item.price)}
                      </span>
                      {(item.compare_at_price ?? 0) > 0 && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                          {t('common.currency')} {formatPrice(item.compare_at_price)}
                        </span>
                      )}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-white/10 z-50 lg:hidden safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.15)] pb-safe">
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-secondary/80 rounded-2xl px-1 border border-white/5 h-14">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-10 text-foreground hover:bg-white/10 rounded-xl"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-bold text-lg text-foreground">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-10 text-foreground hover:bg-white/10 rounded-xl"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="lg"
            className="flex-1 h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              addItem({
                id: product.id,
                name: product.title,
                nameAr: product.title_ar || undefined,
                price: Number(product.price),
                image: productImages[0],
                quantity: quantity,
                inStock: inStock,
                resellerPrice: product.reseller_price
              })
              router.push("/cart")
            }}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            <div className="flex flex-col items-start leading-none ml-1">
              <span className="text-[10px] opacity-80 font-normal uppercase tracking-wider">{t('product.add_to_cart')}</span>
              <span className="text-base font-bold">{t('common.currency')} {formatPrice(product.price * quantity)}</span>
            </div>
          </Button>
        </div>
      </div>
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
              <p className="text-muted-foreground/80 max-w-sm leading-relaxed text-sm">
                Didali Store - Votre partenaire de confiance pour le matériel et les solutions informatiques au Maroc.
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.company')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/our-story" className="hover:text-primary transition-colors block py-1">{t('footer.our_story')}</Link></li>
                  <li><Link href="/sustainability" className="hover:text-primary transition-colors block py-1">{t('footer.sustainability')}</Link></li>
                  <li><Link href="/press" className="hover:text-primary transition-colors block py-1">{t('footer.press')}</Link></li>
                  <li><Link href="/careers" className="hover:text-primary transition-colors block py-1">{t('footer.careers')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.support')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/contact" className="hover:text-primary transition-colors block py-1">{t('footer.contact_us')}</Link></li>
                  <li><Link href="/shipping-info" className="hover:text-primary transition-colors block py-1">{t('footer.shipping_info')}</Link></li>
                  <li><Link href="/track-order" className="hover:text-primary transition-colors block py-1">{t('footer.track_order')}</Link></li>
                  <li><Link href="/faq" className="hover:text-primary transition-colors block py-1">{t('nav.faq')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.legal')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/privacy-policy" className="hover:text-primary transition-colors block py-1">{t('footer.privacy_policy')}</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors block py-1">{t('footer.terms')}</Link></li>
                  <li><Link href="/refund-policy" className="hover:text-primary transition-colors block py-1">{t('footer.refund_policy')}</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors block py-1">{t('footer.cookies')}</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Didali Store. {t('footer.rights')}</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">{t('footer.privacy_short')}</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">{t('footer.terms_short')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
