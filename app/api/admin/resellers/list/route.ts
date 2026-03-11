import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }

  // 1. Fetch all records from resellers table
  const { data: resellersData, error: resellersError } = await supabaseAdmin
    .from("resellers")
    .select(`
      id,
      user_id,
      company_name,
      phone,
      city,
      user:profiles!user_id (name, email, phone)
    `)

  if (resellersError) {
    console.error("Error fetching resellers:", resellersError)
    return NextResponse.json({ error: resellersError.message }, { status: 500 })
  }

  // 2. Also fetch profiles with role=RESELLER who may not have a resellers row
  const { data: resellerProfiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, phone")
    .eq("role", "RESELLER")

  if (profilesError) {
    console.error("Error fetching reseller profiles:", profilesError)
    // Non-fatal — still return what we have
    return NextResponse.json({ resellers: resellersData || [] })
  }

  // 3. Find profiles that have NO resellers row yet
  const existingUserIds = new Set((resellersData || []).map((r: any) => r.user_id))
  const missingProfiles = (resellerProfiles || []).filter((p: any) => !existingUserIds.has(p.id))

  // 4. For each missing profile, create a virtual reseller entry using their profile id as the id
  const virtualResellers = missingProfiles.map((p: any) => ({
    id: p.id,           // Use the profile id as the reseller identifier
    user_id: p.id,
    company_name: p.name || p.email || "Unknown",
    phone: p.phone || null,
    city: null,
    user: { name: p.name, email: p.email, phone: p.phone }
  }))

  // 5. Also check customers table for RESELLER-role profiles to get company names
  const missingIds = missingProfiles.map((p: any) => p.id)
  if (missingIds.length > 0) {
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, company_name, phone, city")
      .in("id", missingIds)

    // Merge customer data into virtual resellers
    if (customers) {
      customers.forEach((c: any) => {
        const vr = virtualResellers.find((v: any) => v.user_id === c.id)
        if (vr) {
          vr.company_name = c.company_name || vr.company_name
          vr.phone = c.phone || vr.phone
          vr.city = c.city || vr.city
        }
      })
    }
  }

  // Special virtual entry: "Client Digital"
  // Represents all orders placed without a login/account (guest orders, reseller_id IS NULL)
  // Uses a fixed sentinel UUID so it can be stored in account_manager_assignments
  const CLIENT_DIGITAL_ID = "00000000-0000-0000-0000-000000000001"
  const clientDigital = {
    id: CLIENT_DIGITAL_ID,
    user_id: CLIENT_DIGITAL_ID,
    company_name: "Client Digital",
    phone: null,
    city: null,
    user: { name: "Commandes sans compte", email: "—", phone: null },
    is_virtual: true  // flag so UI can style it differently
  }

  const combined = [clientDigital, ...(resellersData || []), ...virtualResellers]

  return NextResponse.json({ resellers: combined })
}
