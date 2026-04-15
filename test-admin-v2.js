const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = loadEnv(path.resolve(process.cwd(), '.env.local'));

async function testOrderFetch() {
    console.log('Testing connection with SUPABASE_SERVICE_ROLE_KEY...');
    console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing environment variables in .env.local');
        return;
    }

    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=id&limit=1`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`--- RESULT: FAILED ---`);
            console.error(`Status: ${response.status} ${response.statusText}`);
            console.error(err);
        } else {
            const data = await response.json();
            console.log('--- RESULT: SUCCESS ---');
            console.log('Fetched Data:', data);
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

testOrderFetch();
