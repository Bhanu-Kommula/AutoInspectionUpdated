-- Create Technician table with phone field
CREATE TABLE IF NOT EXISTS technicians (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    delearship_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    zipcode VARCHAR(20) NOT NULL,
    years_of_experience VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TechnicianAuditLog table
CREATE TABLE IF NOT EXISTS technician_audit_log (
    id BIGSERIAL PRIMARY KEY,
    technician_id BIGINT,
    email VARCHAR(255) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TechAcceptedPost table
CREATE TABLE IF NOT EXISTS tech_accepted_post (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TechDeclinedPosts table
CREATE TABLE IF NOT EXISTS tech_declined_posts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TechCounterOffer table
CREATE TABLE IF NOT EXISTS tech_counter_offer (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    technician_email VARCHAR(255) NOT NULL,
    original_offer_amount VARCHAR(50),
    requested_offer_amount VARCHAR(50),
    technician_location VARCHAR(255),
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_reason TEXT,
    technician_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    dealer_response_at TIMESTAMP,
    dealer_response_notes TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    posting_service_counter_offer_id BIGINT
);

-- Create TechnicianPerformanceMetrics table
CREATE TABLE IF NOT EXISTS technician_performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    technician_email VARCHAR(255) NOT NULL UNIQUE,
    total_posts_viewed INTEGER NOT NULL DEFAULT 0,
    total_posts_accepted INTEGER NOT NULL DEFAULT 0,
    total_posts_declined INTEGER NOT NULL DEFAULT 0,
    total_counter_offers INTEGER NOT NULL DEFAULT 0,
    accepted_counter_offers INTEGER NOT NULL DEFAULT 0,
    rejected_counter_offers INTEGER NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    avg_response_time_ms BIGINT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TechnicianPostInteraction table
CREATE TABLE IF NOT EXISTS technician_post_interactions (
    id BIGSERIAL PRIMARY KEY,
    technician_email VARCHAR(255) NOT NULL,
    post_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    original_offer_amount VARCHAR(50),
    counter_offer_amount VARCHAR(50),
    request_reason VARCHAR(500),
    notes VARCHAR(1000),
    response_time_ms BIGINT,
    external_service_success BOOLEAN,
    error_message VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_technicians_email ON technicians(email);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);
CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians(location);
CREATE INDEX IF NOT EXISTS idx_technicians_zipcode ON technicians(zipcode);
CREATE INDEX IF NOT EXISTS idx_technicians_created_at ON technicians(created_at);
CREATE INDEX IF NOT EXISTS idx_technicians_last_activity ON technicians(last_activity_at);

-- Indexes for TechnicianAuditLog
CREATE INDEX IF NOT EXISTS idx_audit_technician_id ON technician_audit_log(technician_id);
CREATE INDEX IF NOT EXISTS idx_audit_email ON technician_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_audit_updated_at ON technician_audit_log(updated_at);

-- Indexes for TechAcceptedPost
CREATE INDEX IF NOT EXISTS idx_accepted_email ON tech_accepted_post(email);
CREATE INDEX IF NOT EXISTS idx_accepted_post_id ON tech_accepted_post(post_id);
CREATE INDEX IF NOT EXISTS idx_accepted_created_at ON tech_accepted_post(created_at);

-- Indexes for TechDeclinedPosts
CREATE INDEX IF NOT EXISTS idx_declined_email ON tech_declined_posts(email);
CREATE INDEX IF NOT EXISTS idx_declined_post_id ON tech_declined_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_declined_created_at ON tech_declined_posts(created_at);

-- Indexes for TechCounterOffer
CREATE INDEX IF NOT EXISTS idx_counter_offer_post_id ON tech_counter_offer(post_id);
CREATE INDEX IF NOT EXISTS idx_counter_offer_email ON tech_counter_offer(technician_email);
CREATE INDEX IF NOT EXISTS idx_counter_offer_status ON tech_counter_offer(status);
CREATE INDEX IF NOT EXISTS idx_counter_offer_requested_at ON tech_counter_offer(requested_at);

-- Indexes for TechnicianPerformanceMetrics
CREATE INDEX IF NOT EXISTS idx_performance_email ON technician_performance_metrics(technician_email);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON technician_performance_metrics(created_at);

-- Indexes for TechnicianPostInteraction
CREATE INDEX IF NOT EXISTS idx_interaction_email ON technician_post_interactions(technician_email);
CREATE INDEX IF NOT EXISTS idx_interaction_post_id ON technician_post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_interaction_action_type ON technician_post_interactions(action_type);
CREATE INDEX IF NOT EXISTS idx_interaction_created_at ON technician_post_interactions(created_at);
