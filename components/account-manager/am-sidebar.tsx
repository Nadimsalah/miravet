"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingBag,
    Briefcase,
    LogOut,
    Menu,
    Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLanguage } from "@/components/language-provider"

export function AccountManagerSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { language } = useLanguage()
    const isFrench = language === "fr"

    const menuItems = [
        { icon: Users, label: isFrench ? "Mes clients" : "My Clients", href: "/manager/resellers" },
        { icon: ShoppingBag, label: isFrench ? "Commandes" : "Orders", href: "/manager/orders" },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        toast.success(isFrench ? "Déconnecté avec succès" : "Logged out successfully")
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border-r border-white/10">
            <div className="p-6 flex items-center justify-center border-b border-white/10">
                <Image
                    src={"/logo.png"}
                    alt={"Miravet"}
                    width={142}
                    height={40}
                    className={"h-10 w-auto"}
                />
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
                                <span className="font-medium">{item.label}</span>
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{isFrench ? "Se déconnecter" : "Logout"}</span>
                </Button>
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
                    <SheetTitle className="sr-only">Menu Gestionnaire de Compte</SheetTitle>
                    <SheetDescription className="sr-only">Accédez à vos clients et commandes</SheetDescription>
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
