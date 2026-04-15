"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

interface HeroCarouselProps {
    items: {
        image: string
        title: string
        subtitle: string
        link?: string | null
    }[]
}

export function ModernHeroCarousel({ items }: HeroCarouselProps) {
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

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    const scrollTo = React.useCallback(
        (index: number) => {
            if (emblaApi) emblaApi.scrollTo(index)
        },
        [emblaApi]
    )

    if (!items.length) return null

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-secondary/5 border border-white/10 shadow-2xl">
            {/* Carousel Viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {items.map((item, index) => {
                        const isActive = index === selectedIndex

                        return (
                            <div
                                key={index}
                                className="flex-[0_0_100%] min-w-0 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/10]"
                            >
                                <div className="block w-full h-full relative overflow-hidden">
                                     {/* Image */}
                                     {item.image && (
                                         <Image
                                             src={item.image}
                                             alt={item.title || "Promo"}
                                             fill
                                             className="object-cover transition-transform duration-[2000ms] select-none scale-100 group-hover:scale-105"
                                             priority={index === 0}
                                             sizes="(max-w-768px) 100vw, (max-w-1200px) 100vw, 100vw"
                                         />
                                     )}

                                     {/* Gradient Overlay */}
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                     {/* Text Content */}
                                     <div className={`absolute inset-0 flex flex-col justify-end p-8 sm:p-12 pb-16 sm:pb-20 ${dir === 'rtl' ? 'items-start text-right' : 'items-start text-left'}`}>
                                         <div className={`max-w-2xl space-y-4 ${isActive ? 'animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both' : 'opacity-0'}`}>
                                             {item.subtitle && (
                                                 <p className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                                     {item.subtitle}
                                                 </p>
                                             )}
                                             {item.title && (
                                                 <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-2xl">
                                                     {item.title}
                                                 </h2>
                                             )}
                                             
                                             {item.link && (
                                                 <div className="pt-4">
                                                     <Link href={item.link}>
                                                        <Button className="bg-white text-black hover:bg-indigo-600 hover:text-white rounded-full px-8 py-6 font-black text-xs uppercase tracking-widest transition-all shadow-xl">
                                                            Voir l'offre
                                                            <ArrowRight className="w-4 h-4 ml-2" />
                                                        </Button>
                                                     </Link>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between z-10">
                {/* Dots */}
                <div className="flex gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === selectedIndex
                                ? "w-8 bg-white"
                                : "bg-white/50 hover:bg-white/80"
                                }`}
                            onClick={() => scrollTo(index)}
                            aria-label={`${t('accessibility.go_to_slide')} ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm"
                        onClick={scrollPrev}
                        aria-label="Previous slide"
                    >
                        {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm"
                        onClick={scrollNext}
                        aria-label="Next slide"
                    >
                        {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
