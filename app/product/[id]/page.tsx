"use client"

import { useState, useEffect, useRef } from "react"
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
  ShoppingBag, Star, Minus, Plus, Truck, ShieldCheck, RotateCcw,
  Check, Sparkles, Search, Phone, ChevronLeft, ChevronRight,
  Package, Heart, Share2, Award, Zap, ArrowRight, Info
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductDetailsSkeleton } from "@/components/ui/store-skeletons"

function RelatedProductCard({ product }: { product: Product }) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-slate-50">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-200" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-slate-900 text-xs sm:text-sm line-clamp-1 mb-1">
            {isArabic && product.title_ar ? product.title_ar : product.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-slate-900">{formatPrice(product.price)} MAD</span>
            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
              <Plus className="w-4 h-4" />
            </div>
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
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [productData, tierData] = await Promise.all([
          getProductById(productId),
          getCurrentResellerTier()
        ])
        setProduct(productData)
        setResellerTier(tierData)
        if (productData) {
          const related = await getProducts({ category: productData.category, limit: 4, status: 'active' })
          setRelatedProducts(related.filter(p => p.id !== productData.id))
        }
      } catch (err) {
        console.error("Failed to load product", err)
      }
      setLoading(false)
    }
    if (productId) loadData()
  }, [productId])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [productId])

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      window.open('https://wa.me/212522450507', '_blank')
      return
    }
    const tier = resellerTier || 'reseller'
    const tierPrice = resellerTier
      ? (tier === 'wholesaler' ? product.wholesaler_price : tier === 'partner' ? product.partner_price : product.reseller_price)
      : undefined
    
    addItem({
      id: product.id,
      name: product.title,
      nameAr: product.title_ar || undefined,
      price: Number(product.price),
      image: (product.images && product.images[0]) || "",
      quantity,
      inStock: product.stock > 0,
      stock: product.stock,
      resellerPrice: tierPrice ?? product.reseller_price ?? undefined
    })
  }

  if (loading) return <ProductDetailsSkeleton />
  if (!product) return <div className="p-20 text-center">Produit non trouvé</div>

  const inStock = product.stock > 0
  const productImages = (product.images && product.images.length > 0) ? product.images : ["/placeholder.svg"]
  const displayPrice = resellerTier
    ? (resellerTier === 'wholesaler' ? product.wholesaler_price : resellerTier === 'partner' ? product.partner_price : product.reseller_price) || product.price
    : product.price

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Mini Nav */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 px-4 text-center truncate font-semibold text-sm">
            {product.title}
          </div>
          <Link href="/cart" className="relative p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pb-32">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-12">
          {/* Gallery - Mobile Scroll / Desktop Main */}
          <div className="relative">
            <div className="flex lg:grid lg:grid-cols-1 overflow-x-auto snap-x snap-mandatory no-scrollbar bg-slate-50">
              {productImages.map((img, idx) => (
                <div key={idx} className="snap-center shrink-0 w-full aspect-square relative lg:aspect-[4/3]">
                  <Image src={img} alt={product.title} fill className="object-cover" priority={idx === 0} />
                </div>
              ))}
            </div>
            
            {/* Custom Dot Indicators for Mobile */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 lg:hidden px-4">
              {productImages.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/20" />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {product.category || 'Équipement'}
                </span>
                {!inStock && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    Rupture de stock
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                <span className="text-xs text-slate-400 ml-1">4.9 (124 avis)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{formatPrice(displayPrice)}</span>
                <span className="text-sm font-bold text-slate-500">MAD</span>
              </div>
              {product.compare_at_price && (
                <p className="text-sm text-slate-300 line-through">{formatPrice(product.compare_at_price)} MAD</p>
              )}
            </div>

            {/* Selection (if any) - Minimalist style */}
            <div className="space-y-6 pt-4 border-t border-slate-50">
               <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100 shadow-sm shadow-slate-200/50">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-400 hover:text-black shadow-none hover:shadow-sm">
                    <Minus className="w-4 h-4" />
                  </button>
                  <Input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center font-black bg-transparent border-none focus-visible:ring-0 text-lg p-0 h-auto"
                  />
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-400 hover:text-black shadow-none hover:shadow-sm">
                    <Plus className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Tabs */}
            <div className="pt-6">
              <div className="flex gap-8 border-b border-slate-50 mb-4">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={cn("pb-2 text-sm font-bold transition-all border-b-2", activeTab === 'description' ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600')}
                >
                  Détails
                </button>
                <button 
                  onClick={() => setActiveTab('specs')}
                  className={cn("pb-2 text-sm font-bold transition-all border-b-2", activeTab === 'specs' ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600')}
                >
                  Fiche Technique
                </button>
              </div>
              <div className="text-sm leading-relaxed text-slate-600 min-h-[100px]">
                {activeTab === 'description' ? (
                   <div dangerouslySetInnerHTML={{ __html: product.description || "Aucune description disponible." }} />
                ) : (
                   <div dangerouslySetInnerHTML={{ __html: product.ingredients || "Pas de spécifications techniques." }} />
                )}
              </div>
            </div>

            {/* Desktop Add to Cart */}
            <div className="hidden lg:block pt-8">
              <Button 
                onClick={handleAddToCart}
                disabled={!inStock && false}
                className={cn(
                  "w-full h-14 rounded-full text-base font-black transition-all",
                  addedToCart ? "bg-emerald-500 hover:bg-emerald-600" : "bg-black hover:bg-slate-900"
                )}
              >
                {addedToCart ? <Check className="w-5 h-5 mr-2" /> : <ShoppingBag className="w-5 h-5 mr-2" />}
                {addedToCart ? "Ajouté !" : inStock ? "Ajouter au panier" : "Commander sur WhatsApp"}
              </Button>
            </div>
          </div>
        </div>

        {/* Suggest / Related */}
        {relatedProducts.length > 0 && (
          <section className="px-6 py-12 lg:px-8 border-t border-slate-50 mt-12">
            <h2 className="text-xl font-black mb-8">Articles similaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => <RelatedProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 lg:hidden z-50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Prix Total</span>
            <span className="text-xl font-black">{formatPrice(displayPrice * quantity)} MAD</span>
          </div>
          <Button 
            onClick={handleAddToCart}
            className={cn(
              "flex-1 h-14 rounded-2xl text-base font-black transition-all",
              addedToCart ? "bg-emerald-500 hover:bg-emerald-600" : "bg-black hover:bg-slate-900"
            )}
          >
            {addedToCart ? <Check className="w-5 h-5 mr-2" /> : <ShoppingBag className="w-5 h-5 mr-2" />}
            {addedToCart ? "Ajouté !" : inStock ? "Panier" : "WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  )
}
