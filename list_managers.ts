import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listManagers() {
  const { data: managers } = await supabase.from('profiles').select('id, name, role').eq('role', 'account_manager')
  console.log('Managers:', JSON.stringify(managers, null, 2))
}

listManagers()
