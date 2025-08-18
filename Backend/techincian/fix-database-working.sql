-- Working database fix script
-- Run these commands one by one in MySQL

-- 1. Add the created_at column
ALTER TABLE tech_declined_posts ADD COLUMN created_at DATETIME;

-- 2. Set values for existing records
UPDATE tech_declined_posts SET created_at = NOW();

-- 3. Check what indexes already exist
SHOW INDEX FROM tech_declined_posts;

-- 4. Create index on email (only if it doesn't exist)
-- If you get "Duplicate key name" error, the index already exists - that's fine!
CREATE INDEX idx_declined_posts_email ON tech_declined_posts(email);

-- 5. Check the final result
SELECT COUNT(*) as total_records FROM tech_declined_posts;
