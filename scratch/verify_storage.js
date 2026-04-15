const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc1MTUyNCwiZXhwIjoyMDg5MzI3NTI0fQ.b_IIXQvvI_ddS-EPOCg_Jx1qDHrrPw5mJNrLuUljLBE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStorage() {
    console.log("Checking storage buckets...");
    
    // 1. Create bucket if not exists
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    if (getBucketsError) {
        console.error("Error listing buckets:", getBucketsError);
        return;
    }

    if (!buckets.find(b => b.id === 'product-images')) {
        console.log("Creating 'product-images' bucket...");
        const { error: createError } = await supabase.storage.createBucket('product-images', { 
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) console.error("Error creating bucket:", createError);
    } else {
        console.log("'product-images' bucket already exists.");
        // Ensure it is public
        await supabase.storage.updateBucket('product-images', { public: true });
    }

    console.log("Buckets verified. Since I cannot set SQL policies via JS client, please run the SQL provided in the chat.");
}

fixStorage();
