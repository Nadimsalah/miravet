"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
    Upload, Save, RotateCcw, Loader2, Image as ImageIcon,
    MoreHorizontal, Search, Trash2, CheckCircle2, XCircle,
    Plus, ExternalLink, GripVertical, AlertCircle, ArrowUp, ArrowDown
} from "lucide-react"
import { toast } from "sonner"
import {
    getHeroCarouselItems,
    updateHeroCarouselItem,
    uploadHeroCarouselImage,
    addHeroCarouselItem,
    deleteHeroCarouselItem,
    type HeroCarouselItem
} from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function HeroCarouselPage() {
    const { t } = useLanguage()
    const [items, setItems] = useState<HeroCarouselItem[]>([])
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<{ id: string, title: string, images: string[] }[]>([])

    // New Slide State
    const [newSlideImage, setNewSlideImage] = useState<File | null>(null)
    const [newSlidePreview, setNewSlidePreview] = useState<string | null>(null)
    const [newSlideTitle, setNewSlideTitle] = useState("")
    const [newSlideSubtitle, setNewSlideSubtitle] = useState("")
    const [newSlideLink, setNewSlideLink] = useState<string>("")
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
    const [productSearchQuery, setProductSearchQuery] = useState("")
    const [isUploading, setIsUploading] = useState(false)

    // Edit State
    const [editingItem, setEditingItem] = useState<HeroCarouselItem | null>(null)
    const [editLink, setEditLink] = useState("")
    const [editImage, setEditImage] = useState<File | null>(null)
    const [editPreview, setEditPreview] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        loadCarouselItems()
        loadProducts()
    }, [])

    async function loadProducts() {
        const { data } = await supabase.from('products').select('id, title, images').eq('status', 'active')
        if (data) {
            setProducts(data)
        }
    }

    async function loadCarouselItems() {
        setLoading(true)
        const data = await getHeroCarouselItems(true)
        setItems(data)
        setLoading(false)
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error(t("admin.hero.toast.upload_image"))
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t("admin.hero.toast.image_large"))
            return
        }

        setNewSlideImage(file)
        const objectUrl = URL.createObjectURL(file)
        setNewSlidePreview(objectUrl)
    }

    async function handleAddSlide() {
        if (!newSlideImage) {
            toast.error("Please select an image first")
            return
        }

        setIsUploading(true)
        const nextPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 1

        try {
            // 1. Upload Image
            const uploadResult = await uploadHeroCarouselImage(newSlideImage, nextPosition)
            if (!uploadResult.success || !uploadResult.url) {
                toast.error(uploadResult.error || "Failed to upload image")
                setIsUploading(false)
                return
            }

            // 2. Add Item to DB
            const newItem = {
                title: newSlideTitle || t("admin.hero.placeholder_title"),
                subtitle: newSlideSubtitle || t("admin.hero.placeholder_subtitle"),
                image_url: uploadResult.url,
                position: nextPosition,
                link: newSlideLink || undefined,
                is_active: true
            }

            // Fix type mismatch by ensuring undefined instead of null
            const payload = {
                ...newItem,
                link: newItem.link || undefined
            }

            const result = await addHeroCarouselItem(payload)

            if (result.success && result.data) {
                toast.success("Slide added successfully")
                setItems(prev => [...prev, result.data!])
                // Reset Form
                setNewSlideImage(null)
                setNewSlidePreview(null)
                setNewSlideTitle("")
                setNewSlideSubtitle("")
                setNewSlideLink("")
            } else {
                toast.error(result.error || "Failed to save slide")
            }
        } catch (error) {
            console.error("Error adding slide:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsUploading(false)
        }
    }

    async function handleDeleteSlide(id: string) {
        if (!confirm(t("admin.hero.toast.delete_confirm"))) return

        const deleteToast = toast.loading(t("admin.hero.toast.deleting"))
        const result = await deleteHeroCarouselItem(id)

        if (result.success) {
            toast.success(t("admin.hero.toast.delete_success"), { id: deleteToast })
            setItems(prev => prev.filter(item => item.id !== id))
        } else {
            toast.error(result.error || t("admin.hero.toast.delete_fail"), { id: deleteToast })
        }
    }

    async function handleToggleActive(item: HeroCarouselItem) {
        const newStatus = !item.is_active
        const updateToast = toast.loading(newStatus ? t("admin.hero.toast.activating") : t("admin.hero.toast.deactivating"))

        try {
            const result = await updateHeroCarouselItem(item.id, { is_active: newStatus })

            if (result.success) {
                toast.success(newStatus ? t("admin.hero.toast.status_success_on") : t("admin.hero.toast.status_success_off"), { id: updateToast })
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newStatus } : i))
            } else {
                toast.error(result.error || t("admin.hero.toast.status_fail"), { id: updateToast })
            }
        } catch (e) {
            toast.error("Failed to update status", { id: updateToast })
        }
    }

    async function handleSaveEdit() {
        if (!editingItem) return

        setIsUpdating(true)
        try {
            let imageUrl = editingItem.image_url

            // 1. If new image selected, upload it
            if (editImage) {
                const uploadResult = await uploadHeroCarouselImage(editImage, editingItem.position)
                if (uploadResult.success && uploadResult.url) {
                    imageUrl = uploadResult.url
                } else {
                    toast.error(uploadResult.error || "Failed to upload new image")
                    setIsUpdating(false)
                    return
                }
            }

            // 2. Update Item in DB
            const result = await updateHeroCarouselItem(editingItem.id, {
                title: editingItem.title,
                subtitle: editingItem.subtitle,
                link: editLink || null,
                image_url: imageUrl
            })

            if (result.success) {
                toast.success(t("admin.hero.toast.save_success"))
                setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...editingItem, link: editLink, image_url: imageUrl } : i))
                setEditingItem(null)
                setEditImage(null)
                setEditPreview(null)
            } else {
                toast.error(result.error || "Failed to save changes")
            }
        } catch (error) {
            console.error("Error updating slide:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsUpdating(false)
        }
    }

    // Drag and Drop State and Logic
    const [draggedItem, setDraggedItem] = useState<HeroCarouselItem | null>(null)

    function handleDragStart(e: React.DragEvent<HTMLTableRowElement>, item: HeroCarouselItem) {
        setDraggedItem(item)
        // Make the drag image transparent or set a custom one if needed
        e.dataTransfer.effectAllowed = "move"
        // Setup a ghost image if desired, otherwise brower default
        // const ghost = document.createElement('div')
        // ghost.classList.add('hidden')
        // document.body.appendChild(ghost)
        // e.dataTransfer.setDragImage(ghost, 0, 0)
    }

    function handleDragOver(e: React.DragEvent<HTMLTableRowElement>, item: HeroCarouselItem) {
        e.preventDefault()
        if (!draggedItem || draggedItem.id === item.id) return

        const newItems = [...items]
        const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id)
        const targetIndex = newItems.findIndex(i => i.id === item.id)

        // Safety check: ensure both items exist in the list
        if (draggedIndex === -1 || targetIndex === -1) return

        // Swap locally for visual feedback
        const [removed] = newItems.splice(draggedIndex, 1)
        if (!removed) return // Extra safety

        newItems.splice(targetIndex, 0, removed)

        // Update positions based on new index
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            position: index + 1
        }))

        setItems(updatedItems)
    }

    async function handleDragEnd() {
        setDraggedItem(null)

        // Save new order to DB
        // We only need to update items whose position changed, but updating all is safer/easier logic-wise for small lists
        const updates = items.map((item, index) => ({
            id: item.id,
            position: index + 1
        }))

        try {
            await Promise.all(updates.map(update =>
                updateHeroCarouselItem(update.id, { position: update.position })
            ))
            toast.success("Order updated")
        } catch (error) {
            console.error("Failed to save order", error)
            toast.error("Failed to save new order")
            loadCarouselItems() // Revert
        }
    }

    const filteredProducts = products.filter(p =>
        (p.title || "").toLowerCase().includes(productSearchQuery.toLowerCase())
    )

    const getLinkedProductTitle = (link: string | null) => {
        if (!link) return null
        const id = link.replace('/product/', '')
        return products.find(p => p.id === id)?.title
    }

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
                        {t("admin.hero.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                        {t("admin.hero.subtitle")}
                    </p>
                </div>
                <Button variant="outline" onClick={loadCarouselItems} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {t("admin.hero.refresh")}
                </Button>
            </div>

            {/* Add New Slide Section */}
            <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{t("admin.hero.add_slide")}</h2>
                </div>

                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Image Upload Area */}
                    <div className="space-y-3">
                        <div className="relative aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-background/50 overflow-hidden group">
                            {newSlidePreview ? (
                                <>
                                    <Image
                                        src={newSlidePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => {
                                            setNewSlideImage(null)
                                            setNewSlidePreview(null)
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground font-medium">Click to upload image</span>
                                    <span className="text-[10px] text-muted-foreground/60 mt-1">1920x1080 recommended</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Details Form */}
                    <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase">{t("admin.hero.title_label")}</label>
                                <Input
                                    placeholder={t("admin.hero.placeholder_title")}
                                    value={newSlideTitle}
                                    onChange={(e) => setNewSlideTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase">{t("admin.hero.subtitle_label")}</label>
                                <Input
                                    placeholder={t("admin.hero.placeholder_subtitle")}
                                    value={newSlideSubtitle}
                                    onChange={(e) => setNewSlideSubtitle(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">{t("admin.hero.linked_product")}</label>
                            <Dialog open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal text-muted-foreground relative">
                                        <Search className="w-4 h-4 mr-2" />
                                        {newSlideLink ? (
                                            <span className="text-foreground font-medium flex items-center gap-2">
                                                <Badge variant="secondary" className="px-1.5 py-0">Product</Badge>
                                                {getLinkedProductTitle(newSlideLink) || "Selected Product"}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setNewSlideLink("")
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.stopPropagation()
                                                            setNewSlideLink("")
                                                        }
                                                    }}
                                                    className="ml-auto hover:text-destructive cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-muted"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </div>
                                            </span>
                                        ) : (
                                            t("admin.hero.select_product")
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Select Product</DialogTitle>
                                        <DialogDescription>
                                            Search for a product to link to this slide.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search products..."
                                                className="pl-9"
                                                value={productSearchQuery}
                                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="h-[300px] overflow-y-auto border rounded-xl p-2 space-y-1">
                                            {filteredProducts.map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => {
                                                        setNewSlideLink(`/product/${product.id}`)
                                                        setIsProductSearchOpen(false)
                                                    }}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left group"
                                                >
                                                    <div className="w-10 h-10 rounded-md bg-muted relative overflow-hidden shrink-0 border">
                                                        {product.images?.[0] ? (
                                                            <Image src={product.images[0]} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                                                        {product.title}
                                                    </span>
                                                </button>
                                            ))}
                                            {filteredProducts.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    No products found.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button onClick={handleAddSlide} disabled={isUploading || !newSlideImage}>
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Slide
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slides Table */}
            <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">Image</TableHead>
                            <TableHead>{t("admin.hero.title_label")}</TableHead>
                            <TableHead className="hidden md:table-cell">{t("admin.hero.subtitle_label")}</TableHead>
                            <TableHead className="hidden sm:table-cell">Details</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No slides configured yet. Add one above!
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className={`group transition-colors ${draggedItem?.id === item.id ? 'opacity-50 bg-muted' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onDragOver={(e) => handleDragOver(e, item)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                            <div className="w-20 aspect-video rounded-lg bg-muted relative overflow-hidden border">
                                                {item.image_url ? (
                                                    <Image src={item.image_url} alt={item.title} fill className="object-cover pointer-events-none" />
                                                ) : (
                                                    <ImageIcon className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.title}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                        {item.subtitle}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {item.link ? (
                                            <Badge variant="outline" className="gap-1 font-normal">
                                                <ExternalLink className="w-3 h-3" />
                                                {getLinkedProductTitle(item.link) || "Product"}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No link</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={item.is_active ? "default" : "secondary"}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleToggleActive(item)}
                                        >
                                            {item.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
                                                            setEditingItem(item)
                                                            setEditLink(item.link || "")
                                                        }}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Slide</DialogTitle>
                                                        <DialogDescription className="sr-only">
                                                            Modifier les détails de la diapositive du carrousel.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        {/* Image Edit Section */}
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Image</label>
                                                            <div className="relative aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors bg-background/50 overflow-hidden group">
                                                                {editingItem?.id === item.id && (editPreview || item.image_url) && (
                                                                    <Image
                                                                        src={editPreview || item.image_url}
                                                                        alt="Preview"
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                )}
                                                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                                                    <Upload className="w-8 h-8 mb-2" />
                                                                    <span className="text-xs font-medium">Click to change image</span>
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0]
                                                                            if (file) {
                                                                                setEditImage(file)
                                                                                setEditPreview(URL.createObjectURL(file))
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Title</label>
                                                            <Input
                                                                value={editingItem?.title || ""}
                                                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Subtitle</label>
                                                            <Input
                                                                value={editingItem?.subtitle || ""}
                                                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Link (Product ID)</label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={editLink}
                                                                    onChange={(e) => setEditLink(e.target.value)}
                                                                    placeholder="/product/..."
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Enter /product/ID or use the main dashboard to copy a link.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={handleSaveEdit} disabled={isUpdating}>
                                                            {isUpdating ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                "Save Changes"
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500/50 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => handleDeleteSlide(item.id)}
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
