const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkId() {
    const id = 'b1e3fa9a-a875-430b-9721-5ba53f69a407'
    console.log('Final Check for ID:', id)

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    const { data: customer } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
    const { data: reseller } = await supabase.from('resellers').select('*').eq('user_id', id).maybeSingle()
    const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', id)

    console.log('Profile Role:', profile?.role)
    console.log('Customer Status:', customer?.status)
    console.log('Reseller Status:', reseller?.status)
    console.log('Orders found:', orders?.length || 0)
}

checkId()
