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
import { Loader2, ArrowRight, User, Lock, Mail, Phone, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <SignupContent />
        </Suspense>
    )
}

function SignupContent() {
    const { t, language, dir } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect')
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    })
    const isArabic = language === "ar"

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    },
                },
            })

            if (authError) throw authError

            if (authData.user) {
                // 2. Create customer record in public.customers table
                const { error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        id: authData.user.id, // Link to auth user
                        name: formData.name,
                        email: formData.email,
                        status: 'active',
                        total_orders: 0,
                        total_spent: 0
                    })

                if (customerError) {
                    console.error('Error creating customer profile:', customerError)
                    // Continue anyway as auth account is created
                }

                toast.success(isArabic ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!")
                
                const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
                router.push(loginUrl)
            }
        } catch (error: any) {
            console.error('Signup error:', error)
            toast.error(error.message || (isArabic ? "حدث خطأ أثناء التسجيل" : "Error creating account"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse delay-1000" />

            {/* Left Side */}
            <div className="hidden lg:flex w-1/2 relative p-12 flex-col justify-between z-10">
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
                    <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                        {isArabic ? "ابدأ رحلتك معنا" : "Start Your Journey"}
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {isArabic
                            ? "أنشئ حسابك الآن واحصل على تجربة تسوق فريدة مع أفضل ضمانات الجودة."
                            : "Create your account now and experience unique shopping with the best quality guarantees."}
                    </p>
                </div>
                <div className="relative z-10 text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Miravet.
                </div>
                <div className="absolute inset-4 glass-liquid bg-white/10 rounded-[3rem] -z-0" />
            </div>

            {/* Right Side */}
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
                                width={140}
                                height={40}
                                className={"h-10 w-auto"}
                            />
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight">
                            {isArabic ? "إنشاء حساب" : "Create Account"}
                        </h2>
                        <p className="text-muted-foreground">
                            {isArabic
                                ? "انضم إلينا اليوم"
                                : "Join us today"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{isArabic ? "الاسم الكامل" : "Full Name"}</Label>
                            <div className="relative">
                                <User className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={isArabic ? "الاسم" : "John Doe"}
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
                            <div className="relative">
                                <Mail className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">{isArabic ? "كلمة المرور" : "Password"}</Label>
                            <div className="relative">
                                <Lock className={`absolute top-3 w-5 h-5 text-muted-foreground ${isArabic ? "right-3" : "left-3"}`} />
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`pl-10 h-12 rounded-xl bg-white/50 border-primary/10 ${isArabic ? "pr-10 pl-3" : "pl-10 pr-3"}`}
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 mt-4" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isArabic ? "جاري الإنشاء..." : "Creating Account..."}
                                </>
                            ) : (
                                isArabic ? "إنشاء الحساب" : "Create Account"
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm pt-4">
                        <span className="text-muted-foreground">
                            {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}
                        </span>{" "}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            {isArabic ? "تسجيل الدخول" : "Sign in"}
                        </Link>
                    </div>

                    <div className="text-center text-sm pt-2">
                        <Link href="/reseller/register" className="font-semibold text-secondary-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                            {isArabic ? "التسجيل كموزع (شركات)" : "Register as Reseller (Business)"} <Briefcase className="w-4 h-4" />
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
