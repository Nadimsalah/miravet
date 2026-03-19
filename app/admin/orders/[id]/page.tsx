"use client"

import { useState, useEffect } from "react"
import { getOrderDetailsAdmin, updateOrderStatusAdmin } from "@/app/actions/admin-orders"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Package,
    CheckCircle2,
    History,
    User,
    Mail,
    FileText,
    Truck,
    Search,
    MapPin,
    Loader2,
    Phone
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"

export default function OrderDetailsPage() {
    const { t, setLanguage, language } = useLanguage()
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const searchParams = useSearchParams()
    const autoPrint = searchParams.get('print') === 'true'

    // Flattened State (View Model)
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    // Print State
    const [printType, setPrintType] = useState<'bon_commande' | 'delivery_note' | null>(null)

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    useEffect(() => {
        if (orderId) loadData()
    }, [orderId])

    async function loadData() {
        setLoading(true)
        try {
            const { success, data, error } = await getOrderDetailsAdmin(orderId)
            if (error || !success || !data) throw new Error(error || "Failed to fetch data")
            setOrder(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
            if (autoPrint) {
                setTimeout(() => window.print(), 500)
            }
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return
        const statusLower = newStatus.toLowerCase()

        if (statusLower === order.status) return
        await performStatusUpdate(statusLower)
    }

    const performStatusUpdate = async (statusLower: string, deliveryManId?: string) => {
        setUpdating(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error, success } = await updateOrderStatusAdmin(order.id, statusLower, user?.id, deliveryManId)

        if (error) {
            toast.error(`Failed to update status: ${error}`)
        } else if (success) {
            setOrder((prev: any) => ({
                ...prev,
                status: statusLower,
                delivery_man_id: deliveryManId || prev.delivery_man_id,
                auditLogs: [{
                    id: `temp-${Date.now()}`,
                    new_status: statusLower,
                    created_at: new Date().toISOString(),
                    changed_by_user: { name: 'You (Just Now)' }
                }, ...(prev.auditLogs || [])]
            }))
            toast.success(`Statut mis à jour : ${statusLower}`)

            // Auto-print for delivery company when shipping
            if (statusLower === 'shipped') {
                handlePrint('delivery_note')
            }
        }
        setUpdating(false)
    }

    const handlePrint = (type: 'bon_commande' | 'delivery_note' = 'bon_commande') => {
        setPrintType(type)
        requestAnimationFrame(() => {
            window.print()
        })
    }

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20"
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "shipped": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
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

        // English (or default) labels
        switch (s) {
            case "pending": return "Pending"
            case "processing": return "Processing"
            case "shipped": return "Shipped"
            case "delivered": return "Delivered"
            case "cancelled": return "Cancelled"
            default: return s.charAt(0).toUpperCase() + s.slice(1)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Loading order details...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Order not found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden print:bg-white print:overflow-visible">
            {/* Background gradients - hidden on print */}
            <div className="fixed inset-0 pointer-events-none print:hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <div className="print:hidden">
                <AdminSidebar />
            </div>

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 print:p-0 print:pl-0 print:min-h-0">
                {/* Header - hidden on print */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5 print:hidden">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {order.order_number}
                                <Badge variant="outline" className={`ml-2 border-primary/20 ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </Badge>
                            </h1>
                            <p className="text-xs font-bold text-primary mt-0.5">{order.display_company_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    {/* Bon de Commande Button - Visible on all steps except 'pending' or 'cancelled' */}
                    {order.status.toLowerCase() !== 'pending' && order.status.toLowerCase() !== 'cancelled' && (
                        <Button onClick={() => handlePrint('bon_commande')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <FileText className="w-4 h-4 mr-2" />
                            Bon de Commande
                        </Button>
                    )}
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
                    {/* Left Column: Order Details */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Items Card */}
                        <div className="glass-strong rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" /> {t("admin.orders.table.items")}
                            </h3>

                            <div className="space-y-4">
                                {order.items.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.product_title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Package className="w-8 h-8 text-muted-foreground/20" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground">{item.product_title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-muted-foreground">Qté: {item.quantity} × MAD {formatPrice(item.final_price)}</p>
                                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">📍 {item.warehouse_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-foreground">MAD {formatPrice(item.subtotal)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{t("cart.subtotal")}</span>
                                    <span>MAD {formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{t("cart.shipping")}</span>
                                    <span>MAD {formatPrice(order.shipping_cost)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-foreground pt-4 border-t border-white/5">
                                    <span>{t("cart.total")}</span>
                                    <span className="text-primary">MAD {formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Status & History */}
                    <div className="space-y-6">

                        {/* Status Card */}
                        <div className="glass-strong rounded-3xl p-6 border-l-4 border-primary">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                {language === "fr" ? "Mettre à jour le statut" : "Update Status"}
                            </h3>
                            <div className="space-y-3">
                                {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                                    <button
                                        key={s}
                                        disabled={updating}
                                        onClick={() => handleStatusChange(s)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${order.status === s
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "hover:bg-white/5 text-foreground"
                                            } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <span className="font-medium">
                                            {getStatusLabel(s)}
                                        </span>
                                        {order.status === s && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* NEW: Audit Logs / Timeline */}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-foreground">
                                    {language === "fr" ? "Historique des statuts" : "Timeline Logs"}
                                </h3>
                            </div>
                            <div className="relative pl-2 border-l border-white/10 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {order.auditLogs && order.auditLogs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative pl-6 group">
                                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${idx === 0 ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-muted-foreground/30'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground capitalize mb-0.5">
                                                {getStatusLabel(log.new_status)}
                                            </span>
                                            {log.new_status === 'cancelled' && order.delivery_failed_reason && (
                                                <span className="text-[10px] text-red-500 font-medium block">
                                                    Raison: {order.delivery_failed_reason}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[10px] text-primary/80 font-medium flex items-center gap-1 mt-1">
                                                <User className="w-3 h-3" />
                                                {log.changed_by_user?.name || "System/Admin"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!order.auditLogs || order.auditLogs.length === 0) && (
                                    <p className="text-xs text-muted-foreground pl-6">
                                        {language === "fr" ? "Aucun journal disponible." : "No logs available."}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Proof of Delivery Section */}
                        {order.delivery_proof && (
                            <div className="glass-strong rounded-3xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-bold text-foreground">
                                        {language === "fr" ? "Preuve de Livraison" : "Proof of Delivery"}
                                    </h3>
                                </div>
                                <div className="relative w-full h-48 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-3">
                                    {order.delivery_proof.toLowerCase().endsWith('.pdf') ? (
                                        <div className="flex items-center justify-center h-full">
                                            <FileText className="w-12 h-12 text-muted-foreground" />
                                            <span className="ml-2 text-sm text-foreground font-bold">Document PDF</span>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={order.delivery_proof}
                                                alt="Preuve de livraison"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                                <a
                                    href={order.delivery_proof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-3 bg-primary/10 text-primary text-center rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
                                >
                                    {language === "fr" ? "Voir le document" : "View Document"}
                                </a>
                            </div>
                        )}

                        {/* Costumer Details Card */}
                        <div className="glass-strong rounded-3xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold text-foreground">
                                    {language === "fr" ? "Client" : "Customer"}
                                </h3>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {(order.display_company_name || "C").charAt(0)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><Package className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                            {language === "fr" ? "Entreprise" : "Company"}
                                        </p>
                                        <p className="text-foreground font-medium">{order.display_company_name}</p>
                                    </div>
                                </div>
                                {order.display_reseller_name && order.display_reseller_name !== "None" && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-white/5 rounded-lg text-primary"><User className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                {language === "fr" ? "Contact" : "Contact"}
                                            </p>
                                            <p className="text-foreground font-medium">{order.display_reseller_name}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><Mail className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                            {language === "fr" ? "E-mail" : "Email"}
                                        </p>
                                        <p className="text-foreground font-medium truncate max-w-[180px]">{order.customer_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-2 bg-white/5 rounded-lg text-primary"><Phone className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                            {language === "fr" ? "Téléphone" : "Phone"}
                                        </p>
                                        <p className="text-foreground font-medium">{order.customer_phone || "Non défini"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Printable "Bon de Commande" Section */}
                <div id="printable-invoice" className="hidden print:block bg-white text-black p-0 min-h-screen font-sans">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
                        <div>
                            <div className="relative w-32 h-9 mb-2">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                            <div className="text-xs text-gray-600">
                                <p className="font-bold text-gray-900">Miravet SARL</p>
                                <p>Casablanca, Morocco</p>
                                <p>Email: contact@miravet.ma</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-gray-900 uppercase">
                                {printType === 'delivery_note' ? 'BON DE LIVRAISON' : 'BON DE COMMANDE'}
                            </h1>
                            <div className="text-sm mt-2">
                                <p><span className="font-bold">N° Commande:</span> {order.order_number}</p>
                                <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Client & Shipping Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                <p className="font-bold text-gray-900">{order.display_company_name}</p>
                                {order.display_reseller_name && order.display_reseller_name !== "None" && (
                                    <p className="text-gray-600">Attn: {order.display_reseller_name}</p>
                                )}
                                <p className="text-gray-600">{order.customer_email}</p>
                                <p className="text-gray-600">{order.customer_phone}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">Adresse de Livraison</h3>
                            <div className="text-sm text-right">
                                <p className="font-bold text-gray-900">{order.customer_name}</p>
                                <p className="text-gray-600">{order.address_line1}</p>
                                {order.address_line2 && <p className="text-gray-600">{order.address_line2}</p>}
                                <p className="text-gray-600">{order.city}, {order.governorate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900 text-gray-900">
                                <th className="py-2 text-left text-xs font-bold uppercase tracking-wider">Produit</th>
                                <th className="py-2 text-center text-xs font-bold uppercase tracking-wider">Quantité</th>
                                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Prix Unitaire</th>
                                <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="py-3 text-sm">
                                        <p className="font-bold text-gray-900">{item.product_title}</p>
                                        <p className="text-xs text-gray-600">{item.variant_name}</p>
                                        <p className="text-[10px] text-blue-600 font-medium mt-1">📍 {item.warehouse_name}</p>
                                    </td>
                                    <td className="py-3 text-center text-sm font-medium">{item.quantity}</td>
                                    <td className="py-3 text-right text-sm text-gray-600">{formatPrice(item.final_price)} MAD</td>
                                    <td className="py-3 text-right text-sm font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-1/3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Sous-total</span>
                                <span>{formatPrice(order.subtotal)} MAD</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Livraison</span>
                                <span>{formatPrice(order.shipping_cost)} MAD</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>{formatPrice(order.total)} MAD</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="flex justify-between items-end pt-8 border-t border-gray-200">
                        <div className="text-xs text-gray-400">
                            <p>Ce document est généré automatiquement.</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Cachet et Signature</p>
                            <div className="h-16 w-32 border border-gray-200 rounded-lg bg-gray-50"></div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}


