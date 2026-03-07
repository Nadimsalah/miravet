-- Migration: Fix Reseller Registration & Login
-- Atomically creates profiles, resellers, and customers records via trigger
-- Fixes RLS for authenticated users on customers table

-- 1. Update RLS for customers table
-- Allow authenticated users to manage their own customer record (needed for resellers)
DROP POLICY IF EXISTS "Allow authenticated insert own customer" ON public.customers;
CREATE POLICY "Allow authenticated insert own customer" ON public.customers
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated select own customer" ON public.customers;
CREATE POLICY "Allow authenticated select own customer" ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated update own customer" ON public.customers;
CREATE POLICY "Allow authenticated update own customer" ON public.customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Enhance the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role;
  full_name TEXT;
BEGIN
  -- Determine role
  assigned_role := CASE 
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'ADMIN' THEN 'ADMIN'::user_role
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'ACCOUNT_MANAGER' THEN 'ACCOUNT_MANAGER'::user_role
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'RESELLER' THEN 'RESELLER'::user_role
    WHEN UPPER(COALESCE(new.raw_user_meta_data->>'role', '')) = 'RESELLER_PENDING' THEN 'RESELLER_PENDING'::user_role
    ELSE 'RESELLER'::user_role -- Default for storefront signups
  END;

  full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);

  -- A. Create Profile
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id, 
    full_name, 
    new.email, 
    assigned_role,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

  -- B. Create Reseller record if applicable
  IF (assigned_role IN ('RESELLER', 'RESELLER_PENDING')) THEN
      INSERT INTO public.resellers (user_id, company_name, ice, website, city, phone, status)
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'company_name', 'Personal Account'),
        new.raw_user_meta_data->>'ice',
        new.raw_user_meta_data->>'website',
        new.raw_user_meta_data->>'city',
        new.raw_user_meta_data->>'phone',
        CASE WHEN assigned_role = 'RESELLER_PENDING' THEN 'pending' ELSE 'active' END
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        ice = EXCLUDED.ice,
        website = EXCLUDED.website,
        city = EXCLUDED.city,
        phone = EXCLUDED.phone,
        status = EXCLUDED.status;
  END IF;

  -- C. Create Customer record (for all storefront users, including resellers)
  INSERT INTO public.customers (id, name, email, phone, role, status, company_name, ice, website, city, total_orders, total_spent)
  VALUES (
    new.id,
    full_name,
    new.email,
    new.raw_user_meta_data->>'phone',
    LOWER(assigned_role::text),
    CASE WHEN assigned_role = 'RESELLER_PENDING' THEN 'pending' ELSE 'active' END,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'ice',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'city',
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    company_name = EXCLUDED.company_name,
    ice = EXCLUDED.ice,
    website = EXCLUDED.website,
    city = EXCLUDED.city;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Sync existing users who are missing records (Self-healing)
INSERT INTO public.customers (id, name, email, phone, role, status, total_orders, total_spent)
SELECT 
    p.id, 
    p.name, 
    p.email, 
    p.phone, 
    LOWER(p.role::text), 
    CASE WHEN p.role = 'RESELLER_PENDING' THEN 'pending' ELSE 'active' END,
    0, 
    0
FROM public.profiles p
LEFT JOIN public.customers c ON p.id = c.id
WHERE c.id IS NULL
AND p.role NOT IN ('ADMIN', 'ACCOUNT_MANAGER');
