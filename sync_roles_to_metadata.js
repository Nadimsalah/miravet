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

async function syncMetadata() {
    console.log('Fetching all profiles...');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role, name');

    if (pError) {
        console.error('Error:', pError);
        return;
    }

    console.log(`Syncing ${profiles.length} profiles to auth metadata...`);
    for (const p of profiles) {
        console.log(`Processing ${p.email || p.id}...`);
        const { error: uError } = await supabase.auth.admin.updateUserById(
            p.id,
            { user_metadata: { role: p.role, full_name: p.name || '' } }
        );
        if (uError) {
            console.error(`  Error syncing ${p.email}:`, uError.message);
        }
    }
    console.log('Sync complete.');
}

syncMetadata();
