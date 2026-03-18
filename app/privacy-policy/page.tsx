"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function PrivacyPolicyPage() {
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
            {isArabic ? "سياسة الخصوصية" : "Confidentialité"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الخصوصية لمرافيت – المغرب" : "Miravet Maroc – Politique de Confidentialité"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "هذه السياسة تشرح كيفية قيام مرافيت المغرب بجمع واستخدام وحماية بياناتك الشخصية وفقًا للتشريعات المغربية الجاري بها العمل والمتعلقة بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي."
              : "Cette politique explique comment Miravet Maroc collecte, utilise et protège vos données personnelles conformément à la législation marocaine en vigueur (Loi 09-08) relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. البيانات التي نقوم بجمعها" : "1. Informations collectées"}
          </h2>
          <p>
            {isArabic
              ? "نقوم بجمع البيانات اللازمة لتنفيذ طلبياتكم المهنية: الاسم، اسم الشركة، رقم الهاتف، البريد الإلكتروني، وعنوان التسليم."
              : "Nous collectons les données nécessaires à l'exécution de vos commandes professionnelles : nom, nom de l'entreprise, numéro de téléphone, email et adresse de livraison."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. كيفية استخدام البيانات" : "2. Utilisation de vos données"}
          </h2>
          <p>
            {isArabic
              ? "نستخدم بياناتك حصرياً لمعالجة الطلبات، ضمان التوصيل في المغرب، والتواصل معكم بخصوص حسابكم المهني أو العروض الخاصة بالموزعين."
              : "Nous utilisons vos données exclusivement pour traiter les commandes, assurer la livraison au Maroc, et communiquer avec vous concernant votre compte professionnel ou les offres réservées aux distributeurs."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. حماية البيانات" : "3. Protection des données"}
          </h2>
          <p>
            {isArabic
              ? "تلتزم مرافيت بضمان أمن معطياتكم وتخزينها في بيئة آمنة تمنع أي وصول غير مصرح به."
              : "Miravet s'engage à garantir la sécurité de vos données et à les stocker dans un environnement sécurisé empêchant tout accès non autorisé."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٤. حقوقك" : "4. Vos droits"}
          </h2>
          <p>
            {isArabic
              ? "لديكم الحق في الوصول إلى بياناتكم الشخصية، تصحيحها، أو طلب حذفها وفقاً للقانون المعمول به، وذلك عبر مراسلتنا من خلال صفحة الاتصال."
              : "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles conformément à la loi en vigueur, en nous contactant via notre page de contact."}
          </p>
        </div>
      </main>
    </div>
  )
}
