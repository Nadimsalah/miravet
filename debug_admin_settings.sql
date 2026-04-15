-- Check current value
SELECT * FROM admin_settings WHERE key = 'admin_pin';

-- Try to update
UPDATE admin_settings SET value = '654321' WHERE key = 'admin_pin';

-- Check if updated
SELECT * FROM admin_settings WHERE key = 'admin_pin';

-- Reset to default if needed (optional)
-- UPDATE admin_settings SET value = '123456' WHERE key = 'admin_pin';
