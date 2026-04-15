
import { supabaseAdmin } from './lib/supabase-server';

async function verifyProducts() {
    console.log('--- Database Verification ---');
    
    // 1. Check all products
    const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('id, title, status, category, images');
        
    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`Found ${products?.length || 0} products in database:`);
        products?.forEach(p => {
            console.log(`- [${p.id}] ${p.title} | Status: ${p.status} | Category: "${p.category}" | Has Image: ${!!p.images?.length}`);
        });
    }

    // 2. Check categories
    const { data: categories, error: catError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug');
        
    if (catError) {
        console.error('Error fetching categories:', catError);
    } else {
        console.log(`\nFound ${categories?.length || 0} categories:`);
        categories?.forEach(c => {
            console.log(`- ${c.name} (slug: ${c.slug})`);
        });
    }
}

verifyProducts();
