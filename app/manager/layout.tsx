"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AccountManagerSidebar } from "@/components/account-manager/am-sidebar"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AccountManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const user = session?.user

                if (!user) {
                    router.push("/manager/login")
                    return
                }

                // Verify role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role !== 'ACCOUNT_MANAGER' && profile?.role !== 'ADMIN') {
                    router.push("/")
                    return
                }

                setIsAuthorized(true)
            } catch (error) {
                console.error("Auth check error:", error)
                router.push("/login")
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [pathname, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (isAuthorized) {
        return (
            <div dir="ltr" className="min-h-screen bg-background relative overflow-hidden">
                {/* Background gradients */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen" />
                </div>

                <AccountManagerSidebar />

                <main className="lg:pl-72 min-h-screen relative z-10 transition-all duration-300">
                    {children}
                </main>
            </div>
        )
    }

    return null
}
