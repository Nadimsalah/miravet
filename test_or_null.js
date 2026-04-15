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

async function testOrNull() {
    // Test if PostgREST or() supports .is.null
    console.log('Testing .or("reseller_id.is.null")...');
    const { data, error } = await supabase
        .from('orders')
        .select('id')
        .or('reseller_id.is.null')
        .limit(5);

    if (error) {
        console.error('Error with .or("reseller_id.is.null"):', error);
    } else {
        console.log('Success with .or("reseller_id.is.null"), count:', data.length);
    }

    // Test with multiple conditions
    console.log('Testing .or("reseller_id.in.(...),reseller_id.is.null")...');
    const { data: data2, error: error2 } = await supabase
        .from('orders')
        .select('id')
        .or('reseller_id.in.(98fb5919-ab5d-41b8-b970-6d78affda6e4),reseller_id.is.null')
        .limit(5);

    if (error2) {
        console.error('Error with combined .or():', error2);
    } else {
        console.log('Success with combined .or(), count:', data2.length);
    }
}

testOrNull();
