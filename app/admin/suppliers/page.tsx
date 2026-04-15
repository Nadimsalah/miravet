"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Building2,
    Phone,
    Mail,
    MapPin,
    Globe,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

type Supplier = {
    id: string
    name: string
    contact_name: string | null
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
    created_at: string
}

export default function AdminSuppliersPage() {
    const { t, language } = useLanguage()
    const isArabic = language === "ar"

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddMode, setIsAddMode] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [totalUniqueProducts, setTotalUniqueProducts] = useState(0)
    const [allPurchases, setAllPurchases] = useState<any[]>([])
    const [productLookup, setProductLookup] = useState<Record<string, {title: string, sku: string}>>({})

    // Form state
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({})

    useEffect(() => {
        loadSuppliers()
    }, [])

    const loadSuppliers = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/suppliers')
            const result = await response.json()
            
            if (!response.ok) throw new Error(result.error || "Erreur lors du chargement")

            setSuppliers(result.suppliers || [])
            setTotalUniqueProducts(result.totalUniqueProducts || 0)
            setAllPurchases(result.allPurchases || [])
            setProductLookup(result.productLookup || {})
        } catch (err: any) {
            console.error("Error loading suppliers:", err.message)
            toast.error("Erreur lors du chargement des fournisseurs")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!currentSupplier.name) {
            toast.error("Le nom du fournisseur est obligatoire")
            return
        }

        setSubmitting(true)
        try {
            const url = '/api/admin/suppliers'
            const method = isAddMode ? 'POST' : 'PATCH'
            const body = {
                id: currentSupplier.id,
                name: currentSupplier.name,
                contact_name: currentSupplier.contact_name,
                email: currentSupplier.email,
                phone: currentSupplier.phone,
                address: currentSupplier.address,
                notes: currentSupplier.notes
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Une erreur est survenue")

            toast.success(isAddMode ? "Fournisseur ajouté" : "Fournisseur mis à jour")
            
            closeModal()
            loadSuppliers()
        } catch (err: any) {
            console.error("DEBUG: Save error caught")
            console.error("Error type:", typeof err)
            console.error("Error string:", String(err))
            console.error("Error message property:", err?.message)
            console.error("Error code property:", err?.code)
            console.error("Error details property:", err?.details)
            console.error("Full error object:", err)
            
            toast.error(err?.message || "Une erreur est survenue")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) return
        try {
            const response = await fetch(`/api/admin/suppliers?id=${id}`, {
                method: 'DELETE'
            })
            
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Une erreur est survenue")

            toast.success("Fournisseur supprimé")
            loadSuppliers()
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la suppression")
        }
    }

    const openAddModal = () => {
        setCurrentSupplier({})
        setIsAddMode(true)
    }

    const openEditModal = (supplier: Supplier) => {
        setCurrentSupplier(supplier)
        setIsEditMode(true)
    }

    const closeModal = () => {
        setIsAddMode(false)
        setIsEditMode(false)
        setCurrentSupplier({})
    }

    const filteredSuppliers = suppliers.filter(s => {
        const query = searchQuery.toLowerCase();
        
        // 1. Basic Supplier Info
        const matchSupplier = s.name.toLowerCase().includes(query) ||
            (s.contact_name && s.contact_name.toLowerCase().includes(query)) ||
            (s.email && s.email.toLowerCase().includes(query)) ||
            (s.phone && s.phone.includes(query));
        
        if (matchSupplier) return true;

        // 2. Purchases (BL, Invoice, Notes)
        const supplierPurchases = allPurchases.filter(p => p.supplier_id === s.id);
        const matchPurchase = supplierPurchases.some(p => 
            p.bl_number?.toLowerCase().includes(query) ||
            p.invoice_number?.toLowerCase().includes(query) ||
            p.notes?.toLowerCase().includes(query)
        );

        if (matchPurchase) return true;

        // 3. Products (Name, SKU)
        const matchProduct = supplierPurchases.some(p => {
            const product = productLookup[p.product_id];
            return product?.title.toLowerCase().includes(query) || 
                   product?.sku.toLowerCase().includes(query);
        });

        return matchProduct;
    })

    // Global Stats
    const stats = {
        totalSuppliers: suppliers.length,
        totalInvestment: suppliers.reduce((sum, s) => sum + ((s as any).totalSpent || 0), 0),
        totalStock: suppliers.reduce((sum, s) => sum + ((s as any).currentStock || 0), 0),
        activeProducts: totalUniqueProducts
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-black-[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Fournisseurs</h1>
                            <p className="text-sm font-medium text-slate-500">Gérez vos prestataires et stocks entrants</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-inner"
                            />
                        </div>
                        <Button 
                            onClick={openAddModal}
                            className="h-12 px-6 rounded-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-black flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter
                        </Button>
                    </div>
                </header>

                {/* Summary Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-primary/20 transition-all">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{loading ? "..." : stats.totalSuppliers}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fournisseurs Totaux</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-blue-500/20 transition-all">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{loading ? "..." : stats.activeProducts}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Produits Sourcéés</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-orange-500/20 transition-all">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">{loading ? "..." : stats.totalStock}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Stock Actuel Total</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-green-500/20 transition-all">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 truncate tabular-nums">{loading ? "..." : formatPrice(stats.totalInvestment)} MAD</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Investissement Total</div>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-primary/50 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="font-bold text-sm uppercase tracking-widest">Chargement des fournisseurs...</p>
                        </div>
                    ) : filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map(supplier => (
                            <Link 
                                href={`/admin/suppliers/${supplier.id}`}
                                key={supplier.id} 
                                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-primary/20 transition-all group flex flex-col h-full shadow-lg hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openEditModal(supplier);
                                            }} 
                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">Stock</div>
                                        <div className="text-lg font-black text-slate-900 tabular-nums">{(supplier as any).currentStock || 0}</div>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-black text-slate-900 mb-1 line-clamp-1 tracking-tight">{supplier.name}</h3>
                                {supplier.contact_name && <p className="text-sm font-bold text-slate-500 mb-4">{supplier.contact_name}</p>}
                                
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Produits</div>
                                        <div className="text-sm font-black text-slate-900 tabular-nums">{(supplier as any).totalProducts || 0}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investi</div>
                                        <div className="text-sm font-black text-primary truncate tabular-nums">{formatPrice((supplier as any).totalSpent || 0)} MAD</div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 relative z-10">
                                    {supplier.email && (
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                            <Mail className="w-4 h-4 text-primary/40" />
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                            <Phone className="w-4 h-4 text-primary/40" />
                                            <span className="tabular-nums">{supplier.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                            <Building2 className="w-16 h-16 opacity-20" />
                            <p className="font-bold text-lg">Aucun fournisseur trouvé</p>
                            <p className="text-sm">Vérifiez si la table 'suppliers' existe dans la base de données.</p>
                        </div>
                    )}
                </div>

                {/* Modal Add/Edit */}
                <Dialog open={isAddMode || isEditMode} onOpenChange={closeModal}>
                    <DialogContent className="sm:max-w-[500px] border border-slate-200 bg-white p-0 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    {isAddMode ? "Nouveau Fournisseur" : "Modifier le Fournisseur"}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Formulaire pour ajouter ou modifier les informations d'un fournisseur.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Nom de l'entreprise *</label>
                                    <Input 
                                        value={currentSupplier.name || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} 
                                        placeholder="Ex: PharmaVétérinaire SA"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Nom du contact</label>
                                    <Input 
                                        value={currentSupplier.contact_name || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, contact_name: e.target.value})} 
                                        placeholder="Ex: M. Alaoui"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Email</label>
                                        <Input 
                                            value={currentSupplier.email || ""} 
                                            onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} 
                                            placeholder="contact@exemple.com"
                                            className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Téléphone</label>
                                        <Input 
                                            value={currentSupplier.phone || ""} 
                                            onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} 
                                            placeholder="+212 6..."
                                            className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Adresse</label>
                                    <Input 
                                        value={currentSupplier.address || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, address: e.target.value})} 
                                        placeholder="Adresse complète"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-bold shadow-inner"
                                    />
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Notes</label>
                                    <textarea 
                                        value={currentSupplier.notes || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, notes: e.target.value})} 
                                        placeholder="Notes et informations supplémentaires..."
                                        className="w-full h-24 p-3 rounded-xl bg-slate-50 border-slate-200 focus:ring-1 focus:ring-primary focus:outline-none resize-none text-sm placeholder:text-slate-400 font-medium text-slate-900 shadow-inner"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-8 flex gap-3">
                                <Button variant="ghost" onClick={closeModal} className="h-12 rounded-xl flex-1 font-bold">
                                    Annuler
                                </Button>
                                <Button 
                                    onClick={handleSave} 
                                    disabled={submitting || !currentSupplier.name} 
                                    className="h-12 rounded-xl flex-1 font-bold shadow-xl shadow-primary/20"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
