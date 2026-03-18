"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

interface PromoSliderProps {
    items: {
        image: string
        title: string
        subtitle: string
        link?: string | null
    }[]
}

export function CreativePromoSlider({ items }: PromoSliderProps) {
    const { t, dir } = useLanguage()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 80, direction: dir }, [
        Autoplay({ delay: 6000, stopOnInteraction: false }),
    ])
    const [selectedIndex, setSelectedIndex] = React.useState(0)

    React.useEffect(() => {
        if (!emblaApi) return

        const onSelect = () => {
            setSelectedIndex(emblaApi.selectedScrollSnap())
        }

        emblaApi.on("select", onSelect)
        emblaApi.on("reInit", onSelect)
    }, [emblaApi])

    if (!items.length) return null

    return (
        <div className="relative group p-0 pb-12 sm:pb-0 sm:p-2">
            <div className="overflow-hidden rounded-[2.5rem] sm:rounded-[4rem]" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="flex-[0_0_100%] min-w-0 relative"
                        >
                            <div className="grid lg:grid-cols-2 gap-8 items-center bg-white border border-slate-100 rounded-[2.5rem] sm:rounded-[4rem] p-4 sm:p-8 lg:p-12 shadow-2xl overflow-hidden relative group/slide">
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 group-hover/slide:bg-primary/10 transition-colors duration-1000" />
                                
                                {/* Image Column */}
                                <div className="relative h-[300px] sm:h-[450px] lg:h-[550px] rounded-[2rem] sm:rounded-[3rem] overflow-hidden order-1 lg:order-2">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-[2000ms] group-hover/slide:scale-110 select-none animate-in fade-in duration-1000"
                                        priority={index === 0}
                                    />
                                    {/* Glassy overlay on image corner */}
                                    <div className="absolute top-6 right-6 glass-strong px-6 py-3 rounded-full flex items-center gap-3 shadow-xl backdrop-blur-xl animate-bounce" style={{ animationDuration: '4s' }}>
                                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                        <span className="text-xs font-black uppercase tracking-widest text-[#0f172a]">Direct from Miravet</span>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="space-y-8 order-2 lg:order-1 px-4 sm:px-0">
                                    <AnimatePresence mode="wait">
                                        {selectedIndex === index && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.6, ease: "easeOut" }}
                                                className="space-y-8"
                                            >
                                                <div className="space-y-4">
                                                    {item.subtitle && (
                                                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-primary text-xs sm:text-sm font-black uppercase tracking-widest shadow-sm">
                                                            <Sparkles className="w-4 h-4 fill-primary" />
                                                            {item.subtitle}
                                                        </div>
                                                    )}
                                                    {item.title && (
                                                        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#0f172a] leading-[1.05] tracking-tight">
                                                            {item.title.split(' ').map((word, i) => (
                                                                <span key={i} className={i % 2 === 1 ? "text-indigo-600" : ""}>
                                                                    {word}{' '}
                                                                </span>
                                                            ))}
                                                        </h2>
                                                    )}
                                                    <p className="text-[#64748b] text-base sm:text-xl font-medium max-w-lg leading-relaxed">
                                                        Solutions vétérinaires de haute performance adaptées à vos besoins professionnels. Profitez de nos offres exclusives.
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                                                    {item.link && (
                                                        <Link href={item.link} className="w-full sm:w-auto">
                                                            <Button className="w-full sm:w-auto bg-[#0f172a] hover:bg-black text-white rounded-full px-10 py-8 font-black text-lg shadow-2xl transition-all hover:-translate-y-1 active:scale-95 group">
                                                                Explorer l'offre
                                                                <ArrowRight className="ml-3 w-5 h-5 transition-transform group-hover:translate-x-2" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <div className="flex -space-x-3 items-center justify-center sm:justify-start">
                                                        {[1, 2, 3].map((i) => (
                                                            <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-lg bg-slate-200">
                                                                <Image src={`/hero-floating-${i}.jpg`} alt="Vet" width={48} height={48} className="object-cover" />
                                                            </div>
                                                        ))}
                                                        <div className="ml-6 pl-4 border-l border-slate-200">
                                                            <div className="flex items-center gap-1">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <div key={s} className="w-3 h-3 rounded-full bg-amber-400" />
                                                                ))}
                                                            </div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mt-1">+1000 partenaires</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium Pagination */}
            <div className="absolute bottom-4 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
                <div className="flex gap-3 px-6 py-4 rounded-full glass-strong shadow-2xl backdrop-blur-3xl border border-white/20">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            className={`group relative h-2 transition-all duration-500 rounded-full focus:outline-none ${
                                index === selectedIndex ? "w-12 bg-indigo-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                            }`}
                            onClick={() => emblaApi?.scrollTo(index)}
                        >
                            <span className="sr-only">Go to slide {index + 1}</span>
                        </button>
                    ))}
                </div>
                
                <div className="hidden sm:flex gap-2">
                    <button 
                        onClick={() => emblaApi?.scrollPrev()}
                        className="w-12 h-12 rounded-full glass-strong flex items-center justify-center hover:bg-slate-100/50 transition-all active:scale-90 border border-white/20"
                    >
                        <ChevronLeft className="w-5 h-5 text-[#0f172a]" />
                    </button>
                    <button 
                        onClick={() => emblaApi?.scrollNext()}
                        className="w-12 h-12 rounded-full glass-strong flex items-center justify-center hover:bg-slate-100/50 transition-all active:scale-90 border border-white/20"
                    >
                        <ChevronRight className="w-5 h-5 text-[#0f172a]" />
                    </button>
                </div>
            </div>
        </div>
    )
}
