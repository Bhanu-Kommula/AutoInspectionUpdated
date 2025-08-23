-- Add unique constraint to post_id in tech_accepted_post table
-- This prevents race conditions where multiple technicians accept the same post

-- First, remove any duplicate entries (keep the earliest one)
DELETE FROM tech_accepted_post 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM tech_accepted_post 
    GROUP BY post_id
);

-- Add unique constraint on post_id
ALTER TABLE tech_accepted_post 
ADD CONSTRAINT uk_tech_accepted_post_post_id UNIQUE (post_id);

-- Verify the constraint was added
-- This will show in the logs when migration runs
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_tech_accepted_post_post_id' 
        AND table_name = 'tech_accepted_post'
    ) THEN
        RAISE NOTICE 'SUCCESS: Unique constraint uk_tech_accepted_post_post_id added to tech_accepted_post table';
    ELSE
        RAISE EXCEPTION 'FAILED: Unique constraint was not added properly';
    END IF;
END $$;
