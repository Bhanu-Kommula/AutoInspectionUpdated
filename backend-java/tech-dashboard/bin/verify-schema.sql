-- Verify current database schema for inspection_checklist_items
DESCRIBE inspection_checklist_items;

-- Check if condition_rating enum values match our entity
SHOW COLUMNS FROM inspection_checklist_items LIKE 'condition_rating';

-- Check if working_status enum values match our entity  
SHOW COLUMNS FROM inspection_checklist_items LIKE 'working_status';

-- Check current data in the table
SELECT 
    id,
    inspection_report_id,
    category,
    item_name,
    is_checked,
    condition_rating,
    working_status,
    priority_level,
    created_at
FROM inspection_checklist_items 
ORDER BY inspection_report_id, category, item_order
LIMIT 20;

-- Check for any null or zero values
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN condition_rating IS NULL THEN 1 END) as null_condition_rating,
    COUNT(CASE WHEN working_status IS NULL THEN 1 END) as null_working_status,
    COUNT(CASE WHEN priority_level IS NULL THEN 1 END) as null_priority_level,
    COUNT(CASE WHEN is_checked = 0 THEN 1 END) as unchecked_items
FROM inspection_checklist_items;
