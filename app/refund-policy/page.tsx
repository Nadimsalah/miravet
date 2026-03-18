"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function RefundPolicyPage() {
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
            {isArabic ? "سياسة الاسترجاع" : "Retours & Remboursements"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الاسترجاع لدى مرافيت – المغرب" : "Miravet Maroc – Politique de Retour et Remboursement"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "نحرص في مرافيت على تقديم منتجات بيطرية عالية الجودة. نظراً لطبيعة المنتجات (أدوية ولقاحات)، تطبق شروط خاصة للاسترجاع لضمان سلامة سلسلة التبريد والأمان الصحي."
              : "Chez Miravet, nous nous engageons à fournir des produits vétérinaires de haute qualité. En raison de la nature des produits (médicaments et vaccins), des conditions spécifiques de retour s'appliquent pour garantir l'intégrité de la chaîne du froid et la sécurité sanitaire."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "١. المنتجات غير القابلة للاسترجاع" : "1. Produits non retournables"}
          </h2>
          <p>
            {isArabic
              ? "لا يمكن استرجاع اللقاحات والأدوية التي تتطلب تبريداً بمجرد مغادرتها لمستودعاتنا أو تسليمها، وذلك لعدم إمكانية التأكد من ظروف تخزينها اللاحقة."
              : "Les vaccins et médicaments nécessitant une conservation au froid ne peuvent être retournés une fois livrés, car nous ne pouvons garantir le respect des conditions de stockage ultérieures."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. الأجهزة والمعدات" : "2. Matériel et Équipement"}
          </h2>
          <p>
            {isArabic
              ? "يمكن استرجاع أو استبدال المعدات الطبية والآلات في غضون 7 أيام إذا كان بها عيب مصنعي أو إذا كانت في تغليفها الأصلي ولم يتم فتحها."
              : "Le matériel médical et les équipements peuvent être retournés ou échangés sous 7 jours en cas de défaut de fabrication ou s'ils sont dans leur emballage d'origine non ouvert."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. مسطرة الاسترجاع" : "3. Procédure de retour"}
          </h2>
          <p>
            {isArabic
              ? "في حالة وجود خطأ في الطلبية من جانبنا، نتحمل كامل تكاليف التصحيح. يُرجى فحص الطلبية عند الاستلام والتبليغ عن أي خلل فوراً لمندوبنا أو عبر الهاتف."
              : "En cas d'erreur de préparation de notre part, nous prenons en charge l'intégralité des frais de correction. Veuillez vérifier votre commande à la réception et signaler toute anomalie immédiatement à notre livreur ou par téléphone."}
          </p>
        </div>
      </main>
    </div>
  )
}
