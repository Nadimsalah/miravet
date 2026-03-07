"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { getProducts, getHeroCarouselItems, getCategories, getBrands, getAdminSettings, getCurrentUserRole, getCurrentResellerTier, type Product, type Brand, ResellerTier } from "@/lib/supabase-api"
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
  User,
  LayoutDashboard,
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
  return <>{cartCount}</>
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
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        {t('common.currency')} {formatPrice(tierPrice / 1.2)} <span className="text-[10px] font-normal text-muted-foreground">HT</span>
                      </span>
                      <span className="text-[9px] sm:text-xs text-muted-foreground line-through decoration-destructive/30">
                        {t('common.currency')} {formatPrice(product.price)} <span className="text-[8px] font-normal">TTC</span>
                      </span>
                    </>
                  )
                }

                return (
                  <span className="text-xs sm:text-base font-bold text-foreground">
                    {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
                  </span>
                )
              })()
            ) : (
              <span className="text-xs sm:text-base font-bold text-foreground">
                {t('common.currency')} {formatPrice(product.price)} <span className="text-[10px] font-normal text-muted-foreground">TTC</span>
              </span>
            )}
          </div>
          <Button
            size="icon"
            className={cn(
              "w-8 h-8 sm:w-auto sm:h-9 sm:px-4 rounded-full text-[10px] sm:text-xs pointer-events-none",
              product.stock <= 0 && "bg-muted text-muted-foreground opacity-70"
            )}
          >
            <ShoppingBag className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">
              {product.stock > 0 ? t('product.add_to_cart') : t('product.out_of_stock')}
            </span>
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
            .map(item => ({
              image: String(item.image_url || '/placeholder.jpg'),
              title: String(item.title || ''),
              subtitle: String(item.subtitle || ''),
              link: item.link ? String(item.link) : null
            }));

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
          image: '/hero-showcase-1.jpg',
          title: 'خوادم عالية الأداء',
          subtitle: 'قوة لمشروعك'
        },
        {
          image: '/hero-showcase-2.jpg',
          title: 'أجهزة لابتوب حديثة',
          subtitle: 'اعمل في أي وقت ومكان'
        },
        {
          image: '/hero-showcase-3.jpg',
          title: 'مكونات الألعاب',
          subtitle: 'أطلق العنان لقدراتك'
        },
        {
          image: '/hero-showcase-4.jpg',
          title: 'طابعات احترافية',
          subtitle: 'دقة وسرعة وموثوقية'
        },
        {
          image: '/hero-showcase-5.jpg',
          title: 'حلول الشبكات',
          subtitle: 'تواصل بثقة'
        },
        {
          image: '/hero-showcase-6.jpg',
          title: 'متجر ديدالي',
          subtitle: 'شريكك التقني الموثوق'
        }
      ] : [
        {
          image: '/hero-showcase-1.jpg',
          title: 'High-Performance Servers',
          subtitle: 'Powering Your Enterprise'
        },
        {
          image: '/hero-showcase-2.jpg',
          title: 'Next-Gen Laptops',
          subtitle: 'Work Anywhere, Anytime'
        },
        {
          image: '/hero-showcase-3.jpg',
          title: 'Gaming Components',
          subtitle: 'Unleash Your Potential'
        },
        {
          image: '/hero-showcase-4.jpg',
          title: 'Professional Printers',
          subtitle: 'Sharp, Fast, Reliable'
        },
        {
          image: '/hero-showcase-5.jpg',
          title: 'Network Solutions',
          subtitle: 'Connect with Confidence'
        },
        {
          image: '/hero-showcase-6.jpg',
          title: 'Didali Store',
          subtitle: 'Your Trusted IT Partner'
        }
      ];

      setCarouselItems(fallbackItems);
      setLoading(false);
    }

    loadCarouselItems();
    return () => { isMounted = false; };
  }, [language])

  if (loading) {
    return <HeroCarouselSkeleton />
  }

  return <ModernHeroCarousel items={carouselItems} />
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [visibleProducts, setVisibleProducts] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { t, language, toggleLanguage, dir } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [resellerTier, setResellerTier] = useState<ResellerTier>(null)
  const [shippingEnabled, setShippingEnabled] = useState(true)

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string }[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})

  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [productsData, categoriesData, settingsData, userData, roleData, tierData, brandsData] = await Promise.all([
          getProducts({ status: 'active', limit: 50 }),
          getCategories(),
          getAdminSettings(),
          supabase.auth.getUser(),
          getCurrentUserRole(),
          getCurrentResellerTier(),
          getBrands()
        ])

        setProducts(productsData || [])
        setCategories(categoriesData || [])
        setSettings(settingsData || {})
        setUser(userData.data.user)
        setUserRole(roleData)
        setResellerTier(tierData)
        setBrands(brandsData || [])
        setShippingEnabled(settingsData.shipping_enabled !== 'false')
      } catch (e) {
        console.error("Failed to load home page data", e)
        // Ensure UI doesn't break
        setProducts([])
        setCategories([])
        setSettings({})
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const headerCategories: { id: string, name: string, slug: string, name_ar?: string }[] =
    categories.length > 0
      ? categories
      : ([
        { slug: 'laptops', name: 'Laptops', name_ar: 'أجهزة لابتوب' },
        { slug: 'components', name: 'Components', name_ar: 'مكونات' },
        { slug: 'monitors', name: 'Monitors', name_ar: 'شاشات' },
        { slug: 'printers', name: 'Printers', name_ar: 'طابعات' },
        { slug: 'servers', name: 'Servers', name_ar: 'خوادم' },
        { slug: 'accessories', name: 'Accessories', name_ar: 'إكسسوارات' }
      ] as const).map((cat) => ({
        id: cat.slug,
        name: cat.name,
        slug: cat.slug,
        name_ar: cat.name_ar
      }))

  const allCategories = ["All", ...headerCategories.filter(c => c && c.slug).map(c => c.slug)]

  const getCategoryLabel = (cat: string) => {
    if (!cat || cat === "All") return t('section.all_categories')
    const category = categories.find(c => c.slug === cat)
    // Fallback translation map for categories when DB name_ar is missing
    const categoryMapAr: Record<string, string> = {
      laptops: 'أجهزة لابتوب',
      components: 'مكونات',
      monitors: 'شاشات',
      printers: 'طابعات',
      servers: 'خوادم',
      accessories: 'إكسسوارات',
      desktops: 'أجهزة مكتبية'
    }
    const categoryMapFr: Record<string, string> = {
      laptops: 'Ordinateurs Portables',
      components: 'Composants',
      monitors: 'Écrans',
      printers: 'Imprimantes',
      servers: 'Serveurs',
      accessories: 'Accessoires',
      desktops: 'Ordinateurs de Bureau'
    }

    if (category) {
      if (language === 'ar') {
        return category.name_ar || categoryMapAr[cat] || category.name || cat
      }
      if (language === 'fr') {
        return categoryMapFr[cat] || category.name || cat
      }
      return category.name || cat
    }


    if (language === 'ar') return categoryMapAr[cat] || cat
    if (language === 'fr') return categoryMapFr[cat] || cat
    return cat
  }

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory)

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ]

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
      </div>



      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled ? "glass-strong py-2" : "bg-transparent py-4"
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex-shrink-0 relative group">
              <Image
                src={"/logo.png"}
                alt={"Didali Store"}
                width={100}
                height={28}
                className={"h-8 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105"}
              />
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Link href="/search">
                <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>

              <Link href={user ? "/reseller/dashboard" : "/login"}>
                <Button variant="ghost" size="icon" className="hidden sm:flex rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                  <User className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/5 hover:text-primary transition-all group">
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold group-hover:scale-110 transition-transform">
                    <CartCount />
                  </span>
                </Button>
              </Link>


              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 border-0">
                  <div className="flex flex-col h-full bg-background" dir={dir}>
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <SheetTitle className="text-left">
                        <Image
                          src={"/logo.png"}
                          alt={"Didali Store"}
                          width={100}
                          height={28}
                          className={"h-8 w-auto mb-4"}
                        />
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Menu de navigation pour Didali Store
                      </SheetDescription>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetClose>
                    </div>

                    {/* Mobile Menu Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-8">
                        {/* Search Bar in Menu */}
                        <div className="relative">
                          <SheetClose asChild>
                            <Link href="/search" className="block">
                              <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/50 border border-border/50 text-muted-foreground transition-all active:scale-[0.98]">
                                <Search className="w-5 h-5" />
                                <span>{t('nav.search')}...</span>
                              </div>
                            </Link>
                          </SheetClose>
                        </div>

                        {/* Categories Section */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            {t('header.categories')}
                          </h3>
                          <nav className="grid gap-2">
                            <SheetClose asChild>
                              <Link
                                href="/#shop"
                                onClick={() => setSelectedCategory("All")}
                                className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group active:scale-[0.98]"
                              >
                                <span className="font-medium text-lg">{t('section.all_categories')}</span>
                                <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                              </Link>
                            </SheetClose>
                            {headerCategories.map((cat) => (
                              <SheetClose key={cat.id} asChild>
                                <Link
                                  href={`/#shop`}
                                  onClick={() => setSelectedCategory(cat.slug)}
                                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all group active:scale-[0.98]"
                                >
                                  <span className="font-medium text-lg">
                                    {language === 'ar' && 'name_ar' in cat ? cat.name_ar : cat.name}
                                  </span>
                                  <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:text-primary transition-all ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                </Link>
                              </SheetClose>
                            ))}
                          </nav>
                        </div>

                        {/* Mobile Promo Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/20 border border-primary/10">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                            {language === 'ar' ? 'عرض خاص' : 'Special Offer'}
                          </span>
                          <p className="font-medium text-foreground">
                            {language === 'ar'
                              ? (settings.promo_title_ar || settings.promo_title || "خصم ٢٠٪ على طلبك الأول")
                              : (settings.promo_title || "20% off your first order")
                            }
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {language === 'ar' ? "استخدم كود" : "Use code"} <span className="font-bold text-primary">{settings.promo_code || "DEDALI20"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Menu Footer */}
                    <div className="p-6 border-t border-border/50 space-y-3">
                      <SheetClose asChild>
                        <Button className="w-full h-12 rounded-full shadow-lg shadow-primary/20 text-lg font-semibold" asChild>
                          <Link href="/#shop">{t('nav.shop_now')}</Link>
                        </Button>
                      </SheetClose>

                      <div className="grid grid-cols-2 gap-3">
                        <SheetClose asChild>
                          <Link href="/search" className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-full bg-secondary/30 border-border/50">
                              <Search className="w-4 h-4 mx-2" />
                              {t('nav.search')}
                            </Button>
                          </Link>
                        </SheetClose>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-full bg-secondary/30 border-border/50 font-bold"
                          onClick={toggleLanguage}
                        >
                          {language === 'en' ? '🇺🇸 EN' : '🇫🇷 FR'}
                        </Button>
                        <SheetClose asChild>
                          <Link href={userRole === 'reseller' ? "/reseller/dashboard" : "/login"} className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-full bg-primary/10 border-primary/20 hover:bg-primary hover:text-white transition-colors">
                              {userRole === 'reseller' ? <LayoutDashboard className="w-4 h-4 mx-2" /> : <User className="w-4 h-4 mx-2" />}
                              {userRole === 'reseller'
                                ? (language === 'ar' ? "لوحة التحكم" : "Dashboard")
                                : (language === 'ar' ? "دخول / تسجيل" : "Login / Register")
                              }
                            </Button>
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 lg:py-16 xl:py-20 min-h-[60vh] flex items-center">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
            <div className="space-y-6 lg:space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-[1.1] text-balance" suppressHydrationWarning>
                {language === 'ar' ? (
                  settings.hero_title_ar || settings.hero_title || (
                    <>
                      {t('hero.title_prefix')} <span className="text-primary">{t('hero.title_suffix')}</span>
                    </>
                  )
                ) : (
                  settings.hero_title || (
                    <>
                      {t('hero.title_prefix')} <span className="text-primary">{t('hero.title_suffix')}</span>
                    </>
                  )
                )}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg" suppressHydrationWarning>
                {language === 'ar'
                  ? (settings.hero_subtitle_ar || settings.hero_subtitle || t('hero.subtitle'))
                  : (settings.hero_subtitle || t('hero.subtitle'))
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary CTA → Shop Section */}
                <Button asChild size="lg" className="rounded-full text-base px-8 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Link href="/#shop">
                    {t('nav.shop_now')}
                  </Link>
                </Button>

                {/* Secondary CTA → Search Page */}
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base px-8 bg-transparent border-primary/20 hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all"
                >
                  <Link href="/search">
                    <Search className={`w-4 h-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.search')}
                  </Link>
                </Button>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-4">
                {shippingEnabled && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="text-sm">{t('hero.fast_delivery')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm">{t('hero.secure_checkout')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span className="text-sm">{t('hero.easy_returns')}</span>
                </div>
              </div>
            </div>

            {/* Hero 3D Glass Carousel */}
            <div className="relative">
              <HeroCarousel products={products.slice(0, 6)} />
            </div>
          </div>
        </div>
      </section>



      {/* Best Sellers */}
      <section id="shop" className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('section.best_sellers')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('section.best_sellers_desc')}
            </p>
          </div>
          <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-3 mb-10 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:justify-center">
            {allCategories.map((cat) => (
              <div key={cat} className="flex-shrink-0">
                <Button
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`rounded-full px-6 transition-all duration-300 ${selectedCategory === cat
                    ? "shadow-lg shadow-primary/25 scale-105"
                    : "hover:scale-105"
                    }`}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setVisibleProducts(10) // Reset visible count on switch
                  }}
                >
                  {getCategoryLabel(cat)}
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-5 xl:gap-6 animate-in fade-in duration-500">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : (
              filteredProducts.slice(0, visibleProducts).map((product, i) => (
                <ProductCard
                  key={`${product.id}-${selectedCategory}`}
                  product={product}
                  userRole={userRole}
                  resellerTier={resellerTier}
                />
              ))
            )}
          </div>
          {visibleProducts < filteredProducts.length && (
            <div className="text-center mt-10">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent"
                onClick={() => setVisibleProducts(prev => prev + 10)}
              >
                {t('section.load_more')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Brands Showcase - Smaller logos, cleaner grid */}
      {brands.length > 0 && (
        <section className="py-20 sm:py-32 relative overflow-hidden bg-background">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Sparkles className="w-3 h-3" />
                Nos Partenaires
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
                MARQUES OFFICIELLES
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg border-l-2 border-primary/20 pl-6 text-left sm:text-center sm:pl-0 sm:border-l-0">
                Retrouvez les plus grands noms de la technologie, certifiés et garantis par Didali Store.
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 md:gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brand/${brand.slug}`}
                  className="group relative glass rounded-2xl p-4 sm:p-5 flex items-center justify-center aspect-square transition-all duration-700 hover:shadow-[0_20px_40px_-20px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-1 border border-white/5 hover:border-primary/20 bg-secondary/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />

                  <div className="relative w-full h-full flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        className="object-contain p-2 sm:p-3"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground/60 group-hover:text-primary transition-colors text-center uppercase tracking-tighter line-clamp-2">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  {/* Tooltip-like label on hover */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap shadow-xl z-20">
                    {brand.name}
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 bg-secondary/5">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-foreground sm:text-4xl font-bold mb-4">{t('faq.title')}</h2>
            <p className="text-muted-foreground">{t('faq.subtitle')}</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass rounded-2xl px-6 border-0 data-[state=open]:shadow-lg transition-all duration-300">
                <AccordionTrigger className="text-lg font-medium hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* WhatsApp Subscription */}
      <section className="py-16 sm:py-20 relative">
        <div className="container mx-auto px-4 max-w-2xl">
          <WhatsAppSubscription />
        </div>
      </section>

      {/* Certifications Section Removed for IT Store */}

      {/* Footer */}
      <footer className="bg-background border-t border-border/40 py-16 sm:py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

            {/* Brand Column */}
            <div className="md:col-span-4 lg:col-span-5 space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src={"/logo.png"}
                  alt={"Didali Store"}
                  width={142}
                  height={40}
                  className={"h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"}
                />
              </Link>
              <p className="text-muted-foreground/80 max-w-sm leading-relaxed text-sm">
                {t('footer.about_desc')}
              </p>
              <div className="flex gap-3">
                {/* Social icons removed per user request */}
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.company')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li>
                    <Link href="/our-story" className="hover:text-primary transition-colors block py-1">
                      {t('footer.our_story')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/sustainability" className="hover:text-primary transition-colors block py-1">
                      {t('footer.sustainability')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/press" className="hover:text-primary transition-colors block py-1">
                      {t('footer.press')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-primary transition-colors block py-1">
                      {t('footer.careers')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.support')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/contact" className="hover:text-primary transition-colors block py-1">{t('footer.contact_us')}</Link></li>
                  <li><Link href="/shipping-info" className="hover:text-primary transition-colors block py-1">{t('footer.shipping_info')}</Link></li>
                  <li><Link href="/track-order" className="hover:text-primary transition-colors block py-1">{t('footer.track_order')}</Link></li>
                  <li><Link href="/faq" className="hover:text-primary transition-colors block py-1">{t('nav.faq')}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Équipe</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/manager/login" className="hover:text-primary transition-colors block py-1">Espace Commercial</Link></li>
                  <li><Link href="/logistique/login" className="hover:text-primary transition-colors block py-1">Espace Logisticien</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">{t('footer.legal')}</h4>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li><Link href="/privacy-policy" className="hover:text-primary transition-colors block py-1">{t('footer.privacy_policy')}</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors block py-1">{t('footer.terms')}</Link></li>
                  <li><Link href="/refund-policy" className="hover:text-primary transition-colors block py-1">{t('footer.refund_policy')}</Link></li>
                  <li><Link href="/cookies" className="hover:text-primary transition-colors block py-1">{t('footer.cookies')}</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Didali Store. {t('footer.rights')}</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">{t('footer.privacy_short')}</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">{t('footer.terms_short')}</Link>
              {/* System status removed per user request */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
