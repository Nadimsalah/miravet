-- ==========================================
-- FINAL SYNC: Ensure Admin Role is Correct Everywhere
-- This script fixes the mismatch between profiles and auth metadata
-- and provides a robust RLS fix to avoid infinite recursion.
-- ==========================================

-- 1. Correct the Profiles table for the admin
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'salaheddinenadim@gmail.com';

-- 2. Correct the Auth Metadata (This requires admin/postgres role)
-- Note: This is crucial for JWT-based role checks in code
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "ADMIN"}'::jsonb 
WHERE email = 'salaheddinenadim@gmail.com';

-- 3. DROP old policies to clean up
DROP POLICY IF EXISTS "Profiles access policy" ON profiles;
DROP POLICY IF EXISTS "Resellers access policy" ON resellers;
DROP POLICY IF EXISTS "Allow admins to see all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to see all resellers" ON resellers;

-- 4. Re-setup the Admin Check Function to be more robust
-- We use a SECURITY DEFINER function so it bypasses RLS for the role check itself
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Directly check the role in profiles. 
    -- Since SECURITY DEFINER runs as the owner (superuser), 
    -- it is NOT intercepted by RLS on its internal query.
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'admin')
    );
$$;

-- 5. APPLY THE NEW POLICIES
-- PROFILES: Use a subquery that bypasses RLS by calling the superuser function
CREATE POLICY "Profiles access policy"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR public.check_is_admin()
  );

-- RESELLERS: Similar policy
CREATE POLICY "Resellers access policy"
  ON resellers FOR SELECT
  USING (
    auth.uid() = user_id OR public.check_is_admin()
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

-- 6. Add policy for Service Role explicitly
CREATE POLICY "Service role bypass profile"
  ON profiles FOR ALL
  USING ( (auth.jwt() ->> 'role') = 'service_role' );

CREATE POLICY "Service role bypass reseller"
  ON resellers FOR ALL
  USING ( (auth.jwt() ->> 'role') = 'service_role' );

-- Verify the admin's role now
SELECT id, email, role FROM profiles WHERE email = 'salaheddinenadim@gmail.com';
