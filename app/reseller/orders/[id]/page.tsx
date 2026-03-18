"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { supabase } from "@/lib/supabase"
import { getOrderById, type Order, type OrderItem, getAdminSettings } from "@/lib/supabase-api"
import {
    ArrowLeft,
    Package,
    Truck,
    CreditCard,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

export default function ResellerOrderDetailsPage() {
    const { language } = useLanguage()
    const isArabic = language === "ar"
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [printType, setPrintType] = useState<'bon_commande' | 'facture' | null>(null)
    const [signatureUrl, setSignatureUrl] = useState("")

    useEffect(() => {
        async function loadOrder() {
            if (!orderId) return
            setLoading(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            const data = await getOrderById(orderId)
            const settings = await getAdminSettings()

            if (settings.invoice_signature_url) {
                setSignatureUrl(settings.invoice_signature_url)
            }

            if (data && data.customer_id === user.id) {
                setOrder(data)
            } else {
                console.error("Order not found or access denied")
            }
            setLoading(false)
        }
        loadOrder()
    }, [orderId, router])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200'
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200'
            case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-200'
            case 'delivered': return 'bg-green-50 text-green-600 border-green-200'
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-200'
            default: return 'bg-gray-50 text-gray-600 border-gray-200'
        }
    }

    const getStatusLabel = (status: string) => {
        const s = status.toLowerCase()
        if (isArabic) {
            switch (s) {
                case 'pending': return 'قيد الانتظار'
                case 'processing': return 'جاري التنفيذ'
                case 'shipped': return 'تم الشحن'
                case 'delivered': return 'تم التوصيل'
                case 'cancelled': return 'ملغي'
                default: return status
            }
        }
        // French labels for everything else
        switch (s) {
            case 'pending': return 'En attente'
            case 'processing': return 'En préparation'
            case 'shipped': return 'Expédié'
            case 'delivered': return 'Livré'
            case 'cancelled': return 'Annulé'
            default: return status.charAt(0).toUpperCase() + status.slice(1)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isArabic ? "طلب غير موجود" : "Commande non trouvée"}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {isArabic ? "لم نتمكن من العثور على هذا الطلب أو لا تملك صلاحية الوصول إليه." : "Nous n'avons pas pu trouver cette commande ou vous n'avez pas l'autorisation de la consulter."}
                    </p>
                    <Link href="/reseller/dashboard">
                        <Button className="w-full h-12 rounded-xl">
                            {isArabic ? "العودة للوحة التحكم" : "Retour au tableau de bord"}
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isDelivered = order.status.toLowerCase() === 'delivered'

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto print:hidden">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/reseller/dashboard">
                            <Button variant="outline" size="icon" className="rounded-full bg-white border-gray-200">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {isArabic ? "تفاصيل الطلب" : "Détails de la commande"}
                                <span className="text-primary font-mono text-lg">#{order.order_number}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1 text-left">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Document Buttons */}
                    <div className="flex gap-3">
                        {!loading && order && (order.status.toLowerCase() === 'processing' || order.status.toLowerCase() === 'pending') && (
                            <Button
                                onClick={() => {
                                    setPrintType('bon_commande')
                                    setTimeout(() => window.print(), 100)
                                }}
                                variant="outline"
                                className="bg-white text-gray-600 border-gray-200"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {isArabic ? "بون الطلب" : "Bon de Commande"}
                            </Button>
                        )}

                        {!loading && order && ['shipped', 'delivered'].includes(order.status.toLowerCase()) && (
                            <Button
                                onClick={() => {
                                    setPrintType('facture')
                                    setTimeout(() => window.print(), 100)
                                }}
                                className="bg-primary text-white hover:bg-primary/90"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {isArabic ? "الفاتورة" : "Voir la Facture"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-gray-400" />
                                    {isArabic ? "المنتجات" : "Articles commandés"}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-6">
                                    {order.order_items.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="h-20 w-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative border border-gray-100">
                                                {item.product_image ? (
                                                    <Image
                                                        src={item.product_image}
                                                        alt={item.product_title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="font-bold text-gray-900 truncate">
                                                    {item.product_title}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {isArabic ? `الكمية: ${item.quantity}` : `Quantité: ${item.quantity}`} × {formatPrice(item.price)} MAD
                                                </p>
                                                {item.variant_name && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                                        {item.variant_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatPrice(item.subtotal)} MAD</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "المجموع الفرعي" : "Sous-total"}</span>
                                        <span className="font-medium">{formatPrice(order.subtotal)} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span>{isArabic ? "الشحن" : "Livraison"}</span>
                                        <span className="font-medium">{formatPrice(order.shipping_cost)} MAD</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <span className="text-lg font-bold text-gray-900">{isArabic ? "الإجمالي" : "Montant Total"}</span>
                                        <span className="text-2xl font-black text-primary">{formatPrice(order.total)} MAD</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
                                <Clock className="w-5 h-5 text-gray-400" />
                                {isArabic ? "تتبع الطلب" : "Suivi de la commande"}
                            </h3>
                            <div className="space-y-8 text-left">
                                {[
                                    { label: 'En attente', arabic: 'تم استلام الطلب', icon: CheckCircle2, completed: true },
                                    { label: 'En préparation', arabic: 'جاري التحضير', icon: Loader2, completed: ['processing', 'shipped', 'delivered'].includes(order.status) },
                                    { label: 'Expédié', arabic: 'تم الشحن', icon: Truck, completed: ['shipped', 'delivered'].includes(order.status) },
                                    { label: 'Livré', arabic: 'تم التوصيل', icon: CheckCircle2, completed: order.status === 'delivered' },
                                ].map((step, idx, arr) => (
                                    <div key={idx} className="flex items-start gap-4 relative">
                                        {idx !== arr.length - 1 && (
                                            <div className={`absolute left-2.5 top-5 w-0.5 h-10 ${step.completed ? 'bg-primary' : 'bg-gray-100'}`} />
                                        )}
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${step.completed ? 'bg-primary text-white' : 'bg-gray-100 text-gray-300'}`}>
                                            <step.icon className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <p className={`font-bold text-sm ${step.completed ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {isArabic ? step.arabic : step.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Address & Payment */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "عنوان الشحن" : "Adresse de livraison"}
                            </h4>
                            <div className="flex items-start gap-3 text-left">
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold">{order.customer_name}</p>
                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                        {order.address_line1}<br />
                                        {order.city}, {order.governorate}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "معلومات الاتصال" : "Informations de contact"}
                            </h4>
                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Phone className="w-4 h-4" />
                                    {order.customer_phone}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <Mail className="w-4 h-4" />
                                    {order.customer_email}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {isArabic ? "طريقة الدفع" : "Mode de paiement"}
                            </h4>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase">
                                        {order.payment_method === 'cod' ? (isArabic ? 'الدفع عند الاستلام' : 'Paiement à la livraison') : order.payment_method}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {isArabic ? "فاتورة رسمية للموزعين" : "Facture officielle revendeur"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable "Bon de Commande" Section */}
            <div className="hidden print:block bg-white text-black p-0 min-h-screen font-sans">
                {/* Header */}
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="space-y-4">
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
                            {printType === 'facture' ? 'FACTURE' : 'BON DE COMMANDE'}
                        </h1>
                        <div className="text-sm mt-2">
                            <p><span className="font-bold">{printType === 'facture' ? 'N° Facture:' : 'N° Commande:'}</span> {order.order_number}</p>
                            <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                </div>

                {/* Client & Shipping Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                            <p className="font-bold text-gray-900 uppercase">{order.reseller?.company_name || order.customer_name}</p>
                            {order.reseller?.ice && (
                                <p className="font-bold text-primary mt-1">ICE: {order.reseller.ice}</p>
                            )}
                            <p className="text-gray-600 mt-2">Contact: {order.reseller?.profile?.name || order.customer_name}</p>
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
                            <p className="text-gray-600 uppercase font-medium">{order.city}, {order.governorate}</p>
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
                        {order.order_items.map((item: any, i: number) => (
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
                            <span>{formatPrice(order.subtotal)} MAD</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Livraison</span>
                            <span>{formatPrice(order.shipping_cost)} MAD</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                            <span>TOTAL TTC</span>
                            <span>{formatPrice(order.total)} MAD</span>
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

        </div>
    )
}
