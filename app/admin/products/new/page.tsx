"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Upload,
    X,
    Plus,
    Save,
    Image as ImageIcon,
    Check,
    Wand2,
    RefreshCw,
    ChevronDown,
    Layers,
    Package,
    Tags,
    Sparkles,
    Loader2,
    Building2,
    Warehouse,
    Trash,
    Search,
    Wallet,
    Award,
    ChevronRight,
    Type,
    FileText,
    Boxes,
    Info
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function NewProductPage() {
    // Workflow State
    const [currentStep, setCurrentStep] = useState(1)

    // Form State
    const [title, setTitle] = useState("")
    const [sku, setSku] = useState("")
    const [images, setImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [benefits, setBenefits] = useState<string[]>([])
    const [newBenefit, setNewBenefit] = useState("")
    const [selectedRelated, setSelectedRelated] = useState<string[]>([])
    const [status, setStatus] = useState("active")
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
    const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
    const [selectedLevel2Id, setSelectedLevel2Id] = useState<string | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const router = useRouter()

    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [purchasePrice, setPurchasePrice] = useState("")
    const [profitMargin, setProfitMargin] = useState("")
    const [supplierId, setSupplierId] = useState("")
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [stock, setStock] = useState("")
    const [ingredients, setIngredients] = useState("")
    const [howToUse, setHowToUse] = useState("")
    const [categories, setCategories] = useState<any[]>([])
    const [warehouses, setWarehouses] = useState<any[]>([])
    const [selectedWarehouse, setSelectedWarehouse] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            const [prods, cats, wares, sups] = await Promise.all([
                supabase.from('products').select('id, title, images').eq('status', 'active').limit(15),
                supabase.from('categories').select('id, name, slug, parent_id, logo_url').order('name'),
                supabase.from('warehouses').select('id, name').order('name'),
                supabase.from('suppliers').select('id, name').order('name')
            ])
            if (prods.data) setRelatedProducts(prods.data)
            if (cats.data) setCategories(cats.data)
            if (wares.data) setWarehouses(wares.data)
            if (sups.data) setSuppliers(sups.data)
        }
        fetchData()
    }, [])

    const [relatedProducts, setRelatedProducts] = useState<any[]>([])

    const steps = [
        { id: 1, label: "Titre & Description", icon: <FileText />, desc: "L'essence de votre produit" },
        { id: 2, label: "Images du produit", icon: <ImageIcon />, desc: "Donnez vie à votre catalogue" },
        { id: 3, label: "Catégories", icon: <Layers />, desc: "Organisation hiérarchique" },
        { id: 4, label: "Tarification", icon: <Wallet />, desc: "Stratégie de prix unifiée" },
        { id: 5, label: "Produits suggérés", icon: <Plus />, desc: "Ventes croisées intelligentes" },
        { id: 6, label: "Publication", icon: <Package />, desc: "Lancement final" }
    ]

    const nextStep = () => {
        if (currentStep === 1 && !title.trim()) { alert("Donnez au moins un titre !"); return }
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
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
                const { error } = await supabase.storage.from('product-images').upload(fileName, file)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
                uploadedUrls.push(publicUrl)
            }
            setImages(prev => [...prev, ...uploadedUrls])
        } catch (error: any) { alert(error.message) } finally { setUploading(false) }
    }

    const handlePurchasePriceChange = (v: string) => {
        setPurchasePrice(v)
        if (v && profitMargin) {
            const cost = parseFloat(v)
            const margin = parseFloat(profitMargin)
            const p = cost + (cost * margin / 100)
            setPrice(p.toFixed(2).toString())
        }
    }

    const handleProfitMarginChange = (v: string) => {
        setProfitMargin(v)
        if (v && purchasePrice) {
            const cost = parseFloat(purchasePrice)
            const margin = parseFloat(v)
            const p = cost + (cost * margin / 100)
            setPrice(p.toFixed(2).toString())
        }
    }

    const handlePriceChange = (v: string) => {
        setPrice(v)
        if (v && purchasePrice) {
            const p = parseFloat(v)
            const cost = parseFloat(purchasePrice)
            if (cost > 0) {
                const margin = ((p - cost) / cost) * 100
                setProfitMargin(margin.toFixed(0).toString())
            }
        }
    }

    const handlePublish = async () => {
        if (!price || parseFloat(price) <= 0) { alert("Le prix est obligatoire."); setCurrentStep(4); return }
        setIsPublishing(true)

        let finalSku = sku
        if (!finalSku) {
            const base = title.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "GEN"
            const rand = Math.floor(1000 + Math.random() * 9000)
            finalSku = `${base}-${rand}`
        }

        try {
            const categoryNamesString = categories.filter(c => selectedCategoryIds.includes(c.id)).map(c => c.name).join(', ')

            const { error } = await supabase.from('products').insert({
                title, description, price: parseFloat(price), stock: stock ? parseInt(stock) : 0,
                status: status.toLowerCase(), images, benefits, ingredients, how_to_use: howToUse,
                category: categoryNamesString, warehouse_id: selectedWarehouse || null,
                sku: finalSku,
                supplier_id: supplierId || null,
                purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
                profit_margin_percentage: profitMargin ? parseFloat(profitMargin) : null
            })
            if (error) throw error
            setShowSuccess(true)
            setTimeout(() => router.push('/admin/products'), 2000)
        } catch (error: any) { alert(error.message); setIsPublishing(false) }
    }

    const generateSku = () => {
        const base = title.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "GEN"
        const rand = Math.floor(1000 + Math.random() * 9000)
        setSku(`${base}-${rand}`)
    }

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex overflow-hidden font-sans">
            <AdminSidebar />

            <main className="flex-1 lg:pl-72 relative flex flex-col items-center justify-start py-8 px-4 h-screen overflow-y-auto no-scrollbar">
                {/* Background decorative elements */}
                <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-4xl space-y-8 z-10 relative pb-40">
                    {/* Header: Focused & Minimal */}
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-black/5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95 group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Nouveau Produit
                                </h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    {steps[currentStep - 1].label}
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    Étape {currentStep}/{steps.length}
                                </p>
                            </div>
                        </div>
                        {/* Status preview */}
                        <div className="hidden sm:flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'active' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`} />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">
                                Mode: {status === 'active' ? 'En ligne' : 'Brouillon'}
                            </span>
                        </div>
                    </header>

                    {/* Progress Indicator: Modern Pill Line */}
                    <div className="relative h-1.5 w-full bg-white/40 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        />
                    </div>

                    {/* Main Stage: ONE BY ONE */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.4, ease: "backOut" }}
                            className="w-full bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-white p-8 lg:p-14 min-h-[450px] flex flex-col justify-center relative overflow-hidden group/card"
                        >
                            {/* Icon Watermark */}
                            <div className="absolute top-10 right-10 text-slate-50 opacity-[0.03] group-hover/card:scale-110 group-hover/card:opacity-[0.05] transition-all duration-1000 select-none">
                                {typeof window !== 'undefined' && window.innerWidth > 1024 && React.cloneElement(steps[currentStep - 1].icon as React.ReactElement, { size: 300 } as any)}
                            </div>

                            <div className="relative z-10 max-w-2xl mx-auto w-full space-y-10">
                                {/* Step Intro */}
                                <div className="space-y-2 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100/50">
                                        {React.cloneElement(steps[currentStep - 1].icon as React.ReactElement, { size: 28, strokeWidth: 2.5 } as any)}
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
                                        {steps[currentStep - 1].label}
                                    </h2>
                                    <p className="text-slate-400 font-medium text-lg italic">
                                        {steps[currentStep - 1].desc}
                                    </p>
                                </div>

                                {/* Step Fields */}
                                <div className="space-y-6 pt-6">
                                    {currentStep === 1 && (
                                        <div className="space-y-6">
                                            <div className="group">
                                                <Input
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Titre accrocheur..."
                                                    className="w-full h-20 px-8 text-2xl font-black border-none bg-slate-50 rounded-[2rem] placeholder:text-slate-300 focus:bg-white focus:ring-[6px] focus:ring-indigo-50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Racontez l'histoire de ce produit..."
                                                className="w-full min-h-[220px] p-8 text-lg font-medium border-none bg-slate-50 rounded-[2.5rem] placeholder:text-slate-300 focus:bg-white focus:ring-[6px] focus:ring-indigo-50 transition-all shadow-sm resize-none"
                                            />
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {images.map((img, i) => (
                                                <div key={i} className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group/img border-4 border-white shadow-xl hover:scale-105 transition-all">
                                                    <Image src={img} alt="" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                                        <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="w-10 h-10 rounded-full bg-white text-red-500 shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <label htmlFor="p-upload" className="aspect-[4/5] rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-slate-300 hover:text-indigo-500 group/u">
                                                {uploading ? <Loader2 className="w-12 h-12 animate-spin mb-2" /> : <Upload className="w-12 h-12 mb-2 group-hover/u:scale-110 transition-transform" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-center px-6">
                                                    {uploading ? "Compression..." : "Glisser-déposer ou cliquer"}
                                                </span>
                                                <input id="p-upload" type="file" multiple className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-6">
                                            {/* Top Selection Overview */}
                                            {selectedCategoryIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
                                                    {selectedCategoryIds.map(catId => {
                                                        const catName = categories.find(c => c.id === catId)?.name || 'Inconnu'
                                                        return (
                                                        <Badge key={catId} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-xl border-none">
                                                            {catName}
                                                            <button onClick={() => setSelectedCategoryIds(p => p.filter(id => id !== catId))} className="ml-2 hover:text-red-500 transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    )})}
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row gap-4 h-[350px]">
                                                {/* Niveau 1: Marques */}
                                                <div className="flex-1 border-2 border-slate-100 rounded-3xl p-4 bg-slate-50 overflow-y-auto no-scrollbar">
                                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 px-2">1. Marques</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {categories.filter(c => !c.parent_id).map(brand => (
                                                            <button
                                                                key={brand.id}
                                                                onClick={() => { setSelectedBrandId(brand.id); setSelectedLevel2Id(null); }}
                                                                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all p-2 bg-white flex flex-col items-center justify-center gap-2 group hover:border-indigo-300 ${selectedBrandId === brand.id ? 'border-indigo-600 shadow-lg shadow-indigo-100' : 'border-transparent'}`}
                                                            >
                                                                {brand.logo_url ? (
                                                                    <div className="w-12 h-12 relative">
                                                                        <Image src={brand.logo_url} alt={brand.name} fill className="object-contain" />
                                                                    </div>
                                                                ) : (
                                                                    <Building2 className={`w-8 h-8 ${selectedBrandId === brand.id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                                                )}
                                                                <span className={`text-[10px] font-bold text-center leading-tight ${selectedBrandId === brand.id ? 'text-indigo-700' : 'text-slate-500'}`}>{brand.name}</span>
                                                                <div
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedCategoryIds([brand.id]); }}
                                                                    className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${selectedCategoryIds.includes(brand.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent group-hover:text-slate-300'}`}
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Niveau 2: Rayons */}
                                                {selectedBrandId && (
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 border-2 border-slate-100 rounded-3xl p-4 bg-white overflow-y-auto no-scrollbar shadow-xl shadow-slate-200/50">
                                                        <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4 px-2">2. Rayons</h3>
                                                        <div className="space-y-2">
                                                            {categories.filter(c => c.parent_id === selectedBrandId).map(cat => (
                                                                <button
                                                                    key={cat.id}
                                                                    onClick={() => setSelectedLevel2Id(cat.id === selectedLevel2Id ? null : cat.id)}
                                                                    className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all ${selectedLevel2Id === cat.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                                                >
                                                                    <span className={`text-xs font-bold ${selectedLevel2Id === cat.id ? 'text-indigo-700' : 'text-slate-600'}`}>{cat.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div 
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedCategoryIds([cat.id]); }}
                                                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${selectedCategoryIds.includes(cat.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100/0 border-2 border-slate-200 text-transparent'}`}
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </div>
                                                                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedLevel2Id === cat.id ? 'rotate-90 text-indigo-400' : 'text-slate-300'}`} />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {categories.filter(c => c.parent_id === selectedBrandId).length === 0 && (
                                                                <div className="text-center p-6 text-slate-400 text-xs font-bold">Aucun rayon pour cette marque.</div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Niveau 3: Sous-rubriques */}
                                                {selectedLevel2Id && (
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 border-2 border-indigo-100 rounded-3xl p-4 bg-indigo-50/30 overflow-y-auto no-scrollbar">
                                                        <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-4 px-2">3. Collections</h3>
                                                        <div className="space-y-1.5">
                                                            {categories.filter(c => c.parent_id === selectedLevel2Id).map(sub => (
                                                                <button
                                                                    key={sub.id}
                                                                    onClick={() => setSelectedCategoryIds([sub.id])} // Force single item selection globally as requested
                                                                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedCategoryIds.includes(sub.id) ? 'bg-white shadow-sm border border-indigo-200' : 'hover:bg-white/50 border border-transparent'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${selectedCategoryIds.includes(sub.id) ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-indigo-100'}`}>
                                                                        {selectedCategoryIds.includes(sub.id) && <Check className="w-3 h-3" />}
                                                                    </div>
                                                                    <span className={`text-[11px] font-bold ${selectedCategoryIds.includes(sub.id) ? 'text-indigo-700' : 'text-slate-500'}`}>{sub.name}</span>
                                                                </button>
                                                            ))}
                                                            {categories.filter(c => c.parent_id === selectedLevel2Id).length === 0 && (
                                                                <div className="text-center p-6 text-slate-400 text-xs font-bold">Aucune collection.</div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 4 && (
                                        <div className="max-w-md mx-auto space-y-6 text-center">

                                            <div className="space-y-3 text-left">
                                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-4">Fournisseur (Optionnel)</label>
                                                <select
                                                    value={supplierId}
                                                    onChange={(e) => setSupplierId(e.target.value)}
                                                    className="w-full h-14 px-6 text-base font-bold border-none bg-slate-50 rounded-[2rem] focus:outline-none focus:ring-[4px] focus:ring-indigo-50 transition-all text-slate-700 appearance-none"
                                                >
                                                    <option value="">Sélectionner un fournisseur...</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3 text-left">
                                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-4">Prix d'achat (MAD)</label>
                                                    <Input
                                                        type="number"
                                                        value={purchasePrice}
                                                        onChange={(e) => handlePurchasePriceChange(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-14 border-none bg-emerald-50 text-emerald-700 rounded-[2rem] font-bold text-lg px-6"
                                                    />
                                                </div>
                                                <div className="space-y-3 text-left">
                                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-4">Marge (%)</label>
                                                    <Input
                                                        type="number"
                                                        value={profitMargin}
                                                        onChange={(e) => handleProfitMarginChange(e.target.value)}
                                                        placeholder="Ex: 30"
                                                        className="w-full h-14 border-none bg-amber-50 text-amber-700 rounded-[2rem] font-bold text-lg px-6"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-left pt-6 mt-6 border-t border-slate-100">
                                                <label className="text-xs font-black uppercase text-indigo-400 tracking-widest pl-4">Prix de vente final (MAD)</label>
                                                <div className="relative group">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-indigo-300">MAD</div>
                                                    <Input
                                                        type="number"
                                                        value={price}
                                                        onChange={(e) => handlePriceChange(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full h-24 pl-20 pr-6 text-4xl font-black text-indigo-600 border-none bg-indigo-50 rounded-[2.5rem] shadow-inner"
                                                    />
                                                </div>
                                            </div>

                                            <div className="inline-flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed mt-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimation HT</span>
                                                <span className="text-xl font-black text-slate-700">{((parseFloat(price) || 0) / 1.2).toFixed(2)} <span className="text-xs">MAD</span></span>
                                            </div>

                                        </div>
                                    )}

                                    {currentStep === 5 && (
                                        <div className="space-y-6">
                                            <div className="relative">
                                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rattacher un produit existant..." className="w-full h-16 pl-16 rounded-full bg-slate-50 border-none focus:bg-white focus:ring-blue-100 shadow-inner font-bold" />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                                {relatedProducts.map(p => (
                                                    <div key={p.id} onClick={() => setSelectedRelated(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} className={`p-4 rounded-3xl border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedRelated.includes(p.id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-50 hover:border-slate-100 hover:shadow-md'}`}>
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 relative overflow-hidden shrink-0">
                                                            {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
                                                        </div>
                                                        <span className="font-bold flex-1">{p.title}</span>
                                                        {selectedRelated.includes(p.id) && <Check className="w-5 h-5" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 6 && (
                                        <div className="max-w-sm mx-auto space-y-10 text-center">
                                            <div className="flex flex-col gap-4">
                                                <label className="text-xs font-black uppercase text-slate-400">Statut de Visibilité</label>
                                                <div className="grid grid-cols-2 gap-4 p-2 bg-slate-100 rounded-[2.5rem]">
                                                    <button onClick={() => setStatus('draft')} className={`py-5 rounded-[2rem] text-sm font-black transition-all ${status === 'draft' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Brouillon</button>
                                                    <button onClick={() => setStatus('active')} className={`py-5 rounded-[2rem] text-sm font-black transition-all ${status === 'active' ? 'bg-slate-900 text-white shadow-xl shadow-black/20' : 'text-slate-500 hover:text-slate-700'}`}>Actif</button>
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[3rem] bg-slate-900 text-white space-y-4 shadow-2xl shadow-indigo-200 group/fin">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black">{selectedCategoryIds.length} Cat.</Badge>
                                                    <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black">{images.length} Imgs</Badge>
                                                </div>
                                                <h3 className="text-xl font-bold">{title || "Produit sans nom"}</h3>
                                                <p className="text-slate-400 text-sm font-medium opacity-60">Prêt à rejoindre la flotte Miravet</p>

                                                <Button onClick={handlePublish} disabled={isPublishing} className="w-full h-16 rounded-2xl bg-indigo-500 hover:bg-white hover:text-indigo-600 text-lg font-black transition-all group-hover/fin:scale-[1.02] shadow-xl shadow-indigo-500/30 border-none mt-4">
                                                    {isPublishing ? <Loader2 className="animate-spin" /> : "Publier l'Inspiration"}
                                                    {!isPublishing && <ChevronRight className="ml-2 w-5 h-5" />}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation: Premium Controls */}
                    <div className="fixed bottom-0 left-0 right-0 lg:left-72 p-6 z-50 pointer-events-none flex justify-center">
                        <div className="w-full max-w-4xl flex items-center justify-between pointer-events-auto gap-4 bg-white/40 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={prevStep}
                                disabled={currentStep === 1 || isPublishing}
                                className={`h-14 px-8 rounded-2xl bg-white border-2 border-slate-100 font-black text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-0 flex items-center gap-3 shadow-sm`}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="hidden sm:inline">Précédent</span>
                            </motion.button>

                            <div className="flex items-center gap-2">
                                {steps.map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${currentStep === i + 1 ? 'bg-indigo-600 w-4' : 'bg-slate-200'}`} />
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={currentStep === steps.length ? handlePublish : nextStep}
                                disabled={isPublishing}
                                className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black shadow-xl flex items-center border-none transition-all group/next hover:bg-slate-800"
                            >
                                <span>{currentStep === steps.length ? 'Finaliser' : 'Continuer'}</span>
                                <ChevronRight className="ml-3 w-5 h-5 group-hover/next:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Celebration Overlay */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-3xl"
                        >
                            <motion.div
                                initial={{ scale: 0.5, y: 100 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="bg-white p-14 rounded-[4rem] text-center shadow-2xl relative border-4 border-indigo-400"
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce">
                                    <Check className="w-12 h-12 text-white" strokeWidth={4} />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 mb-2">Succès !</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Le produit est déployé</p>

                                <div className="mt-8 flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                    <span className="text-xs font-black text-slate-500 uppercase">Redirection...</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
