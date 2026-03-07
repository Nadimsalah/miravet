"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { AdminSearch } from "@/components/admin/admin-search"
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Image as ImageIcon,
    MessageCircle,
    Phone,
    Briefcase,
    Truck,
    Shield,
    Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import Image from "next/image"

const menuItems = [
    { icon: LayoutDashboard, key: "admin.sidebar.dashboard", href: "/admin/dashboard" },
    { icon: ShoppingBag, key: "admin.sidebar.orders", href: "/admin/orders" },
    { icon: Package, key: "admin.sidebar.products", href: "/admin/products" },
    { icon: Users, key: "admin.sidebar.customers", href: "/admin/customers" },
    { icon: Briefcase, key: "admin.sidebar.resellers", href: "/admin/resellers" },
    { icon: Shield, key: "admin.sidebar.account_managers", href: "/admin/account-managers" },
    { icon: Truck, key: "admin.sidebar.delivery_men", href: "/admin/logisticiens" },
    { icon: Truck, key: "admin.sidebar.shipping", href: "/admin/shipping" },
    { icon: BarChart3, key: "admin.sidebar.analytics", href: "/admin/analytics" },
    { icon: ImageIcon, key: "admin.sidebar.hero_carousel", href: "/admin/hero-carousel" },
    // CRM / Marketing
    { icon: MessageCircle, key: "admin.sidebar.whatsapp_leads", href: "/admin/whatsapp" },
    { icon: Phone, key: "admin.sidebar.contact_messages", href: "/admin/contacts" },
    { icon: Briefcase, key: "admin.sidebar.career_applications", href: "/admin/careers" },
    { icon: Settings, key: "admin.sidebar.settings", href: "/admin/settings" },
    { icon: Award, key: "admin.sidebar.brands", href: "/admin/brands" },
]


export function AdminSidebar() {
    const pathname = usePathname()
    const { language, toggleLanguage, setLanguage, t } = useLanguage()


    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-r border-white/10">
            <div className="p-6 flex items-center justify-center border-b border-white/10">
                <Image
                    src={"/logo.png"}
                    alt={"Didali Store"}
                    width={142}
                    height={40}
                    className={"h-10 w-auto"}
                />
            </div>

            <div className="px-4 mt-6 mb-2">
                <AdminSearch className="w-full" />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 h-12 rounded-xl transition-all ${isActive
                                    ? "shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
                                    : "hover:bg-primary/5 hover:text-primary"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{t(item.key)}</span>
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 space-y-3 border-t border-white/10">

                <Link href="/admin/login">
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">{t("admin.sidebar.logout")}</span>
                    </Button>
                </Link>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 fixed inset-y-0 left-0 z-50">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50 rounded-full glass-strong">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 border-r border-white/10">
                    <SheetTitle className="sr-only">Menu d'administration</SheetTitle>
                    <SheetDescription className="sr-only">Sélectionnez une section de l'administration</SheetDescription>
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
