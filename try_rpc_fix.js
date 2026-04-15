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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function tryExecSql() {
    console.log('Testing for exec_sql RPC...');
    
    const query = `
        CREATE OR REPLACE FUNCTION is_admin_or_manager() 
        RETURNS boolean AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (
              LOWER(role) = 'admin' 
              OR LOWER(role) = 'manager' 
              OR LOWER(role) = 'account_manager'
            )
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
            console.error('RPC exec_sql failed:', error.message);
            console.log('Trying to find any other exec_sql variants...');
             const { data: functions, error: funcError } = await supabase.rpc('get_functions', {});
             if (funcError) console.error('get_functions failed:', funcError.message);
             else console.log('Functions:', functions);
        } else {
            console.log('Successfully ran SQL via RPC exec_sql!');
        }
    } catch (e) {
        console.error('Crash trying to run RPC:', e.message);
    }
}

tryExecSql();
