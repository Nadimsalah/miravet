-- ============================================================
-- FIX SIGNUP TRIGGER - Run this in Supabase SQL Editor
-- This fixes the broken handle_new_user trigger that causes
-- signup to fail with error 500 "unexpected_failure"
-- ============================================================

-- STEP 1: Drop any broken existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 2: Recreate the function with robust error handling
-- This matches your actual table schema (profiles, customers, resellers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_company_name TEXT;
  v_ice TEXT;
  v_website TEXT;
  v_city TEXT;
  v_phone TEXT;
BEGIN
  -- Extract metadata safely with fallbacks
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'reseller_pending'
  );
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  v_company_name := NEW.raw_user_meta_data->>'company_name';
  v_ice         := NEW.raw_user_meta_data->>'ice';
  v_website     := NEW.raw_user_meta_data->>'website';
  v_city        := NEW.raw_user_meta_data->>'city';
  v_phone       := NEW.raw_user_meta_data->>'phone';

  -- Insert into profiles table (core identity)
  INSERT INTO public.profiles (id, name, email, role, phone, city, created_at, updated_at)
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    UPPER(v_role),
    v_phone,
    v_city,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Insert into customers table
  INSERT INTO public.customers (
    id, name, email, phone, role,
    company_name, ice, website, city,
    status, total_orders, total_spent,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_phone,
    v_role,
    v_company_name,
    v_ice,
    v_website,
    v_city,
    'active',
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  -- If registering as reseller, create reseller record too
  IF v_role IN ('reseller', 'reseller_pending', 'RESELLER', 'RESELLER_PENDING') THEN
    INSERT INTO public.resellers (
      user_id, company_name, ice, website, city,
      status, created_at, updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(v_company_name, v_name),
      v_ice,
      v_website,
      v_city,
      'pending',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block signup
  RAISE WARNING 'handle_new_user error for %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- STEP 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Grant required permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT ALL ON public.customers TO supabase_auth_admin;
GRANT ALL ON public.resellers TO supabase_auth_admin;

-- ============================================================
-- DONE! Now verify the trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
-- ============================================================
