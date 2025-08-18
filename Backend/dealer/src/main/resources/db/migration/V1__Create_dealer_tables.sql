-- Create Dealer table
CREATE TABLE IF NOT EXISTS Dealer (
    dealer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create DealerAuditLog table
CREATE TABLE IF NOT EXISTS DealerAuditLog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dealer_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_by VARCHAR(255) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dealer_audit_dealer_id (dealer_id),
    INDEX idx_dealer_audit_email (email),
    INDEX idx_dealer_audit_updated_at (updated_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_status ON Dealer(status);
CREATE INDEX IF NOT EXISTS idx_dealer_registered_at ON Dealer(registered_at);
CREATE INDEX IF NOT EXISTS idx_dealer_location ON Dealer(location);
CREATE INDEX IF NOT EXISTS idx_dealer_zipcode ON Dealer(zipcode);
CREATE INDEX IF NOT EXISTS idx_dealer_email ON Dealer(email);
