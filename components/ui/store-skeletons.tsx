import { Skeleton } from "./skeleton"

export function ProductCardSkeleton() {
    return (
        <div className="glass rounded-3xl p-4 block">
            <Skeleton className="aspect-square rounded-2xl mb-4 w-full" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-3 w-5/6 rounded-lg" />
                </div>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="w-3.5 h-3.5 rounded-full" />
                    ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export function ProductDetailsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 lg:py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Image Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="aspect-square rounded-3xl w-full" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="aspect-square rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Info Skeleton */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="h-10 w-3/4 rounded-xl" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-24 rounded-lg" />
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="w-4 h-4 rounded-full" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-4 w-2/3 rounded-lg" />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <Skeleton className="h-12 w-full rounded-full" />
                        <Skeleton className="h-12 w-full rounded-full" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2 text-center">
                                <Skeleton className="w-10 h-10 rounded-xl mx-auto" />
                                <Skeleton className="h-3 w-16 rounded-md mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CartItemSkeleton() {
    return (
        <div className="flex gap-4 p-4 glass rounded-2xl mb-4">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/3 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-1/4 rounded-lg" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export function CheckoutSummarySkeleton() {
    return (
        <div className="glass rounded-3xl p-6 space-y-6">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                            <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full rounded-md" />
                                <Skeleton className="h-3 w-1/2 rounded-md" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-12 rounded-md" />
                    </div>
                ))}
            </div>
            <div className="pt-6 border-t border-border space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-24 rounded-lg" />
                </div>
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
        </div>
    )
}

export function HeroCarouselSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-secondary/5 border border-white/10 shadow-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-square xl:aspect-[4/3]">
            <Skeleton className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 pb-16 sm:pb-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                <div className="max-w-2xl space-y-4 text-left">
                    <Skeleton className="h-6 w-32 rounded-full opacity-50" />
                    <Skeleton className="h-12 w-3/4 rounded-xl opacity-70" />
                </div>
            </div>
            <div className="absolute bottom-8 left-8 flex gap-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className={`w-2.5 h-2.5 rounded-full ${i === 1 ? 'w-8' : ''} opacity-40`} />
                ))}
            </div>
        </div>
    )
}
