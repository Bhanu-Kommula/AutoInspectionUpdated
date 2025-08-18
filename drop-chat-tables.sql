-- Drop Chat Tables Script
-- This script removes all chat-related tables from the database
-- Run this script in your MySQL database to completely remove chat functionality

-- Drop tables in correct order (respecting foreign key constraints)

-- Drop dependent tables first
DROP TABLE IF EXISTS signals;
DROP TABLE IF EXISTS call_logs;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS room_participants;

-- Drop main tables
DROP TABLE IF EXISTS rooms;

-- Also drop any chat-related tables that might exist with different names
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS chat_participants;
DROP TABLE IF EXISTS chat_call_logs;
DROP TABLE IF EXISTS chat_signals;

-- Drop any indexes that might still exist
-- (These will automatically drop with tables, but just to be safe)
DROP INDEX IF EXISTS idx_messages_room_created;
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_room_uid;
DROP INDEX IF EXISTS idx_room_display;
DROP INDEX IF EXISTS idx_room_last_seen;
DROP INDEX IF EXISTS idx_room_started;

COMMIT;

-- Verification query - run this to confirm all chat tables are gone
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
-- WHERE TABLE_SCHEMA = 'inspection' 
-- AND TABLE_NAME LIKE '%chat%' 
-- OR TABLE_NAME IN ('rooms', 'messages', 'call_logs', 'signals', 'room_participants');
