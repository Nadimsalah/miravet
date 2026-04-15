const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://xpkvpimvgxbnovxuzdxj.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function migrate() {
    const activeUserId = 'b1e3fa9a-a875-430b-9721-5ba53f69a407'
    const email = 'salaheddinenadim@gmail.com'
    const oldCid = 'f67e137c-1221-49ad-8784-e86c8d6b90c9'

    console.log(`Starting migration for ${email}...`)

    // 1. Temporarily NULL out customer_id on orders to break constraint
    console.log('Step 1: Detaching orders from old ID...')
    await supabase.from('orders').update({ customer_id: null }).eq('customer_id', oldCid)

    // 2. Delete the old stray customer record
    console.log('Step 2: Removing stray customer record...')
    await supabase.from('customers').delete().eq('id', oldCid)

    // 3. Create the NEW customer record for the active user
    console.log('Step 3: Creating active customer record...')
    const { data: customerData, error: cError } = await supabase
        .from('customers')
        .insert({
            id: activeUserId,
            name: 'Nadim Salah Eddine',
            email: email,
            phone: '0707777721',
            role: 'reseller',
            status: 'active',
            company_name: 'Dr Outfit',
            ice: '5486565656',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
    
    if (cError) {
        console.error('Customer Creation Error:', cError)
        // If it already exists, just update it
        await supabase.from('customers').update({ status: 'active', role: 'reseller' }).eq('id', activeUserId)
    }

    // 4. Re-link orders to the new ID
    console.log('Step 4: Re-linking orders to active ID...')
    const { data: updatedOrders } = await supabase
        .from('orders')
        .update({ customer_id: activeUserId })
        .eq('customer_email', email)
        .select()
    
    console.log(`Successfully re-linked ${updatedOrders?.length || 0} orders.`)

    // 5. Ensure reseller record is active
    await supabase.from('resellers').update({ status: 'active' }).eq('user_id', activeUserId)
    
    // 6. Update Profile
    await supabase.from('profiles').update({ name: 'Nadim Salah Eddine', role: 'ADMIN' }).eq('id', activeUserId)

    console.log('--- MIGRATION COMPLETE ---')
}

migrate()
