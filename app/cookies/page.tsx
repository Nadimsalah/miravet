"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function CookiesPage() {
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
            {isArabic ? "سياسة الكوكيز" : "Cookies"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الكوكيز لمرافيت – المغرب" : "Miravet Maroc – Politique des Cookies"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "يستخدم موقع مرافيت ملفات تعريف الارتباط (الكوكيز) لضمان عمل منصة الطلبات المهنية بأفضل شكل وتحسين تجربة المستخدم."
              : "Le site de Miravet utilise des cookies afin de garantir le bon fonctionnement de notre plateforme de commande professionnelle et d'améliorer votre expérience utilisateur."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. ما هي ملفات الكوكيز؟" : "1. Que sont les cookies ?"}
          </h2>
          <p>
            {isArabic
              ? "الكوكيز هي ملفات نصية صغيرة تُخزن على جهازك، وتساعدنا على تذكر تفضيلاتك المهنية وحماية جلسة دخولك."
              : "Les cookies sont de petits fichiers texte stockés sur votre terminal, nous permettant de mémoriser vos préférences professionnelles et de sécuriser votre session."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. استخدامنا للكوكيز" : "2. Notre utilisation"}
          </h2>
          <p>
            {isArabic
              ? "نستخدم الكوكيز الضرورية لتأمين حسابات البياطرة والشركاء، وحفظ محتويات سلة المشتريات، بالإضافة إلى كوكيز تحليلية لقياس أداء الموقع في المغرب."
              : "Nous utilisons des cookies essentiels pour sécuriser les comptes des vétérinaires et partenaires, mémoriser le panier, ainsi que des cookies analytiques pour mesurer les performances du site au Maroc."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. إدارة الكوكيز" : "3. Gestion des cookies"}
          </h2>
          <p>
            {isArabic
              ? "يمكنكم التحكم في ملفات الكوكيز عبر إعدادات المتصفح. يرجى العلم أن تعطيلها قد يؤثر على القدرة على إتمام الطلبات المهنية عبر الموقع."
              : "Vous pouvez paramétrer vos cookies via votre navigateur. Notez que leur désactivation peut limiter l'utilisation de certaines fonctionnalités, comme le passage de commandes."}
          </p>
        </div>
      </main>
    </div>
  )
}
