"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
    const { t, language, dir } = useLanguage()

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden px-4" dir={dir}>
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/15 rounded-full blur-[120px] animate-pulse delay-1000" />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Branding */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <Image
                            src="/logo.png"
                            alt="Didali Store"
                            width={180}
                            height={50}
                            className="h-12 w-auto opacity-90 transition-opacity hover:opacity-100"
                        />
                    </Link>
                </div>

                {/* Big 404 Visual */}
                <div className="relative inline-block">
                    <h1 className="text-[12rem] sm:text-[16rem] font-black text-foreground/5 leading-none select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-primary to-primary/40 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/20 rotate-12 animate-float">
                            <Search className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                        {t('error.404.title')}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                        {t('error.404.description')}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link href="/" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                            <Home className="w-5 h-5 mr-2" />
                            {t('error.404.back_home')}
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto rounded-2xl h-14 px-8 text-lg font-bold bg-white/5 border-primary/10 hover:bg-primary/5 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        {language === 'fr' ? 'Retour' : language === 'ar' ? 'رجوع' : 'Go Back'}
                    </Button>
                </div>

                {/* Support Link */}
                <p className="text-sm text-muted-foreground pt-8">
                    {language === 'fr' ? 'Besoin d\'aide ?' : language === 'ar' ? 'هل تحتاج لمساعدة؟' : 'Need help?'}
                    <Link href="/contact" className="text-primary font-semibold hover:underline ml-2">
                        {language === 'fr' ? 'Contactez le support' : language === 'ar' ? 'اتصل بالدعم' : 'Contact support'}
                    </Link>
                </p>
            </div>
        </div>
    )
}
