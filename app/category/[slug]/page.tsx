"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { getProducts, getCategoryBySlug, getCategories, type Product } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { 
    ChevronLeft, 
    ShoppingBag, 
    Filter, 
    ArrowRight, 
    LayoutGrid, 
    List,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function CategoryPage() {
    const { slug } = useParams() as { slug: string }
    const { t, language } = useLanguage()
    const [category, setCategory] = useState<{ id: string, name: string, name_ar?: string, slug: string, children?: any[] } | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSubCategory, setActiveSubCategory] = useState("all")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const { addItem, cartCount } = useCart()

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const catData = await getCategoryBySlug(slug)
                if (catData) {
                    setCategory(catData)
                    // Initial products (all for this main category)
                    // Note: In real app, we might need a search that includes all sub-category IDs
                    const productsData = await getProducts({ category: catData.name, status: 'active' })
                    setProducts(productsData)
                }
            } catch (error) {
                console.error("Failed to load category data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [slug])

    // Dynamic sub-categories from database
    const subCategories = [
        { id: "all", label: language === 'ar' ? "الكل" : "Tout", slug: "all" },
        ...(category?.children || []).map(child => ({
            id: child.id,
            label: language === 'ar' && child.name_ar ? child.name_ar : child.name,
            slug: child.slug
        }))
    ]

    const handleSubCategoryClick = async (sub: any) => {
        setActiveSubCategory(sub.id)
        if (sub.id === 'all') {
            const data = await getProducts({ category: category?.name, status: 'active' })
            setProducts(data)
        } else {
            // Fetch products specifically for this subcategory name
            const data = await getProducts({ category: sub.label, status: 'active' })
            setProducts(data)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">Chargement de la collection...</p>
                </div>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <h1 className="text-2xl font-black text-slate-900 mb-4">Collection non trouvée</h1>
                <Link href="/">
                    <Button variant="outline" className="rounded-full px-8">Retour à l'accueil</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white selection:bg-indigo-100">
            {/* Minimalist Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Left: Back Link */}
                    <div className="flex-1 flex justify-start">
                        <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold hover:text-indigo-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Retour</span>
                        </Link>
                    </div>

                    {/* Center: Logo */}
                    <div className="flex-1 flex justify-center">
                        <Link href="/" className="flex items-center justify-center">
                            <Image 
                                src="/logo.png" 
                                alt="Miravet Logo" 
                                width={180} 
                                height={54} 
                                className="h-12 w-auto hover:opacity-80 transition-opacity"
                            />
                        </Link>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex-1 flex justify-end items-center gap-6">
                        <Link href="/search" className="text-slate-400 hover:text-slate-900 transition-colors">
                            <Search className="w-5 h-5" />
                        </Link>
                        <Link href="/cart" className="relative text-slate-400 hover:text-slate-900 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    key={cartCount}
                                    className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-lg shadow-indigo-600/20"
                                >
                                    {cartCount}
                                </motion.span>
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
                            <span>Collection</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-400">{category.name}</span>
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black text-[#0f172a] tracking-tighter leading-none">
                            {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                            Explorez notre sélection premium de produits {category.name.toLowerCase()} conçus pour l'excellence et la performance.
                        </p>
                    </motion.div>
                </header>

                {/* Subcategories & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {subCategories.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => handleSubCategoryClick(sub)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                    activeSubCategory === sub.id 
                                    ? "bg-[#0f172a] text-white shadow-xl shadow-black/10 scale-105" 
                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1 bg-slate-50 rounded-xl">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        <Button variant="ghost" className="rounded-xl flex items-center gap-2 text-slate-600 font-bold">
                            <Filter className="w-4 h-4" />
                            <span>Filtres</span>
                        </Button>
                    </div>
                </div>

                {/* Product Grid */}
                {products.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Aucun produit trouvé</h3>
                        <p className="text-slate-400 mt-2">Désolé, nous n'avons pas encore de produits dans cette collection.</p>
                    </div>
                ) : (
                    <motion.div 
                        layout
                        className={viewMode === 'grid' 
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
                            : "flex flex-col gap-6"
                        }
                    >
                        <AnimatePresence mode="popLayout">
                            {products.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className={`group relative ${viewMode === 'list' ? 'flex flex-row gap-8 items-center bg-white p-4 rounded-3xl border border-slate-50' : ''}`}
                                >
                                    <div className={`relative overflow-hidden rounded-[2.5rem] bg-slate-50 aspect-square ${viewMode === 'list' ? 'w-48 h-48' : 'w-full mb-6'}`}>
                                        <Link href={`/product/${product.id}`} className="block w-full h-full">
                                            <Image
                                                src={product.images?.[0] || "/placeholder.svg"}
                                                alt={product.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </Link>
                                        <div className="absolute inset-0 bg-black/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        {/* Quick Add Button Overlay */}
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addItem({
                                                    id: product.id,
                                                    name: product.title,
                                                    price: product.price,
                                                    image: product.images?.[0] || "/placeholder.svg",
                                                    quantity: 1,
                                                    inStock: true,
                                                    stock: product.stock || 0
                                                });
                                            }}
                                            className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl translate-y-20 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-600 hover:text-white"
                                        >
                                            <ShoppingBag className="w-5 h-5" />
                                        </motion.button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{product.brand?.name || 'Miravet'}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="text-[10px] font-bold text-green-600 uppercase">En stock</span>
                                        </div>
                                        <Link href={`/product/${product.id}`}>
                                            <h3 className="text-lg font-black text-[#0f172a] leading-tight group-hover:text-indigo-600 transition-colors">
                                                {product.title}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-black text-[#0f172a]">
                                                {formatPrice(product.price)} <span className="text-xs font-normal text-slate-400">TTC</span>
                                            </p>
                                            {product.compare_at_price && (
                                                <p className="text-sm text-slate-400 line-through">
                                                    {formatPrice(product.compare_at_price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Pagination / Load More */}
                {products.length > 0 && (
                    <div className="mt-24 flex flex-col items-center gap-6">
                        <p className="text-slate-400 text-sm font-medium">Affichage de {products.length} sur {products.length} produits</p>
                        <div className="w-64 h-1 bg-slate-50 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-indigo-600" />
                        </div>
                        <Button variant="outline" className="rounded-full px-10 py-6 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold transition-all">
                            Voir plus de produits
                        </Button>
                    </div>
                )}
            </main>

            {/* Premium Bottom Section */}
            <section className="bg-slate-50 py-24 px-6 border-t border-slate-100">
                <div className="max-w-7xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vous ne trouvez pas ce que vous cherchez ?</h2>
                    <p className="text-slate-500 max-w-xl mx-auto font-medium">Notre équipe d'experts est disponible pour vous conseiller et vous aider à trouver les meilleurs produits pour votre pratique.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/contact">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-12 py-7 text-lg font-black shadow-xl shadow-indigo-600/20">
                                Contactez un Expert
                            </Button>
                        </Link>
                        <Link href="/faq">
                            <Button variant="ghost" className="rounded-full px-10 py-7 text-lg font-bold">
                                Support Technique <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
