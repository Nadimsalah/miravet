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

async function findClientDigital() {
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .or('company_name.ilike.%digital%,company_name.ilike.%global%');

    if (error) console.error(error);
    else console.log('Potential Digital Customers:', JSON.stringify(customers, null, 2));

    const { data: allAssignments } = await supabase
        .from('account_manager_assignments')
        .select('*, customer:customers(company_name)')
        .is('soft_deleted_at', null);
    console.log('All Active Assignments with Customers:', JSON.stringify(allAssignments, null, 2));
}

findClientDigital();
