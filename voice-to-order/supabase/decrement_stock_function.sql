-- =====================================================================
-- Atomic stock decrement function (prevents race conditions)
-- Run this in Supabase SQL Editor AFTER the voice_order_schema.sql
-- =====================================================================

CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_qty        INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the row for this transaction
  SELECT stock INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF current_stock IS NULL THEN
    RETURN FALSE;  -- Product not found
  END IF;

  IF current_stock < p_qty THEN
    RETURN FALSE;  -- Insufficient stock
  END IF;

  UPDATE products
  SET stock = stock - p_qty,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;
