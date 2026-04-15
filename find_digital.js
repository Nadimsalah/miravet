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

async function findTheDigitalReseller() {
    // Check resellers
    const { data: resellers } = await supabase.from('resellers').select('id, company_name');
    console.log('Resellers with Digital in name:', resellers.filter(r => r.company_name && r.company_name.toLowerCase().includes('digital')));

    // Check customers
    const { data: customers } = await supabase.from('customers').select('id, company_name');
    console.log('Customers with Digital in name:', customers.filter(c => c.company_name && c.company_name.toLowerCase().includes('digital')));

    // Check Imad's specifically
    const { data: profiles } = await supabase.from('profiles').select('id').eq('email', 'imad@mail.com').single();
    if (profiles) {
        const { data: assignments } = await supabase
            .from('account_manager_assignments')
            .select(`
                *,
                reseller:resellers(company_name),
                customer:customers(company_name)
            `)
            .eq('account_manager_id', profiles.id)
            .is('soft_deleted_at', null);
        console.log('Imad Current Assignments Detailed:', JSON.stringify(assignments, null, 2));
    }
}

findTheDigitalReseller();
