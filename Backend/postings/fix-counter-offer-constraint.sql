-- Fix Counter Offer Unique Constraint Issue
-- This script removes the overly restrictive unique constraint that prevents
-- multiple counter offers with different statuses for the same post-technician combination

-- Drop the existing unique constraint
-- PostgreSQL: drop index if exists
DROP INDEX IF EXISTS unique_active_request;

-- Add an index for better performance on status-based queries
-- This allows multiple statuses per post-technician combination
CREATE INDEX IF NOT EXISTS idx_counter_offers_status_post_tech ON counter_offers (status, post_id, technician_email);
