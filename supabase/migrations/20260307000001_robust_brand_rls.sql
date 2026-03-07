-- More robust RLS policies for brands
-- First, ensure the authenticated user can actually perform these actions
DROP POLICY IF EXISTS "Allow admin to manage brands" ON public.brands;
DROP POLICY IF EXISTS "Allow admin to manage brands v2" ON public.brands;

-- Explicitly handle INSERT, UPDATE, DELETE with authenticated check and role check
CREATE POLICY "Allow admin to manage brands v2" ON public.brands
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'ADMIN' OR role::text = 'ADMIN') -- Handle both enum and string cases
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'ADMIN' OR role::text = 'ADMIN')
        )
    );

-- Log this action if someone is trying to debug
COMMENT ON POLICY "Allow admin to manage brands v2" ON public.brands IS 'Ensures only authenticated admins can manage brands';
