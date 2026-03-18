"use client"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { getProducts, type Product } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight, X, ChevronLeft, Loader2, ShoppingBag } from "lucide-react"

// Simple best-sellers grid: reuse products API and show top products when no search query
function BestSellersGrid() {
    const { t } = useLanguage()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [resellerTier, setResellerTier] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setResellerTier(session.user.user_metadata.reseller_tier)
        })
    }, [])

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                setLoading(true)
                const data = await getProducts({ status: "active", limit: 8 })
                if (mounted) {
                    setProducts(data)
                }
            } catch (e) {
                console.error("Failed to load best sellers for search page", e)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">
                    Chargement des produits...
                </p>
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <p className="text-muted-foreground">
                Aucun produit disponible pour le moment.
            </p>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {products.map((product) => (
                <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group glass-liquid rounded-[2.5rem] p-4 sm:p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border border-white/10 hover:border-primary/20 bg-white/5 hover:bg-white/10 flex flex-col h-full overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="aspect-square rounded-3xl overflow-hidden mb-6 relative">
                        <Image
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base sm:text-lg leading-tight line-clamp-2">
                            {product.title}
                        </h3>
                        <div className="flex items-center justify-between gap-2 pt-2">
                            <div className="flex flex-row flex-wrap items-baseline gap-x-2">
                                {(() => {
                                    const tier = resellerTier || 'reseller'
                                    const tierPrice = resellerTier ? (
                                        tier === 'wholesaler' ? product.wholesaler_price :
                                            tier === 'partner' ? product.partner_price :
                                                product.reseller_price
                                    ) : null

                                    if (tierPrice) {
                                        return (
                                            <>
                                                <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                                                    {t("common.currency")} {formatPrice(tierPrice / 1.2)} <span className="text-[10px] font-normal text-muted-foreground">HT</span>
                                                </span>
                                                <span className="text-xs text-muted-foreground line-through opacity-70 whitespace-nowrap">
                                                    {t("common.currency")} {formatPrice(product.price)} <span className="text-[10px]">TTC</span>
                                                </span>
                                            </>
                                        )
                                    }

                                    return (
                                        <>
                                            <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                                                {t("common.currency")} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
                                            </span>
                                            {(product.compare_at_price ?? 0) > 0 && (
                                                <span className="text-xs text-muted-foreground line-through opacity-70 whitespace-nowrap">
                                                    {t("common.currency")} {formatPrice(product.compare_at_price || 0)}
                                                </span>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-black/5 group-hover:shadow-primary/40">
                                <ShoppingBag className="w-5 h-5 sm:w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}

export default function SearchPage() {
    const { t } = useLanguage()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [resellerTier, setResellerTier] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setResellerTier(session.user.user_metadata.reseller_tier)
        })
    }, [])

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setLoading(true)
                setIsSearching(true)
                try {
                    const data = await getProducts({ search: query })
                    setResults(data)
                } catch (error) {
                    console.error("Search failed:", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setResults([])
                setIsSearching(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [query])


    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Liquid Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Header / Search Input Area */}
            <div className="container mx-auto px-4 pt-12 pb-8 relative z-10">
                <div className="flex items-center justify-center relative mb-12">
                    <Link href="/" className="absolute left-0">
                        <Button variant="ghost" size="icon" className="rounded-full glass hover:bg-white/20 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <Image src="/logo.png" alt="Miravet" width={140} height={40} className="h-10 w-auto" />
                </div>

                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 -z-10" />
                    <div className="relative glass-liquid p-2 sm:p-4 rounded-[3rem] border border-white/20 shadow-2xl backdrop-blur-3xl bg-white/5 transition-all duration-500 group-focus-within:bg-white/10 group-focus-within:border-primary/30">
                        <div className="flex items-center px-4 gap-4">
                            <Search className={`w-6 h-6 ${isSearching ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-300`} />
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher vos produits préférés..."
                                className="bg-transparent border-0 focus-visible:ring-0 text-xl sm:text-2xl h-14 sm:h-16 placeholder:text-muted-foreground/50 transition-all font-medium"
                                dir="ltr"
                            />
                            {query && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-white/10"
                                    onClick={() => setQuery("")}
                                >
                                    <X className="w-6 h-6 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="container mx-auto px-4 pb-20 relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse font-medium">Recherche en cours...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="group glass-liquid rounded-[2.5rem] p-4 sm:p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border border-white/10 hover:border-primary/20 bg-white/5 hover:bg-white/10 flex flex-col h-full overflow-hidden relative"
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="aspect-square rounded-3xl overflow-hidden mb-6 relative">
                                    <Image
                                        src={product.images[0] || "/placeholder.svg"}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    {(product.compare_at_price ?? 0) > product.price && (
                                        <div className="absolute top-4 left-4 bg-primary/95 text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                                            -{Math.round((((product.compare_at_price ?? 0) - product.price) / (product.compare_at_price ?? 1)) * 100)}%
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base sm:text-lg leading-tight line-clamp-2">
                                        {product.title}
                                    </h3>
                                    <div className="flex items-center justify-between gap-2 pt-2">
                                        <div className="flex flex-row flex-wrap items-baseline gap-x-2">
                                            {(() => {
                                                const tier = resellerTier || 'reseller'
                                                const tierPrice = resellerTier ? (
                                                    tier === 'wholesaler' ? product.wholesaler_price :
                                                        tier === 'partner' ? product.partner_price :
                                                            product.reseller_price
                                                ) : null

                                                if (tierPrice) {
                                                    return (
                                                        <>
                                                            <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                                                                {t('common.currency')} {formatPrice(tierPrice / 1.2)} <span className="text-[10px] font-normal text-muted-foreground">HT</span>
                                                            </span>
                                                            <span className="text-xs text-muted-foreground line-through opacity-70 whitespace-nowrap">
                                                                {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px]">TTC</span>
                                                            </span>
                                                        </>
                                                    )
                                                }

                                                return (
                                                    <>
                                                        <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                                                            {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
                                                        </span>
                                                        {(product.compare_at_price ?? 0) > 0 && (
                                                            <span className="text-xs text-muted-foreground line-through opacity-70 whitespace-nowrap">
                                                                {t('common.currency')} {formatPrice(product.compare_at_price || 0)}
                                                            </span>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center text-primary group-hover:text-white transition-all duration-500 shadow-lg shadow-black/5 group-hover:shadow-primary/40">
                                            <ShoppingBag className="w-5 h-5 sm:w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : query && !loading ? (
                    <div className="text-center py-20 animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Aucun résultat trouvé</h2>
                        Nous n'avons trouvé aucun produit correspondant à "{query}". Essayez d'utiliser des mots-clés différents.
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-20 text-center animate-in fade-in duration-700">
                        <h3 className="text-muted-foreground font-medium mb-8 uppercase tracking-widest text-sm opacity-50">
                            Meilleures Ventes
                        </h3>
                        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
                            Parcourez nos produits les plus populaires et commencez vos achats instantanément.
                        </p>
                        {/* Reuse home page shop section: show top products by created_at (most recent as proxy for top sellers) */}
                        <BestSellersGrid />
                    </div>
                )}
            </div>
        </div>
    )
}
