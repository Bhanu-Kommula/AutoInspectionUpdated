-- Fix Inspection Data Schema and Clear Mock Data
-- This script ensures the database schema matches the entity enums

-- First, clear any existing data that might interfere (handle foreign keys)
DELETE FROM inspection_files;
DELETE FROM inspection_checklist_items;
DELETE FROM inspection_vehicle_details;
DELETE FROM inspection_reports;

-- Update the condition_rating enum to match entity
ALTER TABLE inspection_checklist_items 
MODIFY COLUMN condition_rating ENUM(
    'EXCELLENT',     -- Like New
    'GOOD',          -- Serviceable  
    'FAIR',          -- Marginal
    'POOR',          -- Requires Repair
    'FAILED',        -- Not Accessible
    'NOT_INSPECTED'  -- Skipped
) NULL;

-- Update the working_status enum to match entity
ALTER TABLE inspection_checklist_items 
MODIFY COLUMN working_status ENUM(
    'WORKING',
    'NEEDS_REPAIR', 
    'NOT_WORKING'
) NULL;

-- Ensure priority_level allows NULL
ALTER TABLE inspection_checklist_items 
MODIFY COLUMN priority_level ENUM(
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
) NULL;

-- Verify the schema
DESCRIBE inspection_checklist_items;

-- Show current enum values
SHOW COLUMNS FROM inspection_checklist_items WHERE Field IN ('condition_rating', 'working_status', 'priority_level');

SELECT 'Schema update completed successfully' AS status;
