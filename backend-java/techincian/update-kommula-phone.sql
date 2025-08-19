-- Update phone number for technician kommula
-- This script adds a random phone number for the technician

-- First, let's check if the technician exists
SELECT id, name, email, phone FROM Technicians WHERE LOWER(name) LIKE '%kommula%';

-- Update the phone number for kommula (using a random US phone number)
UPDATE Technicians 
SET phone = '+1' || LPAD(FLOOR(RANDOM() * 900 + 100)::text, 3, '0') || 
           LPAD(FLOOR(RANDOM() * 900 + 100)::text, 3, '0') || 
           LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0'),
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(name) LIKE '%kommula%';

-- Verify the update
SELECT id, name, email, phone, updated_at FROM Technicians WHERE LOWER(name) LIKE '%kommula%';

-- Alternative: If you want a specific phone number instead of random, use this:
-- UPDATE Technicians 
-- SET phone = '+15551234567',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE LOWER(name) LIKE '%kommula%';
