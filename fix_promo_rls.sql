-- Fix RLS for Hero Carousel (Promo)

-- Enable RLS
ALTER TABLE hero_carousel ENABLE ROW LEVEL SECURITY;

-- 1. Public can view ONLY active slides
DROP POLICY IF EXISTS "Public can view carousel" ON hero_carousel;
CREATE POLICY "Public can view carousel" ON hero_carousel
    FOR SELECT USING (is_active = true);

-- 2. Admins can view/edit ALL slides
DROP POLICY IF EXISTS "Admin full access" ON hero_carousel;
CREATE POLICY "Admin full access" ON hero_carousel
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
