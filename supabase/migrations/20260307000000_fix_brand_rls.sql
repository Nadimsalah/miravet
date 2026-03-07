-- Fix brand RLS policies to explicitly include WITH CHECK for inserts
DROP POLICY IF EXISTS "Allow admin to manage brands" ON public.brands;

CREATE POLICY "Allow admin to manage brands" ON public.brands
    FOR ALL 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Also ensure storage bucket policies are correctly applied and not conflicting
-- (Already added in previous migration but good to keep in mind)
