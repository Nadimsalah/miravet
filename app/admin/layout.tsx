"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminNotifications } from "@/components/admin/admin-notifications"
import { PushNotificationManager } from "@/components/admin/push-notification-manager"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for admin session cookie
        const hasSession = document.cookie
            .split("; ")
            .find((row) => row.startsWith("admin_session="))
            ?.split("=")[1] === "true"

        if (!hasSession && pathname !== "/admin/login") {
            router.push("/admin/login")
        } else {
            setIsAuthorized(true)
        }
        setIsLoading(false)
    }, [pathname, router])

    if (isLoading) {
        return null // or a loading spinner
    }

    // If on login page, render children regardless of auth status to avoid redirect loops
    // If authenticated, render children
    // Otherwise render nothing (while redirecting)
    if (pathname === "/admin/login" || isAuthorized) {
        return (
            <div dir="ltr" className="min-h-screen bg-background">
                <AdminNotifications />
                <PushNotificationManager />
                {children}
            </div>
        )
    }

    return null
}
