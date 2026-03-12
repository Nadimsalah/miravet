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

async function checkOussama() {
    const { data, error } = await supabase.from('customers').select('*').eq('id', 'a9ac721b-c826-4510-bd17-2e77d15337ce').maybeSingle();
    console.log('Oussama in customers:', data || error || 'NOT FOUND');
}

checkOussama();
