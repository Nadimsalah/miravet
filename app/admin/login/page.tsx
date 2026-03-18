"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Delete, ArrowRight, Lock, Check } from "lucide-react"
import { verifyAdminPin } from "@/app/actions/auth"
import { toast } from "sonner"

export default function AdminLoginPage() {
    const [pin, setPin] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleNumClick = (num: string) => {
        if (pin.length < 12) {
            setPin((prev) => prev + num)
        }
    }

    const handleClear = () => {
        setPin((prev) => prev.slice(0, -1))
    }

    const handleSubmit = async () => {
        if (pin.length < 4) {
            toast.error("PIN too short")
            return
        }

        setIsLoading(true)

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 500))

        const isValid = await verifyAdminPin(pin)

        if (isValid) {
            // Set session cookie
            document.cookie = "admin_session=true; path=/; max-age=86400; SameSite=Strict" // 1 day expiry
            toast.success("Access Granted")
            router.push("/admin/dashboard")
        } else {
            toast.error("Invalid PIN")
            setPin("")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="glass-strong rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10">
                    {/* Header */}
                    <div className="text-center mb-8 space-y-4">
                        <div className="flex justify-center mb-6">
                            <Image
                                src="/logo.png"
                                alt="Miravet Logo"
                                width={180}
                                height={54}
                                className="w-32 h-32 object-contain hover:scale-105 transition-transform"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
                        <p className="text-sm text-muted-foreground">Enter your secure PIN</p>
                    </div>

                    {/* PIN Display */}
                    <div className="mb-8 flex justify-center gap-3 h-12 items-center">
                        {[...Array(Math.max(4, pin.length + (pin.length < 12 ? 1 : 0)))].map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${i < pin.length
                                    ? "bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                    : "bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumClick(num.toString())}
                                className="h-16 w-16 mx-auto rounded-full glass hover:bg-primary/10 hover:text-primary hover:scale-105 active:scale-95 transition-all text-xl font-bold flex items-center justify-center"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || pin.length < 4}
                            className="h-16 w-16 mx-auto rounded-full hover:bg-green-500/10 hover:text-green-500 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <Check className="w-8 h-8" />
                        </button>
                        <button
                            onClick={() => handleNumClick("0")}
                            className="h-16 w-16 mx-auto rounded-full glass hover:bg-primary/10 hover:text-primary hover:scale-105 active:scale-95 transition-all text-xl font-bold flex items-center justify-center"
                        >
                            0
                        </button>
                        <button
                            onClick={handleClear}
                            className="h-16 w-16 mx-auto rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all flex items-center justify-center"
                        >
                            <Delete className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground opacity-50">Authorized Personnel Only</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
