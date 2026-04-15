"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselItem {
    image: string
    title: string
    subtitle?: string
}

interface GlassCarousel3DProps {
    items: CarouselItem[]
    autoPlayInterval?: number
}

export function GlassCarousel3D({ items, autoPlayInterval = 3000 }: GlassCarousel3DProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [dragOffset, setDragOffset] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

    const itemCount = items.length

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % itemCount)
    }, [itemCount])

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount)
    }, [itemCount])

    // Auto-play functionality
    useEffect(() => {
        if (autoPlayInterval > 0 && !isDragging) {
            autoPlayRef.current = setInterval(goToNext, autoPlayInterval)
        }
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current)
            }
        }
    }, [autoPlayInterval, isDragging, goToNext])

    // Mouse/Touch handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true)
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        setStartX(clientX)
        setDragOffset(0)
    }

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const diff = clientX - startX
        setDragOffset(diff)
    }

    const handleDragEnd = () => {
        if (!isDragging) return
        setIsDragging(false)

        if (Math.abs(dragOffset) > 50) {
            if (dragOffset > 0) {
                goToPrev()
            } else {
                goToNext()
            }
        }
        setDragOffset(0)
    }

    const getCardStyle = (index: number) => {
        const diff = index - currentIndex
        const normalizedDiff = ((diff + itemCount) % itemCount)
        const adjustedDiff = normalizedDiff > itemCount / 2 ? normalizedDiff - itemCount : normalizedDiff

        // 3D transforms for carousel effect
        const rotateY = adjustedDiff * 45
        const translateZ = Math.abs(adjustedDiff) === 0 ? 0 : -150
        const translateX = adjustedDiff * 120 + (isDragging ? dragOffset * 0.3 : 0)
        const scale = Math.abs(adjustedDiff) === 0 ? 1 : 0.75
        const opacity = Math.abs(adjustedDiff) > 2 ? 0 : 1 - Math.abs(adjustedDiff) * 0.3
        const zIndex = 10 - Math.abs(adjustedDiff)

        return {
            transform: `perspective(1000px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
            opacity,
            zIndex,
            transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        }
    }

    if (items.length === 0) {
        return null
    }

    return (
        <div className="relative w-full h-[400px] sm:h-[450px]">
            {/* 3D Carousel Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                style={{ touchAction: 'pan-y' }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="absolute w-[280px] h-[340px] sm:w-[300px] sm:h-[360px]"
                        style={getCardStyle(index)}
                    >
                        {/* Glass Card */}
                        <div className="w-full h-full rounded-[2rem] overflow-hidden relative group select-none">
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-2xl shadow-black/20" />

                            {/* Inner Glow */}
                            <div className="absolute inset-[2px] rounded-[1.9rem] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                            {/* Image Container */}
                            <div className="relative z-10 w-full h-full p-6 flex flex-col">
                                <div className="flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 shadow-inner">
                                    {item.image && item.image !== '/placeholder.svg' ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                                            <div className="text-center space-y-3">
                                                <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-4xl">✨</span>
                                                </div>
                                                <p className="text-sm font-medium text-foreground/80">Brand Showcase</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Title Overlay - Elegant Typography */}
                                <div className="mt-4 text-center space-y-1">
                                    <h3 className="font-bold text-foreground text-xl leading-tight tracking-tight">{item.title}</h3>
                                    {item.subtitle && (
                                        <p className="text-sm text-muted-foreground font-light tracking-wide uppercase">{item.subtitle}</p>
                                    )}
                                </div>
                            </div>

                            {/* Reflection Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-50 pointer-events-none rounded-[2rem]" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-foreground hover:bg-white/20 transition-all hover:scale-110"
                aria-label="Previous"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-foreground hover:bg-white/20 transition-all hover:scale-110"
                aria-label="Next"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                            ? 'bg-primary w-6'
                            : 'bg-white/30 hover:bg-white/50'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
