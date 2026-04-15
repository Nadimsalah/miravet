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

async function debugTarik() {
    const { data: profiles } = await supabase.from('profiles').select('*').or('name.ilike.%Tarik%,email.ilike.%tarik%');
    console.log('MARKER_PROFILES_START');
    console.log(JSON.stringify(profiles || [], null, 2));
    console.log('MARKER_PROFILES_END');

    const { data: customers } = await supabase.from('customers').select('*').or('name.ilike.%Tarik%,email.ilike.%tarik%');
    console.log('MARKER_CUSTOMERS_START');
    console.log(JSON.stringify(customers || [], null, 2));
    console.log('MARKER_CUSTOMERS_END');

    const { data: orders } = await supabase.from('orders').select('*').or('customer_name.ilike.%Tarik%,customer_email.ilike.%tarik%');
    console.log('MARKER_ORDERS_START');
    console.log(JSON.stringify(orders || [], null, 2));
    console.log('MARKER_ORDERS_END');
}

debugTarik();
