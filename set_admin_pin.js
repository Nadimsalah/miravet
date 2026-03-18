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

async function setAdminPin() {
    console.log('Setting default admin_pin to 123456...');

    const { data, error } = await supabase
        .from('admin_settings')
        .upsert({ key: 'admin_pin', value: '123456' }, { onConflict: 'key' });

    if (error) {
        console.error('Error:', error.message, error.code);
    } else {
        console.log('Success! Admin PIN set to 123456');
    }
}

setAdminPin();
