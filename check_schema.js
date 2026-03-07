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

async function checkOrdersSchema() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Order Columns:', Object.keys(data[0]));
    }

    // Check customers
    const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('id, name, email, role, status, company_name')
        .limit(20);

    if (custError) console.error('Error fetching customers:', custError);
    else console.log('Customers Sample:', custData);

    const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .in('role', ['reseller', 'reseller_pending', 'RESELLER', 'RESELLER_PENDING']);

    console.log('Total potential resellers (any case):', count);
}

checkOrdersSchema();
