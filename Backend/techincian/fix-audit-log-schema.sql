-- Fix technician_audit_log table schema
-- Run these commands in MySQL to fix the missing 'action' field

-- 1. Add the missing 'action' field to the technician_audit_log table
ALTER TABLE technician_audit_log ADD COLUMN action VARCHAR(255) NOT NULL;

-- 2. Set a default value for the action field
UPDATE technician_audit_log SET action = 'STATUS_CHANGE' WHERE action IS NULL;

-- 3. Verify the table structure
DESCRIBE technician_audit_log;

-- 4. Check if there are any existing records
SELECT COUNT(*) as total_records FROM technician_audit_log;
