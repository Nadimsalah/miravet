"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { getCategories } from "@/lib/supabase-api"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronRight, ArrowRight, Loader2 } from "lucide-react"

export default function CategoriesPage() {
    const { t, language } = useLanguage()
    const [categories, setCategories] = useState<{ id: string, name: string, slug: string, name_ar?: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await getCategories()
                setCategories(data)
            } catch (error) {
                console.error("Failed to load categories:", error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
                <header className="mb-20 text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl sm:text-6xl font-black text-[#0f172a] tracking-tight mb-6">
                            Nos Collections
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Explorez notre catalogue par catégorie pour trouver les équipements et solutions adaptés à votre spécialité vétérinaire.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((category, idx) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Link 
                                href={`/category/${category.slug}`}
                                className="group block relative overflow-hidden rounded-[40px] bg-slate-50 aspect-[4/3] transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                
                                {/* Dynamic icon based on slug */}
                                <div className="absolute inset-0 -z-10 bg-indigo-50 flex items-center justify-center">
                                    <span className="text-8xl opacity-10 grayscale group-hover:scale-110 transition-transform duration-700">
                                        {category.slug.includes('vaccins') ? '💉' :
                                         category.slug.includes('antiparasitaires') ? '🦟' :
                                         category.slug.includes('anti-infectieux') ? '💊' :
                                         category.slug.includes('anti-inflammatoires') ? '🩺' :
                                         category.slug.includes('vitamines') ? '🍎' :
                                         category.slug.includes('reproduction') ? '🧬' :
                                         category.slug.includes('biosecurite') ? '🧼' :
                                         category.slug.includes('anesthesiques') ? '💤' : '📦'}
                                    </span>
                                </div>

                                <div className="absolute inset-0 p-10 flex flex-col justify-end text-white">
                                    <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <h2 className="text-3xl font-black tracking-tight leading-none">
                                            {language === 'ar' && category.name_ar ? category.name_ar : category.name}
                                        </h2>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <span className="text-sm font-bold uppercase tracking-widest">Voir la collection</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
