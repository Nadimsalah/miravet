-- Migration: Fix Login Credentials Issue (Auto-Confirm Users)
-- Run this in the Supabase SQL Editor to bypass email confirmation requirement
-- or manually confirm existing users who are getting "Invalid login credentials"

-- 1. Auto-confirm all existing users who haven't confirmed yet
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    last_sign_in_at = COALESCE(last_sign_in_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Optional: If you want to ensure all future signups are auto-confirmed 
-- via the database trigger (if project settings allow), we can modify the trigger.
-- However, the most reliable way is to go to the Supabase Dashboard:
-- Authentication -> Settings -> Email Auth -> Disable "Confirm Email"

-- 3. Just to be safe, let's also ensure the profile and reseller records exist
-- for any auth user that might have been created before the trigger was fixed.
INSERT INTO public.profiles (id, name, email, role)
SELECT id, email, email, 'RESELLER'::user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.customers (id, name, email, role, status)
SELECT id, email, email, 'reseller', 'pending'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = u.id);
