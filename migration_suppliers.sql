-- Create Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Supplier Purchases table (Tracking inventory inflow)
CREATE TABLE IF NOT EXISTS supplier_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(12, 2) NOT NULL CHECK (purchase_price >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_supplier_purchases_supplier_id ON supplier_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_purchases_product_id ON supplier_purchases(product_id);

-- Helper function for safe stock increment
CREATE OR REPLACE FUNCTION increment_stock(x INT, row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = COALESCE(stock, 0) + x
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;

-- Update admin check function to be case-insensitive
CREATE OR REPLACE FUNCTION is_admin_or_manager() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (LOWER(role) = 'admin' OR LOWER(role) = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Policies with WITH CHECK for Inserts/Updates
DO $$ 
BEGIN
    -- Drop old policies first if needed to ensure we use the updated syntax
    DROP POLICY IF EXISTS "Admins manage suppliers" ON suppliers;
    DROP POLICY IF EXISTS "Admins manage supplier purchases" ON supplier_purchases;
    
    CREATE POLICY "Admins manage suppliers" ON suppliers 
    FOR ALL USING (is_admin_or_manager()) 
    WITH CHECK (is_admin_or_manager());
    
    CREATE POLICY "Admins manage supplier purchases" ON supplier_purchases 
    FOR ALL USING (is_admin_or_manager())
    WITH CHECK (is_admin_or_manager());
END $$;

