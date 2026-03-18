"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

interface PromoSliderProps {
    items: {
        image: string
        detailImage?: string | null
        title: string
        subtitle: string
        link?: string | null
    }[]
}

export function DiagonalPromoSlider({ items }: PromoSliderProps) {
    const { t, dir } = useLanguage()
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 100, direction: dir }, [
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
        <div className="relative py-12 px-4 sm:px-0">
            <div className="overflow-hidden rounded-[3rem] sm:rounded-[4rem] group" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {items.map((item, index) => {
                        const isActive = selectedIndex === index
                        return (
                            <div
                                key={index}
                                className="flex-[0_0_100%] min-w-0 relative h-[450px] sm:h-[650px] overflow-hidden"
                            >
                                {/* Base Image with Parallax-ish Scale */}
                                <motion.div 
                                    className="absolute inset-0 z-0"
                                    animate={{ scale: isActive ? 1.05 : 1.2 }}
                                    transition={{ duration: 6, ease: "linear" }}
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                    />
                                    <div className="absolute inset-0 bg-black/50" />
                                </motion.div>

                                {/* Diagonal Cut Section */}
                                <div className={cn(
                                    "absolute inset-0 z-10 hidden lg:block",
                                    dir === 'rtl' ? "-translate-x-1/2" : "translate-x-1/2"
                                )}>
                                    <div className="w-full h-full bg-white/5 backdrop-blur-3xl -skew-x-12 origin-top transform translate-x-1/4 shadow-[-100px_0_100px_-50px_rgba(0,0,0,0.1)] border-l border-white/10" />
                                </div>

                                {/* Content Grid */}
                                <div className="absolute inset-0 z-20 container mx-auto px-8 sm:px-16 lg:px-24">
                                    <div className="grid lg:grid-cols-2 h-full items-center">
                                        {/* Left Side (Dark on Image) */}
                                        <div className="lg:max-w-xl space-y-6 sm:space-y-10 order-2 lg:order-1 pt-20 lg:pt-0">
                                            <AnimatePresence mode="wait">
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ x: -100, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        exit={{ x: 100, opacity: 0 }}
                                                        transition={{ duration: 0.8, ease: "circOut" }}
                                                        className="space-y-6 sm:space-y-8"
                                                    >
                                                        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/20 backdrop-blur-xl border border-white/20 text-white font-black text-xs uppercase tracking-widest shadow-xl">
                                                            <TrendingUp className="w-4 h-4 text-primary" />
                                                            {item.subtitle || "Trending Offer"}
                                                        </div>
                                                        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter uppercase italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                                                            {item.title}
                                                        </h2>
                                                        <div className="flex items-center gap-6">
                                                            {item.link && (
                                                                <Link href={item.link}>
                                                                    <Button className="h-20 px-12 bg-indigo-600 hover:bg-white hover:text-black text-white rounded-none skew-x-[-12deg] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 group/btn border-2 border-transparent hover:border-indigo-600">
                                                                        <span className="skew-x-[12deg] flex items-center gap-4 text-white group-hover:text-black">
                                                                            Explorer <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                                                                        </span>
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            <div className="hidden sm:block">
                                                                <p className="text-white/80 font-bold text-sm max-w-[150px] leading-tight drop-shadow-md">
                                                                    Limited stock available for professionals.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Right Side (Visual Detail) */}
                                        <div className="hidden lg:flex justify-end p-20 order-2">
                                            <AnimatePresence mode="wait">
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0, rotate: 10 }}
                                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                                        exit={{ scale: 1.2, opacity: 0, rotate: -10 }}
                                                        transition={{ duration: 1 }}
                                                        className="relative w-80 h-80 rounded-[40px] overflow-hidden border-[12px] border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-slate-100 backdrop-blur-xl"
                                                    >
                                                        <Image 
                                                            src={item.detailImage || item.image} 
                                                            alt="Product" 
                                                            fill 
                                                            className="object-cover hover:scale-110 transition-transform duration-700" 
                                                        />
                                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>


            {/* Custom Navigation */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-30 hidden xl:block">
                <button 
                    onClick={() => emblaApi?.scrollPrev()}
                    className="w-20 h-40 bg-white shadow-2xl flex flex-col items-center justify-center gap-4 hover:bg-[#0f172a] hover:text-white transition-all rounded-r-[40px] group/nav"
                >
                    <ChevronLeft className="w-8 h-8 group-hover/nav:-translate-x-2 transition-transform" />
                    <span className="rotate-90 text-[10px] font-black uppercase tracking-[0.3em]">Prev</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </button>
            </div>
            
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-30 hidden xl:block">
                <button 
                    onClick={() => emblaApi?.scrollNext()}
                    className="w-20 h-40 bg-white shadow-2xl flex flex-col items-center justify-center gap-4 hover:bg-[#0f172a] hover:text-white transition-all rounded-l-[40px] group/nav"
                >
                    <ChevronRight className="w-8 h-8 group-hover/nav:translate-x-2 transition-transform" />
                    <span className="rotate-90 text-[10px] font-black uppercase tracking-[0.3em]">Next</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </button>
            </div>

            {/* Dots Pagination */}
            <div className="flex justify-center gap-4 mt-12">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            index === selectedIndex ? "w-12 bg-[#0f172a]" : "w-2 bg-slate-200 hover:bg-slate-300"
                        )}
                    />
                ))}
            </div>
        </div>
    )
}
