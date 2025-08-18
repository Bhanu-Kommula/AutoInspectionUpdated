-- Create Inspection Database Tables (PostgreSQL)
-- Connect to the 'inspection' database before running this script

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS inspection_files;
DROP TABLE IF EXISTS inspection_checklist_items;
DROP TABLE IF EXISTS inspection_reports;

-- Create inspection_reports table
CREATE TABLE inspection_reports (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,
    report_title VARCHAR(200),
    inspection_date DATE,
    inspection_start_time TIME,
    inspection_end_time TIME,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INT,
    vehicle_mileage INT,
    vehicle_color VARCHAR(30),
    vin_number VARCHAR(17),
    status TEXT CHECK (status IN ('DRAFT','IN_PROGRESS','COMPLETED','SUBMITTED')) NOT NULL DEFAULT 'DRAFT',
    overall_condition TEXT CHECK (overall_condition IN ('EXCELLENT','GOOD','FAIR','POOR')),
    safety_rating TEXT CHECK (safety_rating IN ('SAFE','NEEDS_ATTENTION','UNSAFE')),
    estimated_repair_cost DECIMAL(10,2) DEFAULT 0.00,
    priority_repairs TEXT,
    general_notes TEXT,
    total_files_count INT DEFAULT 0,
    total_files_size BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_post_id ON inspection_reports(post_id);
CREATE INDEX idx_technician_id ON inspection_reports(technician_id);
CREATE INDEX idx_status ON inspection_reports(status);
CREATE INDEX idx_created_at ON inspection_reports(created_at);

-- Create inspection_checklist_items table
CREATE TABLE inspection_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    category TEXT CHECK (category IN ('EXTERIOR','INTERIOR','ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','SAFETY','UNDERCARRIAGE','TEST_DRIVE')) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    remarks TEXT,
    condition_rating TEXT CHECK (condition_rating IN ('LIKE_NEW','SERVICEABLE','MARGINAL','REQUIRES_REPAIR','NOT_ACCESSIBLE')),
    working_status TEXT CHECK (working_status IN ('WORKING','NEEDS_ATTENTION','NOT_WORKING')),
    priority_level TEXT CHECK (priority_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);

CREATE INDEX idx_inspection_report_id ON inspection_checklist_items(inspection_report_id);
CREATE INDEX idx_category ON inspection_checklist_items(category);
CREATE INDEX idx_is_checked ON inspection_checklist_items(is_checked);

-- Create inspection_files table
CREATE TABLE inspection_files (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_category TEXT CHECK (file_category IN ('IMAGE','VIDEO','AUDIO','DOCUMENT','OTHER')),
    description VARCHAR(500),
    file_hash VARCHAR(128),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_virus_scanned BOOLEAN DEFAULT FALSE,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_report_id ON inspection_files(inspection_report_id);
CREATE INDEX idx_files_file_category ON inspection_files(file_category);
CREATE INDEX idx_files_uploaded_at ON inspection_files(uploaded_at);
CREATE INDEX idx_files_stored_filename ON inspection_files(stored_filename);

-- Sample data removed to prevent interference with real inspection data
-- Use the dashboard service to create inspection reports and checklist items

-- Show created tables (PostgreSQL)
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'inspection_%' ORDER BY tablename;

-- Show table structures
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_reports';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_checklist_items';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_files';

-- Show sample data
SELECT 'Inspection Reports:' as info;
SELECT * FROM inspection_reports LIMIT 5;

SELECT 'Checklist Items:' as info;
SELECT * FROM inspection_checklist_items LIMIT 5;
