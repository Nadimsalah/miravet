
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Simple env parser
const envPath = path.resolve(__dirname, '.env.local')
let env: Record<string, string> = {}
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
        }
    })
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCustomers() {
    console.log('Checking customers table at', supabaseUrl)

    // 1. Get all customers to see roles
    const { data: customers, error } = await supabase
        .from('customers')
        .select('id, role')

    if (error) {
        console.error('Error fetching customers:', error)
        return
    }

    console.log(`Found ${customers.length} total customers.`)

    const byRole: Record<string, number> = {}
    customers.forEach((c: any) => {
        const role = c.role === null ? 'NULL' : c.role
        byRole[role] = (byRole[role] || 0) + 1
    })

    console.log('Counts by role:', byRole)

    // 2. Test the query filtering logic simulates what's in getDashboardStats
    const { count: countTotal, error: errorTotal } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .or('role.eq.customer,role.is.null')

    console.log(`Query .or('role.eq.customer,role.is.null') count: ${countTotal}`)
    if (errorTotal) console.error('Error total:', errorTotal)

    const { count: countWithNeq, error: errorWithNeq } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .or('role.eq.customer,role.is.null')
        .neq('role', 'reseller')
        .neq('role', 'admin')

    console.log(`Query with .neq filters count: ${countWithNeq}`)
    if (errorWithNeq) console.error('Error neq:', errorWithNeq)

    // 3. Just role=customer
    const { count: countCustomer, error: errorCustomer } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
    console.log(`Query .eq('role', 'customer') count: ${countCustomer}`)

    // 4. Just role is null
    const { count: countNull, error: errorNull } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .is('role', null)
    console.log(`Query .is('role', null) count: ${countNull}`)
}

checkCustomers()
