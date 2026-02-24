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

async function checkGuestOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .is('reseller_id', null)
        .limit(20);

    if (error) console.error(error);
    else {
        console.log('Guest Orders found:', orders.length);
        orders.forEach(o => {
            console.log(`Order ${o.order_number}: CustomerID=${o.customer_id}, Email=${o.customer_email}`);
        });
    }
}

checkGuestOrders();
