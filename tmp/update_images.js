const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envLines = envConfig.split('\n');
const env = {};
envLines.forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProductImages() {
  console.log("Fetching products...");
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title');

  if (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products. Updating images...`);

  for (const product of products) {
    let imageUrl = '/products/antibiotics.png'; // Default

    const title = product.title || "";
    if (title.toLowerCase().includes('anesth') || title.toLowerCase().includes('seda')) {
      imageUrl = '/products/anesth_sedative.png';
    } else if (title.toLowerCase().includes('inflam')) {
      imageUrl = '/products/anti_inflammatory.png';
    } else if (title.toLowerCase().includes('antibio') || title.toLowerCase().includes('infectieux')) {
      imageUrl = '/products/antibiotics.png';
    } else {
        // Rotate for others to make it look diverse
        const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const options = [
            '/products/anesth_sedative.png',
            '/products/antibiotics.png',
            '/products/anti_inflammatory.png'
        ];
        imageUrl = options[hash % options.length];
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Error updating product ${product.id}:`, updateError);
    } else {
      console.log(`Updated product ${product.id} (${product.title}) -> ${imageUrl}`);
    }
  }

  console.log("All products updated!");
}

updateProductImages();
