-- Add Proper Counter Offer Constraints
-- This script adds the correct constraints to maintain business rules

-- PostgreSQL: no USE; ensure correct DB is targeted in connection

-- 1. CRITICAL: Only ONE ACCEPTED counter offer per post (prevents multiple technicians accepting same post)
ALTER TABLE counter_offers ADD CONSTRAINT unique_accepted_per_post 
    UNIQUE (post_id, status) 
    DEFERRABLE INITIALLY IMMEDIATE;

-- Partial unique index for ACCEPTED status (PostgreSQL preferred)
DROP INDEX IF EXISTS ux_counter_offers_accepted_per_post;
CREATE UNIQUE INDEX IF NOT EXISTS ux_counter_offers_accepted_per_post
  ON counter_offers (post_id)
  WHERE status = 'ACCEPTED';

-- 2. IMPORTANT: Only ONE PENDING counter offer per technician per post (prevents spam)
DROP INDEX IF EXISTS ux_counter_offers_pending_per_technician_post;
CREATE UNIQUE INDEX IF NOT EXISTS ux_counter_offers_pending_per_technician_post
  ON counter_offers (post_id, technician_email)
  WHERE status = 'PENDING';

-- 3. Add index for better performance on ACCEPTED status queries
CREATE INDEX IF NOT EXISTS idx_counter_offers_accepted_post ON counter_offers (status, post_id) WHERE status = 'ACCEPTED';

-- Verify the constraints
-- PostgreSQL: sample verification for constraints
SELECT conname, contype
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'counter_offers';
