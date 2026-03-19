"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrderById, type Order, getAdminSettings } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

export default function OrderPrintPage() {
    const { id } = useParams()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [signatureUrl, setSignatureUrl] = useState("")

    useEffect(() => {
        async function loadData() {
            if (!id) return
            const [orderData, settings] = await Promise.all([
                getOrderById(id as string),
                getAdminSettings()
            ])
            setOrder(orderData)
            if (settings.invoice_signature_url) {
                setSignatureUrl(settings.invoice_signature_url)
            }
            setLoading(false)
        }
        loadData()
    }, [id])

    useEffect(() => {
        if (!loading && order) {
            // Wait for images to potentially load
            const timer = setTimeout(() => {
                window.print()
                // On some mobiles, the print dialog blocks JS. 
                // We don't close the window automatically to let user see the invoice if print fails.
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [loading, order])

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium tracking-wide">Préparation du document...</div>
    if (!order) return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">Commande introuvable</div>

    return (
        <div className="bg-white text-black p-8 min-h-screen font-sans max-w-[800px] mx-auto">
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
                        BON DE COMMANDE
                    </h1>
                    <div className="text-sm mt-2">
                        <p><span className="font-bold">N°:</span> {order.order_number}</p>
                        <p><span className="font-bold">Date:</span> {new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Client</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="font-black text-lg text-slate-900 leading-tight mb-1">
                            {order.reseller?.company_name || order.customer_name}
                        </p>
                        {order.reseller?.ice && (
                            <p className="font-bold text-primary text-xs mb-2">ICE: {order.reseller.ice}</p>
                        )}
                        <div className="text-xs text-slate-500 space-y-0.5">
                            <p>{order.customer_email}</p>
                            <p>{order.customer_phone}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Adresse de Livraison</h3>
                    <div className="text-sm">
                        <p className="font-bold text-gray-900">{order.customer_name}</p>
                        <p className="text-gray-600">{order.address_line1}</p>
                        {order.address_line2 && <p className="text-gray-600">{order.address_line2}</p>}
                        <p className="text-gray-900 font-bold uppercase mt-1 tracking-tight">{order.city}, {order.governorate}</p>
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
                                <td className="py-4">
                                    <p className="font-bold text-slate-900 text-sm">{item.product_title}</p>
                                    {item.variant_name && <p className="text-[10px] text-slate-400 font-medium">{item.variant_name}</p>}
                                </td>
                                <td className="py-4 text-center text-sm font-bold text-slate-700">{item.quantity}</td>
                                <td className="py-4 text-right text-sm text-slate-600 font-medium">{formatPrice(item.price)} MAD</td>
                                <td className="py-4 text-right text-sm font-black text-slate-900">{formatPrice(item.subtotal)} MAD</td>
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
                        <span>{formatPrice(order.subtotal)} MAD</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Livraison</span>
                        <span>{formatPrice(order.shipping_cost)} MAD</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-emerald-600 pt-3 border-t-2 border-slate-200">
                        <span>TOTAL TTC</span>
                        <span>{formatPrice(order.total)} MAD</span>
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-12 border-t border-slate-100">
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
                                className="h-24 w-auto object-contain mix-blend-multiply" 
                            />
                        ) : (
                            <div className="h-24 w-full border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                        )}
                        <p className="absolute -bottom-4 left-0 right-0 text-[8px] text-slate-300 font-medium italic">Document certifié et généré par Miravet Premium</p>
                    </div>
                </div>
            </div>

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
    )
}
