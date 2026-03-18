"use client"

import { useState, useEffect } from "react"
import {
    Save,
    Loader2,
    RotateCcw,
    Globe,
    Bell,
    Mail,
    Shield,
    Smartphone,
    Send,
    CreditCard,
    Settings as SettingsIcon,
    Megaphone,
    MessageSquare,
    Lock,
    Eye,
    EyeOff,
    Sparkles,
    Users,
    Link as LinkIcon,
    Truck,
    Copy,
    ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { getAdminSettings, updateAdminSettings } from "@/lib/supabase-api"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/components/language-provider"

export default function SettingsPage() {
    const { t } = useLanguage()
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [showPin, setShowPin] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [origin, setOrigin] = useState("")

    useEffect(() => {
        setOrigin(window.location.origin)
        loadSettings()
    }, [])

    const handleCopy = (path: string) => {
        const url = `${origin}${path}`
        navigator.clipboard.writeText(url)
        toast.success("Lien copié dans le presse-papiers")
    }

    async function loadSettings() {
        setLoading(true)
        const data = await getAdminSettings()
        setSettings(data)
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const result = await updateAdminSettings(settings)
        if (result.success) {
            toast.success(t("admin.settings.toast.success"))
        } else {
            toast.error(t("admin.settings.toast.error"))
        }
        setSaving(false)
    }

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    async function handleTestNotification() {
        setTesting(true)
        try {
            const response = await fetch('/api/admin/push/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: "System Test ⚡",
                    body: "Connection established. You are now receiving administrative alerts for Miravet.",
                    tag: 'test-push'
                })
            })
            const data = await response.json()
            if (data.sent > 0) {
                toast.success(t("admin.settings.toast.push_sent").replace("{count}", data.sent.toString()))
            } else {
                toast.error(t("admin.settings.toast.push_no_sub"))
            }
        } catch (error) {
            toast.error(t("admin.settings.toast.push_fail"))
        } finally {
            setTesting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const sections = [
        { id: "general", label: t("admin.settings.tabs.general"), icon: Globe },
        { id: "marketing", label: t("admin.settings.tabs.marketing"), icon: Megaphone },
        { id: "payments", label: t("admin.settings.tabs.payments"), icon: CreditCard },
        { id: "notifications", label: t("admin.settings.tabs.alerts"), icon: Bell },
        { id: "security", label: t("admin.settings.tabs.security"), icon: Lock },
    ]

    return (
        <div className="flex min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-4 sm:p-8 relative z-10 transition-all duration-500">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Glass Header */}
                    <header className="glass-strong p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                                <SettingsIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{t("admin.settings.title")}</h1>
                                <p className="text-sm text-muted-foreground font-medium">{t("admin.settings.subtitle")}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={loadSettings}
                                className="rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {t("admin.settings.reset")}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {t("admin.settings.update")}
                            </Button>
                        </div>
                    </header>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                        <TabsList className="glass-subtle p-1 rounded-2xl h-auto flex-wrap justify-start border-white/10 dark:border-white/5">
                            {sections.map(section => (
                                <TabsTrigger
                                    key={section.id}
                                    value={section.id}
                                    className="rounded-xl px-5 py-2.5 data-[state=active]:glass-strong data-[state=active]:shadow-md transition-all flex items-center gap-2"
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.label}
                                </TabsTrigger>
                            ))}
                            <TabsTrigger
                                value="team"
                                className="rounded-xl px-5 py-2.5 data-[state=active]:glass-strong data-[state=active]:shadow-md transition-all flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                {t("admin.settings.tabs.team")}
                            </TabsTrigger>
                        </TabsList>

                        <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* General Settings */}
                            <TabsContent value="general" className="space-y-6 m-0">


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-6">
                                        <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Globe className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <h3 className="font-bold text-lg">{t("admin.settings.general.identity_title")}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.general.label.store_name")}</label>
                                                <Input
                                                    value={settings.store_name || ""}
                                                    onChange={(e) => handleChange("store_name", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10 focus:bg-white/10"
                                                    placeholder="Miravet"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.general.label.support_email")}</label>
                                                <Input
                                                    type="email"
                                                    value={settings.support_email || ""}
                                                    onChange={(e) => handleChange("support_email", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10 focus:bg-white/10"
                                                    placeholder="it-support@dedali.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.general.label.currency")}</label>
                                                <Input
                                                    value={settings.currency || ""}
                                                    onChange={(e) => handleChange("currency", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10 focus:bg-white/10 font-mono"
                                                    placeholder="MAD"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-6">
                                        <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <MessageSquare className="w-5 h-5 text-green-500" />
                                            </div>
                                            <h3 className="font-bold text-lg">{t("admin.settings.general.channels_title")}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.general.label.whatsapp")}</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        value={settings.whatsapp_number || ""}
                                                        onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                                                        className="rounded-xl h-12 pl-12 bg-white/5 border-white/10"
                                                        placeholder="+212 6XX-XXXXXX"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.general.label.phone")}</label>
                                                <Input
                                                    value={settings.contact_phone || ""}
                                                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10"
                                                    placeholder="+212 5XX-XXXXXX"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Marketing Settings */}
                            <TabsContent value="marketing" className="space-y-6 m-0">
                                <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-8">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <Megaphone className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <h3 className="font-bold text-lg">{t("admin.settings.marketing.title")}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* EN Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-widest uppercase">{t("admin.settings.marketing.label.en_content")}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.marketing.label.announcement")}</label>
                                                <textarea
                                                    rows={2}
                                                    value={settings.announcement_bar || ""}
                                                    onChange={(e) => handleChange("announcement_bar", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none"
                                                    placeholder="Exclusive deals on Workstations | Free Shipping on Orders over 1000 MAD"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.marketing.label.hero_title")}</label>
                                                <Input
                                                    value={settings.hero_title || ""}
                                                    onChange={(e) => handleChange("hero_title", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10"
                                                    placeholder="Next-Gen IT Infrastructure"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold ml-1">{t("admin.settings.marketing.label.hero_subtitle")}</label>
                                                <textarea
                                                    rows={3}
                                                    value={settings.hero_subtitle || ""}
                                                    onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none"
                                                    placeholder="Empowering your business with high-performance hardware..."
                                                />
                                            </div>
                                        </div>

                                        {/* AR Section */}
                                        <div className="space-y-6" dir="rtl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-widest uppercase">{t("admin.settings.marketing.label.ar_content")}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold mr-1">الإعلان العلوي</label>
                                                <textarea
                                                    rows={2}
                                                    value={settings.announcement_bar_ar || ""}
                                                    onChange={(e) => handleChange("announcement_bar_ar", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none font-arabic"
                                                    placeholder="عروض حصرية على محطات العمل | شحن مجاني للطلبات فوق ١٠٠٠ د.م"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold mr-1">عنوان البانر الرئيسي</label>
                                                <Input
                                                    value={settings.hero_title_ar || ""}
                                                    onChange={(e) => handleChange("hero_title_ar", e.target.value)}
                                                    className="rounded-xl h-12 bg-white/5 border-white/10 font-arabic"
                                                    placeholder="بنية تحتية لتقنية المعلومات من الجيل القادم"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold mr-1">الوصف الفرعي</label>
                                                <textarea
                                                    rows={3}
                                                    value={settings.hero_subtitle_ar || ""}
                                                    onChange={(e) => handleChange("hero_subtitle_ar", e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none transition-all text-sm resize-none font-arabic"
                                                    placeholder="تمكين عملك بأجهزة عالية الأداء وحلول تقنية مبتكرة..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/10">
                                        <div className="max-w-xs space-y-2">
                                            <label className="text-sm font-bold ml-1">{t("admin.settings.marketing.label.promo_code")}</label>
                                            <Input
                                                value={settings.promo_code || ""}
                                                onChange={(e) => handleChange("promo_code", e.target.value)}
                                                className="rounded-xl h-12 bg-primary/5 border-primary/20 font-bold uppercase tracking-widest text-primary focus:bg-primary/10 transition-all placeholder:text-primary/30"
                                                placeholder="TECH2026"
                                            />
                                            <p className="text-[10px] text-muted-foreground ml-1 italic">{t("admin.settings.marketing.promo_desc")}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Payment Settings */}
                            <TabsContent value="payments" className="space-y-6 m-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-6 h-fit">
                                        <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <h3 className="font-bold text-lg">{t("admin.settings.payments.gateways_title")}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm">{t("admin.settings.payments.cod_title")}</p>
                                                    <p className="text-xs text-muted-foreground">{t("admin.settings.payments.cod_desc")}</p>
                                                </div>
                                                <Switch
                                                    checked={settings.payment_cod_enabled !== "false"}
                                                    onCheckedChange={(checked) => handleChange("payment_cod_enabled", checked ? "true" : "false")}
                                                />
                                            </div>

                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm">{t("admin.settings.payments.cheque_title")}</p>
                                                    <p className="text-xs text-muted-foreground">{t("admin.settings.payments.cheque_desc")}</p>
                                                </div>
                                                <Switch
                                                    checked={settings.payment_cheque_enabled === "true"}
                                                    onCheckedChange={(checked) => handleChange("payment_cheque_enabled", checked ? "true" : "false")}
                                                />
                                            </div>

                                            {settings.payment_cheque_enabled === "true" && (
                                                <div className="animate-in slide-in-from-top-4 duration-300">
                                                    <label className="text-xs font-bold text-muted-foreground m-1 mb-2 block tracking-wider uppercase">{t("admin.settings.payments.label.payee_info")}</label>
                                                    <textarea
                                                        rows={3}
                                                        value={settings.payment_cheque_details || ""}
                                                        onChange={(e) => handleChange("payment_cheque_details", e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-xs font-mono"
                                                        placeholder="Payable à : Miravet SARL..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-6">
                                        <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <RotateCcw className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <h3 className="font-bold text-lg">{t("admin.settings.payments.wire_title")}</h3>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm">{t("admin.settings.payments.transfer_title")}</p>
                                                    <p className="text-xs text-muted-foreground">{t("admin.settings.payments.transfer_desc")}</p>
                                                </div>
                                                <Switch
                                                    checked={settings.payment_virement_enabled === "true"}
                                                    onCheckedChange={(checked) => handleChange("payment_virement_enabled", checked ? "true" : "false")}
                                                />
                                            </div>

                                            {settings.payment_virement_enabled === "true" && (
                                                <div className="animate-in slide-in-from-top-4 duration-300 space-y-3">
                                                    <label className="text-xs font-bold text-muted-foreground m-1 tracking-wider uppercase">{t("admin.settings.payments.label.banking_details")}</label>
                                                    <textarea
                                                        rows={6}
                                                        value={settings.payment_virement_details || ""}
                                                        onChange={(e) => handleChange("payment_virement_details", e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-xs font-mono leading-relaxed"
                                                        placeholder="BANQUE : Attijariwafa Bank&#10;RIB : 007 000 0000000000000000 00&#10;BÉNÉFICIAIRE : DEDALI STORE"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Notification Settings */}
                            <TabsContent value="notifications" className="space-y-6 m-0">
                                <div className="max-w-2xl mx-auto glass rounded-3xl p-10 border-white/20 shadow-2xl space-y-10">
                                    <div className="text-center space-y-3">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 animate-pulse">
                                            <Bell className="w-10 h-10 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-bold">{t("admin.settings.alerts.title")}</h2>
                                        <p className="text-sm text-muted-foreground text-balance">{t("admin.settings.alerts.desc")}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="font-bold text-base">{t("admin.settings.alerts.global_toggle")}</p>
                                                <p className="text-xs text-muted-foreground">{t("admin.settings.alerts.global_desc")}</p>
                                            </div>
                                            <Switch
                                                checked={settings.push_notifications_enabled === "true"}
                                                onCheckedChange={(checked) => handleChange("push_notifications_enabled", checked ? "true" : "false")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.dispatchEvent(new CustomEvent('show-push-prompt'))}
                                                className="rounded-2xl h-14 border-white/10 hover:bg-white/5 transition-all text-sm font-bold"
                                            >
                                                <Smartphone className="w-4 h-4 mr-3" />
                                                {t("admin.settings.alerts.register_device")}
                                            </Button>
                                            <Button
                                                onClick={handleTestNotification}
                                                disabled={testing}
                                                className="rounded-2xl h-14 bg-primary/10 hover:bg-primary/20 text-primary border-none text-sm font-bold shadow-none"
                                            >
                                                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Send className="w-4 h-4 mr-3" />}
                                                {t("admin.settings.alerts.send_ping")}
                                            </Button>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <Shield className="w-4 h-4 font-bold" />
                                                <h4 className="text-xs font-bold uppercase tracking-widest">{t("admin.settings.alerts.guide_title")}</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-blue-400/80 leading-relaxed font-medium">
                                                <div className="space-y-2">
                                                    <p className="text-blue-500 font-bold">{t("admin.settings.alerts.guide_ios_title")}</p>
                                                    <p>{t("admin.settings.alerts.guide_ios_desc")}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-blue-500 font-bold">{t("admin.settings.alerts.guide_android_title")}</p>
                                                    <p>{t("admin.settings.alerts.guide_android_desc")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Security Settings */}
                            <TabsContent value="security" className="space-y-6 m-0">
                                <div className="max-w-md mx-auto glass rounded-3xl p-10 border-white/20 shadow-2xl space-y-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                                        <Lock className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">{t("admin.settings.security.title")}</h3>
                                        <p className="text-xs text-muted-foreground">{t("admin.settings.security.desc")}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{t("admin.settings.security.label.pin")}</label>
                                            <div className="relative">
                                                <Input
                                                    type={showPin ? "text" : "password"}
                                                    value={settings.admin_pin || ""}
                                                    onChange={(e) => handleChange("admin_pin", e.target.value)}
                                                    className="rounded-2xl h-14 bg-black/20 border-white/10 text-center text-3xl tracking-widest font-mono focus:border-red-500/40"
                                                    maxLength={12}
                                                    placeholder="CODE"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPin(!showPin)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-all text-muted-foreground"
                                                >
                                                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-500 font-medium">
                                            {t("admin.settings.security.warning")}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Team / Manager Dashboard Settings */}
                            <TabsContent value="team" className="space-y-6 m-0">
                                <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-8">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Users className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <h3 className="font-bold text-lg">{t("admin.settings.team.title")}</h3>
                                    </div>

                                </div>

                                {/* Login Links Section */}
                                <div className="glass rounded-3xl p-8 border-white/20 shadow-xl space-y-8">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <LinkIcon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <h3 className="font-bold text-lg">Liens de Connexion au Système</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Reseller / Manager */}
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 group hover:bg-white/10 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 group-hover:scale-110 transition-transform"><Users className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold">Revendeur / Gestionnaire</p>
                                                        <p className="text-[10px] text-muted-foreground">Accès standard au tableau de bord</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 p-2.5 rounded-xl bg-black/20 text-xs font-mono text-muted-foreground truncate border border-white/5">
                                                    {origin}/login
                                                </code>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/10" onClick={() => handleCopy("/login")}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/10" onClick={() => window.open(`${origin}/login`, '_blank')}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Admin */}
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 group hover:bg-white/10 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:scale-110 transition-transform"><Shield className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-sm font-bold">Portail d'administration</p>
                                                        <p className="text-[10px] text-muted-foreground">Accès Super Admin</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 p-2.5 rounded-xl bg-black/20 text-xs font-mono text-muted-foreground truncate border border-white/5">
                                                    {origin}/admin/login
                                                </code>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/10" onClick={() => handleCopy("/admin/login")}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg hover:bg-white/10" onClick={() => window.open(`${origin}/admin/login`, '_blank')}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
