-- Update the helper functions to use the safe JWT check
-- This ensures all policies using these functions work correctly without recursion

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_account_manager()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ACCOUNT_MANAGER'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ACCOUNT_MANAGER'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Re-verify RLS activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Ensure managers can see orders and resellers
DROP POLICY IF EXISTS "Managers can view assigned resellers" ON resellers;
CREATE POLICY "Managers can view assigned resellers" ON resellers
FOR SELECT USING (
  is_admin() OR is_account_manager()
);

DROP POLICY IF EXISTS "Managers can view orders" ON orders;
CREATE POLICY "Managers can view orders" ON orders
FOR SELECT USING (
  is_admin() OR is_account_manager()
);
