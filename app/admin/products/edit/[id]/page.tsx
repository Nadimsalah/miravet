"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Save,
    Sparkles,
    Upload,
    X,
    ChevronDown,
    Loader2,
    Check,
    Search,
    RefreshCw,
    Building2,
    Plus,
    Trash,
    Package,
    Wand2
} from "lucide-react"
import Link from "next/link"
import { getProductById } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function EditProductPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const params = useParams()
    const productId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)


    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [price, setPrice] = useState("")
    const [compareAtPrice, setCompareAtPrice] = useState("")
    const [resellerPrice, setResellerPrice] = useState("")
    const [partnerPrice, setPartnerPrice] = useState("")
    const [wholesalerPrice, setWholesalerPrice] = useState("")
    const [resellerMinQty, setResellerMinQty] = useState("")
    const [partnerMinQty, setPartnerMinQty] = useState("")
    const [wholesalerMinQty, setWholesalerMinQty] = useState("")
    const [stock, setStock] = useState("")
    const [sku, setSku] = useState("")
    const [status, setStatus] = useState("active")
    const [benefits, setBenefits] = useState<string[]>([])
    const [ingredients, setIngredients] = useState("")
    const [howToUse, setHowToUse] = useState("")
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string }[]>([])
    const [images, setImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState("")
    const [showWarehouseDialog, setShowWarehouseDialog] = useState(false)
    const [newWarehouseName, setNewWarehouseName] = useState("")

    // AI Rewrite State
    const [rewriting, setRewriting] = useState<string | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<any[]>([])
    const [selectedRelated, setSelectedRelated] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Load product data
    useEffect(() => {
        async function loadProduct() {
            setLoading(true)
            const [product, categoriesData, warehousesData] = await Promise.all([
                getProductById(productId),
                supabase.from('categories').select('id, name, slug').order('name'),
                supabase.from('warehouses').select('id, name').order('name')
            ])

            if (product) {
                setTitle(product.title)
                setDescription(product.description || "")
                setCategory(product.category)
                setPrice(product.price.toString())
                setCompareAtPrice(product.compare_at_price?.toString() || "")
                setResellerPrice(product.reseller_price ? (product.reseller_price / 1.2).toFixed(2) : "")
                setPartnerPrice(product.partner_price ? (product.partner_price / 1.2).toFixed(2) : "")
                setWholesalerPrice(product.wholesaler_price ? (product.wholesaler_price / 1.2).toFixed(2) : "")
                setResellerMinQty(product.reseller_min_qty?.toString() || "")
                setPartnerMinQty(product.partner_min_qty?.toString() || "")
                setWholesalerMinQty(product.wholesaler_min_qty?.toString() || "")
                setStock(product.stock.toString())
                setSku(product.sku)
                setStatus(product.status)
                setBenefits(product.benefits || [])
                setIngredients(product.ingredients || "")
                setHowToUse(product.how_to_use || "")
                setImages(product.images || [])
                setSelectedWarehouse(product.warehouse_id || "")
            }

            if (categoriesData.data) {
                setCategories(categoriesData.data)
            }

            if (warehousesData.data) {
                setWarehouses(warehousesData.data)
            }

            // Fetch related products (initially some active products)
            const { data: prodData } = await supabase
                .from('products')
                .select('id, title, images')
                .eq('status', 'active')
                .neq('id', productId) // Don't suggest self
                .limit(10)

            if (prodData) setRelatedProducts(prodData)

            // Fetch existing selected cross-sells
            const { data: existingCrossSells } = await supabase
                .from('product_cross_sells')
                .select('related_product_id')
                .eq('product_id', productId)

            if (existingCrossSells) {
                const ids = existingCrossSells.map(c => c.related_product_id)
                setSelectedRelated(ids)

                // Ensure selected products are in the relatedProducts list for UI
                if (ids.length > 0) {
                    const { data: selectedProds } = await supabase
                        .from('products')
                        .select('id, title, images')
                        .in('id', ids)

                    if (selectedProds) {
                        setRelatedProducts(prev => {
                            const existingIds = new Set(prev.map(p => p.id))
                            const newProds = selectedProds.filter(p => !existingIds.has(p.id))
                            return [...prev, ...newProds]
                        })
                    }
                }
            }

            setLoading(false)
        }

        if (productId) {
            loadProduct()
        }
    }, [productId])

    // Search for related products
    useEffect(() => {
        if (!searchQuery.trim()) return

        const searchProducts = async () => {
            const { data } = await supabase
                .from('products')
                .select('id, title, images')
                .eq('status', 'active')
                .neq('id', productId)
                .ilike('title', `%${searchQuery}%`)
                .limit(20)

            if (data) {
                setRelatedProducts(prev => {
                    const existingIds = new Set(data.map(p => p.id))
                    const selected = prev.filter(p => selectedRelated.includes(p.id) && !existingIds.has(p.id))
                    return [...selected, ...data]
                })
            }
        }

        const timer = setTimeout(searchProducts, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, selectedRelated, productId])

    const handleRewrite = async (field: string, currentText: string, setter: (val: string) => void) => {
        if (!currentText.trim()) return

        setRewriting(field)
        try {
            const res = await fetch('/api/admin/products/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentText, field })
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.error_code === "RATE_LIMIT_DAILY") {
                    alert("⚠️ Daily Free AI Quota Exceeded\n\nPlease wait until tomorrow or add your own OpenRouter key in settings.")
                    return
                }
                throw new Error(data.message || data.error || "Unknown error")
            }

            if (data.text) {
                setter(data.text)
            }
        } catch (error: any) {
            console.error('Rewrite error:', error)
            if (error.message !== "Unknown error") {
                alert(`AI Assistant: ${error.message}`)
            }
        } finally {
            setRewriting(null)
        }
    }

    const handleAddWarehouse = async () => {
        if (!newWarehouseName.trim()) return

        const { data, error } = await supabase
            .from('warehouses')
            .insert({ name: newWarehouseName })
            .select()
            .single()

        if (error) {
            alert('Error adding warehouse: ' + error.message)
            return
        }

        setWarehouses([...warehouses, data])
        setNewWarehouseName("")
        setSelectedWarehouse(data.id)
    }

    const handleDeleteWarehouse = async (id: string) => {
        if (!confirm('Are you sure you want to delete this warehouse?')) return

        const { error } = await supabase
            .from('warehouses')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting warehouse: ' + error.message)
            return
        }

        setWarehouses(warehouses.filter(w => w.id !== id))
        if (selectedWarehouse === id) setSelectedWarehouse("")
    }

    const generateSku = () => {
        const base = title.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "PROD"
        const random = Math.floor(1000 + Math.random() * 9000)
        setSku(`${base}-${random}`)
    }

    const toggleRelated = (id: string) => {
        if (selectedRelated.includes(id)) {
            setSelectedRelated(selectedRelated.filter(i => i !== id))
        } else {
            setSelectedRelated([...selectedRelated, id])
        }
    }

    const handleAutoRecommend = async () => {
        if (!title && !description) {
            alert("Please add a title or description first so AI can understand the product.")
            return
        }

        setRewriting('recommend')
        try {
            const res = await fetch('/api/admin/products/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    availableProducts: relatedProducts
                })
            })

            const data = await res.json()
            if (data.recommendedIds && Array.isArray(data.recommendedIds)) {
                setSelectedRelated(data.recommendedIds)
            }
        } catch (error) {
            console.error(error)
            alert("Failed to get recommendations")
        } finally {
            setRewriting(null)
        }
    }

    const handleSave = async () => {
        setSaving(true)

        const { error } = await supabase
            .from('products')
            .update({
                title,
                description,
                category,
                price: price ? parseFloat(price) : 0,
                compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
                reseller_price: resellerPrice ? parseFloat(resellerPrice) * 1.2 : null,
                partner_price: partnerPrice ? parseFloat(partnerPrice) * 1.2 : null,
                wholesaler_price: wholesalerPrice ? parseFloat(wholesalerPrice) * 1.2 : null,
                reseller_min_qty: resellerMinQty ? parseInt(resellerMinQty) : null,
                partner_min_qty: partnerMinQty ? parseInt(partnerMinQty) : null,
                wholesaler_min_qty: wholesalerMinQty ? parseInt(wholesalerMinQty) : null,
                stock: stock ? parseInt(stock) : 0,
                sku,
                status,
                benefits,
                ingredients,
                how_to_use: howToUse,
                images,
                warehouse_id: selectedWarehouse || null
            })
            .eq('id', productId)

        // Update cross-sells
        // 1. Delete existing
        await supabase.from('product_cross_sells').delete().eq('product_id', productId)
        // 2. Insert new
        if (selectedRelated.length > 0) {
            const crossSells = selectedRelated.map(id => ({
                product_id: productId,
                related_product_id: id
            }))
            await supabase.from('product_cross_sells').insert(crossSells)
        }

        setSaving(false)

        if (error) {
            alert('Error updating product: ' + error.message)
        } else {
            router.push('/admin/products')
        }
    }

    const addBenefit = () => {
        setBenefits([...benefits, ""])
    }

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...benefits]
        newBenefits[index] = value
        setBenefits(newBenefits)
    }

    const removeBenefit = (index: number) => {
        setBenefits(benefits.filter((_, i) => i !== index))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const uploadedUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file)

                if (error) {
                    console.error('Error uploading image:', error.message)
                    continue
                }

                const publicUrl = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl
                uploadedUrls.push(publicUrl)
            }

            if (uploadedUrls.length > 0) {
                setImages(prev => [...prev, ...uploadedUrls])
            }
        } catch (error) {
            console.error('Upload error:', error)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <AdminSidebar />
                <div className="text-center">
                    <p className="text-gray-500">Loading product...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden text-gray-900">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 pb-24">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Modifier le produit</h1>
                            <p className="text-xs text-gray-500 font-medium">Mettre à jour les informations du produit</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/admin/products">
                            <Button variant="outline" className="rounded-full border-gray-200 hover:bg-gray-100 text-gray-600">
                                Annuler
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full px-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-none transition-all"
                        >
                            {saving ? "Enregistrement..." : <><Save className="w-4 h-4 mr-2" /> Enregistrer les modifications</>}
                        </Button>
                    </div>
                </header>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* General Information */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Informations Générales</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Titre du produit</label>
                                <div className="relative">
                                    <Input
                                        value={title || ""}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Dell Latitude 5420 Laptop"
                                        className="h-12 text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors pr-12"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <div className="relative">
                                    <Textarea
                                        value={description || ""}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Décrivez votre produit..."
                                        className="min-h-[150px] text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none pr-10"
                                    />
                                    <div className="absolute right-2 top-2 flex flex-col gap-2">
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Media Gallery */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    Galerie Média
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-gray-200 bg-gray-50">
                                            <Image src={img} alt="Product" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <button onClick={() => removeImage(i)} className="p-3 bg-white text-red-500 shadow-lg rounded-full hover:bg-red-50 transition-all transform hover:scale-110">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-blue-600 group">
                                        <div className="p-4 rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors mb-3">
                                            {uploading ? (
                                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {uploading ? 'Téléchargement...' : 'Télécharger une image'}
                                        </span>
                                        <input type="file" className="hidden" multiple onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Product Attributes */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Attributs du Produit</h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Avantages Clés</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addBenefit}
                                        className="h-8 text-xs rounded-lg"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" /> Ajouter un avantage
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {benefits.map((benefit, index) => (
                                        <div key={index} className="flex gap-2 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl relative group">
                                            <Input
                                                value={benefit || ""}
                                                onChange={(e) => updateBenefit(index, e.target.value)}
                                                placeholder="Avantage"
                                                className="h-10 text-sm bg-white border-gray-200"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeBenefit(index)}
                                                className="h-10 w-10 text-red-500 hover:bg-red-50 shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {benefits.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
                                            Aucun avantage ajouté pour le moment.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Spécifications Techniques</label>
                                    <div className="flex gap-2">
                                    </div>
                                </div>
                                <Textarea
                                    value={ingredients || ""}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="Processeur, RAM, Stockage, etc."
                                    className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700">Garantie & Support</label>
                                    <div className="flex gap-2">
                                    </div>
                                </div>
                                <Textarea
                                    value={howToUse || ""}
                                    onChange={(e) => setHowToUse(e.target.value)}
                                    placeholder="Détails de la garantie et informations de support..."
                                    className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                                />
                            </div>
                        </section>

                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Organization */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Organisation</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Catégorie</label>
                                <div className="relative">
                                    <select
                                        value={category || ""}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm"
                                    >
                                        <option value="" disabled>Sélectionner une catégorie</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Statut</label>
                                <div className="relative">
                                    <select
                                        value={status || "draft"}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm"
                                    >
                                        <option value="draft">Brouillon</option>
                                        <option value="active">Actif</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </section>

                        {/* Pricing */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Prix</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Price (MAD)</label>
                                <Input
                                    type="number"
                                    value={price || ""}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Prix Revendeur HT (MAD)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={resellerPrice || ""}
                                            onChange={(e) => setResellerPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-12 text-base bg-blue-50/50 border-blue-200 text-blue-900 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <p className="text-[11px] text-blue-700">
                                        TTC ≈ {((Number(resellerPrice || 0) * 1.2) || 0).toFixed(2)} MAD (TVA 20%)
                                    </p>
                                    <Input
                                        type="number"
                                        value={resellerMinQty || ""}
                                        onChange={(e) => setResellerMinQty(e.target.value)}
                                        placeholder="Quantité min pour prix revendeur"
                                        className="h-10 text-sm bg-blue-50/80 border-blue-200 text-blue-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Prix Partenaire HT (MAD)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={partnerPrice || ""}
                                            onChange={(e) => setPartnerPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-12 text-base bg-purple-50/50 border-purple-200 text-purple-900 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <p className="text-[11px] text-purple-700">
                                        TTC ≈ {((Number(partnerPrice || 0) * 1.2) || 0).toFixed(2)} MAD (TVA 20%)
                                    </p>
                                    <Input
                                        type="number"
                                        value={partnerMinQty || ""}
                                        onChange={(e) => setPartnerMinQty(e.target.value)}
                                        placeholder="Quantité min pour prix partenaire"
                                        className="h-10 text-sm bg-purple-50/80 border-purple-200 text-purple-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Prix Grossiste HT (MAD)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={wholesalerPrice || ""}
                                            onChange={(e) => setWholesalerPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="h-12 text-base bg-emerald-50/50 border-emerald-200 text-emerald-900 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <p className="text-[11px] text-emerald-700">
                                        TTC ≈ {((Number(wholesalerPrice || 0) * 1.2) || 0).toFixed(2)} MAD (TVA 20%)
                                    </p>
                                    <Input
                                        type="number"
                                        value={wholesalerMinQty || ""}
                                        onChange={(e) => setWholesalerMinQty(e.target.value)}
                                        placeholder="Quantité min pour prix grossiste"
                                        className="h-10 text-sm bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Prix de comparaison (Optionnel)</label>
                                <Input
                                    type="number"
                                    value={compareAtPrice || ""}
                                    onChange={(e) => setCompareAtPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 text-base bg-gray-50/50 border-gray-200"
                                />
                            </div>
                        </section>

                        {/* Inventory */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Inventaire</h3>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Quantité en stock</label>
                                <Input
                                    type="number"
                                    value={stock || ""}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="bg-white border-gray-200 h-12 text-lg font-mono rounded-xl shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Emplacement du stock
                                    </label>
                                    <Link href="/admin/logisticiens" target="_blank">
                                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                            <Plus className="w-3 h-3" />
                                            Gérer les logisticiens
                                        </button>
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={selectedWarehouse}
                                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                                        className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 appearance-none shadow-sm"
                                    >
                                        <option value="">Sélectionner un emplacement</option>
                                        {warehouses.map((wh) => (
                                            <option key={wh.id} value={wh.id}>{wh.city ? `${wh.city} (${wh.name})` : wh.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">
                                    Référence (SKU)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={sku || ""}
                                        onChange={(e) => setSku(e.target.value)}
                                        placeholder="Généré automatiquement"
                                        className="bg-white border-gray-200 h-12 text-base font-mono rounded-xl uppercase tracking-wider shadow-sm focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                                    />
                                    <Button onClick={generateSku} type="button" className="h-12 w-12 shrink-0 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-indigo-600">
                                        <Wand2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Cross-Sell */}
                        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <RefreshCw className="w-4 h-4 text-pink-500" />
                                    Produits suggérés
                                </h3>

                            </div>
                            <div className="p-6">
                                <div className="flex flex-col gap-4 mb-4">
                                    <p className="text-xs text-gray-500">Produits recommandés basés sur la description ou recherche manuelle.</p>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Rechercher un produit..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-10 bg-gray-50 border-gray-100 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                    {relatedProducts.map(prod => {
                                        const isSelected = selectedRelated.includes(prod.id)
                                        const imgUrl = prod.images?.[0] || null
                                        return (
                                            <div
                                                key={prod.id}
                                                onClick={() => toggleRelated(prod.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? "bg-blue-50 border-blue-200" : "bg-gray-50 hover:bg-gray-100 border-transparent"}`}
                                            >
                                                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-100 shadow-sm">
                                                    {imgUrl ? (
                                                        <Image src={imgUrl} alt={prod.title} fill className="object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gray-100" />
                                                    )}
                                                </div>
                                                <span className={`text-sm flex-1 font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{prod.title}</span>
                                                {isSelected && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
