"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowRight, User, Lock, Mail, Phone, Building2, FileText, Globe } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export default function ResellerRegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <ResellerRegisterContent />
        </Suspense>
    )
}

function ResellerRegisterContent() {
    const { t, language, dir } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect')
    const [isLoading, setIsLoading] = useState(false)
    const isArabic = language === "ar"

    // Form State
    const [formData, setFormData] = useState({
        companyName: "",
        ice: "",
        website: "",
        city: "",
        name: "", // Contact person
        phone: "",
        email: "",
        password: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const normalizedEmail = formData.email.trim().toLowerCase()
            console.log('[Register Debug] Attempting signup:', {
                email: normalizedEmail,
                passwordLength: formData.password.length
            })

            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        role: 'reseller_pending',
                        company_name: formData.companyName,
                        ice: formData.ice,
                        website: formData.website,
                        city: formData.city,
                        phone: formData.phone
                    },
                },
            })

            if (authError) throw authError

            // Note: Database trigger 'handle_new_user' now automatically creates
            // profiles, resellers, and customers records atomically.
            // No manual insert needed here to avoid RLS conflicts.

            toast.success(t("reseller.register.success_toast"))

            // Redirect to login while account awaits activation
            setTimeout(() => {
                const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
                router.push(loginUrl)
            }, 2000)

        } catch (error: any) {
            toast.error(error?.message || t("reseller.register.error_toast"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Left Side */}
            <div className="hidden lg:flex w-5/12 relative p-12 flex-col justify-between z-10">
                <div className="relative z-10">
                    <Link href="/">
                        <Image
                            src={"/logo.png"}
                            alt={"Miravet"}
                            width={178}
                            height={50}
                            className={"h-12 w-auto"}
                        />
                    </Link>
                </div>
                <div className="relative z-10 max-w-lg">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold text-sm mb-4 border border-primary/20">
                        {t("reseller.register.partner_program")}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                        {t("reseller.register.become_partner")}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        {t("reseller.register.partner_desc")}
                    </p>
                    <ul className="mt-8 space-y-4">
                        {[
                            t("reseller.register.feature.pricing"),
                            t("reseller.register.feature.manager"),
                            t("reseller.register.feature.shipping"),
                            t("reseller.register.feature.warranty")
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-foreground/80">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    {t("reseller.register.rights")}
                </div>
                <div className="absolute inset-4 glass-liquid bg-white/10 rounded-[3rem] -z-0" />
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-4 sm:p-8 z-10 overflow-y-auto" dir={dir}>
                <div className="w-full max-w-2xl glass p-8 sm:p-10 rounded-3xl shadow-2xl relative my-8">
                    <Link href="/" className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors">
                        <XIcon className="w-6 h-6" />
                    </Link>
                    <div className="mb-8">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <Image
                                src={"/logo.png"}
                                alt={"Miravet"}
                                width={140}
                                height={40}
                                className={"h-10 w-auto"}
                            />
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            {t("reseller.register.title")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("reseller.register.subtitle")}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Info */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{t("reseller.register.company_info")}</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">{t("reseller.register.company_name")}</Label>
                            <div className="relative">
                                <Building2 className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ice">{t("reseller.register.ice")}</Label>
                            <div className="relative">
                                <FileText className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="ice"
                                    value={formData.ice}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">{t("reseller.register.website")}</Label>
                            <div className="relative">
                                <Globe className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">{t("reseller.register.city")}</Label>
                            <div className="relative">
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl bg-white/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="md:col-span-2 pt-4">
                            <h3 className="text-lg font-semibold mb-4 border-b pb-2">{t("reseller.register.contact_person")}</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">{t("reseller.register.full_name")}</Label>
                            <div className="relative">
                                <User className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t("reseller.register.phone")}</Label>
                            <div className="relative">
                                <Phone className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email">{t("reseller.register.work_email")}</Label>
                            <div className="relative">
                                <Mail className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="password">{t("reseller.register.password")}</Label>
                            <div className="relative">
                                <Lock className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`h-12 rounded-xl bg-white/50 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <Button type="submit" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t("reseller.register.submitting")}
                                    </>
                                ) : (
                                    t("reseller.register.create_account")
                                )}
                            </Button>
                        </div>

                        <div className="md:col-span-2 text-center text-sm pt-2">
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                {t("reseller.register.already_have_account")}
                            </Link>
                        </div>

                    </form>
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
