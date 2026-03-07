-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add brand_id to products
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_id') THEN
        ALTER TABLE public.products ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS products_brand_id_idx ON public.products (brand_id);

-- Add RLS for brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow public read access to brands
CREATE POLICY "Allow public read access to brands" ON public.brands
    FOR SELECT USING (true);

-- Allow admin-only management
CREATE POLICY "Allow admin to manage brands" ON public.brands
    FOR ALL USING (public.is_admin());

-- Function to handle slug generation if needed
CREATE OR REPLACE FUNCTION generate_brand_slug() RETURNS trigger AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Handle potential trailing dash
        NEW.slug := trim(both '-' from NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for brand slug
DROP TRIGGER IF EXISTS brand_slug_trigger ON public.brands;
CREATE TRIGGER brand_slug_trigger
    BEFORE INSERT OR UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION generate_brand_slug();
