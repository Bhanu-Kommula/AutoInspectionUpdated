-- Add unique constraint to postId column in tech_accepted_post table
-- This prevents race conditions at the database level

-- First, remove any duplicate entries (if they exist)
DELETE FROM tech_accepted_post 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM tech_accepted_post 
    GROUP BY "postId"
);

-- Add unique constraint on postId column
ALTER TABLE tech_accepted_post 
ADD CONSTRAINT uk_tech_accepted_post_postid UNIQUE ("postId");

-- Add index for better performance on postId queries
CREATE INDEX IF NOT EXISTS idx_tech_accepted_post_postid ON tech_accepted_post("postId");
