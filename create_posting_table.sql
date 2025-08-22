-- Create posting_dashboard table for postings service
CREATE TABLE posting_dashboard (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    content TEXT,
    location VARCHAR(255),
    offer_amount VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    vin VARCHAR(17),
    auction_lot VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    technician_email VARCHAR(255),
    technician_name VARCHAR(255),
    technician_phone VARCHAR(20),
    dealer_phone VARCHAR(20),
    expected_completion_by TIMESTAMP,
    inspection_report_id BIGINT
);

-- Create indexes for better performance
CREATE INDEX idx_posting_dashboard_email ON posting_dashboard(email);
CREATE INDEX idx_posting_dashboard_status ON posting_dashboard(status);
CREATE INDEX idx_posting_dashboard_created_at ON posting_dashboard(created_at);

-- Insert test data
INSERT INTO posting_dashboard (name, email, content, location, offer_amount, status) VALUES
('Test Post 1', 'bhanu@gmail.com', 'Looking for vehicle inspection', 'Test Location', '1000', 'PENDING'),
('Test Post 2', 'bhanu@gmail.com', 'Need quick inspection', 'Another Location', '1200', 'PENDING');

COMMIT;
