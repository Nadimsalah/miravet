import { createClient } from '@supabase/supabase-js'

// Hardcode Project A fallback for server context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('[Supabase Server] Initializing with:', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    keyPrefix: supabaseServiceKey?.substring(0, 10)
})

// This client has admin privileges and should ONLY be used on the server side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
