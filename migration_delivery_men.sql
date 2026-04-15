-- 0. Add DELIVERY_MAN to user_role enum if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'DELIVERY_MAN') THEN
            ALTER TYPE user_role ADD VALUE 'DELIVERY_MAN';
        END IF;
    END IF;
END $$;

-- SQL Migration for Delivery Men Feature

-- 1. Ensure profiles has city and phone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
-- phone usually exists but ensuring
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Add delivery_man_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_man_id UUID REFERENCES public.profiles(id);

-- 3. Add delivery tracking fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_failed_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_assigned_at TIMESTAMP WITH TIME ZONE;

-- 4. Create a table for delivery reasons (optional but good for 'generate reasons')
-- Or we can just use a list in the frontend.

-- 5. Policies (Robust creation)
-- Drop existing the policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Delivery men can view their assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery men can update their assigned orders" ON public.orders;

-- Delivery men should see orders assigned to them
CREATE POLICY "Delivery men can view their assigned orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = delivery_man_id);

CREATE POLICY "Delivery men can update their assigned orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = delivery_man_id);
