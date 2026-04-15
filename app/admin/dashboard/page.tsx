"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentOrders } from "@/components/admin/recent-orders"
import { Notifications } from "@/components/admin/notifications"
import { useLanguage } from "@/components/language-provider"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PushNotificationManager } from "@/components/admin/push-notification-manager"
import { AdminSearch } from "@/components/admin/admin-search"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUserRole } from "@/lib/supabase-api"

export default function AdminDashboard() {
    const { t } = useLanguage()
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const checkRole = async () => {
            // Check for PIN session first
            const hasPinSession = document.cookie.includes('admin_session=true')
            
            // If they have the PIN, they are authorized for Admin Area
            if (hasPinSession) {
                setAuthorized(true)
                return
            }

            // Fallback: If no PIN session, check if they are an ADMIN in DB
            // (But user wants PIN to be the primary entry, so if no PIN, we go to login)
            router.replace('/admin/login')
        }
        checkRole()
    }, [router])

    if (!authorized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <PushNotificationManager />
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 transition-all duration-300">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{t("dashboard.admin.title")}</h1>
                            <p className="text-xs text-muted-foreground">{t("dashboard.admin.overview")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Notifications />
                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Top Row: Stats (Spawn across all columns) */}
                    <DashboardStats />

                    {/* Bottom Row: Recent Orders (Full Width) */}
                    <div className="lg:col-span-4 min-h-[400px]">
                        <RecentOrders />
                    </div>
                </div>
            </main>
        </div>
    )
}
