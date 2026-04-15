-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (including Account Managers) to read Delivery Men profiles
DROP POLICY IF EXISTS "Allow reading delivery men profiles" ON public.profiles;
CREATE POLICY "Allow reading delivery men profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (role = 'DELIVERY_MAN');

-- Allow Account Managers to read their own profile (usually already exists, but ensuring)
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
CREATE POLICY "Allow users to read own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow Account Managers to read orders assigned to them (or all orders if that's the business rule, but usually they see their own)
-- The "getOrders" function in `lib/supabase-api.ts` might bypass RLS if it uses `supabaseAdmin`, but client-side `supabase` client enforces RLS.
-- The manager pages use `supabase` client-side client to fetch delivery men.

-- Ensure delivery men are visible
-- This was the missing piece for the dropdown to populate.
