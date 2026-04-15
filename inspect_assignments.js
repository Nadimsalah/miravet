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

async function findAMs() {
    const { data: ams, error } = await supabase.from('profiles').select('id, name, email').eq('role', 'ACCOUNT_MANAGER');
    if (error) return console.error(error);
    console.log('Account Managers:', JSON.stringify(ams, null, 2));

    if (ams && ams.length > 0) {
        // Try to query assignments for the first AM
        const { data: assignments, error: assignError } = await supabase
            .from('account_manager_assignments')
            .select('*')
            .eq('account_manager_id', ams[0].id)
            .is('soft_deleted_at', null);

        if (assignError) {
          console.error('Assignments ERROR:', assignError);
          // If account_manager_id is missing, find what IS there
          const { data: allCols } = await supabase.from('account_manager_assignments').select('*').limit(1);
          console.log('ALL COLUMNS:', JSON.stringify(Object.keys(allCols[0] || {}), null, 2));
        } else {
          console.log(`Found ${assignments.length} assignments for ${ams[0].email}`);
        }
    }
}

findAMs();
