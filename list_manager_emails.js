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

async function findAccountManagers() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'ACCOUNT_MANAGER');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Total Account Managers: ${profiles.length}`);
    profiles.forEach(p => console.log(`- ${p.email}`));
}

findAccountManagers();
