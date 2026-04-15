-- FIX: Account Manager RLS Visibility
-- This script allows Account Managers (staff) to see the resellers and profiles 
-- that are assigned to them, addressing why they see "Reseller not found" 
-- on the detail pages.

-- 1. Create a helper function for staff check (Admin OR Account Manager)
CREATE OR REPLACE FUNCTION public.check_is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'admin', 'ACCOUNT_MANAGER', 'manager')
    );
$$;

-- 2. Update Profiles Policy
DROP POLICY IF EXISTS "Profiles access policy" ON profiles;
CREATE POLICY "Profiles access policy"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id -- Own profile
    OR public.check_is_admin() -- Admin sees all
    OR (
        -- Account managers can see profiles of their assigned resellers
        public.check_is_staff() AND EXISTS (
            SELECT 1 FROM account_manager_assignments ama
            JOIN resellers r ON ama.reseller_id = r.id
            WHERE ama.account_manager_id = auth.uid()
            AND r.user_id = profiles.id
            AND ama.soft_deleted_at IS NULL
        )
    )
  );

-- 3. Update Resellers Policy
DROP POLICY IF EXISTS "Resellers access policy" ON resellers;
CREATE POLICY "Resellers access policy"
  ON resellers FOR SELECT
  USING (
    auth.uid() = user_id -- Own reseller data
    OR public.check_is_admin() -- Admin sees all
    OR (
        -- Account managers can see their assigned resellers
        public.check_is_staff() AND EXISTS (
            SELECT 1 FROM account_manager_assignments ama
            WHERE ama.account_manager_id = auth.uid()
            AND ama.reseller_id = resellers.id
            AND ama.soft_deleted_at IS NULL
        )
    )
  );

-- 4. Ensure Orders are also visible to assigned AMs
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Staff can view orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = customer_id -- Own orders
    OR public.check_is_admin() -- Admin sees all
    OR (
        -- Account managers see orders of their assigned resellers
        public.check_is_staff() AND (
            EXISTS (
                SELECT 1 FROM account_manager_assignments ama
                WHERE ama.account_manager_id = auth.uid()
                AND (ama.reseller_id = orders.reseller_id)
                AND ama.soft_deleted_at IS NULL
            )
            OR 
            EXISTS (
                SELECT 1 FROM account_manager_assignments ama
                JOIN resellers r ON ama.reseller_id = r.id
                WHERE ama.account_manager_id = auth.uid()
                AND r.user_id = orders.customer_id
                AND ama.soft_deleted_at IS NULL
            )
        )
    )
  );

-- Note: We assume the 'orders' table has RLS enabled. 
-- If not, we should enable it.
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
