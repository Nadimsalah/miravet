"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getRevenueAnalytics } from "@/lib/supabase-api"
import { Loader2 as Spinner } from "lucide-react"

export function RevenueChart() {
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getRevenueAnalytics()
                // Convert { name, revenue } to { name, total } for compatibility
                setChartData(data.map(d => ({ name: d.name, total: d.revenue })))
            } catch (error) {
                console.error("Failed to load revenue analytics:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    return (
        <div className="glass-strong rounded-3xl p-6 h-full flex flex-col min-h-[400px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">Revenue Over Time</h3>
                <p className="text-sm text-muted-foreground">Monthly revenue performance</p>
            </div>

            <div className="flex-1 w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white'
                                }}
                                itemStyle={{ color: 'white' }}
                                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        No analytics data available
                    </div>
                )}
            </div>
        </div>
    )
}
