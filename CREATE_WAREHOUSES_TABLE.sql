-- 1. Create warehouses table with UUID
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Correct the column type in products table
-- We need to convert it to UUID to match warehouses.id
ALTER TABLE products 
ALTER COLUMN warehouse_id TYPE UUID USING (
    CASE 
        WHEN warehouse_id IS NULL OR warehouse_id = '' THEN NULL
        ELSE warehouse_id::UUID
    END
);

-- 3. Add the foreign key constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_warehouse_id_fkey;

ALTER TABLE products
ADD CONSTRAINT products_warehouse_id_fkey 
FOREIGN KEY (warehouse_id) 
REFERENCES warehouses(id) 
ON DELETE SET NULL;

-- 4. Insert some default warehouses if the table is empty
INSERT INTO warehouses (name, location)
SELECT 'Casablanca Main', 'Casablanca'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Casablanca Main');

INSERT INTO warehouses (name, location)
SELECT 'Marrakech Branch', 'Marrakech'
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = 'Marrakech Branch');

-- 5. Enable RLS and add policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read warehouses') THEN
        CREATE POLICY "Allow public read warehouses" ON warehouses FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admins to manage warehouses') THEN
        CREATE POLICY "Allow admins to manage warehouses" ON warehouses FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;
