"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProductById, getProducts, getCurrentUserRole, getCurrentResellerTier, getAdminSettings, type Product, ResellerTier } from "@/lib/supabase-api"
import { formatPrice, cn } from "@/lib/utils"
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

// Product Card Component for Related Products
function ProductCard({ product, userRole, resellerTier }: { product: Product, userRole?: string | null, resellerTier?: ResellerTier }) {
  const { t, language } = useLanguage()
  const isArabic = language === 'ar'
  const rating = 5
  return (
    <Link href={`/product/${product.id}`} className="group glass rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 block h-full">
      <div className="aspect-square bg-gradient-to-br from-secondary to-muted rounded-xl sm:rounded-2xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative shadow-inner">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={isArabic && product.title_ar ? product.title_ar : product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 min-h-[100px] flex flex-col">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs sm:text-sm line-clamp-2">
          {isArabic && product.title_ar ? product.title_ar : product.title}
        </h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-2.5 h-2.5 ${i < rating ? "fill-primary text-primary" : "text-muted"}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex flex-col">
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
                  return (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {t('common.currency')} {formatPrice(tierPrice / 1.2)} <span className="text-[8px] font-normal text-muted-foreground">HT</span>
                      </span>
                    </>
                  )
                }

                return (
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {t('common.currency')} {formatPrice(product.price)}
                  </span>
                )
              })()
            ) : (
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {t('common.currency')} {formatPrice(product.price)}
              </span>
            )}
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

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
  const [shippingEnabled, setShippingEnabled] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [productData, roleData, tierData, settingsData] = await Promise.all([
        getProductById(productId),
        getCurrentUserRole(),
        getCurrentResellerTier(),
        getAdminSettings()
      ])

      setProduct(productData)
      setUserRole(roleData)
      setResellerTier(tierData)
      setShippingEnabled(settingsData.shipping_enabled !== 'false')

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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 py-4 transition-all duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex-shrink-0 relative group">
                <Image
                  src="/logo.png"
                  alt="Didali Store"
                  width={130}
                  height={38}
                  className="h-9 sm:h-11 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 hover:text-primary transition-all group">
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button
                  variant="ghost"
                  className="relative rounded-full hover:bg-primary/5 hover:text-primary transition-all group px-3 gap-2"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      {cartCount}
                    </span>
                  </div>
                  <span className="hidden sm:inline font-semibold">{t('common.cart')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-12 max-w-[1400px]">
        {/* Breadcrumb - More compact on mobile */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground/60 mb-6 sm:mb-10 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-primary transition-colors uppercase tracking-wider font-medium">Accueil</Link>
          <span className="opacity-20">/</span>
          <Link href="/#shop" className="hover:text-primary transition-colors uppercase tracking-wider font-medium">Boutique</Link>
          <span className="opacity-20">/</span>
          <span className="text-foreground/80 font-bold truncate uppercase tracking-wider">{displayTitle}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Images - Optimized for laptop aspect ratios */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <div className="relative space-y-4 -mx-4 sm:mx-0">
              {/* Mobile: Horizontal Snap Scroll with indicators */}
              <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8 gap-4 px-4 scroll-smooth">
                {productImages.map((image, idx) => (
                  <div key={idx} className="snap-center shrink-0 w-[88vw] aspect-square relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-secondary/10">
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

              {/* Desktop Gallery: More balanced for laptops */}
              <div className="hidden sm:flex flex-col gap-6">
                {/* Main View - Increased depth */}
                <div className="glass-strong rounded-[2.5rem] overflow-hidden aspect-square relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] group border-white/10 bg-secondary/5">
                  <Image
                    src={productImages[selectedImage]}
                    alt={displayTitle}
                    fill
                    className="object-cover transition-all duration-1000 group-hover:scale-110"
                    priority
                  />

                  {/* Subtle Grain Overlay */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                  <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none z-10">
                    <div className="bg-primary/90 backdrop-blur-xl text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-2xl">
                      Exclusivité Didali
                    </div>
                  </div>
                </div>

                {/* Thumbnails - Horizontal list for better vertical space on laptops */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                  {productImages.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-24 h-24 shrink-0 glass-strong rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${selectedImage === idx
                        ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-95"
                        : "hover:scale-105 opacity-40 hover:opacity-100 grayscale hover:grayscale-0"
                        }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} ${idx + 1}`}
                        fill
                        className="object-cover p-2 rounded-2xl"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Info - Balanced spacing for laptops */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col lg:sticky lg:top-28">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-foreground mb-4 tracking-tight leading-[1.1] text-balance">
                  {displayTitle}
                </h1>

                {product.brand && (
                  <Link
                    href={`/brand/${product.brand.slug}`}
                    className="inline-flex items-center gap-4 mb-8 p-1 sm:p-2 pr-6 bg-white/5 backdrop-blur-3xl rounded-[1.25rem] border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group w-fit shadow-2xl"
                  >
                    {product.brand.logo ? (
                      <div className="relative w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                        <Image
                          src={product.brand.logo}
                          alt={product.brand.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:rotate-12 transition-transform">
                        <span className="text-primary font-bold text-xl">{product.brand.name.substring(0, 1)}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] leading-none mb-1">Partenaire</span>
                      <span className="text-base font-bold text-foreground">{product.brand.name}</span>
                    </div>
                  </Link>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex items-center gap-1.5 bg-primary/5 rounded-full px-3 py-1.5 border border-primary/10">
                    <span className="text-sm font-bold text-primary">{rating.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-primary text-primary" : "text-primary/30"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-bold ml-1 uppercase">{reviewsCount} avis</span>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${stockStatus === 'in_stock'
                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                    : stockStatus === 'low_stock'
                      ? "bg-amber-500/5 text-amber-500 border-amber-500/20"
                      : "bg-destructive/5 text-destructive border-destructive/20"
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stockStatus === 'in_stock' ? 'bg-emerald-500' : stockStatus === 'low_stock' ? 'bg-amber-500' : 'bg-destructive'}`} />
                    {t(`product.${stockStatus}`)}
                  </div>
                </div>
              </div>

              {/* Price Card - Redesigned for impact */}
              <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-secondary/50 to-secondary/30 border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                {resellerTier ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 inline-block">Prix Professionnel</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter">
                          {formatPrice((resellerTier === 'wholesaler' ? product.wholesaler_price : resellerTier === 'partner' ? product.partner_price : product.reseller_price) || 0)}
                        </span>
                        <span className="text-lg font-bold text-muted-foreground uppercase">{t('common.currency')}</span>
                      </div>
                    </div>
                    <div className="sm:text-right pt-4 sm:pt-0 sm:border-l sm:pl-8 border-white/10">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2 inline-block">Public</span>
                      <div className="text-2xl text-muted-foreground/40 line-through decoration-2 font-bold decoration-destructive/30 italic">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-4 relative z-10">
                    <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 tracking-tighter">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary uppercase leading-none">{t('common.currency')}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">TTC</span>
                    </div>
                    {(product.compare_at_price ?? 0) > 0 && (
                      <span className="ml-2 text-xl text-muted-foreground/40 line-through decoration-2 font-bold italic">
                        {formatPrice(product.compare_at_price || 0)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description - More readable */}
              <div
                className="text-muted-foreground/80 leading-relaxed text-lg prose prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-foreground border-l-2 border-primary/20 pl-8 py-2"
                dangerouslySetInnerHTML={{ __html: displayDescription }}
              />

              {/* Quantity Selector - Compact on Desktop */}
              <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                <div className="w-full sm:w-auto">
                  <div className={`flex items-center justify-between sm:justify-start gap-4 bg-secondary/20 p-2 rounded-2xl border border-white/5 backdrop-blur-xl ${!inStock ? 'opacity-40 pointer-events-none' : ''}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl hover:bg-white/10 text-foreground transition-all"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || !inStock}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 1) setQuantity(val)
                        else if (e.target.value === '') setQuantity(1)
                      }}
                      className="w-12 text-center font-black text-xl tabular-nums bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl hover:bg-white/10 text-foreground transition-all"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={!inStock}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={!inStock}
                  className="w-full sm:flex-1 h-16 rounded-2xl text-lg font-black shadow-[0_20px_40px_-5px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground group overflow-hidden relative"
                  onClick={() => {
                    const tier = resellerTier || 'reseller'
                    const tierPrice = resellerTier ? (tier === 'wholesaler' ? product.wholesaler_price : tier === 'partner' ? product.partner_price : product.reseller_price) : undefined
                    addItem({
                      id: product.id,
                      name: product.title,
                      nameAr: product.title_ar || undefined,
                      price: Number(product.price),
                      image: productImages[0],
                      quantity: quantity,
                      inStock: inStock,
                      stock: stockLevel,
                      resellerPrice: tierPrice ?? product.reseller_price ?? undefined
                    })
                    router.push("/cart")
                  }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 group-hover:h-full transition-all duration-500 opacity-20 pointer-events-none" />
                  <ShoppingBag className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Acheter maintenant
                </Button>
              </div>

              {/* Specifications & Warranty Accordions */}
              <div className="space-y-4 pt-4">
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {product.benefits && product.benefits.length > 0 && (
                    <AccordionItem value="features" className="border-none">
                      <AccordionTrigger className="flex px-6 py-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all hover:no-underline group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-lg tracking-tight uppercase tracking-widest text-sm">Caractéristiques</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 px-8 py-8 glass-strong rounded-3xl">
                        <ul className="grid sm:grid-cols-2 gap-6">
                          {displayBenefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-4">
                              <div className="mt-1.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-muted-foreground text-base leading-snug">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {product.ingredients && (
                    <AccordionItem value="specs" className="border-none">
                      <AccordionTrigger className="flex px-6 py-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all hover:no-underline group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-lg tracking-tight uppercase tracking-widest text-sm">Spécifications</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="mt-2 px-8 py-8 glass-strong rounded-3xl">
                        <div className="prose prose-invert prose-p:text-muted-foreground prose-li:text-muted-foreground" dangerouslySetInnerHTML={{ __html: displayIngredients }} />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>


            </div>
          </div>
        </div>

      </main>

      {/* Related Products - Restored */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-16 sm:py-24 max-w-[1400px]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tighter">
                {t('product.you_may_also_like')}
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg border-l-2 border-primary/20 pl-6">
                Découvrez d'autres solutions technologiques sélectionnées pour vous par Didali Store.
              </p>
            </div>
            <Button variant="ghost" className="hidden sm:flex rounded-full text-primary hover:bg-primary/5 group" asChild>
              <Link href="/#shop" className="flex items-center gap-2">
                Voir tout le catalogue <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} userRole={userRole} resellerTier={resellerTier} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden z-50 pointer-events-none">
        <div className="max-w-xl mx-auto pointer-events-auto">
          <div className="glass-strong border border-white/10 rounded-[2.5rem] p-3 shadow-[0_-12px_40px_rgba(0,0,0,0.3)] flex items-center gap-3">
            <div className="flex items-center bg-white/5 rounded-2xl border border-white/5 px-1 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-foreground"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || !inStock}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val) && val >= 1) setQuantity(val)
                  else if (e.target.value === '') setQuantity(1)
                }}
                className="w-8 text-center font-bold text-sm tabular-nums bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-foreground"
                onClick={() => setQuantity(quantity + 1)}
                disabled={!inStock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              size="lg"
              disabled={!inStock}
              className="flex-1 h-12 rounded-2xl text-sm font-black bg-primary text-primary-foreground shadow-lg active:scale-95 transition-all flex items-center justify-between px-6"
              onClick={() => {
                const tier = resellerTier || 'reseller'
                const tierPrice = resellerTier ? (tier === 'wholesaler' ? product.wholesaler_price : tier === 'partner' ? product.partner_price : product.reseller_price) : undefined

                addItem({
                  id: product.id,
                  name: product.title,
                  nameAr: product.title_ar || undefined,
                  price: Number(product.price),
                  image: productImages[0],
                  quantity: quantity,
                  inStock: inStock,
                  stock: stockLevel,
                  resellerPrice: tierPrice ?? product.reseller_price ?? undefined
                })
                router.push("/cart")
              }}
            >
              <span>Acheter maintenant</span>
              <div className="flex items-center gap-1 opacity-80">
                <span className="text-[10px] font-bold">{t('common.currency')}</span>
                <span className="font-black">{formatPrice(product.price * quantity)}</span>
              </div>
            </Button>
          </div>
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
