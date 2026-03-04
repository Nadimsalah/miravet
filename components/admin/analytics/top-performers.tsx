
"use client"

import { useLanguage } from "@/components/language-provider"
import { Users, Crown, Mail, ShoppingBag } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface TopClient {
    email: string
    name: string
    totalSpent: number
    ordersCount: number
}

interface TopReseller {
    id: string
    name: string
    totalSpent: number
    ordersCount: number
}

export function TopPerformers({
    type,
    data
}: {
    type: 'clients' | 'resellers',
    data: TopClient[] | TopReseller[]
}) {
    const { t, language } = useLanguage()
    const isClients = type === 'clients'

    return (
        <div className="glass-strong rounded-3xl p-6 relative overflow-hidden h-full">
            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br ${isClients ? 'from-purple-500/10 to-pink-500/10' : 'from-blue-500/10 to-cyan-500/10'} blur-3xl`} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${isClients ? 'from-purple-500/20 to-pink-500/20 text-purple-600' : 'from-blue-500/20 to-cyan-500/20 text-blue-600'}`}>
                        {isClients ? <Users className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">
                        {isClients ? t("admin.analytics.top_clients") : t("admin.analytics.top_resellers")}
                    </h3>
                </div>

                <div className="space-y-4">
                    {data.map((item: any, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/40 group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-500'}`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name || item.email}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <ShoppingBag className="w-3 h-3" />
                                            {item.ordersCount} {t("admin.analytics.orders")}
                                        </span>
                                        {isClients && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="max-w-[100px] truncate">{item.email}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                    {formatPrice(item.totalSpent)} MAD
                                </p>
                            </div>
                        </div>
                    ))}

                    {data.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t("admin.analytics.no_data")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
