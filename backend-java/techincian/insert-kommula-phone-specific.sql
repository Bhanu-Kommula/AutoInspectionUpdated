-- Insert/Update specific phone number for technician kommula
-- Generated phone number: +15509248259

-- First, check if technician 'kommula' exists
SELECT id, name, email, phone FROM Technicians WHERE LOWER(name) LIKE '%kommula%';

-- Update the phone number for kommula with the specific generated number
UPDATE Technicians 
SET phone = '+15509248259',
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(name) LIKE '%kommula%';

-- Verify the update
SELECT id, name, email, phone, updated_at FROM Technicians WHERE LOWER(name) LIKE '%kommula%';

-- If no technician found with name 'kommula', you might want to search by email:
-- SELECT id, name, email, phone FROM Technicians WHERE LOWER(email) LIKE '%kommula%';

-- Alternative: Update by email if you know the email address
-- UPDATE Technicians 
-- SET phone = '+15509248259',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE LOWER(email) LIKE '%kommula%';
