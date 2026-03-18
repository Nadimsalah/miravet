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
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignUp() {
    const email = `test_user_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Testing SignUp for: ${email}`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Member',
                role: 'reseller_pending'
            }
        }
    });

    if (error) {
        console.error('SignUp Failed:', error);
    } else {
        console.log('SignUp Succeeded!', data.user?.id);
    }
}

testSignUp();
