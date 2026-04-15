-- Force Activate All Promo/Hero Carousel Slides
-- Run this to make ALL slides visible on the home page immediately

UPDATE hero_carousel
SET is_active = true;

-- Optional: If some slides are missing images, you might still not see them.
-- You can check them with:
-- SELECT * FROM hero_carousel;
