
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Search,
    Loader2,
    Package,
    ShoppingCart,
    Users,
    Briefcase,
    ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: string
    type: 'product' | 'order' | 'customer' | 'reseller'
    title: string
    subtitle: string
    url: string
    image?: string | null
    status?: string
}

export function AdminSearch({ className }: { className?: string }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)

    // Keyboard shortcut to open search
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])


    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([])
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const res = await fetch(`/api/admin/global-search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data.results || [])
            } catch (error) {
                console.error("Search error:", error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (url: string) => {
        setOpen(false)
        router.push(url)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'product': return <Package className="mr-2 h-4 w-4" />
            case 'order': return <ShoppingCart className="mr-2 h-4 w-4" />
            case 'customer': return <Users className="mr-2 h-4 w-4" />
            case 'reseller': return <Briefcase className="mr-2 h-4 w-4" />
            default: return <Search className="mr-2 h-4 w-4" />
        }
    }

    const getGroupLabel = (type: string) => {
        switch (type) {
            case 'product': return t("admin.sidebar.products") || "Products"
            case 'order': return t("admin.sidebar.orders") || "Orders"
            case 'customer': return t("admin.sidebar.customers") || "Customers"
            case 'reseller': return t("admin.sidebar.resellers") || "Resellers"
            default: return "Results"
        }
    }

    // Group results by type
    const groupedResults = React.useMemo(() => {
        const groups: Record<string, SearchResult[]> = {}
        results.forEach(item => {
            if (!groups[item.type]) groups[item.type] = []
            groups[item.type].push(item)
        })
        return groups
    }, [results])

    return (
        <>
            <Button
                variant="outline"
                className={cn(
                    "relative h-10 w-full justify-start rounded-full bg-background/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 border-white/10 hover:bg-background/80 transition-all",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex truncate">{t("dashboard.admin.search_placeholder")}...</span>
                <span className="inline-flex lg:hidden">Rechercher...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-7 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type to search..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList className="max-h-[500px]">
                    <CommandEmpty className="py-6 text-center text-sm">
                        {loading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-muted-foreground">Searching...</span>
                            </div>
                        ) : query.length < 2 ? (
                            <span className="text-muted-foreground">Type at least 2 characters to search...</span>
                        ) : (
                            <span className="text-muted-foreground">No results found.</span>
                        )}
                    </CommandEmpty>

                    {/* Loading State - Lazy Shimmer Skeleton */}
                    {loading && (
                        <div className="p-2 space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 animate-pulse">
                                    <div className="w-8 h-8 rounded-md bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 bg-muted rounded" />
                                        <div className="h-3 w-1/2 bg-muted rounded opacity-70" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && Object.entries(groupedResults).map(([type, items]) => (
                        <React.Fragment key={type}>
                            <CommandGroup heading={getGroupLabel(type)}>
                                {items.map((item) => (
                                    <CommandItem
                                        key={`${item.type}-${item.id}`}
                                        value={`${item.title} ${item.subtitle}`}
                                        onSelect={() => handleSelect(item.url)}
                                        className="group cursor-pointer rounded-xl aria-selected:bg-primary/10 aria-selected:text-primary transition-all p-3"
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-aria-selected:bg-primary/20 transition-colors">
                                                {item.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                                                ) : (
                                                    getIcon(item.type)
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="font-medium group-aria-selected:font-bold transition-all">{item.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground group-aria-selected:text-primary/70">{item.subtitle}</span>
                                                    {item.status && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-aria-selected:opacity-100 group-aria-selected:translate-x-0 transition-all duration-300 text-primary" />
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                        </React.Fragment>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    )
}
