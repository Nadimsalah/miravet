"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Newspaper, Sparkles, Droplets, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function PressPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Press"
      titleFr="Presse"
      subtitleEn="All press articles, media kits and brand assets will be available here very soon."
      subtitleFr="Tous les articles de presse, kits média et éléments de marque seront disponibles ici très bientôt."
    />
  )

  const openLightbox = (src: string, alt: string) => {
    setLightbox({ src, alt })
  }

  const closeLightbox = () => setLightbox(null)

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
              src="/logo.webp"
              alt="Miravet"
              width={142}
              height={40}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={isArabic ? "space-y-6 text-right" : "space-y-6"}>
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-primary/80">
              {isArabic ? "في الإعلام" : "In the Press"}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {isArabic ? "ديدالي في الصحافة العالمية" : "Miravet in the international press"}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              {isArabic
                ? "على مدار أكثر من 20 عامًا، ظهرت ديدالي في مجلات وصحف عالمية كمرجع في زيت الأرجان المغربي ومنتجات العناية الطبيعية."
                : "For more than 20 years, Miravet has been featured in international magazines and newspapers as a reference for Moroccan argan oil and natural beauty rituals."}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isArabic
                ? "الصور أدناه تُظهر بعض الصفحات من المجلات التي تحدثت عن قصتنا ومنتجاتنا."
                : "The spreads below show a selection of magazine pages that have highlighted our story and products."}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.2em]">
              <Newspaper className="w-3.5 h-3.5" />
              {isArabic ? "مذكور في مجلات رائدة" : "Featured in leading magazines"}
            </div>
          </div>

          {/* Press Collage */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <button
                type="button"
                onClick={() =>
                  openLightbox(
                    "/press-1.jpg",
                    isArabic ? "غلاف مجلة يتحدث عن منتجات الأرجان" : "Magazine cover featuring argan products",
                  )
                }
                className="block relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/10 focus:outline-none"
              >
                <img
                  src="/press-1.jpg"
                  alt={isArabic ? "غلاف مجلة يتحدث عن منتجات الأرجان" : "Magazine cover featuring argan products"}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  openLightbox(
                    "/press-2.jpg",
                    isArabic
                      ? "صفحة مجلة تعرض منتجات ديدالي"
                      : "Magazine spread showcasing Miravet products",
                  )
                }
                className="block relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10 focus:outline-none"
              >
                <img
                  src="/press-2.jpg"
                  alt={isArabic ? "صفحة مجلة تعرض منتجات ديدالي" : "Magazine spread showcasing Miravet products"}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6 translate-y-6 sm:translate-y-10">
              <button
                type="button"
                onClick={() =>
                  openLightbox(
                    "/press-3.jpg",
                    isArabic ? "مقال عن زيت الأرجان المغربي" : "Article about Moroccan argan oil",
                  )
                }
                className="block relative aspect-square rounded-3xl overflow-hidden shadow-xl shadow-black/10 focus:outline-none"
              >
                <img
                  src="/press-3.jpg"
                  alt={isArabic ? "مقال عن زيت الأرجان المغربي" : "Article about Moroccan argan oil"}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Text blocks */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-10">
          <div className={isArabic ? "space-y-4 text-right" : "space-y-4"}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isArabic ? "ثقة الصحافة تعكس أصالة العلامة" : "Media recognition of authentic care"}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              {isArabic
                ? "التغطية الصحفية التي حصلت عليها ديدالي في مجلات الجمال والصحة حول العالم تؤكد التزامنا بالجودة، الأصالة، والنتائج الملموسة."
                : "The press coverage Miravet has received in beauty and health magazines around the world underlines our commitment to quality, authenticity, and visible results."}
            </p>
          </div>

          <div className={isArabic ? "grid md:grid-cols-2 gap-8 text-right" : "grid md:grid-cols-2 gap-8"}>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {isArabic ? "اختيار خبراء الجمال" : "Chosen by beauty editors"}
              </h3>
              <p>
                {isArabic
                  ? "توصي العديد من المقالات بمنتجات ديدالي ضمن روتين العناية اليومية، خاصة زيت الأرجان الذي يقدَّم كعنصر أساسي للبشرة والشعر."
                  : "Many feature stories recommend Miravet products as part of a daily routine, with our argan oil often presented as an essential step for skin and hair."}
              </p>
            </div>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                {isArabic ? "تركيز على جودة زيت الأرجان" : "Focus on argan oil quality"}
              </h3>
              <p>
                {isArabic
                  ? "تسلّط المقالات الضوء على مصدر زيتنا من المغرب وطريقة استخلاصه البارد، بالإضافة إلى فوائده في الترطيب والحماية وتجديد البشرة."
                  : "Articles emphasize the Moroccan origin of our oil, cold‑press extraction, and its benefits for hydration, protection, and skin renewal."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-secondary/5 border-t border-border/40">
        <div className={`container mx-auto px-4 max-w-3xl text-center space-y-6 ${isArabic ? "rtl" : ""}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "اكتشفي ما تحدثت عنه المجلات" : "Discover what the magazines are talking about"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isArabic
              ? "تسوقي منتجات ديدالي المميزة وجربي بنفسك جودة زيت الأرجان المغربي التي لفتت أنظار الصحافة الدولية."
              : "Explore Miravet&apos;s signature products and experience the Moroccan argan oil quality that has caught the attention of international press."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/#shop">{isArabic ? "تسوقي الآن" : "Shop Now"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full bg-transparent">
              <Link href="/our-story">{isArabic ? "اقرئي قصتنا" : "Read Our Story"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Lightbox Overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-background/90 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label={isArabic ? "إغلاق الصورة" : "Close image"}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative w-full max-h-[80vh] flex items-center justify-center bg-black/80">
              <img
                src={lightbox.src}
                alt={lightbox.alt}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
