"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Phone, Inbox, MessageSquare, Calendar, Globe, Copy, Search, RefreshCcw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listWhatsappSubscriptions, WhatsappSubscription } from "@/lib/supabase-api"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function AdminWhatsappPage() {
    const { t } = useLanguage()
    const [leads, setLeads] = useState<WhatsappSubscription[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchLeads()
    }, [])

    async function fetchLeads() {
        setLoading(true)
        try {
            const data = await listWhatsappSubscriptions()
            setLeads(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load WhatsApp leads")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Phone number copied!")
    }

    const filteredLeads = leads.filter(lead => 
        lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lead.country_code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen" />
            </div>

            <AdminSidebar />

            <main className="lg:pl-72 p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto space-y-8"
                >
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                <MessageSquare className="w-3 h-3" />
                                WhatsApp Marketing
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                {t("admin.whatsapp.title")}
                            </h1>
                            <p className="text-muted-foreground max-w-lg">
                                {t("admin.whatsapp.subtitle")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchLeads}
                                className="rounded-xl glass-strong border-white/5 h-11"
                            >
                                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {t("admin.whatsapp.refresh") || "Actualiser"}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="glass-strong border-white/5 p-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full" />
                            <div className="relative z-10 space-y-4">
                                <div className="p-3 bg-green-500/20 text-green-500 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Leads</p>
                                    <h2 className="text-4xl font-black text-foreground tabular-nums">
                                        {leads.length}
                                    </h2>
                                </div>
                            </div>
                        </Card>

                        <Card className="glass-strong border-white/5 p-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
                            <div className="relative z-10 space-y-4">
                                <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ce Mois</p>
                                    <h2 className="text-4xl font-black text-foreground tabular-nums">
                                        {leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                                    </h2>
                                </div>
                            </div>
                        </Card>

                        <Card className="hidden lg:flex glass-strong border-white/5 p-6 relative overflow-hidden group items-center justify-between">
                            <div className="space-y-4">
                                <h3 className="font-bold text-foreground">Marketing Direct</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    Utilisez ces leads pour vos campagnes de promotion ciblées.
                                </p>
                                <Button size="sm" variant="secondary" className="rounded-xl font-bold" disabled>
                                    Exporter CSV
                                </Button>
                            </div>
                            <div className="text-green-500/20">
                                <Phone className="w-20 h-20 rotate-12" />
                            </div>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <Card className="glass-strong border-white/5 p-0 overflow-hidden shadow-2xl backdrop-blur-2xl bg-white/5">
                        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Inbox className="w-5 h-5 text-primary" />
                                Recent Inquiries
                            </h3>
                            <div className="relative w-full sm:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search leads..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-white/[0.02] sticky top-0 z-10">
                                  <TableRow className="border-white/5 hover:bg-transparent uppercase text-[10px] tracking-[0.2em] font-black text-muted-foreground">
                                    <TableHead className="py-4 px-6">{t("admin.whatsapp.table.country")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("admin.whatsapp.table.phone")}</TableHead>
                                    <TableHead className="py-4 px-6">{t("admin.whatsapp.table.date")}</TableHead>
                                    <TableHead className="py-4 px-6 text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <AnimatePresence mode="popLayout">
                                    {filteredLeads.length === 0 ? (
                                      <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                      >
                                        <TableCell colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                                <div className="p-4 bg-muted/20 rounded-full">
                                                    <Inbox className="w-8 h-8 opacity-20" />
                                                </div>
                                                <p className="text-sm font-medium">{t("admin.whatsapp.no_data")}</p>
                                            </div>
                                        </TableCell>
                                      </motion.tr>
                                    ) : (
                                      filteredLeads.map((lead, index) => (
                                        <motion.tr 
                                            key={lead.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-white/5 hover:bg-white/[0.03] transition-colors group"
                                        >
                                          <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className="rounded-lg bg-primary/5 border-primary/20 text-xs py-1 px-3">
                                                {lead.country_code}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-4 px-6">
                                            <span className="font-mono text-sm tracking-tighter text-foreground group-hover:text-primary transition-colors">
                                                {lead.phone}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">
                                                    {new Date(lead.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-bold">
                                                    {new Date(lead.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                                                    onClick={() => copyToClipboard(lead.phone)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl hover:bg-green-500/10 hover:text-green-500 transition-all shadow-sm"
                                                    asChild
                                                >
                                                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                          </TableCell>
                                        </motion.tr>
                                      ))
                                    )}
                                  </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </motion.div>
            </main>
        </div>
    )
}

