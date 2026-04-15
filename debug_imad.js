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

async function debugImadAssignments() {
    const accountManagerId = 'f7cea3f8-70ee-4816-a70d-264d15fad8aa'; // Imad

    const { data: assignments, error: amError } = await supabase
        .from('account_manager_assignments')
        .select(`
            reseller_id, 
            customer_id,
            reseller:resellers(company_name)
        `)
        .eq('account_manager_id', accountManagerId)
        .is('soft_deleted_at', null);

    if (amError) throw amError;

    console.log('Assignments for Imad:', JSON.stringify(assignments, null, 2));

    const isGlobalDigitalManager = assignments?.some((r) =>
        r.reseller?.company_name?.toUpperCase().includes('DIGITAUX') ||
        r.reseller?.company_name?.toUpperCase().includes('DIGITAL GLOBAL')
    );

    console.log('Is Global Manager detectable?', isGlobalDigitalManager);
}

debugImadAssignments();
