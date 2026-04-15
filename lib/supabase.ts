import { createClient } from '@supabase/supabase-js'

// Use placeholders for build time if env vars are missing
// HARDCODED credentials for New Project (xpkvpimvgxbnovxuzdxj)
const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const supabaseAnonKey = 'sb_publishable_6xmP9TH-uqXry1kVg-7riQ_Ych3oUTK'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL, using placeholder for build')
}

// Standard client for client-side operations (respects RLS)
if (typeof window !== 'undefined') {
    console.log('Supabase Browser Init (New Project Forced):', {
        url: supabaseUrl,
        keyPrefix: supabaseAnonKey?.substring(0, 15) + '...'
    })
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side trusted operations (bypasses RLS)
// access this only in server contexts or API routes, NOT in client components
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null
