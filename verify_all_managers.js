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

async function verifyManagers() {
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'ACCOUNT_MANAGER');

    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();

    if (uError) {
        console.error('Error fetching auth users:', uError);
        return;
    }

    console.log(`Checking ${profiles.length} Managers...`);
    profiles.forEach(p => {
        const authUser = users.find(u => u.id === p.id || u.email === p.email);
        if (authUser) {
            console.log(`[OK] ${p.email} exists in Auth.`);
        } else {
            console.log(`[MISSING] ${p.email} NOT found in Auth!`);
        }
    });
}

verifyManagers();
