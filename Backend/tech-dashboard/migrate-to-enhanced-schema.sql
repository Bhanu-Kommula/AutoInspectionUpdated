-- =====================================================
-- MIGRATION SCRIPT: Upgrade to Enhanced Inspection Schema
-- This script safely migrates existing data to the new structure
-- =====================================================

-- Set session variables for safety
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Create backup database
CREATE DATABASE IF NOT EXISTS inspection_backup;

-- Backup existing data
CREATE TABLE inspection_backup.inspection_reports_backup AS SELECT * FROM inspection.inspection_reports;
CREATE TABLE inspection_backup.inspection_checklist_items_backup AS SELECT * FROM inspection.inspection_checklist_items;
CREATE TABLE inspection_backup.inspection_files_backup AS SELECT * FROM inspection.inspection_files;

SELECT 'Backup completed' as status, NOW() as timestamp;

-- =====================================================
-- STEP 1: ADD NEW COLUMNS TO EXISTING TABLES
-- =====================================================

USE inspection;

-- Add new columns to inspection_reports table
ALTER TABLE inspection_reports 
ADD COLUMN IF NOT EXISTS report_number VARCHAR(50) UNIQUE AFTER report_title,
ADD COLUMN IF NOT EXISTS inspection_duration_minutes INT GENERATED ALWAYS AS (
    CASE 
        WHEN inspection_start_time IS NOT NULL AND inspection_end_time IS NOT NULL 
        THEN TIMESTAMPDIFF(MINUTE, inspection_start_time, inspection_end_time)
        ELSE NULL 
    END
) STORED AFTER inspection_end_time,
ADD COLUMN IF NOT EXISTS technician_recommendations TEXT AFTER general_notes,
ADD COLUMN IF NOT EXISTS customer_concerns TEXT AFTER technician_recommendations,
ADD COLUMN IF NOT EXISTS total_checklist_items INT DEFAULT 66 AFTER total_files_size,
ADD COLUMN IF NOT EXISTS completed_checklist_items INT DEFAULT 0 AFTER total_checklist_items,
ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN total_checklist_items > 0 
        THEN ROUND((completed_checklist_items / total_checklist_items) * 100, 2)
        ELSE 0 
    END
) STORED AFTER completed_checklist_items,
ADD COLUMN IF NOT EXISTS started_at DATETIME AFTER updated_at,
ADD COLUMN IF NOT EXISTS approved_at DATETIME AFTER submitted_at,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) AFTER approved_at,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100) AFTER created_by,
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1 AFTER updated_by;

-- Update status enum to include new values
ALTER TABLE inspection_reports 
MODIFY COLUMN status ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT';

-- Update condition and safety rating enums
ALTER TABLE inspection_reports 
MODIFY COLUMN overall_condition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL') DEFAULT 'GOOD';

ALTER TABLE inspection_reports 
MODIFY COLUMN safety_rating ENUM('SAFE', 'NEEDS_ATTENTION', 'UNSAFE', 'CRITICAL') DEFAULT 'SAFE';

-- Add new columns to inspection_checklist_items table
ALTER TABLE inspection_checklist_items
ADD COLUMN IF NOT EXISTS item_order INT NOT NULL DEFAULT 1 AFTER item_name,
ADD COLUMN IF NOT EXISTS working_status ENUM('WORKING', 'NEEDS_ATTENTION', 'NOT_WORKING', 'NOT_APPLICABLE') AFTER condition_rating,
ADD COLUMN IF NOT EXISTS repair_description TEXT AFTER repair_cost,
ADD COLUMN IF NOT EXISTS parts_needed TEXT AFTER repair_description,
ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(4,2) AFTER parts_needed,
ADD COLUMN IF NOT EXISTS technician_notes TEXT AFTER remarks,
ADD COLUMN IF NOT EXISTS has_photos BOOLEAN DEFAULT FALSE AFTER technician_notes,
ADD COLUMN IF NOT EXISTS photo_count INT DEFAULT 0 AFTER has_photos,
ADD COLUMN IF NOT EXISTS inspected_at DATETIME AFTER updated_at;

