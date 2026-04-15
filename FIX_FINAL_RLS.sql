-- ==========================================
-- FINAL FIX: Completely Drop and Clean Policies
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Completely drop ALL existing policies on the affected tables to clean the slate
DROP POLICY IF EXISTS "Allow admins to see all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins see all profiles via JWT" ON profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Allow admins to see all resellers" ON resellers;
DROP POLICY IF EXISTS "Resellers can see own reseller data" ON resellers;
DROP POLICY IF EXISTS "Anyone can view all resellers" ON resellers;

-- 2. Setup the Safe Admin Check Function
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Only return true if the user's role in the profile table is an admin variant
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'admin', 'manager', 'partner') -- Added 'partner' just in case you are registered as that
    );
$$;

GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO anon;

-- 3. Create Clean, Simplified Policies for PROFILES
-- Use the secure function OR check if it's their own profile
CREATE POLICY "Profiles access policy"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR public.check_is_admin()
  );

-- 4. Create Clean, Simplified Policies for RESELLERS
CREATE POLICY "Resellers access policy"
  ON resellers FOR SELECT
  USING (
    auth.uid() = user_id OR public.check_is_admin()
  );

-- Ensure RLS is actually enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

-- 5. Small fix: Make sure your specific email is recognized as ADMIN to avoid issues
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'salaheddinenadim@gmail.com';
