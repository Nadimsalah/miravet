"use client"

import { useLanguage } from "@/components/language-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"

export default function CheckoutCancelPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="glass rounded-3xl p-8 sm:p-12 text-center max-w-lg w-full border-destructive/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
                <div className="relative">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        {t('checkout.cancel_title')}
                    </h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        {t('checkout.cancel_desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/cart">
                            <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto bg-transparent border-foreground/10 hover:bg-foreground/5">
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t('checkout.return_cart')}
                            </Button>
                        </Link>
                        <Link href="/checkout">
                            <Button size="lg" className="rounded-full w-full sm:w-auto">
                                <RefreshCw className="w-4 h-4 mr-2" /> {t('checkout.retry')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
