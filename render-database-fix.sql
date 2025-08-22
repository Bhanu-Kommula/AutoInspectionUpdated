-- RENDER DATABASE FIX: Add unique constraint to prevent race conditions
-- Run this on your Render PostgreSQL database

-- First, check if there are any duplicates and remove them
DELETE FROM tech_accepted_post 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM tech_accepted_post 
    GROUP BY post_id
);

-- Add unique constraint on post_id to prevent race conditions at database level
ALTER TABLE tech_accepted_post 
ADD CONSTRAINT uk_tech_accepted_post_post_id UNIQUE (post_id);

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'tech_accepted_post'
    AND tc.constraint_type = 'UNIQUE';

-- Check current table structure
\d tech_accepted_post;
