-- Add posting_service_counter_offer_id column to tech_counter_offers table
ALTER TABLE tech_counter_offers ADD COLUMN posting_service_counter_offer_id BIGINT;

-- Create index for better performance when looking up by posting service ID
CREATE INDEX idx_posting_service_counter_offer_id ON tech_counter_offers(posting_service_counter_offer_id);
