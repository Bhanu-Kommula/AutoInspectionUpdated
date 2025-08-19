-- Add technicianPhone column to posting_dashboard table
-- Run this script on your PostgreSQL database

ALTER TABLE posting_dashboard 
ADD COLUMN technician_phone VARCHAR(20);

-- Update existing records to set a default phone number if needed
-- This is optional - you can leave it as NULL for existing records
-- UPDATE posting_dashboard 
-- SET technician_phone = '+15551234567' 
-- WHERE technician_phone IS NULL AND technician_email IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posting_dashboard' 
AND column_name = 'technician_phone';
