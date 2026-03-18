"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, User, Building2, Upload } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { createCareerApplication } from "@/lib/supabase-api"

export default function CareersPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [summary, setSummary] = useState("")
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvName, setCvName] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)

    try {
      let cvFilePath: string | null = null

      if (cvFile) {
        const safeName = cvFile.name.replace(/\s+/g, "-").toLowerCase()
        const fileName = `careers/${Date.now()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, cvFile, { upsert: false })

        if (uploadError) {
          console.error("Error uploading CV:", uploadError)
          throw new Error(uploadError.message)
        }

        cvFilePath = fileName
      }

      const { error: createError } = await createCareerApplication({
        name,
        email,
        phone,
        role,
        summary,
        cvFilePath,
      })

      if (createError) {
        throw new Error(createError)
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error("Error submitting career application:", err)
      setError(
        isArabic
          ? "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى."
          : "Something went wrong while sending your application. Please try again."
      )
    } finally {
      setLoading(false)
    }
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
            {isArabic ? "الوظائف" : "Careers"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-4xl">
        <div className={cn("space-y-6 mb-10", isArabic && "text-right")}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "انضم إلى فريق مرافيت" : "Rejoignez l'équipe Miravet"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            {isArabic
              ? "نبحث دائماً عن مواهب شغوفة بقطاع الصحة الحيوانية، سواء للعمل في المبيعات، اللوجستيك، أو كمناديب طبيين في مختلف مناطق المغرب."
              : "Nous recherchons des talents passionnés par la santé animale, que ce soit pour des postes en commercial, logistique, ou comme délégués médicaux à travers le Maroc."}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isArabic
              ? "املأ النموذج التالي وأرفق سيرتك الذاتية (CV)، وسنتواصل معك في حال توفر فرصة مناسبة."
              : "Remplissez le formulaire et joignez votre CV. Notre équipe RH vous contactera si une opportunité correspond à votre profil."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn("glass-subtle rounded-3xl p-6 sm:p-8 space-y-5", isArabic && "text-right")}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "الاسم الكامل" : "Nom Complet"}
              </label>
              <Input
                required
                placeholder={isArabic ? "اكتب اسمك هنا" : "Votre nom complet"}
                className="rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "البريد الإلكتروني" : "Email"}
              </label>
              <Input
                required
                type="email"
                placeholder="email@example.com"
                className="rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "رقم الهاتف" : "Téléphone"}
              </label>
              <Input
                required
                placeholder="+212 ..."
                className="rounded-xl"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {isArabic ? "الوظيفة المطلوبة" : "Poste souhaité"}
              </label>
              <Input
                required
                placeholder={isArabic ? "مثال: مندوب طبي، لوجستيك" : "ex: Délégué médical, Logistique"}
                className="rounded-xl"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-primary" />
              {isArabic ? "السيرة الذاتية (CV)" : "CV / Résumé"}
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 text-xs sm:text-sm cursor-pointer hover:bg-secondary/90 transition-colors">
                <Upload className="w-4 h-4" />
                <span>{isArabic ? "اختيار ملف" : "Choisir un fichier"}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setCvFile(file)
                    setCvName(file ? file.name : null)
                  }}
                  required
                />
              </label>
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                {cvName || (isArabic ? "لم يتم اختيار ملف" : "Aucun fichier sélectionné")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? "نبذة قصيرة" : "Lettre de motivation / Message"}
            </label>
            <Textarea
              required
              rows={4}
              className="rounded-2xl resize-none"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={isArabic ? "اكتب باختصار لماذا ترغب في الانضمام إلينا..." : "Décrivez brièvement votre parcours et pourquoi Miravet..."}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md">
              {isArabic
                ? "بياناتكم محمية وفقاً للقانون المغربي 09-08."
                : "Vos données sont traitées en toute confidentialité conformément à la loi 09-08."}
            </p>
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-8"
              disabled={submitted || loading}
            >
              {submitted
                ? isArabic ? "تم الإرسال ✓" : "Envoyé ✓"
                : isArabic ? "إرسال الطلب" : "Envoyer la candidature"}
            </Button>
          </div>

          {submitted && !error && (
            <p className="mt-3 text-xs sm:text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              {isArabic
                ? "شكراً لكم! تم استلام طلبكم بنجاح."
                : "Merci ! Votre candidature a été transmise avec succès."}
            </p>
          )}

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </form>
      </main>
    </div>
  )
}