-- Update condition rating enum
ALTER TABLE inspection_checklist_items
MODIFY COLUMN condition_rating ENUM(
    'EXCELLENT',    -- Like New
    'GOOD',         -- Serviceable  
    'FAIR',         -- Marginal
    'POOR',         -- Requires Repair
    'FAILED',       -- Not Accessible
    'NOT_INSPECTED' -- Skipped
);

-- Update working status enum to match current values
ALTER TABLE inspection_checklist_items
MODIFY COLUMN working_status ENUM('WORKING', 'NEEDS_REPAIR', 'NOT_WORKING') AFTER condition_rating;

-- Add new columns to inspection_files table
ALTER TABLE inspection_files
ADD COLUMN IF NOT EXISTS checklist_item_id BIGINT NULL AFTER inspection_report_id,
ADD COLUMN IF NOT EXISTS inspection_category ENUM(
    'EXTERIOR', 'INTERIOR', 'ENGINE', 'TRANSMISSION', 
    'BRAKES', 'SUSPENSION', 'ELECTRICAL', 'SAFETY', 
    'UNDERCARRIAGE', 'TEST_DRIVE', 'GENERAL'
) AFTER file_category,
ADD COLUMN IF NOT EXISTS tags VARCHAR(255) AFTER description,
ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE AFTER is_valid,
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(500) AFTER is_processed,
ADD COLUMN IF NOT EXISTS processed_at DATETIME AFTER uploaded_at;

-- =====================================================
-- STEP 2: CREATE NEW VEHICLE DETAILS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS inspection_vehicle_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    
    -- Vehicle identification
    vin_number VARCHAR(17),
    license_plate VARCHAR(20),
    
    -- Vehicle specifications
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    trim_level VARCHAR(50),
    engine_type VARCHAR(100),
    transmission_type VARCHAR(50),
    fuel_type VARCHAR(30),
    
    -- Vehicle condition
    mileage INT,
    color_exterior VARCHAR(30),
    color_interior VARCHAR(30),
    
    -- Vehicle history
    accident_history ENUM('NONE', 'MINOR', 'MAJOR', 'UNKNOWN') DEFAULT 'UNKNOWN',
    service_history_available BOOLEAN DEFAULT FALSE,
    previous_owner_count INT,
    
    -- Location and context
    inspection_location VARCHAR(255),
    weather_conditions VARCHAR(100),
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE,
    INDEX idx_inspection_report_id (inspection_report_id),
    INDEX idx_vin (vin_number),
    INDEX idx_make_model_year (make, model, year)
);

-- =====================================================
-- STEP 3: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate vehicle data from inspection_reports to vehicle_details
INSERT INTO inspection_vehicle_details (
    inspection_report_id, vin_number, make, model, year, mileage, color_exterior
)
SELECT 
    id, vin_number, vehicle_make, vehicle_model, vehicle_year, vehicle_mileage, vehicle_color
FROM inspection_reports
WHERE id NOT IN (SELECT inspection_report_id FROM inspection_vehicle_details);

