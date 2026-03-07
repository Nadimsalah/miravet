-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public to view images
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to upload brand logos
CREATE POLICY "Allow Admin to upload brand logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND 
        (storage.foldername(name))[1] = 'brands' AND
        public.is_admin()
    );

-- Policy to allow admins to delete brand logos
CREATE POLICY "Allow Admin to delete brand logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND 
        (storage.foldername(name))[1] = 'brands' AND
        public.is_admin()
    );

-- Policy to allow admins to update brand logos
CREATE POLICY "Allow Admin to update brand logos" ON storage.objects
    FOR UPDATE WITH CHECK (
        bucket_id = 'product-images' AND 
        (storage.foldername(name))[1] = 'brands' AND
        public.is_admin()
    );
