"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Loader2, Mail, Lock, Briefcase } from "lucide-react"
import { toast } from "sonner"

export default function CommercialLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await supabase.auth.signInWithPassword({
                email: email,
                password,
            })

            if (result.data?.user) {
                toast.success("Connexion réussie")
                router.push('/manager/resellers')
                router.refresh()
            }
        } catch (error: any) {
            const msg = error.message === "Invalid login credentials"
                ? "Identifiants invalides. Vérifiez l'email et le mot de passe."
                : "Erreur de connexion : " + error.message
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 p-8 sm:p-12 border border-slate-100">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6 -rotate-3 transform hover:rotate-0 transition-transform duration-300">
                        <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Espace Commercial</h1>
                    <p className="text-slate-500 font-medium text-center">Gérez vos revendeurs et performances.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Adresse Email Professionnelle</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 rounded-2xl text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 border-none"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Se Connecter"}
                    </Button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">DIDAL SPACE COMMERCIAL</p>
                </div>
            </div>
        </div>
    )
}
