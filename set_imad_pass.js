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

async function setImadPass() {
    const email = 'imad@mail.com';
    const newPassword = '102030++';

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        console.log(`Setting password for ${email} to 102030++...`);
        const { error } = await supabase.auth.admin.updateUserById(user.id, {
            password: newPassword,
            email_confirm: true
        });
        if (error) console.error(error);
        else console.log('Update successful.');
    } else {
        console.log('User not found.');
    }
}

setImadPass();
