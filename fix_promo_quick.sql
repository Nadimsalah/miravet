-- Quick Fix for Promo/Hero Carousel Visibility
-- Run this in the Supabase SQL Editor

-- 1. Create a secure function to check if user is admin (bypassing RLS on profiles)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reset RLS on the table
ALTER TABLE hero_carousel ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view carousel" ON hero_carousel;
DROP POLICY IF EXISTS "Admin full access" ON hero_carousel;
DROP POLICY IF EXISTS "Public can view active carousel" ON hero_carousel;

-- 3. Policy for Public (Everyone): Only see active slides
CREATE POLICY "Public can view active carousel" ON hero_carousel
    FOR SELECT
    USING (is_active = true);

-- 4. Policy for Admins: See EVERYTHING (Active & Inactive) and Edit
CREATE POLICY "Admin full access" ON hero_carousel
    FOR ALL
    USING (check_is_admin());
