"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, RotateCcw, Truck, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { getShippingSettings, updateShippingSettings, ShippingSetting, getAdminSettings, updateAdminSettings } from "@/lib/supabase-api"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"

export default function ShippingAdminPage() {
    const { t } = useLanguage()
    const [settings, setSettings] = useState<ShippingSetting[]>([])
    const [globalSettings, setGlobalSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            await Promise.all([loadSettings(), loadGlobalSettings()])
            setLoading(false)
        }
        init()
    }, [])

    async function loadSettings() {
        const data = await getShippingSettings()
        if (data && data.length > 0) {
            setSettings(data)
        }
    }

    async function loadGlobalSettings() {
        const data = await getAdminSettings()
        setGlobalSettings(data)
    }

    async function handleSave() {
        setSaving(true)
        const [shippingResult, globalResult] = await Promise.all([
            updateShippingSettings(settings),
            updateAdminSettings(globalSettings)
        ])

        if (shippingResult.success && globalResult.success) {
            toast.success(t("admin.shipping.success_update"))
        } else {
            toast.error(t("admin.shipping.error_update"))
        }
        setSaving(false)
    }

    const handleChange = (id: string, field: keyof ShippingSetting, value: any) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleGlobalChange = (key: string, value: string) => {
        setGlobalSettings(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background lg:pl-72">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                {t("admin.shipping.title")}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                {t("admin.shipping.subtitle")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadSettings}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                            >
                                <RotateCcw className="w-4 h-4" />
                                {t("admin.shipping.refresh")}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-primary/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t("admin.shipping.save_rules")}
                            </button>
                        </div>
                    </div>

                    {/* Global Toggle */}
                    <Card className="border-primary/20 bg-primary/5 overflow-hidden rounded-3xl shadow-xl shadow-primary/5">
                        <CardHeader className="border-b border-primary/10 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/20">
                                        <Truck className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Frais de Livraison Globale</CardTitle>
                                        <CardDescription>Activer ou désactiver complètement l&apos;affichage et le calcul des frais de livraison</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-black/20 px-6 py-3 rounded-2xl border border-white/5">
                                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        {globalSettings.shipping_enabled !== 'false' ? 'ACTIF' : 'INACTIF'}
                                    </span>
                                    <Switch
                                        checked={globalSettings.shipping_enabled !== 'false'}
                                        onCheckedChange={(checked) => handleGlobalChange('shipping_enabled', checked.toString())}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid grid-cols-1 gap-8">
                        {settings.map((rule) => (
                            <Card key={rule.id} className="border-white/5 bg-white/5 overflow-hidden rounded-3xl">
                                <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-primary/10">
                                                <Truck className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="capitalize text-xl">
                                                    {t(`admin.shipping.${rule.role}_rules`)}
                                                </CardTitle>
                                                <CardDescription>{t("admin.shipping.configure_costs")}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl border border-white/5">
                                            <Label htmlFor={`enabled-${rule.id}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("admin.shipping.status")}</Label>
                                            <Switch
                                                id={`enabled-${rule.id}`}
                                                checked={rule.enabled}
                                                onCheckedChange={(checked) => handleChange(rule.id, 'enabled', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Base Shipping Cost */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("admin.shipping.base_cost")}</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors">{t("common.currency")}</div>
                                                <Input
                                                    type="number"
                                                    value={rule.base_price}
                                                    onChange={(e) => handleChange(rule.id, 'base_price', parseFloat(e.target.value) || 0)}
                                                    className="pl-14 h-12 rounded-xl bg-white/[0.03] border-white/10 focus:border-primary/50 focus:bg-white/[0.06] transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1">{t("admin.shipping.fixed_fee_desc")}</p>
                                        </div>

                                        {/* Free Threshold (Amount) */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("admin.shipping.free_threshold_amount")}</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors">{t("common.currency")}</div>
                                                <Input
                                                    type="number"
                                                    value={rule.free_shipping_threshold}
                                                    onChange={(e) => handleChange(rule.id, 'free_shipping_threshold', parseFloat(e.target.value) || 0)}
                                                    className="pl-14 h-12 rounded-xl bg-white/[0.03] border-white/10 focus:border-primary/50 focus:bg-white/[0.06] transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1">{t("admin.shipping.amount_required_desc")}</p>
                                        </div>

                                        {/* Free Threshold (Items) */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("admin.shipping.free_threshold_items")}</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors">QTY</div>
                                                <Input
                                                    type="number"
                                                    value={rule.free_shipping_min_items}
                                                    onChange={(e) => handleChange(rule.id, 'free_shipping_min_items', parseInt(e.target.value) || 0)}
                                                    className="pl-14 h-12 rounded-xl bg-white/[0.03] border-white/10 focus:border-primary/50 focus:bg-white/[0.06] transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground px-1">{t("admin.shipping.min_items_desc")}</p>
                                        </div>
                                    </div>

                                    {/* Summary Info */}
                                    <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">{t("admin.shipping.order_logic")} </span>
                                            <span className="font-semibold text-foreground">
                                                {rule.enabled ? (
                                                    <>
                                                        {t("admin.shipping.rule_logic_desc")
                                                            .replace("{price}", rule.base_price.toString())
                                                            .replace("{threshold}", rule.free_shipping_threshold.toString())
                                                            .replace("{items}", rule.free_shipping_min_items.toString())
                                                            .replace(/{currency}/g, t("common.currency"))}
                                                    </>
                                                ) : (
                                                    <span className="text-destructive font-bold uppercase">{t("admin.shipping.rule_disabled")}</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {!loading && settings.length === 0 && (
                            <div className="text-center py-20 glass rounded-3xl border-white/5 space-y-4">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                                <p className="text-muted-foreground">{t("admin.shipping.no_rules")}</p>
                                <Button onClick={loadSettings} variant="outline">{t("admin.shipping.retry")}</Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
