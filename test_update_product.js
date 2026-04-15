const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    require('dotenv').config({ path: '.env.production' });
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpdate() {
    const { data: prodData } = await supabase.from('products').select('*').limit(1);
    if (!prodData || prodData.length === 0) return console.log('no product');
    const product = prodData[0];
    const { data, error } = await supabase
        .from('products')
        .update({
            title: product.title + ' test',
            updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
    console.log(error || 'success');
}
testUpdate();
