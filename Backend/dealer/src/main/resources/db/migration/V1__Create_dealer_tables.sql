-- Create Dealer table
CREATE TABLE IF NOT EXISTS Dealer (
    dealer_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create DealerAuditLog table
CREATE TABLE IF NOT EXISTS DealerAuditLog (
    id BIGSERIAL PRIMARY KEY,
    dealer_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_status ON Dealer(status);
CREATE INDEX IF NOT EXISTS idx_dealer_registered_at ON Dealer(registered_at);
CREATE INDEX IF NOT EXISTS idx_dealer_location ON Dealer(location);
CREATE INDEX IF NOT EXISTS idx_dealer_zipcode ON Dealer(zipcode);
CREATE INDEX IF NOT EXISTS idx_dealer_email ON Dealer(email);

-- Indexes for DealerAuditLog (moved from inline definitions for PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_dealer_audit_dealer_id ON DealerAuditLog (dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_audit_email ON DealerAuditLog (email);
CREATE INDEX IF NOT EXISTS idx_dealer_audit_updated_at ON DealerAuditLog (updated_at);
