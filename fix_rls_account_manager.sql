-- Update is_admin_or_manager function to include ACCOUNT_MANAGER
-- This fix allows users with the 'ACCOUNT_MANAGER' role to manage suppliers and other admin tasks.

CREATE OR REPLACE FUNCTION is_admin_or_manager() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      LOWER(role) = 'admin' 
      OR LOWER(role) = 'manager' 
      OR LOWER(role) = 'account_manager'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-verify RLS policies for suppliers table
-- (These should already be using is_admin_or_manager(), but re-applying ensures they are current)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins manage suppliers" ON suppliers;
    
    CREATE POLICY "Admins manage suppliers" ON suppliers 
    FOR ALL USING (is_admin_or_manager()) 
    WITH CHECK (is_admin_or_manager());
END $$;
