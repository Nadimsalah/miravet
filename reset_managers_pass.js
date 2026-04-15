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

async function resetPassword() {
    const emails = ['imad@mail.com', 'sara@mail.com', 'tarik@gmail.com'];
    const newPassword = 'Password123!';

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error:', listError);
        return;
    }

    for (const email of emails) {
        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`Resetting ${email}...`);
            await supabase.auth.admin.updateUserById(user.id, { password: newPassword, email_confirm: true });
            console.log(`Done.`);
        }
    }
}

resetPassword();
