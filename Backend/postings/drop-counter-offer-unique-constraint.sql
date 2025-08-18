-- Drop unique constraint on counter_offers that blocked multiple same-status rows
-- Allows dealer to reject up to 3 counter offers for the same post/technician

USE inspection;

ALTER TABLE counter_offers DROP INDEX IF EXISTS unique_active_request;

-- Optional: supporting index for queries
CREATE INDEX IF NOT EXISTS idx_counter_status_post_tech ON counter_offers (status, post_id, technician_email);


