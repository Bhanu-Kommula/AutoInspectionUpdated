-- Add new fields to Dealer table for enhanced business logic
ALTER TABLE Dealer 
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN last_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update existing records to have proper timestamps
UPDATE Dealer 
SET registered_at = CURRENT_TIMESTAMP, 
    last_updated_at = CURRENT_TIMESTAMP 
WHERE registered_at IS NULL;

-- Create index on status for better performance
CREATE INDEX idx_dealer_status ON Dealer(status);

-- Create index on registration date for better performance
CREATE INDEX idx_dealer_registered_at ON Dealer(registered_at);

-- Create index on location for search performance
CREATE INDEX idx_dealer_location ON Dealer(location);

-- Create index on zipcode for search performance
CREATE INDEX idx_dealer_zipcode ON Dealer(zipcode);
