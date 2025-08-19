-- PostgreSQL schema for tech-dashboard
-- Mirrors current JPA entities (InspectionReport, InspectionVehicleDetails, InspectionChecklistItem, InspectionFile)

-- Enable required extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects (idempotent in dev)
DROP TABLE IF EXISTS inspection_files CASCADE;
DROP TABLE IF EXISTS inspection_checklist_items CASCADE;
DROP TABLE IF EXISTS inspection_vehicle_details CASCADE;
DROP TABLE IF EXISTS inspection_reports CASCADE;

-- inspection_reports
CREATE TABLE inspection_reports (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    technician_id BIGINT NOT NULL,

    report_title VARCHAR(255),
    report_number VARCHAR(50) UNIQUE,

    inspection_date DATE NOT NULL,
    inspection_start_time TIME,
    inspection_end_time TIME,

    status VARCHAR(32) NOT NULL,
    overall_condition VARCHAR(32),
    safety_rating VARCHAR(32),

    priority_repairs TEXT,
    general_notes TEXT,
    technician_recommendations TEXT,
    customer_concerns TEXT,

    total_files_count INTEGER DEFAULT 0,
    total_files_size BIGINT DEFAULT 0,

    total_checklist_items INTEGER DEFAULT 66,
    completed_checklist_items INTEGER DEFAULT 0,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,

    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    version INTEGER DEFAULT 1,

    vehicle_make VARCHAR(255),
    vehicle_model VARCHAR(255),
    vehicle_year INTEGER,
    vehicle_mileage INTEGER,
    vehicle_color VARCHAR(255),
    vin_number VARCHAR(255)
);

CREATE INDEX idx_post_id ON inspection_reports(post_id);
CREATE INDEX idx_technician_id ON inspection_reports(technician_id);
CREATE INDEX idx_status ON inspection_reports(status);
CREATE INDEX idx_inspection_date ON inspection_reports(inspection_date);
CREATE INDEX idx_created_at ON inspection_reports(created_at);
CREATE INDEX idx_tech_post_composite ON inspection_reports(technician_id, post_id);
CREATE INDEX idx_status_tech ON inspection_reports(status, technician_id);

-- inspection_vehicle_details
CREATE TABLE inspection_vehicle_details (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,

    vin_number VARCHAR(17),
    license_plate VARCHAR(20),
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    trim_level VARCHAR(50),
    engine_type VARCHAR(100),
    transmission_type VARCHAR(50),
    fuel_type VARCHAR(30),
    mileage INTEGER,
    color_exterior VARCHAR(30),
    color_interior VARCHAR(30),
    accident_history VARCHAR(32),
    service_history_available BOOLEAN DEFAULT FALSE,
    previous_owner_count INTEGER,
    inspection_location VARCHAR(255),
    weather_conditions VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_vd_report_id ON inspection_vehicle_details(inspection_report_id);
CREATE INDEX idx_vin ON inspection_vehicle_details(vin_number);
CREATE INDEX idx_make_model_year ON inspection_vehicle_details(make, model, year);

-- inspection_checklist_items
CREATE TABLE inspection_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_order INTEGER NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    condition_rating VARCHAR(32),
    working_status VARCHAR(32),
    priority_level VARCHAR(32),
    repair_description TEXT,
    remarks TEXT,
    technician_notes TEXT,
    has_photos BOOLEAN DEFAULT FALSE,
    photo_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    inspected_at TIMESTAMP
);

CREATE INDEX idx_cli_report_id ON inspection_checklist_items(inspection_report_id);
CREATE INDEX idx_category ON inspection_checklist_items(category);
CREATE INDEX idx_category_order ON inspection_checklist_items(category, item_order);
CREATE INDEX idx_is_checked ON inspection_checklist_items(is_checked);
CREATE INDEX idx_condition_rating ON inspection_checklist_items(condition_rating);
CREATE INDEX idx_priority_level ON inspection_checklist_items(priority_level);
CREATE UNIQUE INDEX uk_report_category_item ON inspection_checklist_items(inspection_report_id, category, item_name);

-- inspection_files
CREATE TABLE inspection_files (
    id BIGSERIAL PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
    checklist_item_id BIGINT REFERENCES inspection_checklist_items(id) ON DELETE SET NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_category VARCHAR(32) NOT NULL,
    inspection_category VARCHAR(32),
    description VARCHAR(500),
    tags VARCHAR(255),
    file_hash VARCHAR(128),
    is_processed BOOLEAN DEFAULT FALSE,
    is_virus_scanned BOOLEAN DEFAULT FALSE,
    is_valid BOOLEAN DEFAULT TRUE,
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP
);

CREATE INDEX idx_file_report_id ON inspection_files(inspection_report_id);
CREATE INDEX idx_checklist_item_id ON inspection_files(checklist_item_id);
CREATE INDEX idx_file_category ON inspection_files(file_category);
CREATE INDEX idx_inspection_category ON inspection_files(inspection_category);
CREATE INDEX idx_uploaded_at ON inspection_files(uploaded_at);
CREATE INDEX idx_stored_filename ON inspection_files(stored_filename);
CREATE INDEX idx_file_hash ON inspection_files(file_hash);
CREATE INDEX idx_report_category_files ON inspection_files(inspection_report_id, inspection_category);


