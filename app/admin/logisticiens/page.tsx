"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    UserPlus,
    Users,
    MapPin,
    Phone,
    Trash2,
    Lock,
    Loader2,
    MoreHorizontal,
    Truck,
    Shield,
    Mail,
    Edit,
    Ban,
    Unlock,
    Copy,
    ExternalLink
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DeliveryMan {
    id: string
    name: string
    email?: string
    phone: string
    city: string
    role: string
    is_blocked: boolean
}

export default function DeliveryMenPage() {
    const { t, language } = useLanguage()
    const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Create/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMan, setEditingMan] = useState<DeliveryMan | null>(null)
    const [formData, setFormData] = useState({ name: '', email: '', password: '', city: '', phone: '' })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/logisticiens")
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Map profiles to interface
            const mapped = data.deliveryMen
                .filter((p: any) => p.id) // IMPORTANT: Filter out corrupt records
                .map((p: any) => ({
                    id: p.id,
                    name: p.name || p.full_name,
                    email: p.email,
                    phone: p.phone,
                    city: p.city,
                    role: p.role,
                    is_blocked: p.is_blocked || false
                }))
            console.log("[Admin] Loaded logisticiens:", mapped.length)
            setDeliveryMen(mapped)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const url = editingMan
                ? `/api/admin/logisticiens/${editingMan.id}`
                : '/api/admin/logisticiens'

            const method = editingMan ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(editingMan ? "Logisticien mis à jour" : "Logisticien créé avec succès")
            setIsModalOpen(false)
            setEditingMan(null)
            setFormData({ name: '', email: '', password: '', city: '', phone: '' })
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleBlock = async (id: string, currentlyBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: !currentlyBlocked })
                .eq('id', id)

            if (error) throw error

            toast.success(currentlyBlocked ? "Logisticien débloqué" : "Logisticien bloqué")
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) return

        try {
            const res = await fetch(`/api/admin/logisticiens/${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success("Logisticien supprimé")
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleCopyUrl = () => {
        const url = `${window.location.origin}/logistique/login`
        navigator.clipboard.writeText(url)
        toast.success("URL de connexion copiée !")
    }

    const filtered = deliveryMen.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.phone.includes(searchQuery) ||
        m.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 glass-strong p-5 rounded-[2rem] border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-500 rounded-2xl shadow-lg shadow-pink-500/20">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestion des Logisticiens</h1>
                            <p className="text-sm text-muted-foreground font-medium">Gérez votre équipe logistique et leurs secteurs</p>
                        </div>
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        setIsModalOpen(open)
                        if (!open) {
                            setEditingMan(null)
                            setFormData({ name: '', email: '', password: '', city: '', phone: '' })
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl h-12 px-6 gap-2 font-bold shadow-lg shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 transition-all hover:scale-[1.02] active:scale-[0.98] border-none">
                                <UserPlus className="w-5 h-5 text-white" />
                                <span className="text-white">Ajouter un Logisticien</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-strong border-white/10 rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">{editingMan ? "Modifier le Logisticien" : "Nouveau Logisticien"}</DialogTitle>
                                <DialogDescription>Saisissez les informations de connexion pour le logisticien.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 py-4 text-foreground">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nom complet</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-pink-500"
                                        placeholder="Ex: Ahmed Benani"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Entrepôt</label>
                                    <Input
                                        required
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-pink-500"
                                        placeholder="Ex: Entrepôt Principal - Casablanca"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Identifiant)</label>
                                    <Input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-pink-500"
                                        placeholder="logisticien@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-pink-500"
                                        placeholder="+212 6XX XXX XXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        {editingMan ? "Nouveau mot de passe (laisser vide pour inchangé)" : "Mot de passe"}
                                    </label>
                                    <Input
                                        required={!editingMan}
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-pink-500"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 border-none text-white">
                                        {isSaving ? <Loader2 className="animate-spin text-white" /> : (editingMan ? "Mettre à jour" : "Créer le compte")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </header>

                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative flex-1 xl:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom, entrepôt ou téléphone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-pink-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 glass-strong rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : filtered.length > 0 ? (
                        filtered.map((m) => (
                            <div key={m.id} className="glass-strong rounded-[2.5rem] border border-white/10 p-8 hover:border-pink-500/30 transition-all group">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center text-pink-500 font-black text-2xl border border-white/10 shadow-inner">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/20 rounded-lg px-3 py-1 font-bold">
                                            Logisticien
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-strong rounded-xl border-white/10">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingMan(m)
                                                        setFormData({ name: m.name, email: m.email || '', phone: m.phone || '', city: m.city || '', password: '' })
                                                        setIsModalOpen(true)
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={handleCopyUrl}
                                                >
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copier l'URL (Login)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleBlock(m.id, m.is_blocked)}
                                                    className={m.is_blocked ? "text-emerald-500" : "text-amber-500"}
                                                >
                                                    {m.is_blocked ? (
                                                        <>
                                                            <Unlock className="w-4 h-4 mr-2" />
                                                            Débloquer
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="w-4 h-4 mr-2" />
                                                            Bloquer l'accès
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDelete(m.id, m.name)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-foreground mb-1 tracking-tight">{m.name}</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-pink-500 font-bold">
                                        <Mail className="w-4 h-4" />
                                        {m.email || "Email non défini"}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <Phone className="w-4 h-4" />
                                        {m.phone}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {m.city || "Entrepôt non défini"}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status du compte</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full \${m.is_blocked ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                        <span className={`text-xs font-bold \${m.is_blocked ? 'text-red-500' : 'text-foreground'}`}>
                                            {m.is_blocked ? 'Bloqué' : 'Actif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-6 bg-white/5 rounded-full text-muted-foreground/20">
                                    <Truck className="w-16 h-16" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Aucun logisticien trouvé</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">Commencez par ajouter votre premier logisticien pour gérer vos expéditions.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
