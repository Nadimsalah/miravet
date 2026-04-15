import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrdersDrOutfit() {
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, reseller_id, customer_email')
    .eq('reseller_id', 'ab0f1d27-02c3-4a71-bffe-58689f3f72e9')
  
  console.log('Orders for Dr Outfit:', JSON.stringify(orders, null, 2))
}

checkOrdersDrOutfit()
