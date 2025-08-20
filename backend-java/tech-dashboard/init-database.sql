-- Database Initialization Script for Tech Dashboard Service
-- Run this script manually if Flyway migrations fail

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS inspection_reports (
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE IF NOT EXISTS inspection_vehicle_details (
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_checklist_items (
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inspected_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_files (
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
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_post_id ON inspection_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_technician_id ON inspection_reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_status ON inspection_reports(status);
CREATE INDEX IF NOT EXISTS idx_cli_report_id ON inspection_checklist_items(inspection_report_id);
CREATE INDEX IF NOT EXISTS idx_file_report_id ON inspection_files(inspection_report_id);

-- Verify tables were created
SELECT 'Database initialization completed successfully!' as status;
