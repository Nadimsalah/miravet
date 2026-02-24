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

async function inspectUser() {
    const email = 'sara@mail.com';
    console.log(`Inspecting auth details for: ${email}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log('--- Auth User Details ---');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Confirmed At: ${user.email_confirmed_at}`);
        console.log(`Last Sign In: ${user.last_sign_in_at}`);
        console.log(`User Metadata:`, user.user_metadata);
        console.log(`App Metadata:`, user.app_metadata);
    } else {
        console.log('User not found in Auth system.');
    }
}

inspectUser();
