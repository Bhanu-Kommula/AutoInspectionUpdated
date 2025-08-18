-- Add Proper Counter Offer Constraints
-- This script adds the correct constraints to maintain business rules

USE inspection;

-- 1. CRITICAL: Only ONE ACCEPTED counter offer per post (prevents multiple technicians accepting same post)
ALTER TABLE counter_offers ADD CONSTRAINT unique_accepted_per_post 
    UNIQUE (post_id, status) 
    WHERE status = 'ACCEPTED';

-- 2. IMPORTANT: Only ONE PENDING counter offer per technician per post (prevents spam)
ALTER TABLE counter_offers ADD CONSTRAINT unique_pending_per_technician_post 
    UNIQUE (post_id, technician_email, status) 
    WHERE status = 'PENDING';

-- 3. Add index for better performance on ACCEPTED status queries
CREATE INDEX idx_counter_offers_accepted_post ON counter_offers (status, post_id) WHERE status = 'ACCEPTED';

-- Verify the constraints
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME,
    COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'inspection' 
AND TABLE_NAME = 'counter_offers'
AND CONSTRAINT_NAME IS NOT NULL;
