-- Align dealer table to match JPA entity fields
-- Ensure required timestamp columns exist

ALTER TABLE dealer
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE dealer
  ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;


