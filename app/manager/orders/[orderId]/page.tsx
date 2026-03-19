"use client"

import { useState, useEffect } from "react"
import { updateOrderStatusAdmin, getOrderDetailsAdmin } from "@/app/actions/admin-orders"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    ChevronLeft,
    Clock,
    User,
    Package,
    ShoppingBag,
    History,
    MessageSquare,
    Save,
    Building2,
    MapPin,
    Phone,
    FileText,
    Search,
    Loader2,
    CheckCircle2
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function OrderDetailsPage() {
    const { orderId } = useParams()
    const router = useRouter()
    const { t } = useLanguage()

    // Flattened State
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [amId, setAmId] = useState<string | null>(null)
    const [printType, setPrintType] = useState<'bon_commande' | null>(null)



    useEffect(() => {
        if (orderId) loadData()
    }, [orderId])

    async function loadData() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setAmId(user?.id || null)

            // SERVER ACTION CALL
            const { success, data, error } = await getOrderDetailsAdmin(orderId as string)

            if (error || !success || !data) throw new Error(error || "Failed to fetch data")
            setOrder(data)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }



    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return
        const statusLower = newStatus.toLowerCase()
        if (statusLower === order.status) return
        await performStatusUpdate(statusLower)
    }

    const performStatusUpdate = async (statusLower: string, deliveryManId?: string) => {
        setIsUpdating(true)
        try {
            console.log(`[Client] Calling updateOrderStatusAdmin with: orderId=${order.id}, status=${statusLower}, amId=${amId}, deliveryManId=${deliveryManId}`)
            const { success, error } = await updateOrderStatusAdmin(order.id, statusLower, amId || undefined, deliveryManId)

            if (error || !success) throw new Error(error || "Update failed")

            // Format status for toast
            const statusKey = `status.${statusLower}`
            toast.success(t("manager.order_details.status_updated").replace("{status}", t(statusKey)))
            setOrder((prev: any) => ({
                ...prev,
                status: statusLower,
                delivery_man_id: deliveryManId || prev.delivery_man_id,
                auditLogs: [{
                    id: `temp-${Date.now()}`,
                    new_status: statusLower,
                    created_at: new Date().toISOString(),
                    changed_by_user: { name: t("manager.order_details.you_just_now") }
                }, ...prev.auditLogs]
            }))

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(false)
        }
    }



    const handlePrint = () => {
        window.open(`/print/order/${order.id}`, '_blank')
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">{t("manager.order_details.loading")}</p>
        </div>
    )

    if (!order) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold text-xl">{t("manager.order_details.not_found")}</div>

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans print:bg-white pb-20">


            {/* Modern Clean Navbar */}
            <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 flex items-center justify-between sticky top-0 z-30 supports-[backdrop-filter]:bg-white/60 print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <span className="font-bold text-slate-900">{t("manager.order_details.order_number").replace("{number}", order.order_number)}</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-mono text-xs hidden sm:flex">
                        {new Date(order.created_at).toLocaleDateString()}
                    </Badge>
                </div>

                {/* Bon de Commande Button - Visible on all steps except 'pending' or 'cancelled' */}
                {order.status.toLowerCase() !== 'pending' && order.status.toLowerCase() !== 'cancelled' && (
                    <Button onClick={handlePrint} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-full text-xs font-bold shadow-lg shadow-primary/20">
                        <FileText className="w-3.5 h-3.5 mr-2" />
                        {t("manager.order_details.bon_de_commande")}
                    </Button>
                )}
            </nav >

            <main className="max-w-7xl mx-auto p-6 md:p-8 print:p-0 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* HERO SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Status Card */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700" />

                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("manager.order_details.company_customer")}</span>
                            </div>

                            {/* COMPANY NAME DISPLAY */}
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                                {order.display_company_name}
                            </h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-slate-400" />
                                {t("manager.order_details.contact")} <span className="text-slate-900 font-bold">{order.display_reseller_name}</span>
                            </p>
                            {/* Phone Number Display */}
                            {(order.reseller?.profile?.phone || order.reseller?.phone || order.customer_phone) && (
                                <p className="text-slate-500 font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-900 font-bold">
                                        {order.reseller?.profile?.phone || order.reseller?.phone || order.customer_phone}
                                    </span>
                                </p>
                            )}

                            {/* DEBUG info to diagnose NULL reseller_id */}
                            <div className="mt-4 p-2 bg-slate-100/50 rounded text-[10px] text-slate-400 font-mono">
                                {t("manager.order_details.ref")} {order.id.slice(0, 8)} | {t("manager.order_details.rid")} {order.reseller_id || `NULL (${t("manager.order_details.direct_order")})`}
                            </div>

                            <div className="h-px w-full bg-slate-100 my-6" />

                            <div className="flex flex-wrap gap-2">
                                {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(s)}
                                        disabled={isUpdating}
                                        className={`
                                            px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200
                                            ${order.status === s
                                                ? 'bg-slate-900 text-white shadow-lg scale-105'
                                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }
                                        `}
                                    >
                                        {t(`status.${s}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col justify-center gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">{t("manager.order_details.current_status")}</span>
                            <Badge className={`capitalize px-3 py-1 rounded-lg text-sm ${order.status === 'delivered' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                order.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}>
                                {t(`status.${order.status}`)}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">{t("manager.order_details.total")}</span>
                            </div>
                            <span className="text-xl font-black text-slate-900">MAD {formatPrice(order.total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("manager.order_details.location")}</span>
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {order.city}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-slate-900">{t("manager.order_details.items_ordered")}</h3>
                                <Badge variant="outline" className="rounded-full">{t("manager.order_details.items_count").replace("{count}", order.items.length.toString())}</Badge>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 border border-slate-200/60 overflow-hidden relative group">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold bg-slate-50">{t("manager.order_details.img")}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 truncate text-base mb-1">{item.product_title}</h4>
                                            <p className="text-sm text-slate-500 mb-1">{item.variant_name || t("manager.order_details.standard_option")}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-xs">
                                                    {t("manager.order_details.qty")} {item.quantity}
                                                </Badge>
                                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">📍 {item.warehouse_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-slate-900">MAD {formatPrice(item.subtotal)}</p>
                                            <p className="text-xs text-slate-400 font-medium">MAD {formatPrice(item.final_price)} {t("manager.order_details.each")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Stats & Notes */}
                    <div className="space-y-6">




                        {/* Audit Log */}
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <History className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-slate-900">{t("manager.order_details.timeline")}</h3>
                            </div>
                            <div className="relative pl-2 border-l border-slate-100 space-y-6">
                                {order.auditLogs && order.auditLogs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative pl-6">
                                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-primary' : 'bg-slate-200'}`} />
                                        <p className="text-xs font-bold text-slate-900 capitalize mb-0.5">{t(`status.${log.new_status}`)}</p>
                                        {log.new_status === 'cancelled' && order.delivery_failed_reason && (
                                            <p className="text-[10px] text-red-500 font-medium mb-0.5">
                                                {t("manager.order_details.reason")} {order.delivery_failed_reason}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {t("manager.order_details.by")} {log.changed_by_user?.name || t("manager.order_details.system")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>




            </main>

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
                        <h1 className="text-2xl font-black text-gray-900 uppercase">{t("print.bon_de_commande")}</h1>
                        <div className="text-sm mt-2">
                            <p><span className="font-bold">{t("print.order_number")}</span> {order.order_number}</p>
                            <p><span className="font-bold">{t("print.date")}</span> {new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                </div>

                {/* Client & Shipping Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t("print.client")}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                            <p className="font-bold text-gray-900">{order.display_company_name}</p>
                            <p className="text-gray-600">{t("print.attn")} {order.display_reseller_name}</p>
                            <p className="text-gray-600">{order.customer_email}</p>
                            <p className="text-gray-600">{order.customer_phone}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-right">{t("print.shipping_address")}</h3>
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
                            <th className="py-2 text-left text-xs font-bold uppercase tracking-wider">{t("print.product")}</th>
                            <th className="py-2 text-center text-xs font-bold uppercase tracking-wider">{t("print.quantity")}</th>
                            <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">{t("print.unit_price")}</th>
                            <th className="py-2 text-right text-xs font-bold uppercase tracking-wider">{t("print.total")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item: any, i: number) => (
                            <tr key={i}>
                                <td className="py-3 text-sm">
                                    <p className="font-bold text-gray-900">{item.product_title}</p>
                                    <p className="text-xs text-gray-500">{item.variant_name}</p>
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
                            <span>{t("print.subtotal")}</span>
                            <span>{formatPrice(order.subtotal)} MAD</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{t("print.shipping")}</span>
                            <span>{formatPrice(order.shipping_cost)} MAD</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>{t("print.total")}</span>
                            <span>{formatPrice(order.total)} MAD</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="flex justify-between items-end pt-8 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                        <p>{t("print.footer_generated")}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t("print.signature")}</p>
                        <div className="h-16 w-32 border border-gray-200 rounded-lg bg-gray-50"></div>
                    </div>
                </div>
            </div>

        </div>
    )
}
