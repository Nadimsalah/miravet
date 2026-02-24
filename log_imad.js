const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data: profiles } = await supabase.from('profiles').select('id').eq('email', 'imad@mail.com').single();
    const { data: assignments } = await supabase
        .from('account_manager_assignments')
        .select(`
            reseller_id,
            customer_id,
            reseller:resellers(company_name),
            customer:customers(company_name)
        `)
        .eq('account_manager_id', profiles.id)
        .is('soft_deleted_at', null);

    console.log('IMAD ASSIGNMENTS:');
    for (const a of assignments) {
        console.log(`- Reseller: ${a.reseller?.company_name || 'N/A'} (${a.reseller_id})`);

        const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('reseller_id', a.reseller_id);
        console.log(`  Order Count for this Reseller: ${orderCount}`);

        if (a.customer_id) {
            console.log(`- Customer: ${a.customer?.company_name || 'N/A'} (${a.customer_id})`);
            const { count: custOrderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('customer_id', a.customer_id);
            console.log(`  Order Count for this Customer: ${custOrderCount}`);
        }
    }

    // Check for "guest" orders (reseller_id is null)
    const { count: guestCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .is('reseller_id', null);
    console.log(`TOTAL Guest Orders (reseller_id IS NULL): ${guestCount}`);
}

check();
