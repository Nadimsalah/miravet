"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function TermsPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

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
            {isArabic ? "شروط الخدمة" : "Conditions Générales"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "شروط وأحكام استخدام مرافيت – المغرب" : "Miravet Maroc – Conditions Générales de Vente et d'Utilisation"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "باستخدامك لموقع مرافيت في المغرب أو إجرائك لأي طلب شراء، فأنت توافق على الشروط والأحكام الموضحة أدناه، والمطبقة وفقًا للقانون المغربي."
              : "En accédant au site web de Miravet au Maroc ou en passant une commande, vous acceptez les conditions générales ci-dessous, appliquées conformément à la législation marocaine."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. النطاق المهني" : "1. Portée Professionnelle"}
          </h2>
          <p>
            {isArabic
              ? "هذا الموقع مخصص للمهنيين في قطاع الصحة الحيوانية (بياطرة، عيادات، مربين معتمدين). مرافيت تحتفظ بالحق في طلب إثبات الصفة المهنية قبل تفعيل أي حساب ريزيلر."
              : "Ce site est destiné aux professionnels du secteur de la santé animale (vétérinaires, cliniques, éleveurs agréés). Miravet se réserve le droit de demander une preuve de statut professionnel avant toute validation de compte revendeur."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. الأسعار والدفع" : "2. Prix et Paiement"}
          </h2>
          <p>
            {isArabic
              ? "جميع الأسعار معروضة بالدرهم المغربي. بالنسبة للمهنيين، الأسعار معروضة خارج الرسوم (HT) أو شاملة للرسوم (TTC) كما هو موضح. يتم الدفع وفقاً للوسائل المعتمدة (تحويل، شيك، أو نقداً عند التسليم)."
              : "Tous les prix sont en Dirhams Marocains (MAD). Pour les professionnels, les prix sont affichés Hors Taxes (HT) ou Toutes Taxes Comprises (TTC) selon l'indication. Le paiement s'effectue selon les modes convenus (virement, chèque, ou espèces à la livraison)."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. المسؤولية والمنتجات" : "3. Responsabilité et Produits"}
          </h2>
          <p>
            {isArabic
              ? "مرافيت تضمن أصالة وجودة المنتجات الموزعة. يجب استخدام الأدوية واللقاحات تحت إشراف طبي بيطري ووفقاً للنشرات المرفقة."
              : "Miravet garantit l'authenticité et la qualité des produits distribués. Les médicaments et vaccins doivent être utilisés sous supervision vétérinaire et conformément aux notices fournies."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٤. القانون الواجب التطبيق" : "4. Loi Applicable"}
          </h2>
          <p>
            {isArabic
              ? "تخضع هذه الشروط للقانون المغربي. في حالة وجود نزاع، يتم اللجوء إلى المحكمة التجارية بالدار البيضاء."
              : "Les présentes conditions sont régies par le droit marocain. En cas de litige, compétence est attribuée au Tribunal de Commerce de Casablanca."}
          </p>
        </div>
      </main>
    </div>
  )
}
