"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getOrders, type Order, updateAdminSettings, getAdminSettings } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import {
    Search,
    FileText,
    ChevronLeft,
    ChevronRight,
    Upload,
    Loader2,
    Check,
    X,
    Image as ImageIcon
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

export default function AdminInvoicesPage() {
    const { t, language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState("")
    const [orders, setOrders] = useState<Order[]>([])
    const [totalOrders, setTotalOrders] = useState(0)
    const [loading, setLoading] = useState(true)
    const [signatureUrl, setSignatureUrl] = useState("")
    const [uploading, setUploading] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        const settings = await getAdminSettings()
        if (settings.invoice_signature_url) {
            setSignatureUrl(settings.invoice_signature_url)
        }
    }

    useEffect(() => {
        async function loadOrders() {
            setLoading(true)
            const offset = (currentPage - 1) * ITEMS_PER_PAGE
            const { data, count } = await getOrders({
                limit: ITEMS_PER_PAGE,
                offset: offset,
            })
            // Only invoices for all orders or just shipped/delivered?
            // User requested: "see table ofall orders wth option download pdf of facture"
            setOrders(data)
            setTotalOrders(count)
            setLoading(false)
        }
        loadOrders()
    }, [currentPage])

    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE)

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20"
            default: return "bg-secondary text-secondary-foreground"
        }
    }

    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase()

        if (language === "fr") {
            switch (s) {
                case "pending": return "En attente"
                case "processing": return "En traitement"
                case "shipped": return "Expédiée"
                case "delivered": return "Livrée"
                case "cancelled": return "Annulée"
                default: return s.charAt(0).toUpperCase() + s.slice(1)
            }
        }

        switch (s) {
            case "pending": return "Pending"
            case "processing": return "Processing"
            case "shipped": return "Shipped"
            case "delivered": return "Delivered"
            case "cancelled": return "Cancelled"
            default: return s.charAt(0).toUpperCase() + s.slice(1)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        // Basic validation
        if (file.size > 2 * 1024 * 1024) {
             toast.error("La taille de l'image ne doit pas dépasser 2 Mo")
             return
        }

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const { error } = await supabase.storage.from('product-images').upload(fileName, file)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
            
            // Save to admin settings
            const updateRes = await updateAdminSettings({ invoice_signature_url: publicUrl })
            if (updateRes.success) {
                setSignatureUrl(publicUrl)
                toast.success("Signature téléchargée et enregistrée avec succès")
            } else {
                 throw new Error("Failed to save setting")
            }
        } catch (error: any) { 
            toast.error(error.message) 
        } finally { 
            setUploading(false) 
        }
    }

    const deleteSignature = async () => {
        setUploading(true)
        try {
            const updateRes = await updateAdminSettings({ invoice_signature_url: "" })
            if (updateRes.success) {
                setSignatureUrl("")
                toast.success("Signature supprimée")
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    const printInvoice = async (order: Order) => {
        setSelectedOrder(order)
        const toastId = toast.loading("Génération du document...")
        
        setTimeout(async () => {
            const element = document.getElementById('printable-invoice')
            if (!element) {
                toast.error("Erreur: Section introuvable", { id: toastId })
                return
            }
            const origClass = element.className
            element.className = "bg-white text-black p-8 w-[800px] block"
            try {
                const html2pdf = (await import('html2pdf.js')).default
                await html2pdf().set({
                    margin: 0.5,
                    filename: `facture_${order.order_number}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                }).from(element).save()
                toast.success("Document téléchargé !", { id: toastId })
            } catch (err) {
                console.error(err)
                toast.error("Échec du téléchargement", { id: toastId })
            } finally {
                element.className = origClass
            }
        }, 100)
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 print:hidden">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Factures & Signatures</h1>
                            <p className="text-xs text-muted-foreground">Gérez les factures et la signature officielle</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Upload Signature Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-strong rounded-3xl p-6 border border-white/5">
                            <h3 className="font-bold text-lg mb-2">Signature Officielle</h3>
                            <p className="text-xs text-muted-foreground mb-6">Téléchargez l'image de votre cachet/signature qui apparaîtra sur toutes les factures générées.</p>
                            
                            {signatureUrl ? (
                                <div className="space-y-4">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center p-4">
                                        <Image src={signatureUrl} alt="Signature" width={200} height={100} className="object-contain max-h-full" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                            <button onClick={deleteSignature} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 shadow-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-green-500 font-medium">
                                        <Check className="w-4 h-4" /> Active sur les factures
                                    </div>
                                </div>
                            ) : (
                                <label className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary group">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    ) : (
                                        <Upload className="w-8 h-8 mb-2 group-hover:translate-y-[-4px] transition-transform" />
                                    )}
                                    <span className="text-xs font-bold text-center px-4">
                                        {uploading ? "Chargement..." : "Cliquez pour télécharger la signature"}
                                    </span>
                                    <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Invoices List */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-background/40 backdrop-blur-md p-2 rounded-2xl border border-white/5">
                            <div className="relative flex-1 w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher une commande..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 rounded-xl bg-white/5 border-white/10 focus:bg-white/10 h-10"
                                />
                            </div>
                        </div>

                        <div className="glass-strong rounded-3xl overflow-hidden min-h-[500px] flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5 text-left">
                                            <th className="py-4 pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commande</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                                            <th className="py-4 pr-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Facture</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order) => (
                                                <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 pl-6">
                                                        <span className="font-semibold text-foreground text-sm">{order.order_number}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-foreground/80">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-foreground">
                                                        {order.customer_name}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-bold text-foreground">MAD {formatPrice(order.total)}</td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant="outline" className={`border ${getStatusColor(order.status)} text-xs py-0.5 px-2`}>
                                                            {getStatusLabel(order.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 pr-6 text-right">
                                                        <Button 
                                                            variant="default"
                                                            size="sm" 
                                                            onClick={() => printInvoice(order)}
                                                            className="rounded-lg shadow-xl shadow-primary/20"
                                                        >
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            Générer la Facture
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                    {loading ? "Chargement des commandes..." : "Aucune commande trouvée"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Affichage de {Math.min(filteredOrders.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0, totalOrders)} à {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} sur {totalOrders}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-transparent border-white/10 hover:bg-white/10 disabled:opacity-30"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1 || loading}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-transparent border-white/10 hover:bg-white/10 disabled:opacity-30"
                                        onClick={handleNextPage}
                                        disabled={currentPage >= totalPages || loading}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Printable Invoice Section - Hidden on screen, visible on print */}
            {selectedOrder && (
                <div id="printable-invoice" className="hidden print:block bg-white text-black p-0 min-h-screen font-sans">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                        <div className="space-y-4">
                            {/* Instead of hardcoded src, we can just use regular image tag */}
                            <img 
                                src="/logo.png" 
                                alt="Miravet Logo" 
                                className="h-16 w-auto object-contain"
                            />
                            <div className="text-[11px] leading-relaxed text-slate-600">
                                <p className="font-black text-slate-900 text-sm">MIRAVET SARL</p>
                                <p>Grossisterie Vétérinaire Premium</p>
                                <p>Casablanca, Maroc</p>
                                <p className="font-bold text-slate-800">ICE: 003125896000078</p>
                                <p>Tél: +212 5 22 45 05 07</p>
                                <p>Email: contact@miravet.ma</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-gray-900 uppercase">
                                FACTURE
                            </h1>
                            <div className="text-sm mt-2">
                                <p><span className="font-bold">N° Facture:</span> {selectedOrder.order_number}</p>
                                <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Client & Shipping Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                {/* Normally we would fetch reseller info, but here we just use what we have in order */}
                                <p className="font-bold text-gray-900 uppercase">
                                    {/* @ts-ignore */}
                                    {selectedOrder.reseller?.company_name || selectedOrder.customer_name}
                                </p>
                                {/* @ts-ignore */}
                                {selectedOrder.reseller?.ice && (
                                    <p className="font-bold text-primary mt-1">
                                    {/* @ts-ignore */}
                                    ICE: {selectedOrder.reseller.ice}
                                    </p>
                                )}
                                <p className="text-gray-600 mt-2">
                                    {/* @ts-ignore */}
                                    Contact: {selectedOrder.reseller?.profile?.name || selectedOrder.customer_name}
                                </p>
                                <p className="text-gray-600">{selectedOrder.customer_email}</p>
                                <p className="text-gray-600">{selectedOrder.customer_phone}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">Adresse de Livraison</h3>
                            <div className="text-sm text-right">
                                <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                                <p className="text-gray-600">{selectedOrder.address_line1}</p>
                                {selectedOrder.address_line2 && <p className="text-gray-600">{selectedOrder.address_line2}</p>}
                                <p className="text-gray-600 uppercase font-medium">{selectedOrder.city}, {selectedOrder.governorate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900 text-gray-900">
                                <th className="py-2 text-left text-xs font-bold uppercase tracking-wider">Désignation</th>
                                <th className="py-2 text-center text-xs font-bold uppercase tracking-wider">Qté</th>
                                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">P.U (HT)</th>
                                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Total (HT)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* @ts-ignore */}
                            {selectedOrder.order_items?.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="py-3 text-sm">
                                        <p className="font-bold text-gray-900">{item.product_title}</p>
                                        {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                                    </td>
                                    <td className="py-3 text-center text-sm font-medium">{item.quantity}</td>
                                    <td className="py-3 text-right text-sm text-gray-600">{formatPrice(item.price)} MAD</td>
                                    <td className="py-3 text-right text-sm font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-1/3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total HT</span>
                                <span>{formatPrice(selectedOrder.subtotal)} MAD</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Livraison</span>
                                <span>{formatPrice(selectedOrder.shipping_cost)} MAD</span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                                <span>TOTAL TTC</span>
                                <span>{formatPrice(selectedOrder.total)} MAD</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="flex justify-between items-end pt-8 border-t border-gray-100">
                        <div className="text-[10px] text-gray-400 max-w-[60%]">
                            <p className="font-bold">Conditions de paiement:</p>
                            <p>Paiement à la réception de la marchandise. Miravet SARL reste propriétaire des marchandises jusqu'au paiement intégral.</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Cachet et Signature</p>
                            {signatureUrl ? (
                                <div className="h-20 w-40 flex items-center justify-center">
                                    <img src={signatureUrl} alt="Signature Miravet" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                </div>
                            ) : (
                                <div className="h-20 w-40 border border-gray-200 rounded-xl bg-gray-50/50"></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
