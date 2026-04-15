import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAssignments() {
  const { data: manager } = await supabase.from('profiles').select('id, name').ilike('name', '%Nadim%').single()
  if (!manager) {
    console.log('Manager Nadim not found')
    return
  }
  console.log(`Manager: ${manager.name} (${manager.id})`)

  const { data: assignments } = await supabase
    .from('account_manager_assignments')
    .select('reseller_id, customer_id, reseller:resellers(company_name)')
    .eq('account_manager_id', manager.id)
    .is('soft_deleted_at', null)

  console.log('Assignments:', JSON.stringify(assignments, null, 2))

  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, reseller_id, customer_id, customer_email')
    .order('created_at', { ascending: false })
    .limit(20)
  
  console.log('Recent Orders:', JSON.stringify(orders, null, 2))
}

checkAssignments()
