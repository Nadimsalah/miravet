"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function FaqPage() {
  const { t, language } = useLanguage()
  const isArabic = language === "ar"

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ]


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
            {isArabic ? "أسئلة شائعة" : "FAQ"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-3xl">
        <div className={isArabic ? "text-right mb-10 space-y-3" : "mb-10 space-y-3"}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("faq.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("faq.subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="glass rounded-2xl px-6 border-0 data-[state=open]:shadow-lg transition-all duration-300"
            >
              <AccordionTrigger className={isArabic ? "text-right text-base sm:text-lg font-medium py-5" : "text-base sm:text-lg font-medium py-5"}>
                {item.q}
              </AccordionTrigger>
              <AccordionContent className={isArabic ? "text-right text-sm sm:text-base text-muted-foreground pb-5 leading-relaxed" : "text-sm sm:text-base text-muted-foreground pb-5 leading-relaxed"}>
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  )
}

