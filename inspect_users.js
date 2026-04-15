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

async function inspectUsers() {
    console.log('--- PROFILES ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name, email, role');
    if (pError) console.error(pError);
    else console.log(JSON.stringify(profiles, null, 2));

    console.log('\n--- CUSTOMERS ---');
    const { data: customers, error: cError } = await supabase.from('customers').select('id, name, email, role, company_name');
    if (cError) console.error(cError);
    else console.log(JSON.stringify(customers, null, 2));

    console.log('\n--- RESELLERS ---');
    const { data: resellers, error: rError } = await supabase.from('resellers').select('id, user_id, company_name');
    if (rError) console.error(rError);
    else console.log(JSON.stringify(resellers, null, 2));
}

inspectUsers();
