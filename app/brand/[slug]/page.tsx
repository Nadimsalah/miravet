"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProducts, getBrandBySlug, type Product, Brand } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, ShoppingBag, ArrowLeft, Filter, Sparkles } from "lucide-react"
import { ProductCardSkeleton } from "@/components/ui/store-skeletons"
import { useLanguage } from "@/components/language-provider"

export default function BrandPage() {
    const params = useParams()
    const slug = params.slug as string
    const router = useRouter()
    const { t } = useLanguage()
    const [brand, setBrand] = useState<Brand | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            console.log("Loading brand data for slug:", slug)
            const brandData = await getBrandBySlug(slug)
            setBrand(brandData)
            console.log("Brand found:", brandData)

            if (brandData) {
                console.log("Fetching products for brand ID:", brandData.id)
                const productsData = await getProducts({
                    brand_id: brandData.id
                    // status: 'active' - Removed to show all linked products
                })
                console.log("Products found:", productsData?.length || 0, productsData)
                setProducts(productsData)
            }
            setLoading(false)
        }
        if (slug) {
            loadData()
        }
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="container mx-auto">
                    <div className="w-48 h-12 bg-muted shimmer rounded-xl mb-12" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!brand) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <div className="container relative z-10 px-4">
                    <div className="max-w-md mx-auto text-center space-y-8 glass-strong p-12 rounded-[3rem] border border-white/10 shadow-2xl">
                        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto scale-110 rotate-3">
                            <Search className="w-12 h-12 text-primary opacity-50" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                                Marque <span className="text-primary tracking-normal">404</span>
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Désolé, la marque <span className="font-bold text-foreground">"{slug}"</span> n'existe pas ou n'est plus disponible.
                            </p>
                        </div>
                        <Button asChild className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" variant="default">
                            <Link href="/">Retour à l'accueil</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header / Brand Banner */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5 border-b border-white/5">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="container mx-auto flex flex-col items-center text-center space-y-6">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white shadow-2xl p-4 flex items-center justify-center border border-white/20 transform hover:scale-105 transition-transform duration-500">
                            {brand.logo ? (
                                <Image
                                    src={brand.logo}
                                    alt={brand.name}
                                    fill
                                    className="object-contain p-6"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-primary">{brand.name.substring(0, 1)}</span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground uppercase">
                            {brand.name}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 font-medium">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Collection Officielle
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            Produits Disponibles
                            <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {products.length}
                            </span>
                        </h2>
                        <p className="text-sm text-muted-foreground">Découvrez notre sélection de produits {brand.name}</p>
                    </div>

                    <Link href="/">
                        <Button variant="ghost" className="rounded-full hover:bg-primary/5">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Tous les produits
                        </Button>
                    </Link>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/10 rounded-[3rem] border border-dashed border-white/10">
                        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">Aucun produit pour le moment</h3>
                        <p className="text-muted-foreground">Revenez bientôt pour découvrir les nouveautés {brand.name}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="group glass rounded-3xl p-3 sm:p-5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full border border-white/5 hover:border-primary/20"
                            >
                                <div className="aspect-square rounded-2xl overflow-hidden mb-4 sm:mb-6 bg-muted relative">
                                    <Image
                                        src={(product.images && product.images[0]) || "/placeholder.svg"}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="font-bold text-foreground text-sm sm:text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    {product.title}
                                </h3>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-base font-bold text-primary">
                                            {t('common.currency')} {formatPrice(product.price)}
                                        </span>
                                        {(product.compare_at_price ?? 0) > 0 && (
                                            <span className="text-[10px] sm:text-xs text-muted-foreground line-through decoration-destructive/30">
                                                {t('common.currency')} {formatPrice(product.compare_at_price || 0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                        <ShoppingBag className="w-4 h-4 sm:w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
