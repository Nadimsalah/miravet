-- Migration to fix profile deletion errors by allowing null references in history
-- This allows deleting logisticiens or account managers even if they have historical logs.

-- 1. Ensure columns are nullable so we can SET NULL
ALTER TABLE public.order_internal_notes ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.order_status_logs ALTER COLUMN changed_by DROP NOT NULL;

-- 2. Update foreign key constraints to ON DELETE SET NULL
-- This script dynamically finds constraint names to ensure they are dropped correctly regardless of auto-naming.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all constraints on order_status_logs that reference profiles
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = 'order_status_logs' 
        AND column_name = 'changed_by'
    ) LOOP
        EXECUTE 'ALTER TABLE public.order_status_logs DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;

    -- Drop all constraints on order_internal_notes that reference profiles
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = 'order_internal_notes' 
        AND column_name = 'author_id'
    ) LOOP
        EXECUTE 'ALTER TABLE public.order_internal_notes DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
    
    -- Drop all constraints on orders that reference profiles via delivery_man_id
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = 'orders' 
        AND (column_name = 'delivery_man_id' OR column_name = 'reseller_id' AND table_name = 'orders' AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_reseller_id_fkey' AND confdeltype = 's'))
    ) LOOP
        -- We only drop delivery_man_id constraints here. 
        -- reseller_id is usually ON DELETE SET NULL anyway, but checking specifically for delivery_man_id
        IF r.column_name = 'delivery_man_id' THEN
            EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || r.constraint_name;
        END IF;
    END LOOP;
END $$;

-- 3. Re-add constraints with ON DELETE SET NULL
ALTER TABLE public.order_status_logs 
ADD CONSTRAINT order_status_logs_changed_by_fkey 
FOREIGN KEY (changed_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.order_internal_notes 
ADD CONSTRAINT order_internal_notes_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_delivery_man_id_fkey 
FOREIGN KEY (delivery_man_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;
