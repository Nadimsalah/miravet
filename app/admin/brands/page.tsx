"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
    Plus, Search, Trash2, Edit, Loader2, Image as ImageIcon,
    AlertCircle, XCircle, Upload, Save
} from "lucide-react"
import { toast } from "sonner"
import {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    uploadBrandLogo,
    type Brand
} from "@/lib/supabase-api"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"

export default function BrandsPage() {
    const { t } = useLanguage()
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [brandName, setBrandName] = useState("")
    const [brandSlug, setBrandSlug] = useState("")
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadBrands()
    }, [])

    async function loadBrands() {
        setLoading(true)
        const data = await getBrands()
        setBrands(data)
        setLoading(false)
    }

    function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Veuillez télécharger un fichier image valide.")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("La taille de l'image doit être inférieure à 2 Mo.")
            return
        }

        setLogoFile(file)
        const objectUrl = URL.createObjectURL(file)
        setLogoPreview(objectUrl)
    }

    function openCreateDialog() {
        setEditingBrand(null)
        setBrandName("")
        setBrandSlug("")
        setLogoFile(null)
        setLogoPreview(null)
        setIsDialogOpen(true)
    }

    function openEditDialog(brand: Brand) {
        setEditingBrand(brand)
        setBrandName(brand.name)
        setBrandSlug(brand.slug)
        setLogoFile(null)
        setLogoPreview(brand.logo)
        setIsDialogOpen(true)
    }

    function generateSlug(name: string) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
    }

    const handleAutoSlug = (name: string) => {
        setBrandName(name)
        if (!editingBrand) {
            setBrandSlug(generateSlug(name))
        }
    }

    async function handleSaveBrand() {
        if (!brandName || !brandSlug) {
            toast.error("Le nom et le slug sont obligatoires.")
            return
        }

        setIsSaving(true)

        try {
            let logoUrl = editingBrand?.logo

            // Upload new logo if selected
            if (logoFile) {
                const uploadResult = await uploadBrandLogo(logoFile, brandSlug)
                if (!uploadResult.success || !uploadResult.url) {
                    toast.error(uploadResult.error || "Failed to upload logo")
                    setIsSaving(false)
                    return
                }
                logoUrl = uploadResult.url
            }

            if (editingBrand) {
                // Update
                const result = await updateBrand(editingBrand.id, {
                    name: brandName,
                    slug: brandSlug,
                    logo: logoUrl || null
                })
                setBrands(prev => prev.map(b => b.id === result.id ? result : b))
                toast.success("Marque modifiée avec succès.")
            } else {
                // Create
                const result = await createBrand({
                    name: brandName,
                    slug: brandSlug,
                    logo: logoUrl || null
                })
                setBrands(prev => [...prev, result])
                toast.success("Marque créée avec succès.")
            }

            setIsDialogOpen(false)
        } catch (error: any) {
            console.error("Error saving brand:", error)
            toast.error(`Erreur: ${error.message || "Failed to save brand"}`)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette marque ?")) return

        const deleteToast = toast.loading("Suppression...")
        try {
            await deleteBrand(id)
            setBrands(prev => prev.filter(b => b.id !== id))
            toast.success("Marque supprimée.", { id: deleteToast })
        } catch (error: any) {
            toast.error("Erreur lors de la suppression.", { id: deleteToast })
        }
    }

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Marques (Brands)
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        Gérez les marques et leurs logos pour les afficher sur les produits.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Ajouter une marque
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBrand ? "Modifier la marque" : "Ajouter une marque"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Logo Upload */}
                            <div className="flex justify-center mb-4">
                                <div className="relative w-32 h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden bg-muted hover:bg-muted/80 transition-colors group cursor-pointer">
                                    {logoPreview ? (
                                        <>
                                            <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="text-white w-6 h-6" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                            <span className="text-xs font-semibold text-muted-foreground">Logo</span>
                                        </>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoSelect} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nom de la marque</label>
                                <Input
                                    placeholder="Ex: Samsung"
                                    value={brandName}
                                    onChange={(e) => handleAutoSlug(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug (URL)</label>
                                <Input
                                    placeholder="samsung"
                                    value={brandSlug}
                                    onChange={(e) => setBrandSlug(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Annuler</Button>
                            <Button onClick={handleSaveBrand} disabled={isSaving || !brandName || !brandSlug}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher une marque..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <div className="rounded-2xl border bg-background/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">Logo</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBrands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    Aucune marque trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-lg bg-white relative overflow-hidden border flex items-center justify-center p-1">
                                            {brand.logo ? (
                                                <Image src={brand.logo} alt={brand.name} fill className="object-contain p-1" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{brand.slug}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => openEditDialog(brand)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500/50 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => handleDelete(brand.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
