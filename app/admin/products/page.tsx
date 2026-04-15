"use client"

import { useState, useEffect, useCallback } from "react"
import { type Product, uploadCategoryLogo, updateCategoryLogo } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Package,
    AlertCircle,
    Tag,
    X,
    Bell,
    Upload,
    Award,
    Image as ImageIcon,
    Loader2,
    Save,
    ChevronRight,
} from "lucide-react"
import { Notifications } from "@/components/admin/notifications"
import Link from "next/link"
import Image from "next/image"
import Papa from "papaparse"
import { formatPrice, cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion, AnimatePresence } from "framer-motion"

// Mock Products Data
const allProducts = [
    {
        id: "PROD-001",
        name: "Pure Argan Oil",
        category: "Face Care",
        price: "MAD 450.00",
        stock: 124,
        status: "In Stock",
        sales: 1205,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-002",
        name: "Body Butter Set",
        category: "Body Care",
        price: "MAD 420.00",
        stock: 45,
        status: "In Stock",
        sales: 850,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-003",
        name: "Hair Repair Mask",
        category: "Hair Care",
        price: "MAD 280.00",
        stock: 8,
        status: "Low Stock",
        sales: 432,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-004",
        name: "Gift Box Premium",
        category: "Gift Sets",
        price: "MAD 1,200.00",
        stock: 0,
        status: "Out of Stock",
        sales: 156,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-005",
        name: "Face Serum",
        category: "Face Care",
        price: "MAD 580.00",
        stock: 67,
        status: "In Stock",
        sales: 980,
        image: "/placeholder.svg?height=80&width=80"
    },
    {
        id: "PROD-006",
        name: "Argan Soap Trio",
        category: "Body Care",
        price: "MAD 150.00",
        stock: 200,
        status: "In Stock",
        sales: 2100,
        image: "/placeholder.svg?height=80&width=80"
    },
]

