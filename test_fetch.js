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

async function testFetchOrders() {
    const accountManagerId = 'f7cea3f8-70ee-4816-a70d-264d15fad8aa'; // Imad

    // Fetch assigned IDs
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

    const resellerIds = assignments?.map(r => r.reseller_id).filter(Boolean) || [];
    const customerIds = assignments?.map(r => r.customer_id).filter(Boolean) || [];

    const isGlobalDigitalManager = assignments?.some(r =>
        r.reseller?.company_name?.toUpperCase().includes('DIGITAUX') ||
        r.reseller?.company_name?.toUpperCase().includes('DIGITAL GLOBAL')
    );

    console.log('Is Global Manager:', isGlobalDigitalManager);
    console.log('Reseller IDs:', resellerIds);

    const orConditions = [];
    if (resellerIds.length > 0) orConditions.push(`reseller_id.in.(${resellerIds.join(',')})`);
    if (customerIds.length > 0) orConditions.push(`customer_id.in.(${customerIds.join(',')})`);
    if (isGlobalDigitalManager) orConditions.push(`reseller_id.is.null`);

    console.log('OR Conditions:', orConditions);

    if (orConditions.length > 0) {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .or(orConditions.join(','))
            .limit(10);

        if (error) console.error(error);
        else console.log(`Found ${orders.length} orders for Imad.`);
    }
}

testFetchOrders();
