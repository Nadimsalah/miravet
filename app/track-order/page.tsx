"use client"

import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ComingSoonPage } from "@/components/coming-soon-page"

export default function TrackOrderPage() {
  const { language } = useLanguage()
  const isArabic = language === "ar"

  // Temporary: Coming soon layout for footer page
  return (
    <ComingSoonPage
      titleEn="Track Order"
      titleFr="Suivre une commande"
      subtitleEn="Live order tracking and status updates from Miravet are coming very soon."
      subtitleFr="Le suivi en temps réel de vos commandes Miravet arrive très bientôt."
    />
  )

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
            {isArabic ? "تتبع الطلب" : "Track Order"}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-xl">
        <div className={isArabic ? "space-y-4 mb-8 text-right" : "space-y-4 mb-8"}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isArabic ? "تتبعي حالة طلبك" : "Track the status of your order"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isArabic
              ? "أدخلي رقم الطلب أو رقم الموبايل المستخدم في الطلب، وسنساعدك في معرفة حالة الشحن. هذه الصفحة مبدئية، يمكنك دائماً التواصل معنا مباشرةً لمزيد من التفاصيل."
              : "Enter your order number or the phone number used at checkout and we’ll help you understand your delivery status. This page is informational; you can always contact us directly for more details."}
          </p>
        </div>

        <form
          className={isArabic ? "glass-subtle rounded-3xl p-6 space-y-4 text-right" : "glass-subtle rounded-3xl p-6 space-y-4"}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? "رقم الطلب أو رقم الموبايل" : "Order number or phone number"}
            </label>
            <Input
              placeholder={isArabic ? "مثال: #DAR1234 أو +20..." : "e.g. #DAR1234 or +20..."}
              className="rounded-xl"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            <span>{isArabic ? "بحث عن الطلب" : "Search order"}</span>
          </Button>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {isArabic
              ? "حالياً، يتم تحديث حالة الطلبات عن طريق رسائل SMS أو واتساب من شركة الشحن. في حال لم تصلك أي رسالة، يرجى التواصل معنا عبر صفحة اتصل بنا."
              : "At the moment, order statuses are shared via SMS or WhatsApp by the courier. If you haven’t received any updates, please contact us through the Contact Us page."}
          </p>
        </form>
      </main>
    </div>
  )
}

