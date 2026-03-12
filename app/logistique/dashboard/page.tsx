"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Truck,
    LogOut,
    Package,
    MapPin,
    Phone,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Loader2,
    Search,
    RefreshCw,
    User
} from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"

const DELIVERY_FAILED_REASONS = [
    { fr: "Client absent / injoignable", ar: "الزبون غائب / هاتفه مغلق" },
    { fr: "Numéro de téléphone erroné", ar: "رقم الهاتف خاطئ" },
    { fr: "Adresse incomplète ou introuvable", ar: "العنوان غير كامل أو غير موجود" },
    { fr: "Client a refusé le colis", ar: "الزبون رفض الطلبية" },
    { fr: "Demande de report de livraison", ar: "طلب تأجيل التوصيل" },
    { fr: "Problème d'accès au secteur", ar: "مشكلة في الوصول إلى الحي" },
    { fr: "Colis endommagé", ar: "الطلبية متضررة" }
]

export default function DeliveryDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isFailModalOpen, setIsFailModalOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [failReason, setFailReason] = useState("")
    const [failDetails, setFailDetails] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        checkUser()
    }, [])

    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
            router.push('/logistique/login')
            return
        }

        // Check if blocked
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_blocked')
            .eq('id', user.id)
            .single()

        if (profile?.is_blocked) {
            await supabase.auth.signOut()
            toast.error("Votre compte est bloqué. Contactez l'administrateur.")
            router.push('/logistique/login')
            return
        }

        setUser(user)
        loadOrders(user.id)
    }

    async function loadOrders(userId: string) {
        console.log("[Dashboard] Loading orders for user:", userId)
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        product_title,
                        quantity,
                        variant_name,
                        product_image
                    )
                `)
                .eq('delivery_man_id', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("[Dashboard] Supabase Query Error:", error)
                throw error
            }

            console.log(`[Dashboard] Fetched ${data?.length} orders for user ${userId}`)

            // Map the data to match our UI needs with full details
            const mappedOrders = data.map(order => ({
                ...order,
                shipping_address: `${order.address_line1}${order.address_line2 ? ', ' + order.address_line2 : ''}${order.postal_code ? ' (' + order.postal_code + ')' : ''}`,
                shipping_city: order.city,
                total_amount: order.total,
                items: order.order_items || []
            }))

            setOrders(mappedOrders)
        } catch (error: any) {
            console.error("[Dashboard] Error in loadOrders:", error)
            toast.error("Erreur lors du chargement des commandes")
        } finally {
            setLoading(false)
        }
    }

    const initiateDelivery = (order: any) => {
        setSelectedOrder(order)
        setProofFile(null)
        setIsConfirmModalOpen(true)
    }

    const uploadProof = async (orderId: string, file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${orderId}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('delivery-proofs')
            .upload(filePath, file)

        if (uploadError) {
            throw uploadError
        }

        const { data } = supabase.storage
            .from('delivery-proofs')
            .getPublicUrl(filePath)

        return data.publicUrl
    }

    const handleMarkDelivered = async () => {
        if (!selectedOrder) return

        setIsUpdating(true)
        setUploading(true)
        try {
            let proofUrl = null
            if (proofFile) {
                try {
                    proofUrl = await uploadProof(selectedOrder.id, proofFile)
                } catch (uploadErr) {
                    console.error("Upload failed:", uploadErr)
                    toast.error("Échec de l'upload de la preuve. Continuer sans preuve ?")
                    // Optional: return here if proof is mandatory
                }
            }

            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'delivered',
                    delivered_at: new Date().toISOString(),
                    delivery_failed_reason: null,
                    delivery_proof: proofUrl
                })
                .eq('id', selectedOrder.id)

            if (error) throw error

            toast.success("Colis livré avec succès !")
            setIsConfirmModalOpen(false)
            loadOrders(user.id)
        } catch (error: any) {
            console.error("[MarkDelivered] Error:", error)
            toast.error(`Erreur: ${error.message || "Échec de la mise à jour"}`)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleMarkFailed = async (reason: string) => {
        if (!selectedOrder || !reason) return

        setIsUpdating(true)
        try {
            // 1. Update Order Status
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    delivery_failed_reason: reason
                })
                .eq('id', selectedOrder.id)

            if (error) throw error

            // 2. Insert Log Manually to capture the driver WHO did it
            const { error: logError } = await supabase
                .from('order_status_logs')
                .insert({
                    order_id: selectedOrder.id,
                    changed_by: user.id,
                    old_status: selectedOrder.status,
                    new_status: 'cancelled'
                })

            if (logError) {
                console.error("[MarkFailed] Log insertion failed:", logError)
                // Don't throw here, the order update succeeded
            }

            toast.info("Livraison marquée comme échouée (Commande annulée)")
            setIsFailModalOpen(false)
            setFailReason("")
            setFailDetails("") // Reset details as well
            setSelectedOrder(null)
            loadOrders(user.id)
        } catch (error: any) {
            console.error("[MarkFailed] Error:", error)
            toast.error(`Erreur: ${error.message || "Échec de la mise à jour"}`)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/logistique/login')
    }

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: orders.length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        pending: orders.filter(o => o.status !== 'delivered').length
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] font-sans pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 leading-tight">Ma Logistique</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tableau de bord</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500 rounded-full">
                    <LogOut className="w-6 h-6" />
                </Button>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-black text-emerald-500">{stats.delivered}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Expédiés</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <span className="text-2xl font-black text-blue-500">{stats.pending}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">En cours</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <Input
                        placeholder="Rechercher une commande..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="h-14 rounded-2xl bg-white border-transparent focus:ring-blue-500/20 pl-12 shadow-sm text-base font-medium"
                    />
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Commandes et Historique</h3>
                        <Button variant="ghost" size="sm" onClick={() => loadOrders(user.id)} className="h-8 text-blue-600 font-bold gap-1 p-0">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="text-slate-400 font-bold text-sm">Chargement des colis...</p>
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                            const isDelivered = order.status === 'delivered'
                            return (
                                <div key={order.id} className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group transition-all ${isDelivered ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-slate-900">#{order.order_number}</h3>
                                                    {order.delivery_failed_reason && (
                                                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                                            Échec
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 mt-1">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-indigo-600">
                                                    {formatPrice(order.total_amount || 0)} MAD
                                                </div>
                                                <span className={`
                                                    inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                                                    ${isDelivered ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}
                                                `}>
                                                    {isDelivered ? 'Livré' : 'En cours'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {/* Client Info */}
                                            <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
                                                <User className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-slate-700">
                                                        {order.customer_name || "Nom client inconnu"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        <a href={`tel:${order.customer_phone}`} className="text-xs font-bold text-emerald-600 hover:underline">
                                                            {order.customer_phone || "N/A"}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
                                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                                        {order.shipping_city || "Entrepôt N/A"}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
                                                        {order.shipping_address || "Adresse non spécifiée"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="pt-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Articles</p>
                                                <div className="space-y-1.5">
                                                    {order.items?.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="font-bold text-slate-700 truncate max-w-[150px]">
                                                                {item.product_title}
                                                                {item.variant_name && <span className="text-slate-400 font-medium ml-1">({item.variant_name})</span>}
                                                            </span>
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black">
                                                                x{item.quantity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {(!order.items || order.items.length === 0) && (
                                                        <p className="text-xs text-slate-400 italic px-1">Aucun détail d'article</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!isDelivered ? (
                                            <div className="grid grid-cols-2 gap-3 mt-5">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setIsFailModalOpen(true)
                                                    }}
                                                    variant="outline"
                                                    className="h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Échec
                                                </Button>
                                                <Button
                                                    onClick={() => initiateDelivery(order)}
                                                    className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-none shadow-lg shadow-emerald-500/20 transition-all"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Livré
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-5 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl border border-emerald-100 font-black text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Expédié avec succès
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                <Package className="w-8 h-8 text-slate-400" />
                            </div>
                            <h4 className="text-slate-900 font-black mb-1">Aucun colis</h4>
                            <p className="text-slate-400 text-sm font-medium">Vous n'avez pas de livraisons assignées pour le moment.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Failed Delivery Modal */}
            <Dialog open={isFailModalOpen} onOpenChange={setIsFailModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-[90%] sm:max-w-md border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Signaler un échec logistique</DialogTitle>
                        <DialogDescription className="font-medium">Pourquoi l'expédition n'a pas pu être effectuée ?</DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            {DELIVERY_FAILED_REASONS.map((item) => (
                                <button
                                    key={item.fr}
                                    type="button"
                                    onClick={() => setFailReason(item.fr)}
                                    className={`
                                            w-full text-left p-4 rounded-xl border transition-all duration-200
                                            ${failReason === item.fr
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                        }
                                        `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{item.fr}</span>
                                            <span className={`text-xs ${failReason === item.fr ? 'text-slate-300' : 'text-slate-400'}`}>{item.ar}</span>
                                        </div>
                                        {failReason === item.fr && <CheckCircle2 className="w-5 h-5 text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Précisions (Optionnel)</Label>
                            <Textarea
                                placeholder="Plus de détails..."
                                value={failDetails}
                                onChange={(e) => setFailDetails(e.target.value)}
                                className="rounded-2xl bg-slate-50 border-slate-100 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => {
                                const fullReason = failDetails ? `${failReason} - ${failDetails}` : failReason
                                handleMarkFailed(fullReason)
                            }}
                            disabled={!failReason || isUpdating}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg border-none"
                        >
                            {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bottom Nav Bar (Quick Stats/Logo) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 py-3 px-8 flex justify-center z-40 lg:hidden">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EXPÉDIÉ AUJOURD'HUI</span>
                    <span className="text-xl font-black text-slate-900">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-[90%] sm:max-w-md border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Confirmation</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">Voulez-vous confirmer l'expédition de ce colis ?</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900">#{selectedOrder?.order_number}</p>
                                <p className="text-sm font-bold text-emerald-600">Marquer comme expédié</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Label className="text-sm font-bold text-slate-700 mb-2 block">
                            Preuve de livraison (Photo / Bon de livraison)
                        </Label>
                        <Input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            Prenez une photo du bon signé ou chargez un PDF.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="h-14 rounded-2xl border-slate-200 font-bold text-slate-500 flex-1"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleMarkDelivered}
                            disabled={isUpdating}
                            className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg border-none shadow-lg shadow-emerald-500/20 flex-1"
                        >
                            {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