export default function AdminProductsPage() {
    const { t, setLanguage } = useLanguage()
    const [activeTab, setActiveTab] = useState("Tous")
    const [searchQuery, setSearchQuery] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string, parent_id?: string | null, logo_url?: string | null }[]>([])
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryNameAr, setNewCategoryNameAr] = useState("")
    const [isTranslating, setIsTranslating] = useState(false)
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const [categorySearch, setCategorySearch] = useState("")
    const [brandSearch, setBrandSearch] = useState("")

    const [isSavingBrand, setIsSavingBrand] = useState(false)
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
    const [parentAddingSubId, setParentAddingSubId] = useState<string | null>(null)
    const [nestedAddingSubId, setNestedAddingSubId] = useState<string | null>(null)
    const [newSubCategoryName, setNewSubCategoryName] = useState("")
    const [logoUploading, setLogoUploading] = useState<string | null>(null) // categoryId being uploaded
    const [pasteTargetId, setPasteTargetId] = useState<string | null>(null)  // categoryId selected for Ctrl+V paste
    const [newCategoryFile, setNewCategoryFile] = useState<File | null>(null)
    const [newCategoryPreview, setNewCategoryPreview] = useState<string | null>(null)
    const [newCategorySubtitle, setNewCategorySubtitle] = useState("Partenaire Officiel")
    const [newCategoryButtonText, setNewCategoryButtonText] = useState("Explorer la gamme")


    // Fetch products from Supabase
    useEffect(() => {
        loadProducts()
        loadCategories()
        loadBrands()
    }, [])

    // Global paste listener — fires when dialog is open and a paste target is selected
    const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
        if (!pasteTargetId) return
        const items = e.clipboardData?.items
        if (!items) return
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile()
                if (file) {
                    handleUploadSubcategoryLogo(pasteTargetId, file)
                }
                break
            }
        }
    }, [pasteTargetId])

    useEffect(() => {
        window.addEventListener('paste', handleGlobalPaste)
        return () => window.removeEventListener('paste', handleGlobalPaste)
    }, [handleGlobalPaste])

    async function loadBrands() {
        // Removed brands loading
    }

    async function loadCategories() {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (data) {
            setCategories(data)
        }
    }

    // Simplified: single-language categories, no auto-translate

    const toSlug = (text: string) => text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        const slug = toSlug(newCategoryName)

        let logo_url = null
        if (newCategoryFile) {
            const uploadResult = await uploadCategoryLogo(newCategoryFile, "temp-" + Date.now())
            if (uploadResult.success) {
                logo_url = uploadResult.url
            }
        }

        const { data: newCat, error } = await supabase
            .from('categories')
            .insert({
                name: newCategoryName,
                slug,
                parent_id: null,
                logo_url: logo_url,
                subtitle: newCategorySubtitle,
                button_text: newCategoryButtonText
            })
            .select()
            .single()

        if (error) {
            alert('Error adding category: ' + error.message)
            return
        }

        setNewCategoryName("")
        setNewCategoryFile(null)
        setNewCategoryPreview(null)
        loadCategories()
        toast.success('Catégorie ajoutée avec succès !')
    }

    async function handleAddSubCategory(parentId: string) {
        if (!newSubCategoryName.trim()) return

        const slug = toSlug(newSubCategoryName)

        const { error } = await supabase
            .from('categories')
            .insert({
                name: newSubCategoryName,
                slug: slug + '-' + Date.now(),
                parent_id: parentId
            })

        if (error) {
            toast.error("Erreur lors de l'ajout: " + error.message)
            return
        }

        toast.success(`Ajouté avec succès !`)
        loadCategories()
        setNewSubCategoryName("")
        setParentAddingSubId(null)
        setNestedAddingSubId(null)
    }

    async function handleUploadSubcategoryLogo(categoryId: string, file: File) {
        setLogoUploading(categoryId)
        try {
            const uploadResult = await uploadCategoryLogo(file, categoryId)
            if (!uploadResult.success || !uploadResult.url) {
                toast.error('Erreur lors du téléchargement du logo')
                return
            }
            const saveResult = await updateCategoryLogo(categoryId, uploadResult.url)
            if (!saveResult.success) {
                toast.error('Erreur lors de la sauvegarde du logo')
                return
            }
            toast.success('Logo mis à jour !')
            loadCategories()
        } finally {
            setLogoUploading(null)
        }
    }

    async function handleRemoveSubcategoryLogo(categoryId: string) {
        await updateCategoryLogo(categoryId, null)
        toast.success('Logo supprimé')
        loadCategories()
    }

    async function handleDeleteCategory(id: string) {
        if (!confirm(t("admin.products.delete_category_confirm"))) return

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting category: ' + error.message)
        } else {
            loadCategories()
        }
    }

    async function loadProducts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error loading products:", error)
            setProducts([])
        } else {
            setProducts((data || []) as Product[])
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm(t("admin.products.delete_product_confirm"))) return

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting product: ' + error.message)
        } else {
            loadProducts()
        }
    }

    async function handleToggleStatus(product: Product) {
        const newStatus = product.status === 'active' ? 'draft' : 'active'
        const { error } = await supabase
            .from('products')
            .update({ status: newStatus })
            .eq('id', product.id)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
        }
    }

    const parentCategories = categories.filter(c => !c.parent_id)
    const tabs = ["Tous", ...parentCategories.map(c => c.slug)]

    const getCategoryName = (slug: string) => {
        if (slug === "Tous") return "Tous"
        const category = categories.find(c => c.slug === slug)
        return category?.name || slug
    }

    const filteredProducts = products.filter(product => {
        // Find if product category belongs to the active tab or any of its subcategories
        const activeCategory = categories.find(c => c.slug === activeTab)
        const subCategories = activeTab === "Tous" ? [] : categories.filter(c => c.parent_id === activeCategory?.id)
        const allowedCategoryNames = activeTab === "Tous" 
            ? null 
            : [activeCategory?.name, ...subCategories.map(s => s.name)].filter(Boolean).map(n => n?.toLowerCase())

        const matchesTab = activeTab === "Tous" || (
            product.category && allowedCategoryNames?.some(name => name && product.category?.toLowerCase().includes(name))
        )
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesSearch
    })

    const getStockStatus = (stock: number) => {
        if (stock === 0) return "En rupture"
        if (stock < 10) return "Stock faible"
        return "En stock"
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "En stock": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "Stock faible": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "En rupture": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    async function handleDeleteBrand(id: string) {
        // Removed brands deletion
    }

    const [uploading, setUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState("")

    // Handle CSV Upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(true)
        setUploadStatus("Analyse du CSV...")

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: Papa.ParseResult<any>) => {
                const rows = results.data as any[]
                const validProducts: any[] = []

                // 1. Pre-process Categories
                const uniqueCategories = new Set<string>()
                const categoryNameMap = new Map<string, string>() // slug -> Name

                // Helper to slugify
                const toSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

                for (const row of rows) {
                    const rawCat = row["Product Category"] || row["category"] || "Uncategorized"
                    // Handle "Parent > Child > Grandchild" - take Grandchild
                    const cleanName = rawCat.split('>').pop().trim()
                    const slug = toSlug(cleanName)

                    if (slug) {
                        uniqueCategories.add(slug)
                        if (!categoryNameMap.has(slug)) {
                            categoryNameMap.set(slug, cleanName)
                        }
                    }
                }

                // Check for new categories
                const existingSlugs = new Set(categories.map(c => c.slug))
                const newCategoriesToInsert: { name: string, slug: string }[] = []

                uniqueCategories.forEach(slug => {
                    if (!existingSlugs.has(slug)) {
                        newCategoriesToInsert.push({
                            name: categoryNameMap.get(slug) || slug,
                            slug: slug
                        })
                    }
                })

                if (newCategoriesToInsert.length > 0) {
                    setUploadStatus(`Création de ${newCategoriesToInsert.length} nouvelles catégories...`)
                    const { error: catError } = await supabase
                        .from('categories')
                        .insert(newCategoriesToInsert)

                    if (catError) {
                        console.error("Error creating categories:", catError)
                        // Continue anyway, maybe they exist but local state is stale?
                    } else {
                        // Refresh local categories to ensure consistency
                        await loadCategories()
                    }
                }

                // 2. Transform Data
                setUploadStatus(`Traitement de ${rows.length} lignes...`)

                // Flexible check for required title column
                const firstRow = rows[0] || {}
                const titleKey = firstRow.hasOwnProperty('Title') ? 'Title' : firstRow.hasOwnProperty('title') ? 'title' : null

                if (!titleKey) {
                    console.error("CSV Missing 'Title' or 'title' column. Available keys:", Object.keys(firstRow))
                    setUploadStatus("Erreur : Le CSV doit avoir une colonne 'Title' ou 'title'.")
                    setUploading(false)
                    return
                }

                for (const row of rows) {
                    const title = row["Title"] || row["title"]
                    if (!title || title.trim() === "") continue

                    // Flexible field mapping
                    const description = row["Body (HTML)"] || row["description"] || ""
                    const rawCat = row["Product Category"] || row["category"] || "Uncategorized"

                    // Same cleaning logic
                    const catName = rawCat.split('>').pop().trim()
                    const catSlug = toSlug(catName)

                    const priceRaw = row["Variant Price"] || row["price"] || "0"
                    const resellerPriceRaw = row["Price HT"] || row["reseller_price"] || "0"
                    const stockRaw = row["Variant Inventory Qty"] || row["stock"] || "0"
                    const sku = row["Variant SKU"] || row["sku"] || ""
                    const imageUrl = row["Image Src"] || row["image_url"] || ""
                    const crossSellsRaw = row["product.metafields.shopify--discovery--product_recommendation.related_products"] || row["cross_sells"]

                    // Basic numeric cleanup
                    const price = parseFloat(priceRaw) || 0
                    const resellerPrice = parseFloat(resellerPriceRaw) || 0
                    const stock = parseInt(stockRaw) || 0

                    const product = {
                        title: title,
                        description: description,
                        category: catSlug, // Use the slug!
                        price: price,
                        reseller_price: resellerPrice,
                        compare_at_price: 0, // Hardcoded as per rule
                        stock: stock,
                        sku: sku,
                        image_url: imageUrl,
                        images: imageUrl ? [imageUrl] : [],
                        cross_sells: crossSellsRaw
                            ? String(crossSellsRaw)
                                .split(',')
                                .map((s: string) => s.trim())
                                .filter((s: string) => s.length > 0)
                            : [],
                        status: stock > 0 ? "active" : "draft",
                        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)
                    }

                    // Exclude properties not in the schema
                    const { cross_sells, image_url, slug, ...dbProduct } = product as any
                    validProducts.push(dbProduct)
                }

                if (validProducts.length === 0) {
                    console.warn("No valid products found. First row keys:", rows[0] ? Object.keys(rows[0]) : "No rows")
                    setUploadStatus("Aucun produit valide trouvé. Vérifiez les en-têtes du CSV (Title, Body (HTML), etc).")
                    setUploading(false)
                    return
                }

                // 2. Batch Insert
                const BATCH_SIZE = 50
                let insertedCount = 0

                try {
                    for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
                        const batch = validProducts.slice(i, i + BATCH_SIZE)
                        setUploadStatus(`Téléchargement du lot ${Math.floor(i / BATCH_SIZE) + 1}...`)

                        const { error } = await supabase
                            .from('products')
                            .insert(batch)

                        if (error) {
                            console.error("Batch upload error:", JSON.stringify(error, null, 2))
                            setUploadStatus(`Error: ${error.message || JSON.stringify(error)}`)
                            return // Stop on error? Or continue? Let's stop to be safe.
                        }
                        insertedCount += batch.length
                    }

                    setUploadStatus(`Succès ! ${insertedCount} produits téléchargés.`)
                    loadProducts() // Refresh list
                    // Clear file input
                    event.target.value = ""
                } catch (e: any) {
                    console.error("Upload exception:", e)
                    setUploadStatus(`Error: ${e.message}`)
                } finally {
                    setUploading(false)
                    // Clear status after delay
                    setTimeout(() => setUploadStatus(""), 5000)
                }
            },
            error: (error: Error) => {
                console.error("PapaParse error:", error)
                setUploadStatus("Error parsing CSV file.")
                setUploading(false)
            }
        })
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 transition-all duration-300">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{t("admin.products.title")}</h1>
                            <p className="text-xs text-muted-foreground">{t("admin.products.subtitle")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="csv-upload-input"
                            disabled={uploading}
                        />

                        {/* Upload Button */}
                        <Button
                            variant="outline"
                            className="rounded-full h-9 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-primary/5"
                            onClick={() => document.getElementById('csv-upload-input')?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    {uploadStatus || "Téléchargement..."}
                                </span>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t("admin.products.import_csv")}</span>
                                </>
                            )}
                        </Button>

                        <Dialog open={showCategoryDialog} onOpenChange={(open) => { setShowCategoryDialog(open); if (!open) setPasteTargetId(null) }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="rounded-full h-9">
                                    <Tag className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t("admin.products.manage_categories")}</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        {t("admin.products.manage_categories")}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Gérez vos marques et leurs catalogues de produits.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
                                    {/* Creation Area */}
                                    <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Nouvelle Marque</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Input
                                                    placeholder="Nom de la marque"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    className="h-11 rounded-xl bg-white border-slate-200"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder="Sous-titre"
                                                        value={newCategorySubtitle}
                                                        onChange={(e) => setNewCategorySubtitle(e.target.value)}
                                                        className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                                                    />
                                                    <Input
                                                        placeholder="Bouton"
                                                        value={newCategoryButtonText}
                                                        onChange={(e) => setNewCategoryButtonText(e.target.value)}
                                                        className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="brand-logo-upload"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                setNewCategoryFile(file)
                                                                setNewCategoryPreview(URL.createObjectURL(file))
                                                            }
                                                        }}
                                                    />
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => document.getElementById('brand-logo-upload')?.click()}
                                                        className="h-11 rounded-xl border-dashed border-slate-300 hover:border-indigo-600 flex-1 bg-white hover:bg-slate-50 transition-all font-bold text-xs"
                                                    >
                                                        <ImageIcon className="w-4 h-4 mr-2" />
                                                        {newCategoryFile ? "Modifier Logo" : "Choisir Logo"}
                                                    </Button>
                                                    {newCategoryPreview && (
                                                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex-shrink-0">
                                                            <img src={newCategoryPreview} alt="Preview" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>
                                                <Button onClick={handleAddCategory} className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                                                    <Plus className="w-4 h-4 mr-2" /> Créer la Marque
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand List Area */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Marques Existantes</h3>
                                            <div className="relative w-48">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                <input
                                                    placeholder="Rechercher..."
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {categories
                                                .filter(c => !c.parent_id)
                                                .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                                .map((parent) => {
                                                    const subCats = categories.filter(c => c.parent_id === parent.id)
                                                    return (
                                                        <div key={parent.id} className="group bg-white border border-slate-100 rounded-[2rem] p-4 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-100/50">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                                                                        {parent.logo_url ? (
                                                                            <Image src={parent.logo_url} alt={parent.name} width={40} height={40} className="object-contain p-1" />
                                                                        ) : (
                                                                            <span className="font-black text-indigo-600">{parent.name[0]}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-black text-sm text-[#0f172a]">{parent.name}</h4>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subCats.length} Collections</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setParentAddingSubId(parentAddingSubId === parent.id ? null : parent.id)}
                                                                        className={`w-9 h-9 rounded-xl transition-all ${parentAddingSubId === parent.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteCategory(parent.id)}
                                                                        className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Inline Add Input */}
                                                            {parentAddingSubId === parent.id && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    className="mb-4 overflow-hidden"
                                                                >
                                                                    <div className="flex gap-2 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                                                        <Input
                                                                            placeholder="Nouvelle sous-catégorie..."
                                                                            value={newSubCategoryName}
                                                                            autoFocus
                                                                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                                                                            className="h-10 text-xs flex-1 bg-white"
                                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(parent.id)}
                                                                        />
                                                                        <Button onClick={() => handleAddSubCategory(parent.id)} className="h-10 px-6 bg-indigo-600 rounded-xl font-bold text-xs shadow-lg shadow-indigo-100">
                                                                            Ajouter
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            )}

                                                            {/* Sub-categories List (Level 2) */}
                                                            {subCats.length > 0 && (
                                                                <div className="grid grid-cols-1 gap-3 mt-4 pt-4 border-t border-slate-50">
                                                                    {subCats.map(sub => {
                                                                        const subSubCats = categories.filter(c => c.parent_id === sub.id)
                                                                        return (
                                                                        <div key={sub.id} className="space-y-2">
                                                                            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/sub">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-100 flex-shrink-0">
                                                                                        <Tag className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-xs font-bold text-slate-600 block">{sub.name}</span>
                                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subSubCats.length} Sous-rubriques</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Button 
                                                                                        variant="ghost" 
                                                                                        size="icon" 
                                                                                        onClick={() => setNestedAddingSubId(nestedAddingSubId === sub.id ? null : sub.id)}
                                                                                        className={`w-7 h-7 rounded-lg transition-all ${nestedAddingSubId === sub.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-indigo-600'}`}
                                                                                    >
                                                                                        <Plus className="w-3 h-3" />
                                                                                    </Button>
                                                                                    <button onClick={() => handleDeleteCategory(sub.id)} className="p-1 text-slate-200 hover:text-red-500 transition-all">
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Inline Add Level 3 */}
                                                                            {nestedAddingSubId === sub.id && (
                                                                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ml-8 p-2 bg-indigo-50/30 rounded-xl border border-dashed border-indigo-200">
                                                                                    <div className="flex gap-2">
                                                                                        <Input 
                                                                                                placeholder="Nouvelle sous-rubrique (Niveau 3)..." 
                                                                                                value={newSubCategoryName} 
                                                                                                autoFocus 
                                                                                                onChange={(e) => setNewSubCategoryName(e.target.value)} 
                                                                                                className="h-8 text-[10px] flex-1 bg-white" 
                                                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(sub.id)} 
                                                                                        />
                                                                                        <Button onClick={() => handleAddSubCategory(sub.id)} className="h-8 px-4 bg-indigo-600 rounded-lg font-bold text-[10px]">Ajouter</Button>
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}

                                                                            {/* Level 3 List */}
                                                                            {subSubCats.length > 0 && (
                                                                                <div className="ml-10 space-y-1">
                                                                                    {subSubCats.map(ssc => (
                                                                                        <div key={ssc.id} className="flex items-center justify-between py-1.5 px-3 bg-white border border-slate-50 rounded-lg group/ssc">
                                                                                            <span className="text-[11px] font-medium text-slate-500">{ssc.name}</span>
                                                                                            <button onClick={() => handleDeleteCategory(ssc.id)} className="opacity-0 group-hover/ssc:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                                                                                                <Trash2 className="w-3 h-3" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Link href="/admin/products/new">
                            <Button className="rounded-full h-9 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">{t("admin.products.add_product")}</span>
                            </Button>
                        </Link>
                        <Notifications />
                    </div>
                </header>

                {/* Inventory Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">{t("admin.products.stats.total_products")}</span>
                        <span className="text-xl font-bold text-foreground mt-1">{products.length}</span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">{t("admin.products.stats.total_inventory")}</span>
                        <span className="text-xl font-bold text-foreground mt-1">
                            {products.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('en-US')}
                        </span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">{t("admin.products.stats.low_stock")}</span>
                        <span className="text-xl font-bold text-orange-500 mt-1">
                            {products.filter(p => p.stock < 10 && p.stock > 0).length}
                        </span>
                    </div>
                    <div className="glass-strong rounded-2xl p-4 flex flex-col">
                        <span className="text-sm text-muted-foreground font-medium">{t("admin.products.stats.out_of_stock")}</span>
                        <span className="text-xl font-bold text-red-500 mt-1">
                            {products.filter(p => p.stock === 0).length}
                        </span>
                    </div>
                </div>

                {/* Filters & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] border border-white/20 shadow-xl shadow-black/5">
                        {/* Tabs */}
                        <div className="flex p-1.5 bg-slate-100/50 rounded-2xl overflow-x-auto max-w-full no-scrollbar w-full lg:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                        : "text-slate-500 hover:text-indigo-600 hover:bg-white/80"
                                        }`}
                                >
                                    {getCategoryName(tab)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input
                                placeholder="Rechercher une référence..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 rounded-xl bg-white border-2 border-slate-100 focus:border-indigo-500 h-12 text-sm font-bold shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Products Grid/List */}
                    <div className="glass-strong rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white/5 rounded-xl p-4 border border-white/5 flex gap-4">
                                        {/* Image */}
                                        <div className="h-20 w-20 bg-white rounded-lg overflow-hidden flex-shrink-0 relative" >
                                            {product.images && product.images.length > 0 ? (
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className="font-semibold text-foreground text-sm truncate">{product.title}</p>
                                                    <Badge className={`${getStatusColor(getStockStatus(product.stock))} text-[10px] px-1.5 h-5`}>
                                                        {getStockStatus(product.stock)}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                                            </div>

                                            <div className="flex justify-between items-end mt-2">
                                                <p className="font-bold text-foreground">{formatPrice(product.price)}</p>
                                                <div className="flex gap-2">
                                                    <Link href={`/admin/products/edit/${product.id}`}>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10">
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    {t("admin.products.no_products")}
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5 text-left">
                                        <th className="py-4 pl-4 sm:pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.products.table.product")}</th>

                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t("admin.products.table.category")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix en Dirham</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("admin.products.table.stock")}</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.products.table.status")}</th>
                                        <th className="py-4 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.products.table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4 pl-4 sm:pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                                                            {product.images && product.images.length > 0 ? (
                                                                <Image
                                                                    src={product.images[0]}
                                                                    alt={product.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground text-sm">{product.title}</p>
                                                            <p className="text-xs text-muted-foreground md:hidden">
                                                                {t("admin.products.qty")}: {product.stock}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4 text-sm text-foreground/80 hidden sm:table-cell">{product.category}</td>
                                                <td className="py-4 px-4 text-sm font-bold text-foreground whitespace-nowrap">{formatPrice(product.price)}</td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell font-medium">
                                                    {product.stock} {t("admin.products.units")}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge className={getStatusColor(getStockStatus(product.stock))}>
                                                            {getStockStatus(product.stock)}
                                                        </Badge>
                                                        <button
                                                            onClick={() => handleToggleStatus(product)}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                                                                product.status === 'active'
                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                            }`}
                                                        >
                                                            {product.status === 'active' ? '● Actif' : '○ Brouillon'}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/admin/products/edit/${product.id}`}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground/60 hover:text-blue-500 hover:bg-blue-500/10">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-foreground/60 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                {t("admin.products.no_products")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    )
}
