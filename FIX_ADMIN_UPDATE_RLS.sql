-- ==========================================
-- FIX MISSING UPDATE POLICIES FOR ADMINS
-- The previous script only added SELECT policies.
-- This script adds UPDATE/ALL policies so admins can approve accounts.
-- ==========================================

-- 1. Ensure the check_is_admin function exists (idempotent)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'admin')
    );
$$;

-- 2. Add UPDATE/ALL policies for PROFILES
DROP POLICY IF EXISTS "Admin ALL profiles" ON profiles;
CREATE POLICY "Admin ALL profiles"
  ON profiles FOR ALL
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- 3. Add UPDATE/ALL policies for RESELLERS
DROP POLICY IF EXISTS "Admin ALL resellers" ON resellers;
CREATE POLICY "Admin ALL resellers"
  ON resellers FOR ALL
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- 4. Just in case, grant all to users on their OWN reseller record (for profile edits)
DROP POLICY IF EXISTS "Users can update their own reseller info" ON resellers;
CREATE POLICY "Users can update their own reseller info"
  ON resellers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Re-verify the existing SELECT policies still work or are replaced by ALL
-- (They are effectively subsumed by ALL if it covers SELECT)
