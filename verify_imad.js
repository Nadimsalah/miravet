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

async function checkImadAssignments() {
    const { data: imad } = await supabase.from('profiles').select('id').eq('email', 'imad@mail.com').single();
    if (!imad) return console.log('Imad not found');

    console.log('Imad ID:', imad.id);

    const { data: assignments, error } = await supabase
        .from('account_manager_assignments')
        .select('*, customer:customers(company_name, email)')
        .eq('account_manager_id', imad.id)
        .is('soft_deleted_at', null);

    if (error) console.error(error);
    else console.log('Assignments:', JSON.stringify(assignments, null, 2));

    // Also check for any orders with customers but no account
    const { data: orders } = await supabase
        .from('orders')
        .select('id, customer_id, customer_email, reseller_id')
        .is('reseller_id', null)
        .limit(5);
    console.log('Sample Guest Orders:', orders);
}

checkImadAssignments();