-- Generate report numbers for existing reports
UPDATE inspection_reports 
SET report_number = CONCAT('RPT-', YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0'), '-', LPAD(technician_id, 4, '0'), '-', UNIX_TIMESTAMP(created_at))
WHERE report_number IS NULL;

-- Update completed checklist items count
UPDATE inspection_reports ir
SET completed_checklist_items = (
    SELECT COUNT(*) 
    FROM inspection_checklist_items ci 
    WHERE ci.inspection_report_id = ir.id AND ci.is_checked = TRUE
);

-- Set item_order for existing checklist items
UPDATE inspection_checklist_items 
SET item_order = 1 
WHERE item_order IS NULL OR item_order = 0;

-- =====================================================
-- STEP 4: ADD MISSING CHECKLIST ITEMS
-- Ensure all reports have complete 66-item checklist
-- =====================================================

-- Create temporary procedure for migration
DELIMITER $$

CREATE PROCEDURE MigrateChecklistItems()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE report_id BIGINT;
    DECLARE cur CURSOR FOR SELECT id FROM inspection_reports;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO report_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Add missing EXTERIOR items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'EXTERIOR', 'Body panels and paint condition', 1),
        (report_id, 'EXTERIOR', 'Windows and windshield condition', 2),
        (report_id, 'EXTERIOR', 'Headlights, taillights, and turn signals', 3),
        (report_id, 'EXTERIOR', 'Tires, wheels, and wheel alignment', 4),
        (report_id, 'EXTERIOR', 'Side mirrors and visibility', 5),
        (report_id, 'EXTERIOR', 'Doors, handles, and locks', 6),
        (report_id, 'EXTERIOR', 'Hood and trunk operation', 7),
        (report_id, 'EXTERIOR', 'Bumpers, grille, and trim', 8);
        
        -- Add missing INTERIOR items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'INTERIOR', 'Seats, upholstery, and comfort', 1),
        (report_id, 'INTERIOR', 'Dashboard, gauges, and controls', 2),
        (report_id, 'INTERIOR', 'Air conditioning and heating system', 3),
        (report_id, 'INTERIOR', 'Radio, infotainment, and connectivity', 4),
        (report_id, 'INTERIOR', 'Instrument cluster and warning lights', 5),
        (report_id, 'INTERIOR', 'Steering wheel and steering column', 6),
        (report_id, 'INTERIOR', 'Carpets, floor mats, and cleanliness', 7),
        (report_id, 'INTERIOR', 'Interior lighting and accessories', 8);
        
        -- Add missing ENGINE items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'ENGINE', 'Engine oil level and quality', 1),
        (report_id, 'ENGINE', 'Coolant level and radiator condition', 2),
        (report_id, 'ENGINE', 'Battery, terminals, and charging system', 3),
        (report_id, 'ENGINE', 'Drive belts and cooling hoses', 4),
        (report_id, 'ENGINE', 'Air filter and intake system', 5),
        (report_id, 'ENGINE', 'Engine mounts and vibration', 6),
        (report_id, 'ENGINE', 'Exhaust system and emissions', 7),
        (report_id, 'ENGINE', 'Engine performance and idle', 8);
        
        -- Add missing TRANSMISSION items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'TRANSMISSION', 'Transmission fluid level and color', 1),
        (report_id, 'TRANSMISSION', 'Gear shifting operation (manual/automatic)', 2),
        (report_id, 'TRANSMISSION', 'Clutch operation and engagement', 3),
        (report_id, 'TRANSMISSION', 'Transmission mounts and support', 4),
        (report_id, 'TRANSMISSION', 'Driveshaft and CV joints', 5),
        (report_id, 'TRANSMISSION', 'Differential and axle condition', 6);
        
        -- Add missing BRAKES items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'BRAKES', 'Brake pads thickness and wear', 1),
        (report_id, 'BRAKES', 'Brake rotors and disc condition', 2),
        (report_id, 'BRAKES', 'Brake lines, hoses, and connections', 3),
        (report_id, 'BRAKES', 'Brake fluid level and quality', 4),
        (report_id, 'BRAKES', 'Parking brake adjustment and operation', 5),
        (report_id, 'BRAKES', 'ABS system and brake assist', 6);
        
        -- Add missing SUSPENSION items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'SUSPENSION', 'Shock absorbers and dampers', 1),
        (report_id, 'SUSPENSION', 'Springs, struts, and coil springs', 2),
        (report_id, 'SUSPENSION', 'Control arms and suspension bushings', 3),
        (report_id, 'SUSPENSION', 'Ball joints and tie rod ends', 4),
        (report_id, 'SUSPENSION', 'Steering components and alignment', 5),
        (report_id, 'SUSPENSION', 'Wheel bearings and hub assembly', 6);
        
        -- Add missing ELECTRICAL items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'ELECTRICAL', 'Alternator and charging system', 1),
        (report_id, 'ELECTRICAL', 'Starter motor and ignition system', 2),
        (report_id, 'ELECTRICAL', 'Wiring harnesses and connections', 3),
        (report_id, 'ELECTRICAL', 'Fuses, relays, and electrical panels', 4),
        (report_id, 'ELECTRICAL', 'Engine control unit (ECU) and sensors', 5),
        (report_id, 'ELECTRICAL', 'Power accessories and electronics', 6);
        
        -- Add missing SAFETY items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'SAFETY', 'Seat belts and restraint systems', 1),
        (report_id, 'SAFETY', 'Airbag system and SRS warning', 2),
        (report_id, 'SAFETY', 'Child safety locks and LATCH system', 3),
        (report_id, 'SAFETY', 'Emergency brake and hazard lights', 4),
        (report_id, 'SAFETY', 'Safety warning systems and alerts', 5),
        (report_id, 'SAFETY', 'Security system and anti-theft', 6);
        
        -- Add missing UNDERCARRIAGE items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'UNDERCARRIAGE', 'Frame, chassis, and structural integrity', 1),
        (report_id, 'UNDERCARRIAGE', 'Fuel tank, lines, and vapor system', 2),
        (report_id, 'UNDERCARRIAGE', 'Steering rack and power steering', 3),
        (report_id, 'UNDERCARRIAGE', 'Exhaust system and catalytic converter', 4),
        (report_id, 'UNDERCARRIAGE', 'Heat shields and protective covers', 5),
        (report_id, 'UNDERCARRIAGE', 'Undercarriage protection and skid plates', 6);
        
        -- Add missing TEST_DRIVE items
        INSERT IGNORE INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
        (report_id, 'TEST_DRIVE', 'Engine acceleration and power delivery', 1),
        (report_id, 'TEST_DRIVE', 'Braking performance and stopping distance', 2),
        (report_id, 'TEST_DRIVE', 'Steering response and handling', 3),
        (report_id, 'TEST_DRIVE', 'Suspension comfort and road feel', 4),
        (report_id, 'TEST_DRIVE', 'Unusual noises, vibrations, or odors', 5),
        (report_id, 'TEST_DRIVE', 'Transmission shifting and operation', 6);
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- Run the migration
CALL MigrateChecklistItems();
DROP PROCEDURE MigrateChecklistItems;

