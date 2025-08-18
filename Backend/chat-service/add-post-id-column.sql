-- Add missing post_id column to chat_rooms table
-- This fixes the "Unknown column 'post_id' in 'field list'" error

USE inspection;

-- First check if the column already exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'inspection' 
  AND TABLE_NAME = 'chat_rooms' 
  AND COLUMN_NAME = 'post_id';

-- Add the column only if it doesn't exist
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE chat_rooms ADD COLUMN post_id INT NULL AFTER technician_email', 
  'SELECT "Column post_id already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for the post_id column if it was just created
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'inspection' 
  AND TABLE_NAME = 'chat_rooms' 
  AND INDEX_NAME = 'idx_post_id';

SET @sql_index = IF(@index_exists = 0, 
  'ALTER TABLE chat_rooms ADD INDEX idx_post_id (post_id)', 
  'SELECT "Index idx_post_id already exists" as message');

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

-- Show the final structure
DESCRIBE chat_rooms;
