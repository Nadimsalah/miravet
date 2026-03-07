-- 1. Manually confirm all existing users who haven't confirmed yet
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW(),
    last_sign_in_at = COALESCE(last_sign_in_at, NOW()),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email_confirmed_at IS NULL;

-- 2. Create a trigger function to automatically confirm any NEW users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to auth.users (requires superuser or bypassrls)
-- Note: In Supabase, this is often better handled in the Dashboard UI.
-- But we can try to add it to the 'on_auth_user_created' trigger if it exists.

DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- 4. Ensure Profile and Reseller records exist for all auth users (Sync check)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', 'User'), COALESCE(u.raw_user_meta_data->>'role', 'customer')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
