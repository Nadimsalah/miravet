-- Add logo_url column to categories table for subcategory brand logos
ALTER TABLE categories ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Optional: create a storage policy for the category-logos bucket
-- Run this in Supabase dashboard > Storage > New bucket: "category-logos" (public)
