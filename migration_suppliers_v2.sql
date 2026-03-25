-- Update Supplier Purchases table with document and payment tracking
ALTER TABLE supplier_purchases 
ADD COLUMN IF NOT EXISTS bl_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'cheque', 'card', 'transfer')),
ADD COLUMN IF NOT EXISTS payment_modality TEXT;

-- Update the view/indexes if needed (optional for now as we use direct table access)
COMMENT ON COLUMN supplier_purchases.bl_number IS 'Bon de Livraison number';
COMMENT ON COLUMN supplier_purchases.invoice_number IS 'Facture (Invoice) number';
COMMENT ON COLUMN supplier_purchases.payment_method IS 'Method of payment used for this purchase';
COMMENT ON COLUMN supplier_purchases.payment_modality IS 'Payment terms or specific details about the payment';
