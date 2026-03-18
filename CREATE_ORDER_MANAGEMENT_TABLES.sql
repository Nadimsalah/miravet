-- Create order_status_logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_internal_notes table
CREATE TABLE IF NOT EXISTS order_internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_internal_notes_order_id ON order_internal_notes(order_id);

-- Enable RLS
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_internal_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_or_manager() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for Logs (Read only for admin/manager)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all status logs') THEN
        CREATE POLICY "Admins can view all status logs" ON order_status_logs
        FOR SELECT USING (is_admin_or_manager());
    END IF;
END $$;

-- RLS Policies for Internal Notes (Full access for admin/manager)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all internal notes') THEN
        CREATE POLICY "Admins can manage all internal notes" ON order_internal_notes
        FOR ALL USING (is_admin_or_manager());
    END IF;
END $$;
