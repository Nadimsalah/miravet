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

async function testResellerJoin() {
    console.log('Testing Resellers -> Profiles join...');
    const { data: d1, error: e1 } = await supabase
        .from('resellers')
        .select('company_name, user:profiles!user_id(name, email)')
        .limit(1);
    console.log('Join Result:', e1 || 'SUCCESS');

    console.log('\nTesting Resellers -> Customers join...');
    // Note: customers ID is the same as profiles ID (user_id)
    const { data: d2, error: e2 } = await supabase
        .from('resellers')
        .select('company_name, customer:customers!user_id(total_spent)')
        .limit(1);
    console.log('Join Result:', e2 || 'SUCCESS');
    if (e2) {
      console.log('Error details:', e2.message);
    }
}

testResellerJoin();
