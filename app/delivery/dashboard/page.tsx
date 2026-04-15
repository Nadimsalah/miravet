"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DeliveryRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/logistique/dashboard')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Redirection vers le tableau de bord logistique...</p>
        </div>
    )
}
