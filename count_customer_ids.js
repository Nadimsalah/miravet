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

async function countCustomerIds() {
    const { data } = await supabase.from('orders').select('customer_id').limit(200);
    const counts = {};
    data.forEach(o => counts[o.customer_id] = (counts[o.customer_id] || 0) + 1);
    console.log('Customer ID counts in orders:', counts);

    // Check if the assigned ID is in here
    const assignedId = '9cfb4ec4-bae4-4db1-9d41-4c6002f90111';
    console.log(`Is assigned ID ${assignedId} in orders?`, counts[assignedId] !== undefined);
}

countCustomerIds();
