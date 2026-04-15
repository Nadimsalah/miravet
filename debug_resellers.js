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

async function check() {
    console.log('--- Resellers Check ---');
    const { data, error } = await supabase
        .from('customers')
        .select('name, email, role, company_name');

    if (error) {
        console.error(error);
    } else {
        const potential = data.filter(c =>
            c.role && (c.role.toLowerCase() === 'reseller' || c.role.toLowerCase() === 'reseller_pending')
        );
        console.log(`Found ${potential.length} potential resellers:`);
        potential.forEach(p => {
            console.log(`- ${p.name} (${p.email}), Role: ${p.role}, Company: "${p.company_name}"`);
        });
    }
}

check();
