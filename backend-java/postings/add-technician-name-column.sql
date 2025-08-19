-- Add technician_name column to counter_offers table
ALTER TABLE counter_offers ADD COLUMN technician_name VARCHAR(255);

-- Update existing records with technician names from technician table
-- This is a placeholder - in a real scenario, you would need to join with the technician table
-- For now, we'll set a default value for existing records
UPDATE counter_offers SET technician_name = 'Unknown Technician' WHERE technician_name IS NULL;

-- Make the column NOT NULL after updating existing records
-- Note: This syntax may vary by database system
-- For MySQL: ALTER TABLE counter_offers MODIFY COLUMN technician_name VARCHAR(255) NOT NULL;
-- For PostgreSQL: ALTER TABLE counter_offers ALTER COLUMN technician_name SET NOT NULL;
-- For H2: ALTER TABLE counter_offers ALTER COLUMN technician_name SET NOT NULL;
