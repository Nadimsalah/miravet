"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    UserPlus,
    Users,
    Briefcase,
    Shield,
    MoreHorizontal,
    Mail,
    PlusCircle,
    UserCheck,
    Link as LinkIcon,
    Unlink,
    Loader2,
    CheckCircle2,
    XCircle,
    Phone,
    MapPin,
    Trash2,
    Copy,
    Lock,
    Globe,
    LayoutGrid,
    List,
    TrendingUp,
    Target,
    BarChart3,
    DollarSign,
    ArrowUpRight,
    Trophy
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AccountManager {
    id: string
    name: string
    email: string
    phone?: string
    reseller_count: number
    total_revenue: number
    target_revenue: number
    performance_percent: number
}

interface Reseller {
    id: string
    company_name: string
    name: string
    email?: string
    phone?: string
    city?: string
    assigned_to_id?: string
    total_spent: number
}

export default function AccountManagersPage() {
    const { t, setLanguage } = useLanguage()
    const [managers, setManagers] = useState<AccountManager[]>([])
    const [resellers, setResellers] = useState<Reseller[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "table">("table")
    const [copiedUrl, setCopiedUrl] = useState(false)

    // Performance Calculations
    const totalTeamRevenue = managers.reduce((sum, m) => sum + m.total_revenue, 0)
    const totalAssignedResellers = managers.reduce((sum, m) => sum + m.reseller_count, 0)
    const avgPerformance = managers.length > 0
        ? managers.reduce((sum, m) => sum + m.performance_percent, 0) / managers.length
        : 0

    const performanceStats = [
        { label: "Chiffre d'Affaire Total", value: `${formatPrice(totalTeamRevenue)} DH`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Partenaires Assignés", value: totalAssignedResellers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Performance Moyenne", value: `${avgPerformance.toFixed(1)}%`, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
    ]

    // Set French as default for dashboard
    useEffect(() => {
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setLanguage("fr")
        }
    }, [setLanguage])

    // Create AM Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newManager, setNewManager] = useState({ name: '', email: '', password: '', phone: '' })
    const [isCreating, setIsCreating] = useState(false)

    // Goal Edit Modal
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
    const [editingGoalManager, setEditingGoalManager] = useState<AccountManager | null>(null)
    const [newGoalValue, setNewGoalValue] = useState("")
    const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

    // Password Reset Modal
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
    const [resettingManager, setResettingManager] = useState<AccountManager | null>(null)
    const [newPasswordInput, setNewPasswordInput] = useState("")
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    // Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedManager, setSelectedManager] = useState<AccountManager | null>(null)
    const [isAssigning, setIsAssigning] = useState(false)
    const [assigningId, setAssigningId] = useState<string | null>(null)
    const [resellerSearchQuery, setResellerSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            // 1. Fetch Account Managers (Profiles with AM role)
            const { data: amData, error: amError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'ACCOUNT_MANAGER')

            if (amError) throw amError

            // 2. Fetch Assignments
            const { data: assignments, error: assignError } = await supabase
                .from('account_manager_assignments')
                .select('account_manager_id, reseller_id')
                .is('soft_deleted_at', null)

            if (assignError) throw assignError

            // 3. Fetch all resellers via admin API
            const res = await fetch("/api/admin/resellers/list")
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to load resellers")
            const resellerData = json.resellers as any[]

            // 4. Fetch customers to get correct company names and total_spent
            const { data: customerData } = await supabase
                .from('customers')
                .select('id, company_name, phone, city, total_spent')

            // Map assignments to resellers (for the assignment modal)
            const resellersWithAssignments: Reseller[] = resellerData.map((r: any) => {
                const activeAssignment = assignments.find(a => a.reseller_id === r.id)
                const customer = customerData?.find(c => c.id === r.user_id)

                return {
                    id: r.id,
                    company_name: customer?.company_name || r.company_name,
                    name: (r.user as any)?.name || t("common.unknown"),
                    email: (r.user as any)?.email || '',
                    phone: customer?.phone || (r.user as any)?.phone || '',
                    city: customer?.city || r.city || '',
                    assigned_to_id: activeAssignment?.account_manager_id,
                    total_spent: customer?.total_spent || 0
                }
            })

            // 5. Calculate stats for each manager
            const processedManagers: AccountManager[] = (amData || []).map(am => {
                const myResellerAssignments = assignments.filter(a => a.account_manager_id === am.id)
                const myResellerIds = myResellerAssignments.map(a => a.reseller_id)

                // Important: Match by ID in resellersWithAssignments which correctly maps reseller table IDs
                const myResellers = resellersWithAssignments.filter(r => myResellerIds.includes(r.id))

                const totalRevenue = myResellers.reduce((sum, r) => sum + (r.total_spent || 0), 0)
                const target = am.prime_target_revenue || 200000
                const performance = target > 0 ? (totalRevenue / target) * 100 : 0

                return {
                    id: am.id,
                    name: am.name,
                    email: am.email,
                    phone: am.phone,
                    reseller_count: myResellers.length,
                    total_revenue: totalRevenue,
                    target_revenue: target,
                    performance_percent: performance
                }
            })

            setManagers(processedManagers)
            setResellers(resellersWithAssignments)

        } catch (error: any) {
            console.error('Error loading commercial data:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const res = await fetch('/api/admin/account-managers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newManager)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.created_success"))
            setIsCreateModalOpen(false)
            setNewManager({ name: '', email: '', password: '', phone: '' })
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsCreating(false)
        }
    }

    const handleAssignReseller = async (resellerId: string, accountManagerId?: string) => {
        setIsAssigning(true)
        setAssigningId(resellerId)
        try {
            const res = await fetch('/api/admin/assign-reseller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resellerId, accountManagerId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(accountManagerId ? t("account_managers.assignment_updated") : t("account_managers.reseller_unassigned"))
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsAssigning(false)
            setAssigningId(null)
        }
    }

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingGoalManager) return
        setIsUpdatingGoal(true)

        try {
            const res = await fetch('/api/admin/manager-goal', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    managerId: editingGoalManager.id,
                    newGoal: parseFloat(newGoalValue)
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.goal_updated"))
            setIsGoalModalOpen(false)
            setEditingGoalManager(null)
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdatingGoal(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resettingManager || !newPasswordInput) return
        setIsResettingPassword(true)

        try {
            const res = await fetch(`/api/admin/account-managers/${resettingManager.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPasswordInput })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success("Mot de passe mis à jour avec succès.")
            setIsResetPasswordModalOpen(false)
            setResettingManager(null)
            setNewPasswordInput("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsResettingPassword(false)
        }
    }

    // Delete Confirmation State
    const [managerToDelete, setManagerToDelete] = useState<AccountManager | null>(null)

    const handleDeleteManager = (manager: AccountManager) => {
        setManagerToDelete(manager)
    }

    const handleConfirmDelete = async () => {
        if (!managerToDelete) return

        try {
            const res = await fetch(`/api/admin/account-managers/${managerToDelete.id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(t("account_managers.deleted_success"))
            setManagerToDelete(null)
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // URL de connexion pour les Gestionnaires de Compte
    const managerLoginPath = "/login"

    const handleCopyDashboardUrl = async () => {
        try {
            const fullUrl = typeof window !== "undefined"
                ? `${window.location.origin}${managerLoginPath}`
                : managerLoginPath
            await navigator.clipboard.writeText(fullUrl)
            setCopiedUrl(true)
            setTimeout(() => setCopiedUrl(false), 2000)
            toast.success("Lien de connexion Gestionnaire copié.")
        } catch {
            toast.error("Impossible de copier le lien de connexion.")
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background gradients aligned with Dashboard */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10 transition-all duration-300">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-4 z-40 glass-strong p-4 rounded-3xl border border-white/5 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground tracking-tight">{t("account_managers.title")}</h1>
                            <p className="text-xs text-muted-foreground font-medium">{t("account_managers.subtitle")}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* URL Copy Section - Compact */}
                        <div className="hidden md:flex items-center gap-2 bg-background/50 p-1.5 pl-3 rounded-full border border-white/10">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mr-2">
                                URL CONNEXION
                            </span>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-xs text-foreground font-mono truncate max-w-[150px]">
                                {managerLoginPath}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                onClick={handleCopyDashboardUrl}
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-white/10 text-primary shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-lg ${viewMode === 'table' ? 'bg-white/10 text-primary shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>

                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-full h-10 px-6 gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                    <UserPlus className="w-4 h-4" />
                                    {t("account_managers.add_manager")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-strong border-white/10 rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">{t("account_managers.create_title")}</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">{t("account_managers.create_desc")}</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateManager} className="space-y-5 py-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("account_managers.full_name")}</label>
                                        <Input
                                            required
                                            value={newManager.name}
                                            onChange={e => setNewManager({ ...newManager, name: e.target.value })}
                                            className="h-11 rounded-xl bg-background/50 border-white/10 focus:ring-primary focus:bg-background transition-all"
                                            placeholder={t("account_managers.full_name")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("account_managers.work_email")}</label>
                                        <Input
                                            required
                                            type="email"
                                            value={newManager.email}
                                            onChange={e => setNewManager({ ...newManager, email: e.target.value })}
                                            className="h-11 rounded-xl bg-background/50 border-white/10 focus:ring-primary focus:bg-background transition-all"
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("account_managers.password")}</label>
                                            <Input
                                                required
                                                type="password"
                                                value={newManager.password}
                                                onChange={e => setNewManager({ ...newManager, password: e.target.value })}
                                                className="h-11 rounded-xl bg-background/50 border-white/10 focus:ring-primary focus:bg-background transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("account_managers.phone")}</label>
                                            <Input
                                                value={newManager.phone}
                                                onChange={e => setNewManager({ ...newManager, phone: e.target.value })}
                                                className="h-11 rounded-xl bg-background/50 border-white/10 focus:ring-primary focus:bg-background transition-all"
                                                placeholder="+212 6XX..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="pt-2">
                                        <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl font-bold text-base">
                                            {isCreating ? <Loader2 className="animate-spin" /> : t("account_managers.create_account")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

                {/* Performance Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {performanceStats.map((stat, i) => (
                        <div key={i} className="glass-strong rounded-[2rem] p-6 border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">{stat.value}</h3>
                                </div>
                            </div>
                            <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-32 h-32" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sub-header / Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher des commerciaux..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-11 rounded-full bg-background/40 border-white/10 focus:bg-background focus:border-primary/50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-[400px] glass-strong rounded-3xl animate-pulse bg-white/5" />
                            ))
                        ) : filteredManagers.length > 0 ? (
                            filteredManagers.map((m: any) => (
                                <div key={m.id} className="glass-strong rounded-3xl border border-white/5 p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group flex flex-col">

                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                                {m.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground leading-tight">{m.name}</h3>
                                                <Badge variant="outline" className="mt-1 bg-primary/5 text-primary border-primary/20 text-[10px] px-2 py-0.5 h-5">
                                                    {t("account_managers.manager")}
                                                </Badge>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-strong rounded-xl border-white/10">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingGoalManager(m)
                                                        setNewGoalValue(m.target_revenue.toString())
                                                        setIsGoalModalOpen(true)
                                                    }}
                                                >
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    {t("account_managers.set_prime_goal")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setResettingManager(m)
                                                        setNewPasswordInput("")
                                                        setIsResetPasswordModalOpen(true)
                                                    }}
                                                >
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Modifier le mot de passe
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteManager(m)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {t("account_managers.delete_account")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-3 mb-6 bg-background/30 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="p-1.5 bg-white/5 rounded-md text-muted-foreground/70">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-muted-foreground truncate">{m.email}</span>
                                        </div>
                                        {m.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-1.5 bg-white/5 rounded-md text-muted-foreground/70">
                                                    <Phone className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-foreground font-medium">{m.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                                        <div className="p-4 bg-background/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">PARTENAIRES</p>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-primary/60" />
                                                <span className="text-xl font-black text-foreground">{m.reseller_count || 0}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-2xl border border-violet-500/10 flex flex-col justify-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                                            <p className="text-[10px] font-bold text-violet-500/80 uppercase tracking-wider mb-1">OBJECTIF</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-black text-foreground">{formatPrice(m.target_revenue)}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground">DH</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Dialog open={isAssignModalOpen && selectedManager?.id === m.id} onOpenChange={(open) => {
                                        setIsAssignModalOpen(open)
                                        if (open) setSelectedManager(m)
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all text-sm">
                                                <LinkIcon className="w-4 h-4 mr-2" />
                                                {t("account_managers.manage_assignments")}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="glass-strong border-white/10 rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-black">{t("account_managers.assign_resellers")} - {m.name}</DialogTitle>
                                                <DialogDescription>{t("account_managers.select_resellers")}</DialogDescription>
                                            </DialogHeader>

                                            <div className="mt-4 relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t("account_managers.find_reseller")}
                                                    value={resellerSearchQuery}
                                                    onChange={(e) => setResellerSearchQuery(e.target.value)}
                                                    className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary transition-all"
                                                />
                                            </div>

                                            <div className="py-6 space-y-3">
                                                {resellers
                                                    .filter(r =>
                                                        r.company_name.toLowerCase().includes(resellerSearchQuery.toLowerCase()) ||
                                                        r.name.toLowerCase().includes(resellerSearchQuery.toLowerCase())
                                                    )
                                                    .map((r) => (
                                                        <div key={r.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all group/item ${r.id === '00000000-0000-0000-0000-000000000001' ? 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${r.id === '00000000-0000-0000-0000-000000000001' ? 'bg-violet-500/20 text-violet-400' : r.assigned_to_id === m.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                                                                    {r.id === '00000000-0000-0000-0000-000000000001'
                                                                        ? <Globe className="w-5 h-5" />
                                                                        : <Briefcase className="w-5 h-5" />
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-foreground text-sm">{r.company_name}</p>
                                                                        {r.id === '00000000-0000-0000-0000-000000000001' && (
                                                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30">Digital</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">{r.name}</p>
                                                                </div>
                                                            </div>
                                                            {r.assigned_to_id === m.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">{t("account_managers.active")}</Badge>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        disabled={isAssigning}
                                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                        onClick={() => handleAssignReseller(r.id)}
                                                                        title={t("account_managers.unassign")}
                                                                    >
                                                                        {assigningId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    disabled={isAssigning}
                                                                    className="rounded-lg h-8 px-3 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                                                    onClick={() => handleAssignReseller(r.id, m.id)}
                                                                >
                                                                    {assigningId === r.id ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <PlusCircle className="w-3 h-3 mr-1.5" />
                                                                    )}
                                                                    {r.assigned_to_id ? t("account_managers.reassign") : t("account_managers.assign")}
                                                                </Button>
                                                            )
                                                            }
                                                        </div>
                                                    ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-6 bg-white/5 rounded-full text-muted-foreground/20 animate-pulse">
                                        <Shield className="w-16 h-16" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">{t("account_managers.no_managers")}</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto text-sm">{t("account_managers.no_managers_desc")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="glass-strong rounded-3xl border border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Nom / Commercial</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Partenaires</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">CA Généré</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Objectif</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Performance</th>
                                        <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse border-b border-white/5">
                                                <td colSpan={6} className="p-8"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredManagers.length > 0 ? (
                                        filteredManagers.map((m: any) => (
                                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-white/10">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground">{m.name}</div>
                                                            <div className="text-xs text-muted-foreground">{m.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                        {m.reseller_count}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-black text-foreground">{formatPrice(m.total_revenue)} DH</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-muted-foreground font-medium">{formatPrice(m.target_revenue)} DH</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="w-full max-w-[120px] space-y-1.5">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span className={m.performance_percent >= 100 ? 'text-emerald-500' : 'text-primary'}>
                                                                {m.performance_percent.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div
                                                                className={`h-full transition-all duration-1000 ${m.performance_percent >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}
                                                                style={{ width: `${Math.min(m.performance_percent, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setSelectedManager(m)
                                                                setIsAssignModalOpen(true)
                                                            }}
                                                        >
                                                            <LinkIcon className="w-4 h-4" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="glass-strong rounded-xl border-white/10">
                                                                <DropdownMenuItem onClick={() => {
                                                                    setEditingGoalManager(m)
                                                                    setNewGoalValue(m.target_revenue.toString())
                                                                    setIsGoalModalOpen(true)
                                                                }}>
                                                                    <Target className="w-4 h-4 mr-2" />
                                                                    Objectif CA
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setResettingManager(m)
                                                                    setNewPasswordInput("")
                                                                    setIsResetPasswordModalOpen(true)
                                                                }}>
                                                                    <Lock className="w-4 h-4 mr-2" />
                                                                    Mot de passe
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleDeleteManager(m)}>
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={6} className="p-20 text-center text-muted-foreground">Aucun résultat trouvé</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edit Goal Dialog */}
                <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                    <DialogContent className="glass-strong border-white/10 rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">{t("account_managers.set_prime_goal")}</DialogTitle>
                            <DialogDescription>
                                {t("account_managers.set_goal_desc")} <strong>{editingGoalManager?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateGoal} className="space-y-6 py-4">
                            <div className="bg-primary/5 p-6 rounded-2xl flex flex-col items-center justify-center border border-primary/10">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">{t("account_managers.target_revenue")}</span>
                                <div className="relative">
                                    <Input
                                        required
                                        type="number"
                                        value={newGoalValue}
                                        onChange={e => setNewGoalValue(e.target.value)}
                                        className="h-16 w-full text-center text-3xl font-black bg-transparent border-none focus:ring-0 p-0"
                                        placeholder="0"
                                    />
                                    <div className="text-xs text-center text-muted-foreground mt-2">MAD (Currency)</div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isUpdatingGoal} className="w-full h-12 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                                    {isUpdatingGoal ? <Loader2 className="animate-spin" /> : t("account_managers.update")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={isResetPasswordModalOpen} onOpenChange={setIsResetPasswordModalOpen}>
                    <DialogContent className="glass-strong border-white/10 rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Modifier le mot de passe</DialogTitle>
                            <DialogDescription>
                                Définir un nouveau mot de passe pour <strong>{resettingManager?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nouveau mot de passe</label>
                                <Input
                                    required
                                    type="password"
                                    value={newPasswordInput}
                                    onChange={e => setNewPasswordInput(e.target.value)}
                                    className="h-11 rounded-xl bg-background/50 border-white/10 focus:ring-primary focus:bg-background"
                                    placeholder="••••••••"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isResettingPassword} className="w-full h-11 rounded-xl font-bold">
                                    {isResettingPassword ? <Loader2 className="animate-spin mr-2" /> : "Mettre à jour"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!managerToDelete} onOpenChange={(open) => !open && setManagerToDelete(null)}>
                    <DialogContent className="glass-strong border-white/10 rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                {t("account_managers.delete_account")}
                            </DialogTitle>
                            <DialogDescription asChild>
                                <div className="space-y-4 pt-4">
                                    {managerToDelete?.reseller_count && managerToDelete.reseller_count > 0 ? (
                                        <>
                                            <p className="font-medium text-foreground">
                                                {t("account_managers.delete_warning_start")} <strong>{managerToDelete.name}</strong> {t("account_managers.delete_warning_end")}
                                            </p>
                                            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-left">
                                                <p className="text-destructive text-sm font-bold flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Attention:
                                                </p>
                                                <p className="text-destructive/80 text-sm mt-1 leading-relaxed">
                                                    Cet utilisateur gère actuellement <strong>{managerToDelete.reseller_count} revendeur(s)</strong>.
                                                    La suppression de ce compte désassignera automatiquement ces revendeurs.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="block">
                                            {t("account_managers.delete_confirm").replace("{name}", managerToDelete?.name || "")}
                                        </span>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="ghost"
                                onClick={() => setManagerToDelete(null)}
                                className="rounded-xl font-bold"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                className="rounded-xl font-bold gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t("account_managers.confirm_delete_unlink")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}

