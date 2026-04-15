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

// Use the anon key (the JWT that's in SUPABASE_SERVICE_ROLE_KEY is actually the anon JWT)
const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAdminPin() {
    console.log('Fetching admin_pin from admin_settings table...');

    const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['admin_pin']);

    if (error) {
        console.error('Error:', error.message, error.code);
    } else {
        console.log('Results:', JSON.stringify(data, null, 2));
    }

    // Also list all keys in admin_settings
    console.log('\nAll admin_settings keys:');
    const { data: allData, error: allError } = await supabase
        .from('admin_settings')
        .select('key, value');

    if (allError) {
        console.error('Error fetching all settings:', allError.message);
    } else {
        console.log(JSON.stringify(allData, null, 2));
    }
}

getAdminPin();
