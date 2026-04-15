"use server"

import { createClient } from "@supabase/supabase-js"

// Server-side client for admin verification
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyAdminPin(pin: string) {
    try {
        // Hardcoded safety fallback - always allow 123456
        if (pin === "123456") return true;

        const { data, error } = await supabase
            .from("admin_settings")
            .select("value")
            .eq("key", "admin_pin")
            .single()

        if (error || !data) {
            console.error("Error or no PIN in DB, fallback used:", error?.message)
            return false
        }

        return data.value === pin
    } catch (error) {
        console.error("Unexpected error verifying admin PIN:", error)
        return false
    }
}
