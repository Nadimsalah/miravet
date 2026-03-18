"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

interface ComingSoonPageProps {
  titleEn: string
  titleFr?: string
  subtitleEn?: string
  subtitleFr?: string
}

export function ComingSoonPage({
  titleEn,
  titleFr,
  subtitleEn = "We’re putting the final touches on this experience. Check back very soon.",
  subtitleFr = "Nous finalisons encore cette expérience. Revenez très bientôt.",
}: ComingSoonPageProps) {
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const isFrench = language === "fr"

  const title = isFrench ? titleFr || titleEn : titleEn
  const subtitle = isFrench ? subtitleFr : subtitleEn

  return (
    <div className={`min-h-screen bg-background ${isArabic ? "font-[var(--font-almarai)]" : ""}`}>
      {/* Top Bar with logo */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {isArabic
                ? "العودة إلى الرئيسية"
                : isFrench
                ? "Retour à l’accueil"
                : "Back to Home"}
            </span>
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

      {/* Main content */}
      <main className="container mx-auto px-4 py-16 sm:py-24 flex items-center justify-center">
        <div
          className={`relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background via-secondary/30 to-background shadow-[0_18px_60px_rgba(15,23,42,0.40)]`}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-10 w-72 h-72 bg-amber-200/25 rounded-full blur-3xl" />
          </div>

          <div
            className={`relative z-10 px-6 sm:px-10 py-10 sm:py-14 ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-[0.22em] uppercase text-primary mb-6">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isArabic
                  ? "قريباً جداً"
                  : isFrench
                  ? "Bientôt disponible"
                  : "Coming soon"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div
              className={`mt-8 flex flex-wrap gap-3 ${
                isArabic ? "justify-end" : "justify-start"
              }`}
            >
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/">
                  {isArabic
                    ? "العودة للتسوق"
                    : isFrench
                    ? "Retourner à la boutique"
                    : "Back to store"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-dashed border-muted-foreground/40"
              >
                <Link href="/contact">
                  {isArabic
                    ? "تواصلي مع فريقنا"
                    : isFrench
                    ? "Contacter notre équipe"
                    : "Contact our team"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

