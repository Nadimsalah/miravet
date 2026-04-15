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

async function checkDigitalResellers() {
    const { data: resellers, error } = await supabase
        .from('resellers')
        .select('*')
        .ilike('company_name', '%digit%');

    if (error) console.error(error);
    else console.log('Digital Resellers:', JSON.stringify(resellers, null, 2));
}

checkDigitalResellers();
