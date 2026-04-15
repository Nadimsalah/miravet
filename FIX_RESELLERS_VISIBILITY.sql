-- 1. Ensure RLS is active
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy for profiles: Admins can see all, users can see own
DROP POLICY IF EXISTS "Anyone can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to see all profiles" ON profiles;

CREATE POLICY "Allow admins to see all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles AS p
            WHERE p.id = auth.uid()
            AND (p.role = 'ADMIN' OR p.role = 'admin' OR p.role = 'manager')
        )
    );

CREATE POLICY "Users can see own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 3. Policy for resellers: Admins can see all, owners can see own
DROP POLICY IF EXISTS "Anyone can view all resellers" ON resellers;
DROP POLICY IF EXISTS "Allow admins to see all resellers" ON resellers;

CREATE POLICY "Allow admins to see all resellers" ON resellers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'ADMIN' OR profiles.role = 'admin' OR profiles.role = 'manager')
        )
    );

CREATE POLICY "Resellers can see own reseller data" ON resellers
    FOR SELECT USING (auth.uid() = user_id);

-- 4. FIX: Current Admin User might not even have a profile entry in the DB!
-- Let's make sure the common email seen in logs exists and has the admin role.
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
SELECT id, 'Super Admin', email, 'ADMIN', NOW(), NOW()
FROM auth.users
WHERE email = 'salaheddinenadim@gmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'salaheddinenadim@gmail.com');

-- Also force the role to ADMIN if it is something else (like reseller_pending)
UPDATE profiles 
SET role = 'ADMIN'
WHERE email = 'salaheddinenadim@gmail.com';
