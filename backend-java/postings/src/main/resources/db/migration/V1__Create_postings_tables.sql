-- PostgreSQL schema for postings service
-- Creates all necessary tables for the postings functionality

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS accepted_posts CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;

-- dealers table
CREATE TABLE dealers (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- technicians table
CREATE TABLE technicians (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    specialization VARCHAR(100),
    experience_years INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- posts table
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    dealer_id BIGINT NOT NULL REFERENCES dealers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vehicle_make VARCHAR(50),
    vehicle_model VARCHAR(50),
    vehicle_year INTEGER,
    vehicle_mileage INTEGER,
    vehicle_condition VARCHAR(50),
    location VARCHAR(255),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    urgency VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0
);

-- accepted_posts table
CREATE TABLE accepted_posts (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    technician_id BIGINT NOT NULL REFERENCES technicians(id),
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'accepted',
    notes TEXT,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    final_cost DECIMAL(10,2),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_posts_dealer_id ON posts(dealer_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_vehicle_make_model ON posts(vehicle_make, vehicle_model);
CREATE INDEX idx_posts_location ON posts(location);

CREATE INDEX idx_accepted_posts_post_id ON accepted_posts(post_id);
CREATE INDEX idx_accepted_posts_technician_id ON accepted_posts(technician_id);
CREATE INDEX idx_accepted_posts_status ON accepted_posts(status);
CREATE INDEX idx_accepted_posts_accepted_at ON accepted_posts(accepted_at);

CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_dealers_city_state ON dealers(city, state);

CREATE INDEX idx_technicians_status ON technicians(status);
CREATE INDEX idx_technicians_specialization ON technicians(specialization);
CREATE INDEX idx_technicians_city_state ON technicians(city, state);
