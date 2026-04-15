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

async function checkGlobal() {
    const { data: res } = await supabase.from('resellers').select('*').ilike('company_name', '%global%');
    console.log('Global Resellers:', res);

    const { data: cust } = await supabase.from('customers').select('*').ilike('company_name', '%global%');
    console.log('Global Customers:', cust);
}

checkGlobal();
