"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Zap, Award } from "lucide-react"
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

export function DepthPromoCarousel({ items }: PromoSliderProps) {
    const { t, dir } = useLanguage()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60, direction: dir }, [
        Autoplay({ delay: 5000, stopOnInteraction: false }),
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
        <div className="relative py-10 sm:py-20">
            {/* Background Decorative Text */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none -z-10 opacity-[0.03]">
                <h2 className="text-[20vw] font-black leading-none whitespace-nowrap -translate-x-1/4 translate-y-1/4 rotate-12">
                    MIRAVET PROMO MIRAVET PROMO
                </h2>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y -ml-4 sm:-ml-8 px-4 sm:px-0">
                    {items.map((item, index) => {
                        const isActive = selectedIndex === index
                        const isNext = (selectedIndex + 1) % items.length === index
                        
                        return (
                            <div
                                key={index}
                                className="flex-[0_0_90%] sm:flex-[0_0_80%] lg:flex-[0_0_70%] pl-4 sm:pl-8 perspective-[2000px]"
                            >
                                <motion.div
                                    animate={{ 
                                        scale: isActive ? 1 : 0.9,
                                        rotateY: isActive ? 0 : (dir === 'rtl' ? -15 : 15),
                                        opacity: isActive ? 1 : 0.4,
                                        filter: isActive ? "blur(0px)" : "blur(4px)"
                                    }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className={cn(
                                        "relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-[3rem] sm:rounded-[5rem] overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]",
                                        isActive ? "z-10" : "z-0"
                                    )}
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                                        priority={index === 0}
                                    />
                                    
                                    {/* Abstract Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/20 to-transparent" />
                                    
                                    {/* Glass Content Card */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-16 lg:p-24">
                                        <div className="max-w-3xl space-y-6 sm:space-y-10">
                                            <AnimatePresence mode="wait">
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ y: 50, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -50, opacity: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.2 }}
                                                        className="space-y-4 sm:space-y-8"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <div className="glass-strong px-6 py-2 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                                {item.subtitle || "Exclusive Deal"}
                                                            </div>
                                                            <div className="flex items-center gap-1 glass px-4 py-2 rounded-full border border-white/10">
                                                                <Award className="w-3 h-3 text-indigo-400" />
                                                                <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Premium quality</span>
                                                            </div>
                                                        </div>

                                                        <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                                                            {item.title}
                                                        </h2>

                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-8 group/btn">
                                                            {item.link && (
                                                                <Link href={item.link}>
                                                                    <Button className="h-16 sm:h-20 px-10 sm:px-16 bg-white hover:bg-white/90 text-black rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4">
                                                                        Voir l'Offre
                                                                        <ArrowRight className="w-6 h-6 transition-transform group-hover/btn:translate-x-2" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            <div className="hidden sm:block h-12 w-1.5 bg-indigo-500 rounded-full" />
                                                            <p className="text-white/60 font-semibold text-sm max-w-[200px]">
                                                                Limited quantity available for qualified partners.
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    
                                    {/* Corner Badge */}
                                    <div className="absolute top-12 left-12">
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full glass-strong border border-white/20 flex flex-col items-center justify-center -rotate-12 hover:rotate-0 transition-transform duration-500">
                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Offre</span>
                                            <span className="text-2xl sm:text-3xl font-black text-white">2026</span>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Special</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Futuristic Progress Navigation */}
            <div className="container mx-auto max-w-7xl px-4 mt-12 flex flex-col sm:flex-row items-center justify-between gap-10">
                <div className="flex-[1] flex items-center gap-4 group/nav w-full sm:w-auto">
                    <span className="text-4xl font-black text-indigo-600 tabular-nums">0{selectedIndex + 1}</span>
                    <div className="flex-grow max-w-[400px] h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-indigo-600"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((selectedIndex + 1) / items.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <span className="text-xl font-bold text-slate-400 tabular-nums">0{items.length}</span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => emblaApi?.scrollPrev()}
                        className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 group/prev"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-400 group-hover/prev:text-indigo-600 transition-colors" />
                    </button>
                    <button 
                        onClick={() => emblaApi?.scrollNext()}
                        className="w-16 h-16 rounded-full border-2 border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 group/next"
                    >
                        <ChevronRight className="w-6 h-6 text-slate-400 group-hover/next:text-indigo-600 transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    )
}
