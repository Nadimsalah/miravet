"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { createWhatsappSubscription } from "@/lib/supabase-api"

const COUNTRY_CODES = (t: (k: string) => string) => [
    { code: "+212", country: t('language') === 'ar' ? "المغرب" : "Morocco", flag: "🇲🇦" },
    { code: "+20", country: t('language') === 'ar' ? "مصر" : "Egypt", flag: "🇪🇬" },
    { code: "+966", country: t('language') === 'ar' ? "السعودية" : "Saudi Arabia", flag: "🇸🇦" },
    { code: "+971", country: t('language') === 'ar' ? "الإمارات" : "UAE", flag: "🇦🇪" },
    { code: "+965", country: t('language') === 'ar' ? "الكويت" : "Kuwait", flag: "🇰🇼" },
    { code: "+974", country: t('language') === 'ar' ? "قطر" : "Qatar", flag: "🇶🇦" },
    { code: "+44", country: t('language') === 'ar' ? "بريطانيا" : "UK", flag: "🇬🇧" },
    { code: "+1", country: t('language') === 'ar' ? "أمريكا" : "USA", flag: "🇺🇸" },
    { code: "+33", country: t('language') === 'ar' ? "فرنسا" : "France", flag: "🇫🇷" },
    { code: "+49", country: t('language') === 'ar' ? "ألمانيا" : "Germany", flag: "🇩🇪" },
]

export function WhatsAppSubscription() {
    const { t } = useLanguage()
    const [submitted, setSubmitted] = useState(false)
    const [countryCode, setCountryCode] = useState("+212")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone) return

        setLoading(true)
        const fullPhone = `${countryCode} ${phone.trim()}`
        const { error } = await createWhatsappSubscription({
            countryCode,
            phone: fullPhone,
        })

        if (error) {
            console.error(error)
            setLoading(false)
            // keep UI simple: just stop loading, you could add toast later
            return
        }

        setLoading(false)
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="glass rounded-[2rem] p-8 sm:p-12 text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5" />
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">{t('whatsapp.success_title')}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto text-lg">
                            {t('whatsapp.success_desc')}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSubmitted(false)
                            setPhone("")
                        }}
                        className="mt-4 rounded-full"
                    >
                        {t('whatsapp.register_another')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="glass rounded-[2rem] p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <div className="relative space-y-8 z-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-700 font-medium text-sm mb-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{t('whatsapp.verified_updates')}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('whatsapp.title')}</h2>
                    <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
                        {t('whatsapp.desc')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <div className="flex rounded-full shadow-sm bg-background/80 border border-input focus-within:ring-2 focus-within:ring-green-500/20 transition-all overflow-hidden h-14 w-full group/input" dir="ltr">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger 
                                className="w-[110px] sm:w-[130px] border-0 bg-transparent focus:ring-0 h-full rounded-s-full px-4 gap-2 hover:bg-muted/50 transition-colors"
                                suppressHydrationWarning
                            >
                                <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                                {COUNTRY_CODES(t).map((country) => (
                                    <SelectItem key={country.code} value={country.code}>
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">{country.flag}</span>
                                            <span className="font-medium text-muted-foreground">{country.code}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="w-px bg-border my-3" />
                        <Input
                            type="tel"
                            placeholder={t('whatsapp.placeholder')}
                            className="border-0 focus-visible:ring-0 bg-transparent h-full text-base px-4 rounded-e-full"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="rounded-full h-14 px-8 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all whitespace-nowrap"
                    >
                        {loading ? t('whatsapp.processing') : t('whatsapp.button')}
                    </Button>
                </form>

                <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto">
                    {t('whatsapp.disclaimer')}
                </p>
            </div>
        </div>
    )
}
