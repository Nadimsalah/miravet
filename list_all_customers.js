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

async function listAllCustomers() {
    const { data: customers, error } = await supabase
        .from('customers')
        .select('id, company_name, email')
        .limit(100);

    if (error) console.error(error);
    else {
        const digital = customers.filter(c => c.company_name && (c.company_name.toLowerCase().includes('digital') || c.company_name.toLowerCase().includes('global')));
        console.log('Digital Customers Found:', digital);
        console.log('Total customers checked:', customers.length);
    }
}

listAllCustomers();
