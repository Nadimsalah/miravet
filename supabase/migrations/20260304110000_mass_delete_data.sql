-- Resilient Mass Delete Script
-- This script wipes all transactions and users (except admins) while preserving products.
-- It checks if tables exist before attempting to delete from them to avoid errors.

DO $$ 
BEGIN
    -- 1. Wipe Order Data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        TRUNCATE public.order_items CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_status_logs') THEN
        TRUNCATE public.order_status_logs CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_internal_notes') THEN
        TRUNCATE public.order_internal_notes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_timeline') THEN
        TRUNCATE public.order_timeline CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        TRUNCATE public.orders CASCADE;
    END IF;

    -- 2. Wipe Customer Data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        TRUNCATE public.customers CASCADE;
    END IF;

    -- 3. Wipe Reseller & Account Manager Data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_manager_assignments') THEN
        TRUNCATE public.account_manager_assignments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resellers') THEN
        TRUNCATE public.resellers CASCADE;
    END IF;

    -- 4. Clear Push Subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        TRUNCATE public.push_subscriptions CASCADE;
    END IF;

    -- 5. Delete all Auth Users EXCEPT Admins
    -- This handles the profiles deletion via CASCADE if configured, 
    -- or we delete profiles afterwards if needed.
    DELETE FROM auth.users 
    WHERE id IN (
        SELECT id FROM public.profiles 
        WHERE role IS DISTINCT FROM 'ADMIN'
    );

    -- 6. Reset Product Sales
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        UPDATE public.products SET sales_count = 0;
    END IF;

END $$;
