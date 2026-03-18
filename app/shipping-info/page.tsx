"use client"

import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function ShippingInfoPage() {
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
            {isArabic ? "معلومات الشحن" : "Livraison"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${isArabic ? "text-right" : ""}`}>
          {isArabic ? "سياسة الشحن لدى مرافيت – المغرب" : "Miravet Maroc – Informations de Livraison"}
        </h1>
        <div className={`space-y-5 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
          <p>
            {isArabic
              ? "نقدم خدمة توصيل احترافية للطلبات داخل المملكة المغربية من خلال أسطولنا الخاص وشركاء شحن موثوقين، مع ضمان احترام سلسلة التبريد للمنتجات الحساسة."
              : "Nous assurons une livraison professionnelle à travers tout le Royaume du Maroc, via notre propre flotte et des partenaires logistiques de confiance, en garantissant le respect strict de la chaîne du froid pour les produits sensibles."}
          </p>

          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            {isArabic ? "١. مدة التوصيل" : "1. Délais de livraison"}
          </h2>
          <p>
            {isArabic
              ? "يتم توصيل الطلبات داخل الدار البيضاء والنواحي خلال ٢٤ إلى ٤٨ ساعة عمل. بالنسبة لباقي المدن المغربية، تتراوح المدة بين ٢ إلى ٤ أيام عمل حسب المنطقة."
              : "Les commandes à Casablanca et ses environs sont livrées sous 24h à 48h ouvrables. Pour les autres villes du Maroc, les délais varient de 2 à 4 jours ouvrables selon la zone géographique."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٢. شروط الشحن والأمان" : "2. Conditions de transport et sécurité"}
          </h2>
          <p>
            {isArabic
              ? "بصفتنا متخصصين في المنتجات البيطرية، نولي أهمية قصوى لنقل اللقاحات والأدوية في ظروف حرارية مثالية لضمان فعاليتها عند وصولها إليكم."
              : "En tant que spécialistes vétérinaires, nous accordons une importance capitale au transport des vaccins et médicaments dans des conditions thermiques optimales pour garantir leur efficacité à réception."}
          </p>

          <h2 className="font-semibold text-foreground">
            {isArabic ? "٣. رسوم التوصيل" : "3. Frais de livraison"}
          </h2>
          <p>
            {isArabic
              ? "تختلف رسوم التوصيل بناءً على حجم الطلبية والوجهة. كجزء من عروضنا المهنية، نقدم توصيلاً مجانياً للطلبيات التي تتجاوز مبلغاً معيناً كما هو موضح في سلة المشتريات."
              : "Les frais de livraison varient selon l'importance de la commande et la destination. Dans le cadre de nos offres professionnelles, nous proposons la gratuité de livraison pour les commandes dépassant un certain seuil, comme indiqué dans votre panier."}
          </p>
        </div>
      </main>
    </div>
  )
}
