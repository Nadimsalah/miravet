"use client"

import { useState, useEffect, useRef } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProducts, getHeroCarouselItems, getCategories, getAdminSettings, getCurrentUserRole, getCurrentUserId, getCurrentResellerTier, type Product, type ResellerTier } from "@/lib/supabase-api"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn, formatPrice } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Menu,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Leaf,
  Heart,
  Award,
  ChevronUp,
  ArrowRight,
  ChevronDown,
  X,
  Zap,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  User,
  UserPlus,
  LogOut,
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ModernHeroCarousel } from "@/components/modern-hero-carousel"
import { WhatsAppSubscription } from "@/components/whatsapp-subscription"
import { ProductCardSkeleton, HeroCarouselSkeleton } from "@/components/ui/store-skeletons"

// Countdown Timer Component
function CountdownTimer() {
  const { t } = useLanguage()
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
          days--
        }
        if (days < 0) {
          return { days: 3, hours: 12, minutes: 45, seconds: 30 }
        }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex gap-3 sm:gap-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="glass-strong rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-[50px] sm:min-w-[60px]">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {value.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize">
            {t(`timer.${unit}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

function CartCount() {
  const { cartCount } = useCart()
  if (cartCount === 0) return null
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
      {cartCount}
    </span>
  )
}

// Product Card Component
function ProductCard({ product, userRole, resellerTier }: { product: Product, userRole?: string | null, resellerTier?: ResellerTier }) {
  const { t, language } = useLanguage()
  const isArabic = language === 'ar'
  const rating = 5 // Default rating since it's not in DB yet
  return (
    <Link href={`/product/${product.id}`} className="group glass rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-3 xl:p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 block">
      <div className="aspect-square bg-gradient-to-br from-secondary to-muted rounded-xl sm:rounded-2xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={isArabic && product.title_ar ? product.title_ar : product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-0">
          {isArabic && product.title_ar ? product.title_ar : product.title}
        </h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < rating ? "fill-primary text-primary" : "text-muted"}`}
            />
          ))}
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">({rating}.0)</span>
        </div>
        <div className="flex items-center justify-between pt-1 sm:pt-2 mt-auto">
          <div className="flex flex-col">
            {resellerTier ? (
              (() => {
                const tier = resellerTier || 'reseller'
                const tierPrice =
                  tier === 'wholesaler'
                    ? product.wholesaler_price
                    : tier === 'partner'
                      ? product.partner_price
                      : product.reseller_price

                if (tierPrice) {
                  return (
                    <>
                      <span className="text-xs sm:text-base font-bold text-foreground whitespace-nowrap">
                        {t('common.currency')} {formatPrice(tierPrice / 1.2)} <span className="text-[10px] font-normal text-muted-foreground">HT</span>
                      </span>
                      <span className="text-[9px] sm:text-xs text-muted-foreground line-through decoration-destructive/30 whitespace-nowrap">
                        {t('common.currency')} {formatPrice(product.price)} <span className="text-[8px] font-normal">TTC</span>
                      </span>
                    </>
                  )
                }

                return (
                  <span className="text-xs sm:text-base font-bold text-foreground whitespace-nowrap">
                    {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
                  </span>
                )
              })()
            ) : (
              <span className="text-xs sm:text-base font-bold text-foreground whitespace-nowrap">
                {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
              </span>
            )}
          </div>
          <Button
            size="icon"
            className={cn(
              "w-9 h-9 rounded-full",
              product.stock <= 0 && "bg-muted text-muted-foreground opacity-70"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}



// Collection Card Component
function CollectionCard({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) {
  const { t } = useLanguage()
  return (
    <div className="group glass rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link
        href="#"
        className="inline-flex items-center text-primary font-medium group-hover:gap-2 gap-1 transition-all"
      >
        {t('section.view_collection')} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

import { DiagonalPromoSlider } from "@/components/diagonal-promo-slider"

// Hero Carousel Component - Brand Showcase
function HeroCarousel({ products }: { products: Product[] }) {
  const { t, language } = useLanguage()
  const [carouselItems, setCarouselItems] = useState<Array<{ image: string; title: string; subtitle: string; link?: string | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    async function loadCarouselItems() {
      if (!isMounted) return;
      setLoading(true);

      try {
        const items = await getHeroCarouselItems();
        console.log("HeroCarousel - Fetched items:", items);

        if (!isMounted) return;

        if (items && Array.isArray(items) && items.length > 0) {
          const mappedItems = items
            .filter(item => item && item.image_url) // Only show items with an image
            .map(item => {
              const productId = item.link?.startsWith('/product/') ? item.link.replace('/product/', '') : null;
              const linkedProduct = products.find(p => p.id === productId);
              const detailImage = linkedProduct?.images?.[0] || item.image_url;

              return {
                image: String(item.image_url || '/placeholder.jpg'),
                detailImage: String(detailImage || item.image_url),
                title: String(item.title || ''),
                subtitle: String(item.subtitle || ''),
                link: item.link ? String(item.link) : null
              };
            });

          if (mappedItems.length > 0) {
            setCarouselItems(mappedItems);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("HeroCarousel - Error loading data:", error);
      }

      // If we reach here, we use fallback data
      if (!isMounted) return;

      const fallbackItems = language === 'ar' ? [
        {
          image: '/hero-dog-professional.jpg',
          title: 'رعاية بيطرية ممتازة',
          subtitle: 'حلول احترافية'
        },
        {
          image: '/hero-dog.jpg',
          title: 'منتجات طبية متخصصة',
          subtitle: 'جودة مضمونة'
        },
        {
          image: '/services-cat.jpg',
          title: 'معدات جراحية حديثة',
          subtitle: 'تقنيات متقدمة'
        }
      ] : [
        {
          image: '/hero-dog-professional.jpg',
          title: 'Vaccins Aviaires & Ruminants',
          subtitle: 'Protection optimale pour votre bétail'
        },
        {
          image: '/hero-dog.jpg',
          title: 'Antiparasitaires Professionnels',
          subtitle: 'Éradication efficace et durable'
        },
        {
          image: '/services-cat.jpg',
          title: 'Matériel Chirurgical Vétérinaire',
          subtitle: 'Innovation au service de la chirurgie'
        }
      ];

      setCarouselItems(fallbackItems);
      setLoading(false);
    }

    loadCarouselItems();
    return () => { isMounted = false; };
  }, [language, products])

  if (loading) {
    return <HeroCarouselSkeleton />
  }

  return <ModernHeroCarousel items={carouselItems} />
}




export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const { t, language, toggleLanguage, dir } = useLanguage()
  const isArabic = language === 'ar'
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
  const [shippingEnabled, setShippingEnabled] = useState(true)
  const [typedText, setTypedText] = useState("")
  const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string }[]>([])
  const fullText = "Grossisterie Vétérinaire"
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let i = 0
    let isDeleting = false
    const speed = 100

    const type = () => {
      const current = isDeleting
        ? fullText.slice(0, i - 1)
        : fullText.slice(0, i + 1)

      setTypedText(current)
      i = isDeleting ? i - 1 : i + 1

      if (!isDeleting && i === fullText.length) {
        setTimeout(() => { isDeleting = true; type() }, 2000)
      } else if (isDeleting && i === 0) {
        isDeleting = false
        setTimeout(type, 500)
      } else {
        setTimeout(type, isDeleting ? speed / 2 : speed)
      }
    }

    const timeout = setTimeout(type, 500)
    return () => clearTimeout(timeout)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8

      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  // Cart context is now available but we need to create a client component wrapper 
  // or accept that HomePage is a client component (which it already is: "use client" is missing but useState implies it)
  // Let's check imports to see if "use client" is needed or if it's already there


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      setShowBackToTop(window.scrollY > 500)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const [products, setProducts] = useState<Product[]>([])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [userData, roleData, tierData, catsData, prodsData] = await Promise.all([
          supabase.auth.getSession(),
          getCurrentUserRole(),
          getCurrentResellerTier(),
          getCategories({ onlyMain: true }),
          getProducts()
        ])

        setUser(userData.data.session?.user || null)
        setUserRole(roleData)
        setResellerTier(tierData)
        setCategories(catsData)
        setProducts(prodsData || [])
      } catch (e) {
        console.error("Failed to load home page auth data", e)
        setUser(null)
      }
    }
    loadData()
  }, [])





  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled ? "py-2 sm:py-3" : "py-4 sm:py-8"}`}>
        <div className={`mx-auto max-w-7xl px-4 transition-all duration-500 ${isScrolled ? "glass-strong rounded-full shadow-2xl mx-4 sm:mx-8" : "bg-transparent"}`}>
          <div className="flex items-center justify-between h-14 sm:h-20 px-2 sm:px-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src="/logo.png"
                alt="Miravet"
                width={180}
                height={54}
                className="h-14 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center gap-10">
              <Link href="#accueil" className="text-[14px] font-bold text-[#1a1a1a] hover:text-primary transition-colors">Accueil</Link>
              <Link href="#produits" className="text-[14px] font-bold text-[#1a1a1a] hover:text-primary transition-colors">Produits</Link>
              <Link href="#services" className="text-[14px] font-bold text-[#1a1a1a] hover:text-primary transition-colors">Services</Link>
              <Link href="#expertise" className="text-[14px] font-bold text-[#1a1a1a] hover:text-primary transition-colors">Expertise</Link>
              <Link href="#contact" className="text-[14px] font-bold text-[#1a1a1a] hover:text-primary transition-colors">Contact</Link>
            </nav>

            {/* Right Action - ESPACE REVENDEUR */}
            <div className="flex items-center gap-4">
              <Link href={!user ? "/login" : (userRole === 'DELIVERY_MAN' ? "/logistique/dashboard" : userRole === 'ACCOUNT_MANAGER' ? "/manager/resellers" : "/reseller/dashboard")}>
                <Button className="bg-[#0f172a] hover:bg-black text-white rounded-full px-5 sm:px-8 py-3 sm:py-6 font-black text-xs sm:text-[13px] flex items-center gap-2 shadow-xl shadow-black/10 transition-all hover:shadow-black/20 hover:-translate-y-0.5 active:scale-95 group">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  {!user ? "Espace revendeur" : "Dashboard"}
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Button>
              </Link>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-full hover:bg-black/5 transition-all active:scale-90">
                    <Menu className="w-6 h-6 text-[#0f172a]" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[440px] p-0 border-0 bg-[#ffffff] overflow-hidden [&>button]:hidden">
                  <SheetTitle className="hidden">Menu de Navigation</SheetTitle>
                  <SheetDescription className="hidden">Menu principal pour naviguer sur le site Miravet</SheetDescription>
                  <div className="flex flex-col h-full relative">
                    {/* Decorative Background Glow for Menu */}
                    <div className="absolute top-[-10%] right-[-10%] w-[150%] h-[150%] pointer-events-none opacity-20">
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-200 rounded-full blur-[100px]" />
                      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-100 rounded-full blur-[80px]" />
                    </div>

                    <div className="relative z-10 p-8 sm:p-12 flex flex-col h-full">
                      {/* Menu Header: Brand Only */}
                      <div className="flex items-center justify-between mb-16">
                        <Image src="/logo.png" alt="Miravet" width={180} height={54} className="h-14 w-auto" />
                        <SheetClose className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                          <X className="w-6 h-6 text-slate-500" />
                        </SheetClose>
                      </div>

                      {/* Navigation Sections */}
                      <div className="space-y-12">
                        <div className="space-y-6 text-left">
                          <p className="text-[#94a3b8] font-black text-xs uppercase tracking-[0.3em] ml-1">Menu Principal</p>
                          <nav className="flex flex-col gap-6">
                            {[
                              { label: 'Accueil', href: '#accueil' },
                              { label: 'Nos Produits', href: '#produits' },
                              { label: 'Services Express', href: '#services' },
                              { label: 'Expertise Pro', href: '#expertise' },
                              { label: 'Contact Direct', href: '#contact' }
                            ].map((item, i) => (
                              <Link
                                key={i}
                                href={item.href}
                                className="group flex items-center justify-between py-1 transition-all"
                              >
                                <span className="text-4xl font-black text-[#0f172a] tracking-tight group-hover:text-indigo-600 group-hover:translate-x-3 transition-all duration-300">
                                  {item.label}
                                </span>
                                <ArrowRight className="w-6 h-6 text-slate-200 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 transition-all" />
                              </Link>
                            ))}
                          </nav>
                        </div>
                      </div>

                      {/* Floating Bottom: Auth & Identity Area */}
                      <div className="mt-auto pt-12 space-y-8">
                        {!user ? (
                          <div className="grid gap-4">
                            <Link href="/login" className="w-full">
                              <button className="w-full bg-[#0f172a] text-white py-6 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 transition-all active:scale-95">
                                <User className="w-5 h-5" />
                                Connexion
                              </button>
                            </Link>
                            <Link href="/reseller/register" className="w-full">
                              <button className="w-full bg-white border-2 border-[#e2e8f0] text-[#0f172a] py-6 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-indigo-500/20 transition-all">
                                <UserPlus className="w-5 h-5 text-indigo-500" />
                                Inscription
                              </button>
                            </Link>
                          </div>
                        ) : (
                          <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {user.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Active</p>
                                <p className="text-lg font-black text-[#0f172a] truncate max-w-[160px]">{user.email?.split('@')[0]}</p>
                              </div>
                            </div>
                            <Link href={userRole === 'DELIVERY_MAN' ? "/logistique/dashboard" : userRole === 'ACCOUNT_MANAGER' ? "/manager/resellers" : "/reseller/dashboard"} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                              <ArrowRight className="w-5 h-5" />
                            </Link>
                          </div>
                        )}

                        {/* Quick Contact Footer dalam Menu */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                          <div className="flex gap-4">
                            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                              <Icon key={i} className="w-5 h-5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" />
                            ))}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Miravet v3.0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - EXACTLY LIKE IMAGE */}
      <section id="accueil" className="relative pt-32 sm:pt-40 lg:pt-48 pb-20 overflow-hidden min-h-screen flex flex-col justify-center bg-[#ffffff]">
        <div className="container mx-auto px-4 max-w-7xl relative z-10" dir={dir}>
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (Col 7) */}
            <div className={`lg:col-span-7 space-y-10 ${isArabic ? 'text-right' : 'text-left'}`}>
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black text-[#0f172a] leading-[1.2] lg:leading-[1.1] tracking-tight flex flex-col">
                  <span className="opacity-90">Miravet</span>
                  <span className="flex items-center gap-2 text-indigo-600 min-h-[1.5em] lg:min-h-[1.2em] text-xl sm:text-3xl lg:text-4xl mt-3 lg:mt-2 font-bold tracking-normal italic opacity-80">
                    {typedText}
                    <span className="w-1 h-[0.8em] bg-indigo-600/40 animate-pulse rounded-full"></span>
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-[#64748b] max-w-xl leading-relaxed font-medium">
                  {t('hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-8">
                <Link href="/search" className="w-full sm:w-auto">
                  <button data-slot="button" className="w-full sm:w-auto justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary hover:bg-primary/90 btn-gradient text-white rounded-[24px] px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold flex items-center justify-center gap-3 sm:gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20">
                    <Search className="w-5 h-5 sm:w-6 h-6" />
                    <span>{t('nav.search')}</span>
                  </button>
                </Link>
                <Link href="tel:+212522510025" className="flex items-center justify-center sm:justify-start gap-3 text-[#475569] font-bold text-base sm:text-lg hover:text-[#0f172a] transition-colors group">
                  <span className="w-10 h-10 sm:w-12 h-12 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center shadow-sm">
                    <PhoneCall className="w-5 h-5 sm:w-6 h-6 text-indigo-500" />
                  </span>
                  +212 5 22 51 00 25
                </Link>
              </div>
            </div>

            {/* Right Content - Organic Image (Col 5) */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-[#fecaca]/40 organic-shape animate-blob z-0 scale-110" />
                <div className="absolute inset-0 bg-[#e0e7ff]/30 organic-shape animate-blob animation-delay-2000 z-0 rotate-45" />

                {/* Main Image Container */}
                <div className="relative w-full h-full organic-shape overflow-hidden z-10">
                  <Image
                    src="/hero-dog-professional.jpg"
                    alt="+212 5 22 51 00 25"
                    fill
                    className="object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="absolute -top-4 left-0 w-24 h-24 rounded-full border-[6px] border-white shadow-2xl overflow-hidden z-20 animate-bounce" style={{ animationDuration: '6s' }}>
                  <Image src="/hero-floating-1.jpg" alt="+212 5 22 51 00 25" fill className="object-cover" />
                </div>

                <div className="absolute bottom-20 -right-4 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-xl z-20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Our Brands Store - Category Carousel Section */}
          <div id="produits" className="mt-32 relative" dir={dir}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black tracking-widest uppercase">
                  <Award className="w-3.5 h-3.5" />
                  {t('section.brands_store')}
                </div>
                <h3 className="text-4xl sm:text-5xl font-black text-[#0f172a] tracking-tight">
                  {t('section.brands_store_subtitle')}
                </h3>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => scroll('left')}
                  className="w-14 h-14 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center shadow-sm hover:scale-110 hover:border-indigo-500 hover:text-indigo-600 active:scale-95 transition-all text-[#0f172a] group"
                >
                  <ChevronLeft className={`w-6 h-6 transition-transform group-hover:-translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="w-14 h-14 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center shadow-sm hover:scale-110 hover:border-indigo-500 hover:text-indigo-600 active:scale-95 transition-all text-[#0f172a] group"
                >
                  <ChevronRight className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex flex-nowrap gap-6 sm:gap-8 overflow-x-auto no-scrollbar pb-12 snap-x snap-mandatory px-4 -mx-4 sm:px-0 sm:mx-0"
            >
              {categories.length > 0 ? (
                categories.map((cat, idx) => {
                  // Dynamic Brand Data from Categories
                  const label = cat.name;
                  const logoUrl = cat.logo_url;
                  const subtitle = (cat as any).subtitle || "Partenaire Officiel";
                  const buttonText = (cat as any).button_text || "Explorer la gamme";
                  
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="group relative flex-shrink-0 snap-start"
                    >
                      <div className="bg-white border border-slate-100 rounded-[3rem] p-8 sm:p-10 min-w-[280px] sm:min-w-[340px] h-[400px] flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-4 border-b-4 hover:border-b-indigo-500">
                        {/* Static White Background Branding */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-bl-[4rem] group-hover:bg-indigo-500/5 transition-colors duration-500" />
                        
                        <div className="space-y-8 relative z-10">
                          {/* Logo Container - Pure White & Smooth */}
                          <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            {logoUrl ? (
                              <Image 
                                src={logoUrl} 
                                alt={label} 
                                width={120} 
                                height={120} 
                                className="object-contain w-3/4 h-3/4"
                              />
                            ) : (
                              <div className="text-4xl sm:text-5xl font-black text-indigo-600/20">
                                {label.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-black text-3xl text-[#0f172a] leading-tight group-hover:text-indigo-600 transition-colors">
                              {label}
                            </h4>
                            <p className="text-sm font-bold text-[#64748b] uppercase tracking-[0.15em] opacity-60">
                              {subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-8 relative z-10">
                          <span className="text-sm font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-500">
                            {buttonText}
                          </span>
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0f172a] group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:rotate-45 shadow-sm">
                            <ArrowRight className="w-7 h-7" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                /* Fallback skeleton or initial designs if no categories loaded */
                [1,2,3,4].map((i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-[3rem] p-10 min-w-[340px] h-[400px] animate-pulse" />
                ))
              )}
            </div>
          </div>
          {/* Simple Offres & Promotions Section */}
          <div className="mt-16 sm:mt-24 space-y-10 px-4 sm:px-0 mb-20">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">
                {t('section.exclusive_promos')}
              </h3>
              <p className="text-[#64748b] font-medium">
                {t('section.exclusive_promos_subtitle')}
              </p>
            </div>
            
            <div className="relative z-10">
              <HeroCarousel products={products} />
            </div>
          </div>
        </div>
      </section>



      {/* Grossisterie Vétérinaire Miravet Services Selection */}
      <section id="services" className="py-32 bg-[#fafafa] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-indigo-100 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[5%] w-64 h-64 bg-rose-50 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Content & Features */}
            <div className="space-y-12">
              <div className="space-y-6">
                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-black tracking-widest uppercase ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Star className="w-4 h-4 fill-primary" />
                  Grossisterie Vétérinaire Miravet
                </div>
                <h2 id="expertise" className="text-5xl md:text-6xl font-black text-[#0f172a] leading-[1.1] tracking-tight">
                  Services de <span className="text-indigo-600">Grossisterie</span> Vétérinaire
                </h2>
                <p className="text-xl text-[#64748b] font-medium leading-relaxed max-w-xl">
                  Découvrez nos services de grossisterie vétérinaire pour la vente de produits compétitifs pour toutes les espèces.
                </p>
              </div>

              <div className="grid gap-8">
                {/* Feature 1 */}
                <div className="group flex flex-col sm:flex-row gap-8 p-8 rounded-[40px] bg-white border border-[#f1f5f9] transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:border-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fff1f2]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-20 h-20 shrink-0 rounded-[28px] bg-[#fff1f2] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-sm relative z-10">
                    <Award className="w-10 h-10 text-[#e11d48]" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-2xl font-black text-[#0f172a]">Produits Vétérinaires de Qualité</h3>
                    <p className="text-lg text-[#64748b] font-medium leading-relaxed">
                      Découvrez notre large gamme de produits vétérinaires de qualité pour soutenir votre pratique professionnelle.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group flex flex-col sm:flex-row gap-8 p-8 rounded-[40px] bg-white border border-[#f1f5f9] transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:border-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#eef2ff]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-20 h-20 shrink-0 rounded-[28px] bg-[#eef2ff] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-sm relative z-10">
                    <Truck className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <h3 className="text-2xl font-black text-[#0f172a]">Livraison Rapide et Fiable</h3>
                    <p className="text-lg text-[#64748b] font-medium leading-relaxed">
                      Profitez de notre service de livraison rapide et fiable pour recevoir vos commandes en toute simplicité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Excellence */}
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full -z-10 animate-pulse group-hover:bg-indigo-500/30 transition-all duration-700"></div>

              <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-slate-200 group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] transition-all duration-700">
                <Image
                  src="/services-cat.jpg"
                  alt="Veterinary Excellence"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>

                <div className="absolute bottom-12 left-12 right-12 text-white space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-[0.2em]">
                    Engagement Qualité
                  </div>
                  <h4 className="text-4xl font-black tracking-tight leading-tight">Miravet Professional Services</h4>
                  <p className="text-white/80 font-medium text-lg">L'excellence au service de la santé animale.</p>
                </div>
              </div>

              {/* Floating Status Card */}
              <div className="absolute -bottom-10 -right-6 glass-strong p-8 rounded-[36px] shadow-2xl hidden md:block animate-bounce border border-white/50 z-20" style={{ animationDuration: '5s' }}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[20px] bg-primary/10 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-[#64748b] uppercase tracking-widest leading-none">Status</p>
                    <p className="text-2xl font-black text-[#0f172a]">Certifié Expert</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600 uppercase">Service Actif</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-12 -left-12 w-24 h-24 rounded-3xl bg-white border border-[#f1f5f9] flex items-center justify-center shadow-xl rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Leaf className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Minimalist Footer */}
      <footer id="contact" className="bg-white pt-24 pb-12 border-t border-slate-100 relative z-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20 text-center md:text-left">
            {/* Column 1: Brand */}
            <div className="lg:col-span-5 space-y-8 flex flex-col items-center md:items-start">
              <Link href="/" className="relative group">
                <Image src="/logo.png" alt="Miravet Logo" width={180} height={54} className="h-14 w-auto" />
              </Link>
              <p className="text-[#64748b] text-lg font-medium leading-relaxed max-w-sm">
                Partenaire de confiance pour la grossisterie vétérinaire au Maroc. Innovation, expertise et engagement pour la santé animale.
              </p>

              <div className="flex gap-4">
                {[Facebook, Instagram, Linkedin, Mail].map((Icon, i) => (
                  <Link key={i} href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-all hover:bg-slate-50 hover:border-indigo-500/50 group">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[#0f172a] font-black text-xs uppercase tracking-[0.2em] opacity-60">Compagnie</h4>
              <ul className="space-y-4">
                <li><Link href="/our-story" className="text-[#64748b] font-bold text-base hover:text-indigo-600 transition-colors">Notre Histoire</Link></li>
                <li><Link href="/services" className="text-[#64748b] font-bold text-base hover:text-indigo-600 transition-colors">Nos Services</Link></li>
                <li><Link href="/solutions" className="text-[#64748b] font-bold text-base hover:text-indigo-600 transition-colors">Solutions Pro</Link></li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[#0f172a] font-black text-xs uppercase tracking-[0.2em] opacity-60">Support</h4>
              <ul className="space-y-4">
                <li><Link href="/contact" className="text-[#64748b] font-bold text-base hover:text-indigo-600 transition-colors">Contactez-nous</Link></li>
                <li><Link href="/faq" className="text-[#64748b] font-bold text-base hover:text-indigo-600 transition-colors">Support Tech</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Help */}
            <div className="lg:col-span-3 space-y-8">
              <h4 className="text-[#0f172a] font-black text-xs uppercase tracking-[0.2em] opacity-60">Accès Rapide</h4>
              <div className="space-y-5">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <span className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                    <PhoneCall className="w-4 h-4 text-indigo-500" />
                  </span>
                  <Link href="tel:+212522510025" className="text-[#0f172a] font-black text-lg hover:text-indigo-600 transition-colors">+212 5 22 51 00 25</Link>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100/50 w-fit mx-auto md:mx-0 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest leading-none">Live Support Open</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Footer */}
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <p className="text-[#94a3b8] font-bold text-sm">
              © {new Date().getFullYear()} <span className="text-[#0f172a]">Miravet</span>. Tous droits réservés.
            </p>
            <div className="flex gap-8">
              <Link href="#" className="text-[#94a3b8] font-bold text-xs hover:text-[#0f172a] transition-colors uppercase tracking-widest">Confidentialité</Link>
              <Link href="#" className="text-[#94a3b8] font-bold text-xs hover:text-[#0f172a] transition-colors uppercase tracking-widest">Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
