-- ==========================================
-- FIX 1: Prevent Infinite Recursion in Policies
-- ==========================================

-- 1. Drop existing broken policies (that query profiles inside their own policy)
DROP POLICY IF EXISTS "Allow admins to see all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to see all resellers" ON resellers;
DROP POLICY IF EXISTS "Resellers can see own reseller data" ON resellers;


-- 2. Create a secure function to check admin status bypassing RLS
-- Security Definer allows it to run with elevated privileges without recurring 
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'admin', 'manager')
    );
$$;

-- Give access to use this function
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO anon;


-- 3. Create Safe Policies for PROFILES
CREATE POLICY "Allow admins to see all profiles"
  ON profiles FOR SELECT
  USING (public.check_is_admin());

CREATE POLICY "Users can see own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);


-- 4. Create Safe Policies for RESELLERS
CREATE POLICY "Allow admins to see all resellers"
  ON resellers FOR SELECT
  USING (public.check_is_admin());

CREATE POLICY "Resellers can see own reseller data"
  ON resellers FOR SELECT
  USING (auth.uid() = user_id);

-- ==========================================
-- END SCRIPT
-- ==========================================
