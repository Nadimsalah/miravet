"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, User, Building2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createContactMessage } from "@/lib/supabase-api"

type ContactType = "professional" | "partner" | "distributor"

export default function ContactPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [type, setType] = useState<ContactType>("professional")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const name = (formData.get("name") || "").toString().trim()
    const email = (formData.get("email") || "").toString().trim() || undefined
    const phone = (formData.get("phone") || "").toString().trim()
    const company = (formData.get("company") || "").toString().trim() || undefined
    const message = (formData.get("message") || "").toString().trim()

    if (!name || !phone || !message) return

    setLoading(true)
    const { error: apiError } = await createContactMessage({
      name,
      email,
      phone,
      company,
      type,
      message,
    })

    setLoading(false)

    if (apiError) {
      setError(apiError)
      return
    }

    setSubmitted(true)
    form.reset()
  }

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "font-[var(--font-almarai)]" : ""}`}>
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isArabic ? "العودة إلى الرئيسية" : "Back to Home"}</span>
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
            {isArabic ? "اتصل بنا" : "Contact Us"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-4xl">
        <div className={cn("space-y-6 mb-10", isArabic && "text-right")}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "يسعدنا التواصل معكم" : "Nous sommes à votre écoute"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            {isArabic
              ? "سواء كنتم من المهنيين في قطاع الصحة الحيوانية، شريكاً محتملاً، أو موزعاً مهتماً بخدمات مرافيت في المغرب، املأ النموذج التالي وسنقوم بالرد عليكم في أقرب وقت."
              : "Que vous soyez un professionnel de la santé animale, un partenaire potentiel ou un distributeur intéressé par les services de Miravet au Maroc, remplissez le formulaire et nous vous répondrons dans les plus brefs délais."}
          </p>

          {/* Type selector */}
          <div className={cn("inline-flex rounded-full bg-secondary/50 p-1 gap-1", isArabic && "flex-row-reverse")}>
            <button
              type="button"
              onClick={() => setType("professional")}
              className={cn(
                "px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                type === "professional"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {isArabic ? "مهني" : "Professionnel"}
            </button>
            <button
              type="button"
              onClick={() => setType("partner")}
              className={cn(
                "px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                type === "partner"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {isArabic ? "شريك" : "Partenaire"}
            </button>
            <button
              type="button"
              onClick={() => setType("distributor")}
              className={cn(
                "px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                type === "distributor"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {isArabic ? "موزع" : "Distributeur"}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn("glass-subtle rounded-3xl p-6 sm:p-8 space-y-5", isArabic && "text-right")}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "الاسم الكامل" : "Nom complet"}
              </label>
              <Input name="name" required placeholder={isArabic ? "الاسم الكامل هنا" : "Votre nom complet"} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "البريد الإلكتروني (اختياري)" : "Email (optionnel)"}
              </label>
              <Input name="email" type="email" placeholder="email@example.com" className="rounded-xl" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "رقم الهاتف" : "Téléphone"}
              </label>
              <Input name="phone" required placeholder="+212 ..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "اسم العيادة أو الشركة (اختياري)" : "Clinique ou Société (optionnel)"}
              </label>
              <Input name="company" placeholder={isArabic ? "اسم العيادة أو الشركة" : "Nom de votre établissement"} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic
                ? type === "professional"
                  ? "كيف يمكننا مساعدتكم؟"
                  : type === "partner"
                    ? "أخبرنا عن نوع الشراكة التي تبحث عنها"
                    : "أخبرنا عن خطتك للتوزيع في السوق المغربي"
                : type === "professional"
                  ? "Comment pouvons-nous vous aider ?"
                  : type === "partner"
                    ? "Quel type de partenariat souhaitez-vous ?"
                    : "Parlez-nous de vos projets de distribution au Maroc"}
            </label>
            <Textarea
              name="message"
              required
              rows={5}
              className="rounded-2xl resize-none"
              placeholder={
                isArabic
                  ? "اكتب رسالتك هنا..."
                  : "Votre message ici..."
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md">
              {isArabic
                ? "بإرسال هذه الرسالة، توافقون على تواصلنا معكم بخصوص طلبكم."
                : "En envoyant ce message, vous acceptez que nous vous contactions concernant votre demande."}
            </p>
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-8"
              disabled={loading}
            >
              {submitted
                ? (isArabic ? "تم الإرسال ✓" : "Envoyé ✓")
                : (isArabic
                    ? (loading ? "جاري الإرسال..." : "إرسال الرسالة")
                    : (loading ? "Envoi..." : "Envoyer le message"))}
            </Button>
          </div>

          {submitted && !error && (
            <p className="text-xs text-emerald-600 mt-2">
              {isArabic
                ? "تم إرسال رسالتكم بنجاح، وسنقوم بالتواصل معكم قريباً."
                : "Votre message a été envoyé avec succès. Nous vous contacterons bientôt."}
            </p>
          )}

          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </form>
      </main>
    </div>
  )
}
