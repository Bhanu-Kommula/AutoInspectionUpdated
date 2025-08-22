-- Create posting_dashboard table if it doesn't exist
-- This ensures the table exists with the correct structure

CREATE TABLE IF NOT EXISTS posting_dashboard (
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
CREATE INDEX IF NOT EXISTS idx_posting_dashboard_email ON posting_dashboard(email);
CREATE INDEX IF NOT EXISTS idx_posting_dashboard_status ON posting_dashboard(status);
CREATE INDEX IF NOT EXISTS idx_posting_dashboard_created_at ON posting_dashboard(created_at);

-- Add some test data if table is empty
INSERT INTO posting_dashboard (name, email, content, location, offer_amount, status)
SELECT 'Test Post', 'bhanu@gmail.com', 'Test posting content', 'Test Location', '1000', 'PENDING'
WHERE NOT EXISTS (SELECT 1 FROM posting_dashboard WHERE email = 'bhanu@gmail.com');

COMMIT;
