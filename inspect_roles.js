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

async function inspectUser() {
    console.log('Inspecting user roles...');

    // Get all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, role');

    if (error) {
        console.error('Error fetching profiles:', error.message);
    } else {
        console.log('All Profiles:', JSON.stringify(profiles, null, 2));
    }
}

inspectUser();
