import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Almarai } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from "@/components/cart-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "sonner"
import { VoiceAssistantWidget } from "@/components/voice-assistant-widget"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const almarai = Almarai({ subsets: ["arabic"], weight: ["300", "400", "700", "800"], variable: "--font-almarai" });

export const metadata: Metadata = {
  title: 'Didali Store | Premium IT Equipment',
  description: 'Whole seller of IT material like PC, servers, printers. We are leader in Morocco.',
  icons: {
    icon: [
      {
        url: '/logo.png',
      },
    ],
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${almarai.variable}`}>
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
