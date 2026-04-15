-- 1. Add delivery_proof column to orders if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_proof') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_proof TEXT;
    END IF;
END $$;

-- 2. Create the storage bucket 'delivery-proofs' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set RLS for the bucket (Allow authenticated uploads, public reads)
-- Policy: Allow authenticated users (delivery men) to upload
DROP POLICY IF EXISTS "Delivery men can upload proofs" ON storage.objects;
CREATE POLICY "Delivery men can upload proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-proofs');

-- Policy: Allow public to view proofs (useful for admins/managers)
DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;
CREATE POLICY "Public can view proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'delivery-proofs');
