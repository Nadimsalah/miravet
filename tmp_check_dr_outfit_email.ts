import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDrOutfitEmail() {
  const { data: res } = await supabase
    .from('resellers')
    .select('*, profile:profiles!user_id(email)')
    .eq('id', 'ab0f1d27-02c3-4a71-bffe-58689f3f72e9')
    .single()
  
  console.log('Reseller Data:', JSON.stringify(res, null, 2))
}

checkDrOutfitEmail()
