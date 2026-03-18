"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Globe2, MapPin, Droplets, Sparkles, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function OurStoryPage() {
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
              width={142}
              height={40}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={`space-y-6 ${isArabic ? "text-right" : ""}`}>
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-primary/80">
              {isArabic ? "منذ 1999 • خبرة في الصحة الحيوانية" : "Since 1999 • Animal Health Expertise"}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {isArabic ? (
                <>
                  حكايتنا في <span className="text-primary">مرافيت</span>
                </>
              ) : (
                <>
                  Notre Histoire chez <span className="text-primary">Miravet</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isArabic
                ? "مرافيت هي شريككم الموثوق في توزيع المنتجات البيطرية منذ عام 1999. لأكثر من عقدين من الزمن، عملنا جنبًا إلى جنب مع المتخصصين والشركاء لتقديم أفضل الحلول الصحية لجميع أنواع الحيوانات."
                : "Miravet est votre partenaire de confiance dans la distribution de produits vétérinaires depuis 1999. Depuis plus de deux décennies, nous travaillons main dans la main avec des professionnels et des partenaires pour offrir les meilleures solutions de santé pour toutes les espèces animales."}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "اليوم نقدّم لك خلاصة خبرتنا بجودة لا تُضاهى. نحن على ثقة أن خدماتنا ستلبي تطلعاتكم، لأن الجودة والالتزام هما جوهر كل ما نقدّمه."
                : "Aujourd'hui, nous vous offrons le meilleur de notre expertise avec une qualité irréprochable. Nous sommes convaincus que nos services répondront à vos attentes, car la qualité et l'engagement sont au cœur de tout ce que nous faisons."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isArabic ? "خبرة بيطرية 100٪" : "100% Expertise Vétérinaire"}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5" />
                {isArabic ? "جودة مضمونة" : "Qualité Garantie"}
              </div>
            </div>
          </div>

          {/* Visual Story */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-1.jpg"
                  alt="Veterinary expertise"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-2.jpg"
                  alt="Animal health products"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6 translate-y-6 sm:translate-y-10">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10">
                <Image
                  src="/hero-showcase-3.jpg"
                  alt="Professional distribution"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <Image
                  src="/hero-showcase-4.jpg"
                  alt="Veterinary laboratory"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Story */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          <div className="grid md:grid-cols-[1fr_minmax(0,2fr)] gap-8 md:gap-12 items-start">
            <div className={`space-y-4 ${isArabic ? "text-right" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                <Globe2 className="w-3.5 h-3.5" />
                {isArabic ? "خبرة وطنية وثقة عالمية" : "Expertise Nationale & Confiance"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isArabic ? "جذورنا في المغرب وخبرتنا في خدمتكم" : "Ancrés au Maroc, au service de vos besoins"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "منذ عام 1999، تخصصت مرافيت في توفير أفضل المنتجات البيطرية في السوق المغربي. ما بدأ كطموح لتطوير القطاع تحول إلى شبكة توزيع رائدة تحترم معايير الصحة والسلامة."
                : "Depuis 1999, Miravet s'est spécialisée dans la fourniture des meilleurs produits vétérinaires sur le marché marocain. Ce qui a commencé comme une ambition de développer le secteur s'est transformé en un réseau de distribution de premier plan respectant les normes de santé et de sécurité."}
              </p>
            </div>
            <div className={`space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed ${isArabic ? "text-right" : ""}`}>
              <p>
                {isArabic
                  ? "لأكثر من عشرين عامًا، أتقنّا كل خطوة في رحلتنا – من اختيار الشركاء العالميين بعناية إلى ضمان سلسلة تبريد مثالية وتوزيع سريع. كل منتج هو ثمرة خبرة واحترام عميق لصحة الحيوان."
                  : "Depuis plus de vingt ans, nous maîtrisons chaque étape de notre parcours – de la sélection rigoureuse des partenaires internationaux à la garantie d'une chaîne de froid optimale et d'une distribution rapide. Chaque produit est le fruit d'une expertise et d'un profond respect pour la santé animale."}
              </p>
              <p>
                {isArabic
                  ? "شركاؤنا والأطباء البيطريون في المغرب هم قلب هذه الحكاية. معًا نضمن أن يحصل كل حيوان على الرعاية المناسبة من خلال منتجات فعالة وآمنة."
                  : "Nos partenaires et les vétérinaires au Maroc sont au cœur de cette histoire. Ensemble, nous veillons à ce que chaque animal reçoive les soins appropriés grâce à des produits efficaces et sûrs."}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-[minmax(0,2fr)_1fr] gap-8 md:gap-12 items-start">
            <div className={`space-y-4 ${isArabic ? "text-right" : ""}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold uppercase tracking-[0.2em]">
                <MapPin className="w-3.5 h-3.5" />
                {isArabic ? "حضور قوي في المغرب" : "Présence Partout au Maroc"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isArabic ? "مرافيت: ريادة في التوزيع البيطري" : "Miravet: Leader de la Distribution Vétérinaire"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "بعد سنوات من التميز، أصبحت مرافيت اليوم اسمًا يرمز للموثوقية في المغرب. تظل رسالتنا واحدة: أن نقدّم لكم توزيعًا بيطريًا أصيلاً، يناسب احتياجات العيادات والمربين."
                  : "Après des années d'excellence, Miravet est aujourd'hui un nom synonyme de fiabilité au Maroc. Notre mission reste la même : vous offrir une distribution vétérinaire authentique, adaptée aux besoins des cliniques et des éleveurs."}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic
                  ? "من الدار البيضاء إلى جميع أنحاء المملكة، نلتزم بتقديم منتجات عالية الجودة، حتى تحصلوا على النتائج الموثوقة التي صنعت اسم مرافيت منذ 1999."
                  : "De Casablanca à toutes les régions du Royaume, nous nous engageons à fournir des produits de haute qualité, afin que vous obteniez les résultats fiables qui font le nom de Miravet depuis 1999."}
              </p>
            </div>
            <div className={`glass-subtle rounded-3xl p-6 space-y-3 text-sm sm:text-base ${isArabic ? "text-right" : ""}`}>
              <p className="font-semibold text-foreground">
                {isArabic ? "وعدنا لكم" : "Notre Promesse"}
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  {isArabic
                    ? "• منتجات بيطرية مختارة من كبار الموردين العالميين"
                    : "• Produits vétérinaires sélectionnés chez les grands fournisseurs mondiaux"}
                </li>
                <li>
                  {isArabic
                    ? "• التزام تام بمعايير الجودة وسلامة سلسلة التبريد"
                    : "• Engagement total envers les normes de qualité et la sécurité de la chaîne du froid"}
                </li>
                <li>
                  {isArabic
                    ? "• دعم فني ولوجستي متخصص لجميع عملائنا"
                    : "• Support technique et logistique spécialisé pour tous nos clients"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-secondary/5 border-t border-border/40">
        <div className={`container mx-auto px-4 max-w-3xl text-center space-y-6 ${isArabic ? "rtl" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "شريككم في النجاح المهني" : "Votre Partenaire de Succès Professionnel"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "اكتشف مجموعتنا الواسعة من المنتجات البيطرية المصممة بعناية فائقة وخبرة تزيد عن 20 عامًا. من اللقاحات إلى المعدات المتطورة، كل منتج مصمم لدعم ممارستكم."
              : "Découvrez notre large gamme de produits vétérinaires conçus avec le plus grand soin et plus de 20 ans d'expertise. Des vaccins aux équipements de pointe, chaque produit est conçu pour soutenir votre pratique."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/#produits">{isArabic ? "تصفح المنتجات" : "Découvrir nos Produits"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/contact">{isArabic ? "اتصل بنا" : "Contactez-nous"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

