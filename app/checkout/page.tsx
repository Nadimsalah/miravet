"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/components/cart-provider"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Loader2, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CheckoutSummarySkeleton } from "@/components/ui/store-skeletons"
import { supabase } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getAdminSettings, getShippingSettings, ShippingSetting } from "@/lib/supabase-api"
import { formatPrice } from "@/lib/utils"

const MOROCCO_CITIES = [
    "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra",
    "Tetouan", "Safi", "Mohammedia", "Beni Mellal", "El Jadida", "Taza", "Nador", "Settat", "Larache",
    "Khemisset", "Khouribga", "Guelmim", "Errachidia", "Ouarzazate", "Essaouira", "El Kelaa des Sraghna"
].sort()

export default function CheckoutPage() {
    const { items, cartCount, isInitialized } = useCart()
    const { t, language } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [saveInfo, setSaveInfo] = useState(false)
    const [paymentSettings, setPaymentSettings] = useState<Record<string, string>>({})
    const [paymentMethod, setPaymentMethod] = useState("cod")
    const [userRole, setUserRole] = useState<string | null>(null)
    const [shippingSettings, setShippingSettings] = useState<ShippingSetting[]>([])

    // Form State
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        city: "",
        address: "",
    })

    // Redirect if cart is empty
    useEffect(() => {
        if (cartCount === 0) {
            router.push("/cart")
        }
    }, [cartCount, router])

    // Fetch user and profile for pre-filling, and settings
    useEffect(() => {
        const fetchUserAndProfile = async () => {
            const settingsData = await getAdminSettings()
            setPaymentSettings(settingsData)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUser(user)
                const { data: profile } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    setUserRole(profile.role)
                    setFormData(prev => ({
                        ...prev,
                        fullName: profile.name || prev.fullName,
                        email: profile.email || prev.email,
                        phone: profile.phone || prev.phone,
                        city: profile.city || prev.city
                    }))
                }
            }

            const shippingData = await getShippingSettings()
            setShippingSettings(shippingData)
        }
        fetchUserAndProfile()
    }, [])

    const isResellerAccount = userRole === 'reseller'

    // Get current shipping rule
    const currentShippingRule = shippingSettings.find(s => s.role === (isResellerAccount ? 'reseller' : 'retail'))

    // Calculate totals
    const subtotal = items.reduce((total, item) => {
        const price = (isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price
        return total + price * item.quantity
    }, 0)

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    let shipping = 50 // Default
    const isShippingDisabledGlobally = paymentSettings.shipping_enabled === 'false'

    if (isShippingDisabledGlobally) {
        shipping = 0
    } else if (currentShippingRule) {
        if (!currentShippingRule.enabled) {
            shipping = 0
        } else {
            const isFreeAmount = currentShippingRule.free_shipping_threshold > 0 && subtotal >= currentShippingRule.free_shipping_threshold
            const isFreeItems = currentShippingRule.free_shipping_min_items > 0 && totalItems >= currentShippingRule.free_shipping_min_items

            if (isFreeAmount || isFreeItems) {
                shipping = 0
            } else {
                shipping = currentShippingRule.base_price
            }
        }
    } else {
        shipping = subtotal >= 750 ? 0 : 50
    }

    const total = subtotal + shipping

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleCityChange = (value: string) => {
        setFormData(prev => ({ ...prev, city: value }))
        if (errors.city) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.city
                return newErrors
            })
        }
    }

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.fullName.trim()) newErrors.fullName = t('validation.required')
        if (!formData.city.trim()) newErrors.city = t('validation.required')
        if (!formData.address.trim()) newErrors.address = t('validation.required')

        // Phone validation (min 10 chars, rudimentary check)
        if (!formData.phone.trim() || formData.phone.length < 10) {
            newErrors.phone = t('validation.phone')
        }

        // Email validation (only if provided)
        if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = t('validation.email')
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error(t('validation.required'))
            return
        }

        setLoading(true)

        try {
            const itemsWithPrices = items.map(item => ({
                ...item,
                price: (isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price
            }))

            // Updated user profile if requested
            if (currentUser && saveInfo) {
                await supabase
                    .from('customers')
                    .update({
                        name: formData.fullName,
                        phone: formData.phone,
                        city: formData.city
                    })
                    .eq('id', currentUser.id)
            }

            const response = await fetch("/api/checkout/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    customerId: currentUser?.id,
                    cart: {
                        items: itemsWithPrices,
                        subtotal,
                        shipping,
                        total
                    },
                    paymentMethod: currentUser ? paymentMethod : 'cod'
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong")
            }

            if (data.redirectUrl) {
                // Save order details for success page
                localStorage.setItem("last_order", JSON.stringify({
                    items,
                    subtotal,
                    shipping,
                    total,
                    customerName: formData.fullName
                }))
                router.push(data.redirectUrl)
            }
        } catch (error) {
            console.error("Checkout Error:", error)
            toast.error("Failed to process checkout. Please try again.")
            setLoading(false)
        }
    }

    if (cartCount === 0) return null

    return (
        <div className="min-h-screen bg-background relative flex flex-col">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Simple Header */}
            <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="relative">
                        <Image src="/logo.png" alt="Didali Store" width={106} height={30} className="h-6 w-auto" />
                    </Link>
                    <Link href="/cart" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> {t('checkout.return_cart')}
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-6xl mx-auto">

                    {/* Left Column: Form */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{t('checkout.title')}</h1>
                            <p className="text-muted-foreground">{t('checkout.contact_info')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName">{t('checkout.full_name')} *</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Mohammed Kamal"
                                    className={`bg-background/50 h-10 ${errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground pointer-events-none z-10">
                                        <span className="text-base">🇲🇦</span>
                                        <span className="text-sm font-medium border-r border-border/50 pr-2 h-4 flex items-center">+212</span>
                                    </div>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="123 456 7890"
                                        className={`bg-background/50 h-10 pl-24 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                        dir="ltr"
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('checkout.email')}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className={`bg-background/50 h-10 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <Label htmlFor="city">{t('checkout.city')} *</Label>
                                <Select onValueChange={handleCityChange} value={formData.city}>
                                    <SelectTrigger className={`bg-background/50 h-10 ${errors.city ? "border-destructive ring-destructive" : ""}`}>
                                        <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOROCCO_CITIES.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('checkout.address')} *</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Street address, apartment, suite, etc."
                                    className={`bg-background/50 min-h-[100px] resize-none ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                            </div>

                            {/* Payment Method Selection (Logged in users only) */}
                            {currentUser && (
                                <div className="space-y-4 pt-2">
                                    <Label className="text-base font-semibold">
                                        {t('checkout.payment_method')}
                                    </Label>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                                        {/* COD */}
                                        {paymentSettings.payment_cod_enabled !== 'false' && (
                                            <div className={`flex items-start space-x-3 space-x-reverse rounded-xl border p-4 transition-all cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-accent/50'}`}>
                                                <RadioGroupItem value="cod" id="cod" className="mt-1" />
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor="cod" className="font-medium cursor-pointer">
                                                        {t('checkout.payment_cod')}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('checkout.payment_cod_desc')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Virement */}
                                        {paymentSettings.payment_virement_enabled === 'true' && (
                                            <div className={`flex flex-col rounded-xl border transition-all ${paymentMethod === 'virement' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'}`}>
                                                <div className="flex items-start space-x-3 space-x-reverse p-4 cursor-pointer" onClick={() => setPaymentMethod('virement')}>
                                                    <RadioGroupItem value="virement" id="virement" className="mt-1" />
                                                    <div className="flex-1 space-y-1">
                                                        <Label htmlFor="virement" className="font-medium cursor-pointer">
                                                            {t('checkout.payment_virement')}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t('checkout.payment_virement_desc')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'virement' && paymentSettings.payment_virement_details && (
                                                    <div className="px-4 pb-4 pl-10 text-xs text-muted-foreground whitespace-pre-line border-t border-primary/10 pt-3 mt-1">
                                                        {paymentSettings.payment_virement_details}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Cheque */}
                                        {paymentSettings.payment_cheque_enabled === 'true' && (
                                            <div className={`flex flex-col rounded-xl border transition-all ${paymentMethod === 'cheque' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'}`}>
                                                <div className="flex items-start space-x-3 space-x-reverse p-4 cursor-pointer" onClick={() => setPaymentMethod('cheque')}>
                                                    <RadioGroupItem value="cheque" id="cheque" className="mt-1" />
                                                    <div className="flex-1 space-y-1">
                                                        <Label htmlFor="cheque" className="font-medium cursor-pointer">
                                                            {t('checkout.payment_cheque')}
                                                        </Label>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'cheque' && paymentSettings.payment_cheque_details && (
                                                    <div className="px-4 pb-4 pl-10 text-xs text-muted-foreground whitespace-pre-line border-t border-primary/10 pt-3 mt-1">
                                                        {paymentSettings.payment_cheque_details}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </RadioGroup>
                                </div>
                            )}

                            {/* Save Info Checkbox */}
                            {currentUser && (
                                <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                                    <Checkbox
                                        id="saveInfo"
                                        checked={saveInfo}
                                        onCheckedChange={(checked) => setSaveInfo(checked as boolean)}
                                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <label
                                        htmlFor="saveInfo"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {t('checkout.save_info')}
                                    </label>
                                </div>
                            )}

                            {/* Submit Button (Mobile) */}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-full lg:hidden text-base h-12 shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t('checkout.processing')}
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5 mr-2" />
                                        {t('checkout.pay')} {formatPrice(total)} {t('common.currency')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {!isInitialized ? (
                            <CheckoutSummarySkeleton />
                        ) : (
                            <div className="glass-strong rounded-2xl p-6 sm:p-8">
                                <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                    {t('cart.order_summary')}
                                </h2>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item) => (
                                        <div key={`${item.id}-${item.size}`} className="flex gap-4 py-2">
                                            <div className="relative w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                                                <Image
                                                    src={item.image || "/placeholder.svg"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm text-foreground line-clamp-1">
                                                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                                                </h4>
                                                {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}
                                                <p className="text-sm font-semibold text-primary mt-1 whitespace-nowrap">
                                                    {t('common.currency')} {formatPrice(((isResellerAccount && item.resellerPrice) ? item.resellerPrice : item.price) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="my-6 h-px bg-border/50" />

                                {currentShippingRule && shipping > 0 && (
                                    <div className="mb-6 space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-primary flex items-center gap-1.5">
                                                <Truck className="w-3.5 h-3.5" />
                                                {language === 'ar' ? 'شحن مجاني' : 'Free Shipping'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {language === 'ar'
                                                    ? `باقي ${formatPrice(Math.max(0, currentShippingRule.free_shipping_threshold - subtotal))} ${t('common.currency')}`
                                                    : `${formatPrice(Math.max(0, currentShippingRule.free_shipping_threshold - subtotal))} ${t('common.currency')} left`
                                                }
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, (subtotal / currentShippingRule.free_shipping_threshold) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t('cart.subtotal')}</span>
                                        <span className="font-medium text-foreground whitespace-nowrap">{t('common.currency')} {formatPrice(subtotal)}</span>
                                    </div>
                                    {!isShippingDisabledGlobally && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>{t('cart.shipping')}</span>
                                            <span className="font-medium text-foreground">
                                                {shipping === 0 ? t('cart.free') : `${t('common.currency')} ${formatPrice(shipping)}`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-foreground pt-3 border-t border-border/50">
                                        <span>{t('cart.total')}</span>
                                        <span className="whitespace-nowrap">{t('common.currency')} {formatPrice(total)}</span>
                                    </div>
                                </div>

                                {/* Submit Button (Desktop) */}
                                <Button
                                    onClick={handleSubmit}
                                    size="lg"
                                    className="w-full rounded-full hidden lg:flex mt-8 text-base h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {t('checkout.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5 mr-2" />
                                            {t('checkout.pay')} {formatPrice(total)} {t('common.currency')}
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                    <Truck className="w-3 h-3" /> {t('cart.trust.shipping')}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
            {/* Footer */}
            <footer className="bg-background border-t border-border/40 py-16 sm:py-20 relative overflow-hidden print:hidden mt-auto">
                <div className="container mx-auto px-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                        {/* Brand Column */}
                        <div className="md:col-span-4 lg:col-span-5 space-y-6">
                            <Link href="/" className="inline-block">
                                <Image
                                    src="/logo.png"
                                    alt="Didali Store"
                                    width={142}
                                    height={40}
                                    className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
                                />
                            </Link>
                            <p className="text-muted-foreground/80 max-w-sm leading-relaxed text-sm text-left">
                                Didali Store - Your trusted partner for IT hardware and solutions in Morocco. Empowering businesses with technology.
                            </p>
                        </div>

                        {/* Links Columns */}
                        <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                            <div className="text-left">
                                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Company</h4>
                                <ul className="space-y-4 text-sm text-muted-foreground">
                                    <li><Link href="/our-story" className="hover:text-primary transition-colors block py-1">Our Story</Link></li>
                                    <li><Link href="/sustainability" className="hover:text-primary transition-colors block py-1">Sustainability</Link></li>
                                    <li><Link href="/press" className="hover:text-primary transition-colors block py-1">Press</Link></li>
                                    <li><Link href="/careers" className="hover:text-primary transition-colors block py-1">Careers</Link></li>
                                </ul>
                            </div>

                            <div className="text-left">
                                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Support</h4>
                                <ul className="space-y-4 text-sm text-muted-foreground">
                                    <li><Link href="/contact" className="hover:text-primary transition-colors block py-1">Contact Us</Link></li>
                                    <li><Link href="/shipping-info" className="hover:text-primary transition-colors block py-1">Shipping Info</Link></li>
                                    <li><Link href="/track-order" className="hover:text-primary transition-colors block py-1">Track Order</Link></li>
                                    <li><Link href="/faq" className="hover:text-primary transition-colors block py-1">FAQ</Link></li>
                                </ul>
                            </div>

                            <div className="text-left">
                                <h4 className="font-semibold text-foreground text-sm tracking-wide uppercase mb-6">Legal</h4>
                                <ul className="space-y-4 text-sm text-muted-foreground">
                                    <li><Link href="/privacy-policy" className="hover:text-primary transition-colors block py-1">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="hover:text-primary transition-colors block py-1">Terms of Service</Link></li>
                                    <li><Link href="/refund-policy" className="hover:text-primary transition-colors block py-1">Refund Policy</Link></li>
                                    <li><Link href="/cookies" className="hover:text-primary transition-colors block py-1">Cookies</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} Didali Store. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
