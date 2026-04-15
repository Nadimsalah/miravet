"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { getProducts, getCategoryBySlug, getCategories, type Product } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
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
    Loader2,
    X,
    Plus
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function CategoryPage() {
    const { slug } = useParams() as { slug: string }
    const { t, language } = useLanguage()
    const [category, setCategory] = useState<{ id: string, name: string, name_ar?: string, slug: string, children?: any[], logo_url?: string | null } | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSubCategory, setActiveSubCategory] = useState("all")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [allSubCategoriesData, setAllSubCategoriesData] = useState<{ id: string, name: string, name_ar?: string, slug: string, logo_url?: string | null }[]>([])
    const { addItem, cartCount } = useCart()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isCreatingSub, setIsCreatingSub] = useState(false)
    const [newSubName, setNewSubName] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const hasSession = document.cookie
            .split("; ")
            .find((row) => row.startsWith("admin_session="))
            ?.split("=")[1] === "true"
        setIsAdmin(hasSession)
    }, [])

    const toSlug = (text: string) => text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                // Fetch Brand (Level 1)
                const { data: brand, error: brandErr } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('slug', slug)
                    .single()

                if (brand) {
                    setCategory(brand)
                    
                    // Fetch all descendants (Level 2 & 3)
                    const { data: allChildren } = await supabase
                        .from('categories')
                        .select('id, name, name_ar, slug, parent_id, logo_url')
                        .not('parent_id', 'is', null)
                        .order('name')
                    
                    if (allChildren) {
                        setAllSubCategoriesData(allChildren)
                        
                        // Collect all category names falling under this brand
                        const l2 = allChildren.filter(c => c.parent_id === brand.id)
                        const l3 = allChildren.filter(c => l2.some(cat => c.parent_id === cat.id))
                        const allDescendantNames = [brand.name, ...l2.map(c => c.name), ...l3.map(c => c.name)]

                        const productsData = await getProducts({ categories: allDescendantNames, status: 'active' })
                        setProducts(productsData)
                    } else {
                        const productsData = await getProducts({ category: brand.name, status: 'active' })
                        setProducts(productsData)
                    }
                }
            } catch (error) {
                console.error("Failed to load category data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [slug])


    // Level 2 Categories (Direct children of brand)
    const level2Categories = allSubCategoriesData.filter(c => c.parent_id === category?.id)
    
    // Level 3 Categories (Children of currently active Level 2)
    const level3Categories = allSubCategoriesData.filter(c => c.parent_id === activeSubCategory)

    const handleLevel2Click = async (catId: string, catName: string) => {
        setActiveSubCategory(catId)

        // Gather Level 2 name and all Level 3 children names
        const l3 = allSubCategoriesData.filter(c => c.parent_id === catId)
        const descendantNames = [catName, ...l3.map(c => c.name)]

        const productsData = await getProducts({ categories: descendantNames, status: 'active' })
        setProducts(productsData)
    }

    const handleLevel3Click = async (catId: string, catName: string) => {
        const productsData = await getProducts({ category: catName, status: 'active' })
        setProducts(productsData)
    }

    const handleShowAll = async () => {
        setActiveSubCategory('all')
        if (category) {
            const l2 = allSubCategoriesData.filter(c => c.parent_id === category.id)
            const l3 = allSubCategoriesData.filter(c => l2.some(cat => c.parent_id === cat.id))
            const allDescendantNames = [category.name, ...l2.map(c => c.name), ...l3.map(c => c.name)]

            const productsData = await getProducts({ categories: allDescendantNames, status: 'active' })
            setProducts(productsData)
        }
    }

    const handleQuickAddSub = async () => {
        if (!newSubName.trim() || !category) return
        setIsSaving(true)
        const slug = toSlug(newSubName)
        
        const { error } = await supabase
            .from('categories')
            .insert({
                name: newSubName,
                slug: slug + '-' + category.slug,
                parent_id: activeSubCategory === 'all' ? category.id : activeSubCategory
            })

        if (error) {
            toast.error("Erreur: " + error.message)
        } else {
            toast.success("Ajouté avec succès !")
            setNewSubName("")
            setIsCreatingSub(false)
            // Refresh
            const { data: allChildren } = await supabase
                .from('categories')
                .select('id, name, name_ar, slug, parent_id, logo_url')
                .not('parent_id', 'is', null)
                .order('name')
            if (allChildren) setAllSubCategoriesData(allChildren)
        }
        setIsSaving(false)
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

            <main className="pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
                {/* Modern Flagship Header */}
                <header className="relative mb-12 sm:mb-20 pt-8 sm:pt-12">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-10 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 flex flex-col md:flex-row gap-8 md:items-center"
                    >
                        {/* High-End Logo Box */}
                        {category.logo_url && (
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="w-28 h-28 sm:w-40 sm:h-40 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-center p-6 sm:p-8 flex-shrink-0"
                            >
                                <div className="relative w-full h-full">
                                    <Image 
                                        src={category.logo_url} 
                                        alt={category.name} 
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </motion.div>
                        )}
                        
                        <div className="space-y-4 sm:space-y-6 flex-1">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Offical Store</span>
                                <div className="w-1 h-1 bg-indigo-300 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{category.name}</span>
                            </div>
                            
                            <h1 className="text-4xl sm:text-6xl font-black text-[#0f172a] tracking-tighter leading-none uppercase">
                                {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                            </h1>
                            
                            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                                Explorez l'univers de {category.name}. Une collection exclusive de solutions {category.name.toLowerCase()} haut de gamme.
                            </p>
                        </div>
                    </motion.div>
                </header>

                {/* Multi-Level Navigation */}
                <div className="mb-12 sm:mb-16 space-y-8">
                    {/* Level 2 Switcher (Categories) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#0f172a]">
                                {language === 'ar' ? 'الفئات' : 'Rayons'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                            <button
                                onClick={handleShowAll}
                                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${activeSubCategory === 'all' ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                Tout
                            </button>
                            {level2Categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleLevel2Click(cat.id, cat.name)}
                                    className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${activeSubCategory === cat.id ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level 3 Switcher (Sub-categories) - Only shows when a Level 2 is selected */}
                    {activeSubCategory !== 'all' && level3Categories.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100"
                        >
                            <div className="flex items-center gap-3 px-1">
                                <ChevronRight className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Affiner par collection
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {level3Categories.map((sub) => (
                                    <button
                                        key={sub.id}
                                        onClick={() => handleLevel3Click(sub.id, sub.name)}
                                        className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg transition-all"
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Note: Grid of Categories (Level 2) intentionally removed as per user request to directly show products on the "Tout" tab. */}

                {/* High-End Product Grid */}
                {products.length === 0 ? (
                    <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <ShoppingBag className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0f172a]">Bientôt disponible</h3>
                        <p className="text-slate-400 mt-3 font-medium max-w-sm mx-auto">Nous préparons actuellement la sélection de cette rubrique. Revenez très bientôt !</p>
                    </div>
                ) : (
                    <motion.div 
                        layout
                        className={viewMode === 'grid' 
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12" 
                            : "flex flex-col gap-8"
                        }
                    >
                        <AnimatePresence mode="popLayout">
                            {products.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                    className={`group bg-white rounded-[2.5rem] p-4 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-transparent hover:border-slate-50 ${viewMode === 'list' ? 'flex flex-row gap-10 items-center' : ''}`}
                                >
                                    <div className={`relative overflow-hidden rounded-[2rem] bg-slate-50 aspect-square ${viewMode === 'list' ? 'w-64 h-64' : 'w-full mb-6'}`}>
                                        <Link href={`/product/${product.id}`} className="block w-full h-full">
                                            <Image
                                                src={product.images?.[0] || "/placeholder.svg"}
                                                alt={product.title}
                                                fill
                                                className="object-cover p-2 mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </Link>
                                        
                                        {/* New Arrival/Promo Badge */}
                                        {idx === 0 && (
                                            <div className="absolute top-4 left-4 bg-[#0f172a] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                                                Nouveau
                                            </div>
                                        )}
                                        
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
                                                toast.success("Ajouté au panier");
                                            }}
                                            className="absolute bottom-6 right-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl translate-y-24 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-600 hover:text-white"
                                        >
                                            <ShoppingBag className="w-6 h-6" />
                                        </motion.button>
                                    </div>

                                    <div className="space-y-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">{product.brand?.name || category.name}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600 uppercase">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                En stock
                                            </span>
                                        </div>
                                        <Link href={`/product/${product.id}`}>
                                            <h3 className="text-xl font-black text-[#0f172a] leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                {product.title}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-4">
                                            <p className="text-2xl font-black text-[#0f172a] tracking-tight">
                                                {formatPrice(product.price)} <span className="text-xs font-medium text-slate-400 ml-1">TTC</span>
                                            </p>
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

            {/* Admin Quick Actions */}
            {isAdmin && (
                <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-start gap-4">
                    <AnimatePresence>
                        {isCreatingSub && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 w-80 mb-2"
                            >
                                <h4 className="text-sm font-black mb-4 uppercase tracking-widest text-slate-400">Nouvelle Sous-Catégorie</h4>
                                <input 
                                    autoFocus
                                    placeholder="Ex: Gamme Bio, Chirurgie..."
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 mb-4 font-medium"
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAddSub()}
                                />
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleQuickAddSub}
                                        disabled={isSaving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl py-6 font-bold"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajouter"}
                                    </Button>
                                    <Button 
                                        variant="ghost"
                                        onClick={() => setIsCreatingSub(false)}
                                        className="rounded-xl px-4"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCreatingSub(!isCreatingSub)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
                            isCreatingSub ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                        }`}
                    >
                        <Plus className="w-8 h-8" />
                    </motion.button>
                </div>
            )}
        </div>
    )
}
