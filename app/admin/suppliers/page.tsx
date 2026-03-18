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
import {
    Dialog,
    DialogContent,
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

    // Form state
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({})

    useEffect(() => {
        loadSuppliers()
    }, [])

    const loadSuppliers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                // If the table doesn't exist, we'll just show empty
                if (error.code === '42P01') {
                     setSuppliers([])
                } else {
                     throw error
                }
            } else {
                setSuppliers(data || [])
            }
        } catch (error: any) {
            console.error("Error loading suppliers:", error.message)
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
            if (isAddMode) {
                const { error } = await supabase
                    .from('suppliers')
                    .insert([{
                        name: currentSupplier.name,
                        contact_name: currentSupplier.contact_name,
                        email: currentSupplier.email,
                        phone: currentSupplier.phone,
                        address: currentSupplier.address,
                        notes: currentSupplier.notes
                    }])
                if (error) throw error
                toast.success("Fournisseur ajouté avec succès")
            } else {
                const { error } = await supabase
                    .from('suppliers')
                    .update({
                        name: currentSupplier.name,
                        contact_name: currentSupplier.contact_name,
                        email: currentSupplier.email,
                        phone: currentSupplier.phone,
                        address: currentSupplier.address,
                        notes: currentSupplier.notes
                    })
                    .eq('id', currentSupplier.id)
                if (error) throw error
                toast.success("Fournisseur mis à jour")
            }
            
            closeModal()
            loadSuppliers()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ?")) return
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id)
            if (error) throw error
            toast.success("Fournisseur supprimé")
            loadSuppliers()
        } catch (error: any) {
            toast.error(error.message)
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

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.contact_name && s.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-strong p-6 rounded-[2rem] border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground">Fournisseurs</h1>
                            <p className="text-sm font-medium text-muted-foreground">Gérez vos prestataires et grossistes</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-12 bg-white/5 border-white/10 rounded-xl focus:bg-white/10 transition-all font-medium"
                            />
                        </div>
                        <Button 
                            onClick={openAddModal}
                            className="h-12 px-6 rounded-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter
                        </Button>
                    </div>
                </header>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-primary/50 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="font-bold text-sm uppercase tracking-widest">Chargement des fournisseurs...</p>
                        </div>
                    ) : filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map(supplier => (
                            <div key={supplier.id} className="glass-strong rounded-3xl p-6 border border-white/5 hover:border-primary/20 transition-all group flex flex-col h-full shadow-lg hover:shadow-xl hover:shadow-primary/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(supplier)} className="w-8 h-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1">{supplier.name}</h3>
                                {supplier.contact_name && <p className="text-sm font-medium text-muted-foreground mb-4">{supplier.contact_name}</p>}
                                
                                <div className="space-y-2 mt-auto pt-4 border-t border-white/5">
                                    {supplier.email && (
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Mail className="w-4 h-4 text-primary/50" />
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Phone className="w-4 h-4 text-primary/50" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4 text-primary/50" />
                                            <span className="truncate">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                    <DialogContent className="sm:max-w-[500px] border-none bg-background/95 backdrop-blur-2xl p-0 rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    {isAddMode ? "Nouveau Fournisseur" : "Modifier le Fournisseur"}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Nom de l'entreprise *</label>
                                    <Input 
                                        value={currentSupplier.name || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} 
                                        placeholder="Ex: PharmaVétérinaire SA"
                                        className="h-12 rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Nom du contact</label>
                                    <Input 
                                        value={currentSupplier.contact_name || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, contact_name: e.target.value})} 
                                        placeholder="Ex: M. Alaoui"
                                        className="h-12 rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Email</label>
                                        <Input 
                                            value={currentSupplier.email || ""} 
                                            onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} 
                                            placeholder="contact@exemple.com"
                                            className="h-12 rounded-xl bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Téléphone</label>
                                        <Input 
                                            value={currentSupplier.phone || ""} 
                                            onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} 
                                            placeholder="+212 6..."
                                            className="h-12 rounded-xl bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Adresse</label>
                                    <Input 
                                        value={currentSupplier.address || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, address: e.target.value})} 
                                        placeholder="Adresse complète"
                                        className="h-12 rounded-xl bg-white/5 border-white/10"
                                    />
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Notes</label>
                                    <textarea 
                                        value={currentSupplier.notes || ""} 
                                        onChange={e => setCurrentSupplier({...currentSupplier, notes: e.target.value})} 
                                        placeholder="Notes et informations supplémentaires..."
                                        className="w-full h-24 p-3 rounded-xl bg-white/5 border-white/10 focus:ring-1 focus:ring-primary focus:outline-none resize-none text-sm placeholder:text-muted-foreground/50"
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
