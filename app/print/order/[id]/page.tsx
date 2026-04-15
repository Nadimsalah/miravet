"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { getOrderById, type Order, getAdminSettings, getUserRole } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import { Edit, Printer, Info, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function OrderPrintPage() {
    const { id } = useParams()
    const searchParams = useSearchParams()
    const printType = searchParams.get('type') // 'invoice', 'bon_commande', 'delivery_note'
    const showSignature = searchParams.get('signature') !== 'false'
    
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [signatureUrl, setSignatureUrl] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [hasStartedEditing, setHasStartedEditing] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            if (!id) return
            const [orderData, settings, role] = await Promise.all([
                getOrderById(id as string),
                getAdminSettings(),
                getUserRole()
            ])
            setOrder(orderData)
            const roleNormalized = role?.toLowerCase() || null
            setUserRole(roleNormalized)
            if (settings.invoice_signature_url) {
                setSignatureUrl(settings.invoice_signature_url)
            }
            
            // SECURITY: Only enable editing if admin/manager AND edit param is true
            if (roleNormalized === 'admin' || roleNormalized === 'manager') {
                if (searchParams.get('edit') === 'true') {
                    setIsEditing(true)
                }
            } else {
                setIsEditing(false)
            }
            setLoading(false)
        }
        loadData()
    }, [id])

    useEffect(() => {
        if (!loading && order && !isEditing) {
            // Wait for images to potentially load
            const timer = setTimeout(() => {
                if (!hasStartedEditing) {
                    window.print()
                }
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [loading, order, isEditing, hasStartedEditing])

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium tracking-wide">Préparation du document...</div>
    if (!order) return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">Commande introuvable</div>

    const getDocTitle = () => {
        if (printType === 'invoice') return 'FACTURE'
        if (printType === 'delivery_note') return 'BON DE LIVRAISON'
        if (printType === 'bon_commande') return 'BON DE COMMANDE'
        return order.status === 'shipped' || order.status === 'delivered' ? 'BON DE LIVRAISON' : 'BON DE COMMANDE'
    }

    const editProps = {
        contentEditable: isEditing && (userRole === 'admin' || userRole === 'manager'),
        suppressContentEditableWarning: true,
        onInput: () => setHasStartedEditing(true)
    }

    const editClass = (extra = "") => {
        return `${extra} ${isEditing ? "hover:bg-yellow-50 outline-dotted outline-1 outline-yellow-400 p-0.5 rounded cursor-text transition-all" : ""}`.trim();
    }

    return (
        <div className="bg-white text-black min-h-screen font-sans">
            {/* Toolbar - Only visible on screen, for authorized users, AND in edit mode */}
            {['admin', 'manager'].includes(userRole || "") && isEditing && (
                <div className="sticky top-0 z-[100] bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4 print:hidden shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Edit className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm">Mode Impression & Édition</h2>
                            <p className="text-[10px] text-slate-400">Modifiez n'importe quel texte avant d'imprimer</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={() => setIsEditing(!isEditing)} 
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            className={`rounded-full border-white/20 ${isEditing ? 'bg-primary' : 'bg-transparent hover:bg-white/10'}`}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            {isEditing ? "Désactiver l'édition" : "Activer l'édition"}
                        </Button>
                        <Button 
                            onClick={() => window.print()} 
                            size="sm"
                            className="rounded-full bg-white text-slate-900 hover:bg-slate-100"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimer le PDF
                        </Button>
                    </div>
                </div>
            )}

            {isEditing && ['admin', 'manager'].includes(userRole || "") && (
                <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-xs text-yellow-800 font-medium print:hidden flex items-center justify-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    Cliquez directement sur un texte pour le modifier. Les modifications ne sont pas enregistrées en base de données.
                </div>
            )}

            <div className="p-8 max-w-[800px] mx-auto print:p-0 print:m-0">
            {/* Styles for consistent footer on every page */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        margin: 20mm 15mm 45mm 15mm;
                    }
                    .fixed-print-footer {
                        position: fixed;
                        bottom: -35mm;
                        left: 0;
                        right: 0;
                        height: 40mm;
                        display: flex !important;
                        justify-content: space-between;
                        align-items: flex-end;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 10px;
                        background: white;
                        width: 100%;
                    }
                }
                .fixed-print-footer {
                    display: none;
                }
            `}} />

            <div className="doc-content">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="space-y-4">
                        <img 
                            src="/logo.png" 
                            alt="Miravet Logo" 
                            className="h-16 w-auto object-contain"
                        />
                        <div className="text-[11px] leading-relaxed text-slate-600 text-left">
                            <p className={editClass("font-black text-slate-900 text-sm")} {...editProps}>MIRAVET SARL</p>
                            <p className={editClass()} {...editProps}>Grossisterie Vétérinaire Premium</p>
                            <p className={editClass()} {...editProps}>Casablanca, Maroc</p>
                            <p className={editClass("font-bold text-slate-800")} {...editProps}>ICE: 003125896000078</p>
                            <p className={editClass()} {...editProps}>Tél: +212 5 22 45 05 07</p>
                            <p className={editClass()} {...editProps}>Email: contact@miravet.ma</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className={editClass("text-2xl font-black text-gray-900 uppercase")} {...editProps}>
                            {getDocTitle()}
                        </h1>
                        <div className="text-sm mt-2">
                            <p><span className="font-bold">N°:</span> <span className={editClass()} {...editProps}>{order.order_number}</span></p>
                            <p><span className="font-bold">Date:</span> <span className={editClass()} {...editProps}>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span></p>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-12 mb-10">
                    <div className="text-left">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Client</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className={editClass("font-black text-lg text-slate-900 leading-tight mb-1 uppercase tracking-tight")} {...editProps}>
                                {order.reseller?.company_name || order.customer_name}
                            </p>
                            {order.reseller?.ice && (
                                <p className={editClass("font-bold text-emerald-600 text-xs mb-2")} {...editProps}>ICE: {order.reseller.ice}</p>
                            )}
                            <div className="text-xs text-slate-500 space-y-0.5">
                                <p className="font-bold text-slate-700">Contact: <span className={editClass()} {...editProps}>{order.reseller?.profile?.name || order.customer_name}</span></p>
                                <p className={editClass()} {...editProps}>{order.customer_email}</p>
                                <p className={editClass()} {...editProps}>{order.customer_phone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Adresse de Livraison</h3>
                        <div className="text-sm">
                            <p className={editClass("font-bold text-gray-900")} {...editProps}>{order.customer_name}</p>
                            <p className={editClass("text-gray-600")} {...editProps}>{order.address_line1}</p>
                            {order.address_line2 && <p className={editClass("text-gray-600")} {...editProps}>{order.address_line2}</p>}
                            <p className={editClass("text-gray-900 font-bold uppercase mt-1 tracking-tight")} {...editProps}>{order.city}, {order.governorate}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-slate-900">
                                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest">Désignation</th>
                                <th className="py-3 text-center text-[10px] font-black uppercase tracking-widest">Qté</th>
                                <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest">P.U (HT)</th>
                                <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest">Total (HT)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.order_items?.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="py-4 text-left">
                                        <p className={editClass("font-bold text-slate-900 text-sm")} {...editProps}>{item.product_title}</p>
                                        {item.variant_name && <p className={editClass("text-[10px] text-slate-400 font-medium")} {...editProps}>{item.variant_name}</p>}
                                    </td>
                                    <td className={editClass("py-4 text-center text-sm font-bold text-slate-700")} {...editProps}>{item.quantity}</td>
                                    <td className="py-4 text-right text-sm text-slate-600 font-medium whitespace-nowrap"><span className={editClass()} {...editProps}>{formatPrice(item.price)}</span> MAD</td>
                                    <td className="py-4 text-right text-sm font-black text-slate-900 whitespace-nowrap"><span className={editClass()} {...editProps}>{formatPrice(item.subtotal)}</span> MAD</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div className="w-64 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Total HT</span>
                            <span className={editClass()} {...editProps}>{formatPrice(order.subtotal)} MAD</span>
                        </div>
                        {order.shipping_cost > 0 && (
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Livraison</span>
                                <span className={editClass()} {...editProps}>{formatPrice(order.shipping_cost)} MAD</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-base font-black text-emerald-600 pt-3 border-t-2 border-slate-200">
                            <span className="whitespace-nowrap mr-4">TOTAL TTC</span>
                            <span className={editClass()} {...editProps}>{formatPrice(order.total)} MAD</span>
                        </div>
                    </div>
                </div>

                {/* Signatures (Screen only) */}
                {showSignature && (
                    <div className="flex justify-between items-end pt-12 border-t border-slate-100 print:hidden">
                        <div className="text-center w-64">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Visa Client</p>
                            <div className="h-24 w-full border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                        </div>
                        <div className="text-center w-64">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Direction Miravet</p>
                            <div className="h-24 w-full flex items-center justify-center relative">
                                {signatureUrl ? (
                                    <img 
                                        src={signatureUrl} 
                                        alt="Signature" 
                                        className="h-24 w-auto object-contain" 
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="h-24 w-full border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                                )}
                                <p className={editClass("absolute -bottom-4 left-0 right-0 text-[8px] text-slate-300 font-medium italic")} {...editProps}>Document certifié et généré par Miravet Premium</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Signatures for PDF/Print Pages */}
            {showSignature && (
                <div className="fixed-print-footer">
                    <div className="text-center w-64">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Visa Client</p>
                        <div className="h-24 w-full border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                    </div>
                    <div className="text-center w-64">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Direction Miravet</p>
                        <div className="h-24 w-full flex items-center justify-center relative">
                            {signatureUrl ? (
                                <img 
                                    src={signatureUrl} 
                                    alt="Signature" 
                                    className="h-24 w-auto object-contain" 
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div className="h-24 w-full border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                            )}
                            <p className={editClass("absolute -bottom-4 left-0 right-0 text-[8px] text-slate-300 font-medium italic")} {...editProps}>Document certifié et généré par Miravet Premium</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Print instructions for mobile */}
            <div className="mt-12 text-center text-[10px] text-slate-400 font-medium print:hidden italic border-t pt-4">
                Si la fenêtre d'impression ne s'affiche pas, utilisez le bouton d'impression de votre navigateur.
                <button 
                  onClick={() => window.print()}
                  className="ml-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-md font-bold"
                >
                    Réessayer
                </button>
            </div>
        </div>
    </div>
    )
}
