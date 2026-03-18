"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Leaf, Heart, ShieldCheck, Globe2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export default function SustainabilityPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "font-[var(--font-almarai)]" : ""}`}>
      {/* Top Bar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isArabic ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}</span>
          </Link>
          <Link href="/" className="flex-shrink-0 relative group">
            <Image
              src="/logo.png"
              alt="Miravet"
              width={180}
              height={54}
              className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`space-y-6 ${isArabic ? "text-right" : ""}`}>
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-primary/80">
              {isArabic ? "التزامنا بالاستدامة • في المغرب" : "Notre Engagement • Au Maroc"}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {isArabic ? "الاستدامة والمسؤولية في مرافيت" : "Durabilité et Responsabilité chez Miravet"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isArabic
                ? "في مرافيت، نؤمن أن صحة الحيوان لا تنفصل عن صحة كوكبنا. منذ عام 1999، نلتزم بممارسات مسؤولة تضمن توفير أفضل العلاجات مع تقليل أثرنا البيئي."
                : "Chez Miravet, nous croyons que la santé animale est indissociable de la santé de notre planète. Depuis 1999, nous nous engageons dans des pratiques responsables pour garantir les meilleurs soins tout en minimisant notre impact environnemental."}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "من تحسين كفاءة التبريد في مخازننا إلى دعم المبادرات المحلية لصحة الحيوان، نحن فخورون بالمساهمة في بناء مستقبل مستدام للقطاع البيطري في المغرب."
                : "De l'optimisation de l'efficacité énergétique de nos entrepôts frigorifiques au soutien des initiatives locales pour la santé animale, nous sommes fiers de contribuer à un avenir durable pour le secteur vétérinaire au Maroc."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-[0.2em]">
                <Heart className="w-3.5 h-3.5" />
                {isArabic ? "رفاهية الحيوان" : "Bien-être Animal"}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isArabic ? "جودة مسؤولة" : "Qualité Responsable"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-5.jpg"
                  alt="Veterinary sustainability"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-6.jpg"
                  alt="Animal health care"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 translate-y-6 sm:translate-y-10">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-2.jpg"
                  alt="Professional storage"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-1.jpg"
                  alt="Local distribution"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className={`space-y-4 text-center max-w-2xl mx-auto ${isArabic ? "rtl" : ""}`}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isArabic ? "ركائزنا للعمل المسؤول" : "Nos Piliers pour une Action Responsable"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "نحن نضع الجودة والأخلاق في قلب كل ما نقوم به، لخدمة شركائنا البياطرة وحماية البيئة المغربية."
                : "Nous plaçons la qualité et l'éthique au cœur de tout ce que nous faisons, pour servir nos partenaires vétérinaires et protéger l'environnement marocain."}
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 sm:gap-8 ${isArabic ? "rtl" : ""}`}>
            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "لوجستيات صديقة للبيئة" : "Logistique Éco-efficiente"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نعمل باستمرار على تحسين مسارات التوزيع وكفاءة الشاحنات لتقليل انبعاثات الكربون مع ضمان وصول الأدوية واللقاحات في الوقت المناسب."
                  : "Nous optimisons constamment nos tournées de distribution et l'efficacité de nos camions pour réduire l'empreinte carbone tout en garantissant des délais de livraison minimaux."}
              </p>
            </div>

            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "إدارة النفايات الطبية" : "Gestion Responsable des Déchets"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نلتزم بدعم البياطرة في الإدارة المسؤولة للتغليف والنفايات المرتبطة بالمنتجات، لضمان حماية التربة والمياه الجوفية في المغرب."
                  : "Nous sensibilisons nos partenaires à la gestion responsable des emballages et déchets liés aux produits, afin de préserver les sols et les nappes phréatiques du Maroc."}
              </p>
            </div>

            <div className="glass-subtle rounded-3xl p-6 space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 text-primary">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground">
                {isArabic ? "دعم الصحة الواحدة (One Health)" : "Soutien à l'approche One Health"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isArabic
                  ? "نؤمن أن صحة البشر والحيوانات والبيئة مترابطة. استثماراتنا تركز على الوقاية من الأمراض الحيوانية لضمان سلامة الجميع في مجتمعنا."
                  : "Nous pensons que la santé des humains, des animaux et de l'environnement est liée. Nos investissements se concentrent sur la prévention pour assurer la sécurité de tous."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-secondary/5 border-t border-border/40">
        <div className={`container mx-auto px-4 max-w-3xl text-center space-y-6 ${isArabic ? "rtl" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "شاركنا في بناء مستقبل صحي" : "Participez avec nous à un avenir sain"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "من خلال اختيار مرافيت كمورد لكم، أنتم تختارون شريكاً يلتزم بالجودة والأمان والمسؤولية تجاه البيئة والمجتمع المغربي."
              : "En choisissant Miravet comme fournisseur, vous choisissez un partenaire qui s'engage pour la qualité, la sécurité et la responsabilité envers l'environnement et la société marocaine."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/#produits">{isArabic ? "اكتشف منتجاتنا" : "Découvrir nos Produits"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/our-story">{isArabic ? "قصتنا الكاملة" : "Notre Histoire"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
