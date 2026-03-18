const { createClient } = require('@supabase/supabase-js');

// Using service role key to bypass RLS and fix policies
const supabaseUrl = 'https://xpkvpimvgxbnovxuzdxj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwa3ZwaW12Z3hibm92eHV6ZHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTE1MjQsImV4cCI6MjA4OTMyNzUyNH0.3MSk7RVyNyBj8HfvD_a2e1z-1-wR7Rugg2Ee6xTXzpA';

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
        await supabase.storage.createBucket('product-images', { public: true });
    } else {
        console.log("'product-images' bucket already exists.");
    }

    // 2. We can't easily set arbitrary SQL policies via the JS client easily 
    // without using the 'rpc' method or direct postgres connection.
    // However, we can try to upload a dummy file to see if service role works.
    
    console.log("Bucket check complete. Please run the SQL script provided in the artifact to set public policies.");
}

fixStorage();
