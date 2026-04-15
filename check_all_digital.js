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

async function checkAllDigitalAssignments() {
    const { data: assignments, error } = await supabase
        .from('account_manager_assignments')
        .select(`
            account_manager_id,
            profile:profiles(email),
            reseller:resellers(company_name)
        `)
        .is('soft_deleted_at', null);

    const digitalAssignments = assignments.filter(a => a.reseller?.company_name?.toUpperCase().includes('DIGITAUX'));
    console.log('Managers assigned to CLIENTS DIGITAUX:', JSON.stringify(digitalAssignments, null, 2));
}

checkAllDigitalAssignments();
