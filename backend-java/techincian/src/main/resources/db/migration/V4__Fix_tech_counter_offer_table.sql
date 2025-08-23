-- Fix tech_counter_offer table - add missing id field
-- The original migration was missing the id BIGSERIAL PRIMARY KEY

-- Drop the existing table if it exists (it's likely malformed)
DROP TABLE IF EXISTS tech_counter_offer CASCADE;

-- Recreate with proper structure
CREATE TABLE tech_counter_offer (
    id BIGSERIAL PRIMARY KEY,  -- This was missing in V1 migration!
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

-- Create proper indexes
CREATE INDEX IF NOT EXISTS idx_counter_offer_post_id ON tech_counter_offer(post_id);
CREATE INDEX IF NOT EXISTS idx_counter_offer_technician_email ON tech_counter_offer(technician_email);
CREATE INDEX IF NOT EXISTS idx_counter_offer_status ON tech_counter_offer(status);
CREATE INDEX IF NOT EXISTS idx_counter_offer_created_at ON tech_counter_offer(created_at);

-- Verify table structure
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tech_counter_offer' 
        AND column_name = 'id'
        AND data_type = 'bigint'
    ) THEN
        RAISE NOTICE 'SUCCESS: tech_counter_offer table recreated with proper id field';
    ELSE
        RAISE EXCEPTION 'FAILED: tech_counter_offer table structure is incorrect';
    END IF;
END $$;
