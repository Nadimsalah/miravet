"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowRight, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { getCurrentUserRole } from "@/lib/supabase-api"

import { useSearchParams } from "next/navigation"

export default function LoginPage() {
    const { t, language, dir } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect')
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const isArabic = language === "ar"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const normalizedEmail = email.trim().toLowerCase()

            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            })

            if (error) {
                throw error
            }

            if (data.user) {
                toast.success(t("login.success"))

                // Fetch role for redirect
                const role = await getCurrentUserRole()

                const normalizedRole = role?.toUpperCase()

                if (redirect) {
                    router.push(redirect)
                } else if (normalizedRole === 'RESELLER' || normalizedRole === 'RESELLER_PENDING') {
                    router.push('/reseller/dashboard')
                } else if (normalizedRole === 'ADMIN') {
                    // Admins see the reseller dashboard by default
                    // They must use /admin/login for super admin access
                    router.push('/reseller/dashboard')
                } else if (normalizedRole === 'ACCOUNT_MANAGER') {
                    router.push('/manager/resellers')
                } else if (normalizedRole === 'DELIVERY_MAN') {
                    router.push('/logistique/dashboard')
                } else {
                    router.push('/')
                }
                router.refresh()
            }
        } catch (error: any) {
            const errorMessage = error.message || t("login.failed")
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex w-1/2 relative p-12 flex-col justify-between z-10">
                <div className="relative z-10">
                    <Link href="/">
                        <Image
                            src={"/logo.png"}
                            alt={"Miravet"}
                            width={240}
                            height={68}
                            className={"h-16 w-auto"}
                        />
                    </Link>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                        {t("login.welcome")}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {t("login.join_network")}
                    </p>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Miravet. {t("login.rights")}
                </div>

                {/* Glass Card Background for Left Side */}
                <div className="absolute inset-4 glass-liquid bg-white/10 rounded-[3rem] -z-0" />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10" dir={dir}>
                <div className="w-full max-w-md space-y-8 glass p-8 sm:p-10 rounded-3xl shadow-2xl relative">
                    <Link href="/" className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors">
                        <XIcon className="w-6 h-6" />
                    </Link>
                    <div className="text-center space-y-2">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <Image
                                src={"/logo.png"}
                                alt={"Miravet"}
                                width={180}
                                height={50}
                                className={"h-12 w-auto"}
                            />
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight">
                            {t("login.sign_in")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("login.enter_credentials")}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("login.email")}</Label>
                            <div className="relative">
                                <Mail className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("login.placeholder_email")}
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:ring-primary/20 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t("login.password")}</Label>
                                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                    {t("login.forgot_password")}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:ring-primary/20 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20" disabled={isLoading} suppressHydrationWarning>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t("login.loading")}
                                </>
                            ) : (
                                t("login.sign_in")
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background/50 backdrop-blur-md px-2 text-muted-foreground rounded-full">
                                {t("login.or")}
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-sm pt-2 space-y-4">
                        <Link 
                            href={redirect ? `/reseller/register?redirect=${encodeURIComponent(redirect)}` : "/reseller/register"} 
                            className="font-semibold text-secondary-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            {t("login.register_reseller")} <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
