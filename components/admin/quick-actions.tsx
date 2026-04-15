import { Plus, Download, FileText, Settings, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function QuickActions() {
    const actions = [
        { label: "Add Product", icon: Plus, color: "bg-primary/10 text-primary hover:bg-primary/20", href: "/admin/products/new" },

        { label: "Site Settings", icon: Settings, color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20", href: "/admin/settings" },
    ]

    return (
        <div className="glass-strong rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="More">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 gap-2 ${action.color} border border-transparent hover:border-white/10 hover:scale-[1.02]`}
                    >
                        <action.icon className="w-6 h-6" />
                        <span className="text-xs font-semibold">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
