-- Create Inspection Database Tables
-- This script creates all necessary tables for the inspection report system

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS inspection;
USE inspection;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS inspection_files;
DROP TABLE IF EXISTS inspection_checklist_items;
DROP TABLE IF EXISTS inspection_reports;

-- Create inspection_reports table
CREATE TABLE inspection_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    status ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
    overall_condition ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR'),
    safety_rating ENUM('SAFE', 'NEEDS_ATTENTION', 'UNSAFE'),
    estimated_repair_cost DECIMAL(10,2) DEFAULT 0.00,
    priority_repairs TEXT,
    general_notes TEXT,
    total_files_count INT DEFAULT 0,
    total_files_size BIGINT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    completed_at DATETIME,
    INDEX idx_post_id (post_id),
    INDEX idx_technician_id (technician_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create inspection_checklist_items table
CREATE TABLE inspection_checklist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    category ENUM('EXTERIOR', 'INTERIOR', 'ENGINE', 'TRANSMISSION', 'BRAKES', 'SUSPENSION', 'ELECTRICAL', 'SAFETY', 'UNDERCARRIAGE', 'TEST_DRIVE') NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    remarks TEXT,
    condition_rating ENUM('LIKE_NEW', 'SERVICEABLE', 'MARGINAL', 'REQUIRES_REPAIR', 'NOT_ACCESSIBLE'),
    working_status ENUM('WORKING', 'NEEDS_ATTENTION', 'NOT_WORKING'),
    priority_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE,
    INDEX idx_inspection_report_id (inspection_report_id),
    INDEX idx_category (category),
    INDEX idx_is_checked (is_checked)
);

-- Create inspection_files table
CREATE TABLE inspection_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_report_id BIGINT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_category ENUM('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER'),
    description VARCHAR(500),
    file_hash VARCHAR(128),
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_virus_scanned BOOLEAN DEFAULT FALSE,
    is_valid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (inspection_report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE,
    INDEX idx_inspection_report_id (inspection_report_id),
    INDEX idx_file_category (file_category),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_stored_filename (stored_filename)
);

-- Sample data removed to prevent interference with real inspection data
-- Use the dashboard service to create inspection reports and checklist items

-- Show created tables
SHOW TABLES;

-- Show table structures
DESCRIBE inspection_reports;
DESCRIBE inspection_checklist_items;
DESCRIBE inspection_files;

-- Show sample data
SELECT 'Inspection Reports:' as info;
SELECT * FROM inspection_reports;

SELECT 'Checklist Items:' as info;
SELECT * FROM inspection_checklist_items;
