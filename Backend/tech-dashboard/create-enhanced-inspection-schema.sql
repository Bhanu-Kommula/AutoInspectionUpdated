-- =====================================================
-- ENHANCED INSPECTION REPORT DATABASE SCHEMA
-- Designed to store ALL 66 inspection items perfectly
-- Optimized for fetching by tech_id and post_id
-- =====================================================

-- Create database if not exists
-- PostgreSQL: databases are created outside migrations; connect to 'inspection' before running

-- Drop existing tables for clean recreation
DROP TABLE IF EXISTS inspection_files;
DROP TABLE IF EXISTS inspection_checklist_items;
DROP TABLE IF EXISTS inspection_vehicle_details;
DROP TABLE IF EXISTS inspection_reports;

-- =====================================================
-- 1. MAIN INSPECTION REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_reports (
    id BIGSERIAL PRIMARY KEY,
    
    -- Core identifiers (OPTIMIZED FOR FETCHING)
    post_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    
    -- Report metadata
    report_title VARCHAR(255) DEFAULT 'Vehicle Inspection Report',
    report_number VARCHAR(50) UNIQUE, -- Auto-generated unique report number
    
    -- Timing information
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspection_start_time TIME,
    inspection_end_time TIME,
    inspection_duration_minutes INT,
    
    -- Status tracking with detailed workflow
    status TEXT CHECK (status IN ('DRAFT','IN_PROGRESS','COMPLETED','SUBMITTED','APPROVED','REJECTED')) NOT NULL DEFAULT 'DRAFT',
    
    -- Overall assessment (REQUIRED FOR COMPLETE REPORTS)
    overall_condition TEXT CHECK (overall_condition IN ('EXCELLENT','GOOD','FAIR','POOR','CRITICAL')) DEFAULT 'GOOD',
    safety_rating TEXT CHECK (safety_rating IN ('SAFE','NEEDS_ATTENTION','UNSAFE','CRITICAL')) DEFAULT 'SAFE',
    
    -- Financial information
    estimated_repair_cost DECIMAL(10,2) DEFAULT 0.00,
    priority_repairs TEXT,
    
    -- Comprehensive notes and remarks
    general_notes TEXT,
    technician_recommendations TEXT,
    customer_concerns TEXT,
    
    -- File tracking
    total_files_count INT DEFAULT 0,
    total_files_size BIGINT DEFAULT 0,
    
    -- Checklist completion tracking
    total_checklist_items INT DEFAULT 66, -- Total expected items
    completed_checklist_items INT DEFAULT 0,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_checklist_items > 0 
            THEN ROUND((completed_checklist_items::numeric / NULLIF(total_checklist_items,0)::numeric) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    
    -- Timestamps (CRITICAL FOR AUDIT TRAIL)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP, -- When inspection actually started
    completed_at TIMESTAMP, -- When inspection was completed
    submitted_at TIMESTAMP, -- When report was submitted
    approved_at TIMESTAMP, -- When report was approved
    
    -- Audit fields
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    version INT DEFAULT 1,
    
    -- OPTIMIZED INDEXES FOR FAST RETRIEVAL
    
    
    -- Constraints
    CONSTRAINT chk_repair_cost CHECK (estimated_repair_cost >= 0),
    CONSTRAINT chk_completion CHECK (completed_checklist_items >= 0 AND completed_checklist_items <= total_checklist_items),
    CONSTRAINT chk_timing CHECK (inspection_end_time IS NULL OR inspection_start_time IS NULL OR inspection_end_time >= inspection_start_time)
);

-- =====================================================
-- 2. VEHICLE DETAILS TABLE (NORMALIZED)
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_vehicle_details (
    id BIGSERIAL PRIMARY KEY,
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
    accident_history TEXT CHECK (accident_history IN ('NONE','MINOR','MAJOR','UNKNOWN')) DEFAULT 'UNKNOWN',
    service_history_available BOOLEAN DEFAULT FALSE,
    previous_owner_count INT,
    
    -- Location and context
    inspection_location VARCHAR(255),
    weather_conditions VARCHAR(100),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. ENHANCED CHECKLIST ITEMS TABLE
-- Stores ALL 66 inspection items with complete data
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    
    -- Item identification (STRUCTURED FOR ALL 66 ITEMS)
    category TEXT CHECK (category IN ('EXTERIOR','INTERIOR','ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','SAFETY','UNDERCARRIAGE','TEST_DRIVE')) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_order INT NOT NULL, -- Order within category (1-8 for most categories)
    
    -- Inspection results
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    condition_rating TEXT CHECK (condition_rating IN ('EXCELLENT','GOOD','FAIR','POOR','FAILED','NOT_INSPECTED')),
    
    -- Detailed assessment
    working_status TEXT CHECK (working_status IN ('WORKING','NEEDS_ATTENTION','NOT_WORKING','NOT_APPLICABLE')),
    priority_level TEXT CHECK (priority_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    
    -- Cost and repair information
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    repair_description TEXT,
    parts_needed TEXT,
    labor_hours DECIMAL(4,2),
    
    -- Detailed notes
    remarks TEXT,
    technician_notes TEXT,
    
    -- Photo/file references
    has_photos BOOLEAN DEFAULT FALSE,
    photo_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inspected_at TIMESTAMP, -- When this specific item was inspected
    
    -- OPTIMIZED INDEXES
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE,
    
    -- Ensure uniqueness of items per report
    UNIQUE (inspection_report_id, category, item_name),
    
    -- Constraints
    CONSTRAINT chk_repair_cost_item CHECK (repair_cost >= 0),
    CONSTRAINT chk_item_order CHECK (item_order > 0 AND item_order <= 10),
    CONSTRAINT chk_labor_hours CHECK (labor_hours IS NULL OR labor_hours >= 0)
);

-- =====================================================
-- 4. INSPECTION FILES TABLE (ENHANCED)
-- =====================================================
CREATE TABLE IF NOT EXISTS inspection_files (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    checklist_item_id BIGINT NULL, -- Link to specific checklist item
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    
    -- File categorization
    file_category TEXT CHECK (file_category IN ('IMAGE','VIDEO','AUDIO','DOCUMENT','OTHER')) NOT NULL,
    inspection_category TEXT CHECK (
        inspection_category IN (
            'EXTERIOR','INTERIOR','ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','SAFETY','UNDERCARRIAGE','TEST_DRIVE','GENERAL'
        )
    ),
    
    -- File metadata
    description VARCHAR(500),
    tags VARCHAR(255), -- Comma-separated tags
    file_hash VARCHAR(128), -- For duplicate detection
    
    -- Processing status
    is_processed BOOLEAN DEFAULT FALSE,
    is_virus_scanned BOOLEAN DEFAULT FALSE,
    is_valid BOOLEAN DEFAULT TRUE,
    thumbnail_path VARCHAR(500), -- For images/videos
    
    -- Timestamps
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- OPTIMIZED INDEXES
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_item_id) REFERENCES inspection_checklist_items(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_file_size CHECK (file_size > 0)
);

-- =====================================================
-- 5. CREATE VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View for complete inspection report data
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

-- View for technician dashboard summary
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
-- 6. INSERT PREDEFINED CHECKLIST TEMPLATE
-- This ensures all 66 items are available for every report
-- =====================================================

-- Create a stored procedure to initialize checklist for a report
-- Stored procedures and triggers need PL/pgSQL in PostgreSQL
CREATE OR REPLACE FUNCTION InitializeInspectionChecklist(report_id BIGINT)
RETURNS void AS $$
BEGIN
    -- EXTERIOR (8 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'EXTERIOR', 'Body panels and paint condition', 1),
    (report_id, 'EXTERIOR', 'Windows and windshield condition', 2),
    (report_id, 'EXTERIOR', 'Headlights, taillights, and turn signals', 3),
    (report_id, 'EXTERIOR', 'Tires, wheels, and wheel alignment', 4),
    (report_id, 'EXTERIOR', 'Side mirrors and visibility', 5),
    (report_id, 'EXTERIOR', 'Doors, handles, and locks', 6),
    (report_id, 'EXTERIOR', 'Hood and trunk operation', 7),
    (report_id, 'EXTERIOR', 'Bumpers, grille, and trim', 8);
    
    -- INTERIOR (8 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'INTERIOR', 'Seats, upholstery, and comfort', 1),
    (report_id, 'INTERIOR', 'Dashboard, gauges, and controls', 2),
    (report_id, 'INTERIOR', 'Air conditioning and heating system', 3),
    (report_id, 'INTERIOR', 'Radio, infotainment, and connectivity', 4),
    (report_id, 'INTERIOR', 'Instrument cluster and warning lights', 5),
    (report_id, 'INTERIOR', 'Steering wheel and steering column', 6),
    (report_id, 'INTERIOR', 'Carpets, floor mats, and cleanliness', 7),
    (report_id, 'INTERIOR', 'Interior lighting and accessories', 8);
    
    -- ENGINE (8 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'ENGINE', 'Engine oil level and quality', 1),
    (report_id, 'ENGINE', 'Coolant level and radiator condition', 2),
    (report_id, 'ENGINE', 'Battery, terminals, and charging system', 3),
    (report_id, 'ENGINE', 'Drive belts and cooling hoses', 4),
    (report_id, 'ENGINE', 'Air filter and intake system', 5),
    (report_id, 'ENGINE', 'Engine mounts and vibration', 6),
    (report_id, 'ENGINE', 'Exhaust system and emissions', 7),
    (report_id, 'ENGINE', 'Engine performance and idle', 8);
    
    -- TRANSMISSION (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'TRANSMISSION', 'Transmission fluid level and color', 1),
    (report_id, 'TRANSMISSION', 'Gear shifting operation (manual/automatic)', 2),
    (report_id, 'TRANSMISSION', 'Clutch operation and engagement', 3),
    (report_id, 'TRANSMISSION', 'Transmission mounts and support', 4),
    (report_id, 'TRANSMISSION', 'Driveshaft and CV joints', 5),
    (report_id, 'TRANSMISSION', 'Differential and axle condition', 6);
    
    -- BRAKES (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'BRAKES', 'Brake pads thickness and wear', 1),
    (report_id, 'BRAKES', 'Brake rotors and disc condition', 2),
    (report_id, 'BRAKES', 'Brake lines, hoses, and connections', 3),
    (report_id, 'BRAKES', 'Brake fluid level and quality', 4),
    (report_id, 'BRAKES', 'Parking brake adjustment and operation', 5),
    (report_id, 'BRAKES', 'ABS system and brake assist', 6);
    
    -- SUSPENSION (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'SUSPENSION', 'Shock absorbers and dampers', 1),
    (report_id, 'SUSPENSION', 'Springs, struts, and coil springs', 2),
    (report_id, 'SUSPENSION', 'Control arms and suspension bushings', 3),
    (report_id, 'SUSPENSION', 'Ball joints and tie rod ends', 4),
    (report_id, 'SUSPENSION', 'Steering components and alignment', 5),
    (report_id, 'SUSPENSION', 'Wheel bearings and hub assembly', 6);
    
    -- ELECTRICAL (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'ELECTRICAL', 'Alternator and charging system', 1),
    (report_id, 'ELECTRICAL', 'Starter motor and ignition system', 2),
    (report_id, 'ELECTRICAL', 'Wiring harnesses and connections', 3),
    (report_id, 'ELECTRICAL', 'Fuses, relays, and electrical panels', 4),
    (report_id, 'ELECTRICAL', 'Engine control unit (ECU) and sensors', 5),
    (report_id, 'ELECTRICAL', 'Power accessories and electronics', 6);
    
    -- SAFETY (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'SAFETY', 'Seat belts and restraint systems', 1),
    (report_id, 'SAFETY', 'Airbag system and SRS warning', 2),
    (report_id, 'SAFETY', 'Child safety locks and LATCH system', 3),
    (report_id, 'SAFETY', 'Emergency brake and hazard lights', 4),
    (report_id, 'SAFETY', 'Safety warning systems and alerts', 5),
    (report_id, 'SAFETY', 'Security system and anti-theft', 6);
    
    -- UNDERCARRIAGE (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'UNDERCARRIAGE', 'Frame, chassis, and structural integrity', 1),
    (report_id, 'UNDERCARRIAGE', 'Fuel tank, lines, and vapor system', 2),
    (report_id, 'UNDERCARRIAGE', 'Steering rack and power steering', 3),
    (report_id, 'UNDERCARRIAGE', 'Exhaust system and catalytic converter', 4),
    (report_id, 'UNDERCARRIAGE', 'Heat shields and protective covers', 5),
    (report_id, 'UNDERCARRIAGE', 'Undercarriage protection and skid plates', 6);
    
    -- TEST_DRIVE (6 items)
    INSERT INTO inspection_checklist_items (inspection_report_id, category, item_name, item_order) VALUES
    (report_id, 'TEST_DRIVE', 'Engine acceleration and power delivery', 1),
    (report_id, 'TEST_DRIVE', 'Braking performance and stopping distance', 2),
    (report_id, 'TEST_DRIVE', 'Steering response and handling', 3),
    (report_id, 'TEST_DRIVE', 'Suspension comfort and road feel', 4),
    (report_id, 'TEST_DRIVE', 'Unusual noises, vibrations, or odors', 5),
    (report_id, 'TEST_DRIVE', 'Transmission shifting and operation', 6);
    
    -- Update the report's completed_checklist_items count
    UPDATE inspection_reports 
    SET completed_checklist_items = (
        SELECT COUNT(*) FROM inspection_checklist_items 
        WHERE inspection_report_id = report_id
    )
    WHERE id = report_id;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE TRIGGERS FOR DATA CONSISTENCY
-- =====================================================

-- Trigger to update completion percentage when checklist items change
-- Triggers in PostgreSQL
CREATE OR REPLACE FUNCTION tr_update_completion_after_checklist_update()
RETURNS trigger AS $$
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_completion_after_checklist_update ON inspection_checklist_items;
CREATE TRIGGER tr_update_completion_after_checklist_update
AFTER UPDATE ON inspection_checklist_items
FOR EACH ROW EXECUTE FUNCTION tr_update_completion_after_checklist_update();

CREATE OR REPLACE FUNCTION tr_generate_report_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.report_number IS NULL THEN
        NEW.report_number := 'RPT-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-' || LPAD(NEW.technician_id::text, 4, '0') || '-' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_report_number ON inspection_reports;
CREATE TRIGGER tr_generate_report_number
BEFORE INSERT ON inspection_reports
FOR EACH ROW EXECUTE FUNCTION tr_generate_report_number();

-- =====================================================
-- 8. CREATE INDEXES FOR OPTIMAL PERFORMANCE
-- =====================================================

-- Additional composite indexes for complex queries
CREATE INDEX idx_reports_status_date ON inspection_reports(status, inspection_date);
CREATE INDEX idx_reports_tech_status_date ON inspection_reports(technician_id, status, inspection_date);
CREATE INDEX idx_checklist_report_checked ON inspection_checklist_items(inspection_report_id, is_checked);
CREATE INDEX idx_files_report_category ON inspection_files(inspection_report_id, inspection_category);

-- Indexes previously defined inline (PostgreSQL requires separate CREATE INDEX)
-- Vehicle details
CREATE INDEX IF NOT EXISTS idx_vehicle_details_report_id ON inspection_vehicle_details(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_vin ON inspection_vehicle_details(vin_number);
CREATE INDEX IF NOT EXISTS idx_make_model_year ON inspection_vehicle_details(make, model, year);

-- Checklist items
CREATE INDEX IF NOT EXISTS idx_checklist_report_id ON inspection_checklist_items(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_checklist_category ON inspection_checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_category_order ON inspection_checklist_items(category, item_order);
CREATE INDEX IF NOT EXISTS idx_checklist_is_checked ON inspection_checklist_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_checklist_condition_rating ON inspection_checklist_items(condition_rating);
CREATE INDEX IF NOT EXISTS idx_checklist_priority_level ON inspection_checklist_items(priority_level);
CREATE INDEX IF NOT EXISTS idx_checklist_report_category ON inspection_checklist_items(inspection_report_id, category);

-- Files
CREATE INDEX IF NOT EXISTS idx_files_report_id ON inspection_files(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_files_checklist_item_id ON inspection_files(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_files_file_category ON inspection_files(file_category);
CREATE INDEX IF NOT EXISTS idx_files_inspection_category ON inspection_files(inspection_category);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON inspection_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_files_stored_filename ON inspection_files(stored_filename);
CREATE INDEX IF NOT EXISTS idx_files_file_hash ON inspection_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_files_report_category_files ON inspection_files(inspection_report_id, inspection_category);

-- =====================================================
-- 9. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a sample inspection report
INSERT INTO inspection_reports (post_id, technician_id, status, overall_condition, safety_rating, created_by) 
VALUES (1, 1, 'DRAFT', 'GOOD', 'SAFE', 'SYSTEM');

-- Initialize checklist for the sample report
SELECT InitializeInspectionChecklist(currval(pg_get_serial_sequence('inspection_reports','id')));

-- Insert sample vehicle details
INSERT INTO inspection_vehicle_details (inspection_report_id, vin_number, make, model, year, mileage, color_exterior)
VALUES (currval(pg_get_serial_sequence('inspection_reports','id')), '1HGCM82633A123456', 'Honda', 'Civic', 2020, 25000, 'Silver');

-- Show table structures
-- PostgreSQL: use information_schema and pg_catalog instead of SHOW/DESCRIBE
SELECT tablename FROM pg_tables WHERE schemaname='public';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_reports';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_checklist_items';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_files';

-- Show sample data
SELECT 'Sample Report Data' as info;
SELECT * FROM v_complete_inspection_reports LIMIT 1;

SELECT 'Sample Checklist Items' as info;
SELECT category, COUNT(*) as item_count FROM inspection_checklist_items WHERE inspection_report_id = 1 GROUP BY category;

SELECT 'Total Checklist Items' as info;
SELECT COUNT(*) as total_items FROM inspection_checklist_items WHERE inspection_report_id = 1;
