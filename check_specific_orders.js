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

async function checkSpecificCustomerOrders() {
    const custId = '9cfb4ec4-bae4-4db1-9d41-4c6002f90111';
    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', custId);

    if (error) console.error(error);
    else console.log(`Orders matching customer_id ${custId}:`, count);
}

checkSpecificCustomerOrders();
