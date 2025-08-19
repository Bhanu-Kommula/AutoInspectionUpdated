-- Verify and Fix Inspection Report Data Integrity
-- Run these queries to diagnose and fix common issues

-- ============================================
-- 1. DIAGNOSTIC QUERIES
-- ============================================

-- Check completed posts and their inspection reports
SELECT 
    p.id as post_id,
    p.name as post_name,
    p.status as post_status,
    p.inspection_report_id,
    p.created_at as post_created,
    ir.id as report_id,
    ir.status as report_status,
    ir.created_at as report_created,
    ir.submitted_at,
    (SELECT COUNT(*) FROM inspection.inspection_checklist_items WHERE inspection_report_id = ir.id) as checklist_count,
    (SELECT COUNT(*) FROM inspection.inspection_files WHERE inspection_report_id = ir.id) as files_count
FROM PostingDashboard p
LEFT JOIN inspection.inspection_reports ir ON p.inspection_report_id = ir.id
WHERE p.status = 'COMPLETED'
ORDER BY p.created_at DESC;

-- Find posts without inspection report IDs
SELECT 
    id, name, status, inspection_report_id, created_at
FROM PostingDashboard 
WHERE status = 'COMPLETED' 
AND inspection_report_id IS NULL;

-- Find orphaned inspection reports (reports without matching posts)
SELECT 
    ir.id, ir.post_id, ir.status, ir.created_at
FROM inspection.inspection_reports ir
LEFT JOIN PostingDashboard p ON ir.post_id = p.id
WHERE p.id IS NULL;

-- Check status consistency
SELECT 
    p.id as post_id,
    p.status as post_status,
    ir.id as report_id,
    ir.status as report_status,
    CASE 
        WHEN p.status = 'COMPLETED' AND ir.status != 'SUBMITTED' THEN 'STATUS_MISMATCH'
        WHEN p.status = 'COMPLETED' AND ir.status = 'SUBMITTED' THEN 'CONSISTENT'
        ELSE 'OTHER'
    END as status_check
FROM PostingDashboard p
JOIN inspection.inspection_reports ir ON p.inspection_report_id = ir.id
WHERE p.status = 'COMPLETED';

-- ============================================
-- 2. FIX COMMON ISSUES
-- ============================================

-- Fix missing inspection_report_id in posts
-- (Only run if you have orphaned reports that should be linked)
UPDATE PostingDashboard p 
SET inspection_report_id = (
    SELECT ir.id 
    FROM inspection.inspection_reports ir 
    WHERE ir.post_id = p.id 
    AND ir.status IN ('COMPLETED', 'SUBMITTED')
    ORDER BY ir.created_at DESC
    LIMIT 1
)
WHERE p.status = 'COMPLETED' 
AND p.inspection_report_id IS NULL
AND EXISTS (
    SELECT 1 FROM inspection.inspection_reports ir 
    WHERE ir.post_id = p.id
);

-- Fix status inconsistency - set report status to SUBMITTED for completed posts
UPDATE inspection.inspection_reports ir
SET 
    status = 'SUBMITTED',
    submitted_at = COALESCE(submitted_at, NOW()),
    updated_at = NOW()
WHERE ir.id IN (
    SELECT ir2.id 
    FROM inspection.inspection_reports ir2
    JOIN PostingDashboard p ON ir2.id = p.inspection_report_id
    WHERE p.status = 'COMPLETED' 
    AND ir2.status != 'SUBMITTED'
);

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================

-- Verify all completed posts have proper inspection reports
SELECT 
    'SUMMARY' as check_type,
    COUNT(*) as total_completed_posts,
    COUNT(inspection_report_id) as posts_with_report_id,
    COUNT(*) - COUNT(inspection_report_id) as posts_missing_report_id
FROM PostingDashboard 
WHERE status = 'COMPLETED';

-- Verify report data completeness
SELECT 
    ir.id as report_id,
    ir.post_id,
    ir.status,
    CASE WHEN ir.general_notes IS NOT NULL AND LENGTH(ir.general_notes) > 0 THEN 'YES' ELSE 'NO' END as has_final_remarks,
    (SELECT COUNT(*) FROM inspection.inspection_checklist_items WHERE inspection_report_id = ir.id) as checklist_items,
    (SELECT COUNT(*) FROM inspection.inspection_files WHERE inspection_report_id = ir.id) as uploaded_files,
    ir.created_at,
    ir.submitted_at
FROM inspection.inspection_reports ir
JOIN PostingDashboard p ON ir.id = p.inspection_report_id
WHERE p.status = 'COMPLETED'
ORDER BY ir.created_at DESC;

-- Check for any remaining issues
SELECT 
    'ISSUES_CHECK' as summary,
    (SELECT COUNT(*) FROM PostingDashboard WHERE status = 'COMPLETED' AND inspection_report_id IS NULL) as posts_without_reports,
    (SELECT COUNT(*) FROM PostingDashboard p JOIN inspection.inspection_reports ir ON p.inspection_report_id = ir.id WHERE p.status = 'COMPLETED' AND ir.status != 'SUBMITTED') as status_mismatches,
    (SELECT COUNT(*) FROM inspection.inspection_reports ir LEFT JOIN PostingDashboard p ON ir.post_id = p.id WHERE p.id IS NULL) as orphaned_reports;

-- ============================================
-- 4. SAMPLE DATA VERIFICATION
-- ============================================

-- Show sample completed report data (for testing frontend)
SELECT 
    'SAMPLE_REPORT' as data_type,
    ir.id,
    ir.post_id,
    ir.status,
    ir.general_notes,
    ir.overall_condition,
    ir.safety_rating,
    ir.estimated_repair_cost,
    ir.created_at,
    ir.submitted_at
FROM inspection.inspection_reports ir
JOIN PostingDashboard p ON ir.id = p.inspection_report_id
WHERE p.status = 'COMPLETED'
ORDER BY ir.created_at DESC
LIMIT 1;

-- Show sample checklist data
SELECT 
    'SAMPLE_CHECKLIST' as data_type,
    ic.id,
    ic.inspection_report_id,
    ic.category,
    ic.item_name,
    ic.is_checked,
    ic.condition_rating,
    ic.remarks,
    ic.repair_cost
FROM inspection.inspection_checklist_items ic
JOIN inspection.inspection_reports ir ON ic.inspection_report_id = ir.id
JOIN PostingDashboard p ON ir.id = p.inspection_report_id
WHERE p.status = 'COMPLETED'
ORDER BY ic.inspection_report_id DESC, ic.category, ic.id
LIMIT 10;

-- Show sample files data
SELECT 
    'SAMPLE_FILES' as data_type,
    if.id,
    if.inspection_report_id,
    if.original_filename,
    if.file_category,
    if.file_size,
    if.uploaded_at
FROM inspection.inspection_files if
JOIN inspection.inspection_reports ir ON if.inspection_report_id = ir.id
JOIN PostingDashboard p ON ir.id = p.inspection_report_id
WHERE p.status = 'COMPLETED'
ORDER BY if.uploaded_at DESC
LIMIT 5;