-- =====================================================
-- STEP 5: ADD NEW INDEXES FOR PERFORMANCE
-- =====================================================

-- Add new composite indexes
CREATE INDEX IF NOT EXISTS idx_tech_post_composite ON inspection_reports(technician_id, post_id);
CREATE INDEX IF NOT EXISTS idx_status_tech ON inspection_reports(status, technician_id);
CREATE INDEX IF NOT EXISTS idx_completion ON inspection_reports(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_reports_status_date ON inspection_reports(status, inspection_date);
CREATE INDEX IF NOT EXISTS idx_reports_tech_status_date ON inspection_reports(technician_id, status, inspection_date);

-- Checklist indexes
CREATE INDEX IF NOT EXISTS idx_category_order ON inspection_checklist_items(category, item_order);
CREATE INDEX IF NOT EXISTS idx_report_category_composite ON inspection_checklist_items(inspection_report_id, category);
CREATE INDEX IF NOT EXISTS idx_checklist_report_checked ON inspection_checklist_items(inspection_report_id, is_checked);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_report_category_files ON inspection_files(inspection_report_id, inspection_category);

-- Add foreign key for checklist_item_id in files table
ALTER TABLE inspection_files 
ADD CONSTRAINT fk_files_checklist_item 
FOREIGN KEY (checklist_item_id) REFERENCES inspection_checklist_items(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 6: CREATE VIEWS
-- =====================================================

-- Create view for complete inspection report data
CREATE OR REPLACE VIEW v_complete_inspection_reports AS
SELECT 
    ir.id,
    ir.post_id,
    ir.technician_id,
    ir.report_title,
    ir.report_number,
    ir.status,
    ir.overall_condition,
    ir.safety_rating,
    ir.estimated_repair_cost,
    ir.completion_percentage,
    ir.inspection_date,
    ir.inspection_duration_minutes,
    ir.general_notes,
    ir.technician_recommendations,
    ir.total_files_count,
    ir.created_at,
    ir.submitted_at,
    
    -- Vehicle details
    vd.vin_number,
    vd.make,
    vd.model,
    vd.year,
    vd.mileage,
    vd.color_exterior,
    
    -- Aggregated checklist stats
    COUNT(ci.id) as total_items_created,
    SUM(CASE WHEN ci.is_checked = TRUE THEN 1 ELSE 0 END) as checked_items,
    SUM(ci.repair_cost) as total_estimated_repairs,
    
    -- File stats
    COUNT(DISTINCT f.id) as actual_file_count
    
FROM inspection_reports ir
LEFT JOIN inspection_vehicle_details vd ON ir.id = vd.inspection_report_id
LEFT JOIN inspection_checklist_items ci ON ir.id = ci.inspection_report_id
LEFT JOIN inspection_files f ON ir.id = f.inspection_report_id
GROUP BY ir.id, vd.id;

-- Create view for technician dashboard summary
CREATE OR REPLACE VIEW v_technician_dashboard_summary AS
SELECT 
    technician_id,
    COUNT(*) as total_reports,
    SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_reports,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_reports,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_reports,
    SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted_reports,
    AVG(completion_percentage) as avg_completion_rate,
    SUM(estimated_repair_cost) as total_repair_estimates,
    AVG(estimated_repair_cost) as avg_repair_cost,
    SUM(total_files_count) as total_files_uploaded,
    MAX(created_at) as last_report_date
FROM inspection_reports
GROUP BY technician_id;

-- =====================================================
-- STEP 7: CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_update_completion_after_checklist_update;
DROP TRIGGER IF EXISTS tr_generate_report_number;

-- Create new triggers
DELIMITER $$

CREATE TRIGGER tr_update_completion_after_checklist_update
AFTER UPDATE ON inspection_checklist_items
FOR EACH ROW
BEGIN
    UPDATE inspection_reports 
    SET 
        completed_checklist_items = (
            SELECT COUNT(*) 
            FROM inspection_checklist_items 
            WHERE inspection_report_id = NEW.inspection_report_id 
            AND is_checked = TRUE
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.inspection_report_id;
END$$

CREATE TRIGGER tr_generate_report_number
BEFORE INSERT ON inspection_reports
FOR EACH ROW
BEGIN
    IF NEW.report_number IS NULL THEN
        SET NEW.report_number = CONCAT('RPT-', YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-', LPAD(NEW.technician_id, 4, '0'), '-', UNIX_TIMESTAMP());
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- STEP 8: VALIDATION AND CLEANUP
-- =====================================================

-- Update final checklist counts
UPDATE inspection_reports ir
SET completed_checklist_items = (
    SELECT COUNT(*) 
    FROM inspection_checklist_items ci 
    WHERE ci.inspection_report_id = ir.id AND ci.is_checked = TRUE
);

-- Validation queries
SELECT 'MIGRATION VALIDATION' as status;

SELECT 'Reports with complete checklists' as check_type,
       COUNT(*) as count
FROM inspection_reports ir
WHERE (SELECT COUNT(*) FROM inspection_checklist_items ci WHERE ci.inspection_report_id = ir.id) = 66;

SELECT 'Total checklist items per report' as check_type,
       inspection_report_id,
       COUNT(*) as item_count
FROM inspection_checklist_items
GROUP BY inspection_report_id
ORDER BY inspection_report_id;

SELECT 'Items by category' as check_type,
       category,
       COUNT(*) as item_count
FROM inspection_checklist_items
WHERE inspection_report_id = 1
GROUP BY category
ORDER BY category;

-- Reset session variables
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

SELECT 'MIGRATION COMPLETED SUCCESSFULLY' as status, NOW() as completed_at;
