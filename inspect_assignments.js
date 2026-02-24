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

async function inspectAssignments() {
    const { data, error } = await supabase
        .from('account_manager_assignments')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Assignments Sample:', data);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        }
    }

    // Also check for 'imad@mail.com' ID first
    const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', 'imad@mail.com').single();
    if (profiles) {
        console.log('Imad ID:', profiles.id);
        const { data: imadAssignments } = await supabase
            .from('account_manager_assignments')
            .select('*')
            .eq('account_manager_id', profiles.id)
            .is('soft_deleted_at', null);
        console.log('Imad Current Assignments:', imadAssignments);
    }
}

inspectAssignments();
