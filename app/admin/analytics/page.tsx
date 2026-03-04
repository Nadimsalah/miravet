"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    TrendingUp,
    Users,
    CreditCard,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Globe,
    Briefcase
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts"
import { getDashboardStats, getRevenueAnalytics, getAdvancedAnalytics } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { TopPerformers } from "@/components/admin/analytics/top-performers"
import { ProductInsights } from "@/components/admin/analytics/product-insights"

export default function AnalyticsPage() {
    const { t } = useLanguage()
    const [stats, setStats] = useState<any>(null)
    const [revenueData, setRevenueData] = useState<any[]>([])
    const [advancedStats, setAdvancedStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadAnalytics() {
            setLoading(true)
            const [statsData, revenue, advanced] = await Promise.all([
                getDashboardStats(),
                getRevenueAnalytics(),
                getAdvancedAnalytics()
            ])
            setStats(statsData)
            setRevenueData(revenue)
            setAdvancedStats(advanced)
            setLoading(false)
        }
        loadAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">{t("admin.analytics.loading")}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 text-gray-900">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{t("admin.analytics.title")}</h1>
                            <p className="text-xs text-muted-foreground">{t("admin.analytics.subtitle")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-full h-9 bg-background/50 border-white/10 text-gray-700">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Button>
                    </div>
                </header>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title={t("admin.analytics.total_revenue")}
                        value={`${formatPrice(stats?.totalRevenue || 0)} MAD`}
                        change="+12.5%"
                        trend="up"
                        icon={CreditCard}
                        color="text-primary bg-primary/10"
                    />
                    <StatCard
                        title={t("admin.analytics.total_orders")}
                        value={stats?.totalOrders?.toString()}
                        change="+8.2%"
                        trend="up"
                        icon={ShoppingBag}
                        color="text-blue-500 bg-blue-500/10"
                    />
                    <StatCard
                        title={t("admin.analytics.account_managers")}
                        value={advancedStats?.accountManagerCount?.toString() || "0"}
                        change="Active"
                        trend="up"
                        icon={Briefcase}
                        color="text-purple-500 bg-purple-500/10"
                    />
                    <StatCard
                        title={t("admin.analytics.avg_order_value")}
                        value={`${formatPrice(stats?.totalRevenue / (stats?.totalOrders || 1))} MAD`}
                        change="+5.2%"
                        trend="up"
                        icon={TrendingUp}
                        color="text-orange-500 bg-orange-500/10"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trends */}
                    <div className="lg:col-span-2 glass-strong rounded-3xl p-6 h-[450px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">{t("admin.analytics.revenue_over_time")}</h3>
                        </div>
                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(val) => formatPrice(val)}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#1f2937', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Clients */}
                    <div className="h-[450px]">
                        <TopPerformers type="clients" data={advancedStats?.topClients || []} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Top Resellers */}
                    <div className="h-[450px]">
                        <TopPerformers type="resellers" data={advancedStats?.topResellers || []} />
                    </div>

                    {/* Product Insights (Low Stock & Sales) */}
                    <div className="lg:col-span-2 h-[450px]">
                        <ProductInsights
                            lowStock={advancedStats?.lowStockProducts || []}
                            lowSales={advancedStats?.lowSalesProducts || []}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}

function StatCard({ title, value, change, icon: Icon, trend, color }: any) {
    return (
        <div className="glass-strong rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors pointer-events-none opacity-20 ${color?.split(' ')[1] || 'bg-gray-100'}`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-xl ${color || 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <BadgeTrend value={change} trend={trend} />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{title}</p>
                    <h3 className="text-xl font-bold text-gray-900">{value}</h3>
                </div>
            </div>
        </div>
    )
}

function BadgeTrend({ value, trend }: any) {
    return (
        <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
            {value}
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : <ArrowDownRight className="w-3 h-3 ml-0.5" />}
        </span>
    )
}
