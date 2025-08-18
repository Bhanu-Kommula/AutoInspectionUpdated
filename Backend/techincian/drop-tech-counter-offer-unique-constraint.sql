-- Drop unique constraint on tech_counter_offers that blocked multiple same-status rows
-- Allows dealer to reject up to 3 counter offers for the same post/technician

USE inspection;

-- MySQL 8.0.13+ supports IF EXISTS
ALTER TABLE tech_counter_offers DROP INDEX IF EXISTS unique_active_counter_offer;

-- Optional: helpful composite index for queries by status/post/tech
CREATE INDEX IF NOT EXISTS idx_tech_counter_status_post_tech 
ON tech_counter_offers (status, post_id, technician_email);


