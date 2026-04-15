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

const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const supabaseAnon = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnose() {
    console.log('=== STEP 1: Check tables exist ===');
    const tables = ['profiles', 'customers', 'resellers'];
    for (const table of tables) {
        const { data, error } = await supabaseAdmin.from(table).select('id').limit(1);
        if (error) {
            console.error(`  Table "${table}" ERROR:`, error.message, error.code);
        } else {
            console.log(`  Table "${table}" OK`);
        }
    }

    console.log('\n=== STEP 2: Try signup with verbose error ===');
    const email = `test_${Date.now()}@miravet.ma`;
    const password = 'Password123!';
    console.log('  Email:', email);

    const { data, error } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test User',
                role: 'reseller_pending',
                company_name: 'Test Company',
                ice: '1234567890',
                city: 'Casablanca',
                phone: '0600000000',
            }
        }
    });

    if (error) {
        console.error('  SignUp Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('  SignUp Success! User ID:', data.user?.id);
        console.log('  Email confirmed:', data.user?.email_confirmed_at);
        console.log('  Identities count:', data.user?.identities?.length);
        
        // Clean up test user
        if (data.user?.id) {
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            console.log('  Cleaned up test user');
        }
    }

    console.log('\n=== STEP 3: Check auth.users for any stuck users ===');
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
        console.error('  Cannot list users:', authErr.message);
    } else {
        console.log('  Total auth users:', authUsers.users.length);
        authUsers.users.forEach(u => {
            console.log(`  - ${u.email} | confirmed: ${!!u.email_confirmed_at} | role: ${u.user_metadata?.role}`);
        });
    }
}

diagnose().catch(console.error);
