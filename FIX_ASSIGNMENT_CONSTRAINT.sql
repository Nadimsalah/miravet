-- Add unique constraint for (account_manager_id, reseller_id) to the account_manager_assignments table.
-- This is required by the ON CONFLICT clause in the assignment logic.

DO $$
BEGIN
    -- 1. Remove duplicates before adding the constraint (keeping the oldest)
    DELETE FROM account_manager_assignments
    WHERE id NOT IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY account_manager_id, reseller_id 
                       ORDER BY created_at ASC
                   ) as row_num
            FROM account_manager_assignments
        ) t
        WHERE t.row_num = 1
    );

    -- 2. Add the unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_am_reseller_assignment'
    ) THEN
        ALTER TABLE account_manager_assignments 
        ADD CONSTRAINT unique_am_reseller_assignment UNIQUE (account_manager_id, reseller_id);
    END IF;
END $$;
