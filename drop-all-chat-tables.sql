-- Comprehensive Chat Tables Removal Script
-- This will remove ALL chat-related tables and their dependencies

-- Disable foreign key checks temporarily to avoid constraint issues
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all chat-related tables (order doesn't matter with FK checks disabled)
DROP TABLE IF EXISTS message_reads;
DROP TABLE IF EXISTS dealer_technician_messages;
DROP TABLE IF EXISTS dealer_technician_chat_rooms;
DROP TABLE IF EXISTS dealer_technician_online_status;
DROP TABLE IF EXISTS private_chat_messages;
DROP TABLE IF EXISTS private_chat_participants;
DROP TABLE IF EXISTS private_chat_rooms;
DROP TABLE IF EXISTS lightweight_chat_messages;
DROP TABLE IF EXISTS lightweight_chat_participants;
DROP TABLE IF EXISTS lightweight_chat_rooms;
DROP TABLE IF EXISTS lightweight_chat_typing;
DROP TABLE IF EXISTS chat_conversations;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS room_participants;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS user_online_status;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Commit the changes
COMMIT;

-- Show remaining tables to verify chat tables are gone
SELECT 'Remaining tables after cleanup:' as Status;
SHOW TABLES;
