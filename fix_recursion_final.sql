-- Fixed RLS policies for profiles to avoid recursion
-- Checking roles via JWT claims instead of querying the same table

-- 1. Helper functions that check JWT first
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Prefer checking JWT claims for faster, recursive-safe check
  -- Role is synced to app_metadata/user_metadata by hooks or manual scripts
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' 
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.is_account_manager()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ACCOUNT_MANAGER'
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ACCOUNT_MANAGER'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Direct policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_individual_select" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Users can always see their own row
CREATE POLICY "profiles_individual_select" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Admins can do everything - using the JWT-based check which is safe
CREATE POLICY "profiles_admin_all" ON profiles 
FOR ALL USING (is_admin());

-- Managers should be able to view profiles they need (e.g. resellers)
-- but for simplicity, let's just make them able to view all profiles for now if recursion is fixed
CREATE POLICY "profiles_manager_select" ON profiles 
FOR SELECT USING (is_account_manager());
