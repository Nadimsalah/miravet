-- Propagated to profiles, resellers, and customers tables.
-- Fix for missing enum values
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'DELIVERY_MAN';

-- 1. Sync profiles (name, phone)
INSERT INTO public.profiles (id, name, email, role, phone)
SELECT 
    u.id, 
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
    u.email,
    CASE 
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'ADMIN' THEN 'ADMIN'::user_role
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'ACCOUNT_MANAGER' THEN 'ACCOUNT_MANAGER'::user_role
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER_PENDING' THEN 'RESELLER_PENDING'::user_role
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER' THEN 'RESELLER'::user_role
        ELSE 'CUSTOMER'::user_role
    END,
    u.raw_user_meta_data->>'phone'
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- 2. Sync resellers table
INSERT INTO public.resellers (user_id, company_name, ice, website, city, phone, status)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'company_name', 'Personal Account'),
    u.raw_user_meta_data->>'ice',
    u.raw_user_meta_data->>'website',
    u.raw_user_meta_data->>'city',
    u.raw_user_meta_data->>'phone',
    CASE 
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER_PENDING' THEN 'pending'
        ELSE 'active'
    END
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' ILIKE 'RESELLER%'
ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    ice = EXCLUDED.ice,
    website = EXCLUDED.website,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status;

-- 3. Sync customers table
INSERT INTO public.customers (id, name, email, phone, role, status, company_name, ice, website, city, total_orders, total_spent)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email),
    u.email,
    u.raw_user_meta_data->>'phone',
    CASE 
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER' THEN 'RESELLER'
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER_PENDING' THEN 'RESELLER_PENDING'
        ELSE 'CUSTOMER'
    END, -- Use uppercase to match enum if column is typed
    CASE 
        WHEN UPPER(u.raw_user_meta_data->>'role') = 'RESELLER_PENDING' THEN 'pending'
        ELSE 'active'
    END,
    u.raw_user_meta_data->>'company_name',
    u.raw_user_meta_data->>'ice',
    u.raw_user_meta_data->>'website',
    u.raw_user_meta_data->>'city',
    0,
    0
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' ILIKE 'RESELLER%'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name,
    ice = EXCLUDED.ice,
    website = EXCLUDED.website,
    city = EXCLUDED.city,
    status = EXCLUDED.status,
    role = EXCLUDED.role;

-- 4. Cleanup: Move personal accounts incorrectly marked as resellers back to CUSTOMER
-- For profiles
UPDATE public.profiles 
SET role = 'CUSTOMER' 
WHERE role = 'RESELLER' 
AND (id NOT IN (SELECT user_id FROM resellers WHERE company_name IS NOT NULL AND company_name != 'Personal Account'));

-- For customers
UPDATE public.customers 
SET role = 'CUSTOMER' 
WHERE role = 'RESELLER' 
AND (company_name IS NULL OR company_name = 'Personal Account');
