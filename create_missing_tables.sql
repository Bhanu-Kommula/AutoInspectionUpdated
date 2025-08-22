-- Create counter_offers table
CREATE TABLE counter_offers (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    technician_email VARCHAR(255) NOT NULL,
    technician_name VARCHAR(255),
    original_offer_amount VARCHAR(100) NOT NULL,
    requested_offer_amount VARCHAR(100) NOT NULL,
    technician_location VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    request_reason TEXT,
    technician_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    dealer_response_at TIMESTAMP,
    dealer_response_notes TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for counter_offers
CREATE INDEX idx_post_id ON counter_offers(post_id);
CREATE INDEX idx_technician_email ON counter_offers(technician_email);
CREATE INDEX idx_status ON counter_offers(status);
CREATE INDEX idx_requested_at ON counter_offers(requested_at);
CREATE INDEX idx_expires_at ON counter_offers(expires_at);

-- Create dealer_counter_offer_actions table
CREATE TABLE dealer_counter_offer_actions (
    id BIGSERIAL PRIMARY KEY,
    counter_offer_id BIGINT NOT NULL,
    dealer_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_notes TEXT,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for dealer_counter_offer_actions
CREATE INDEX idx_counter_offer_id ON dealer_counter_offer_actions(counter_offer_id);
CREATE INDEX idx_dealer_email ON dealer_counter_offer_actions(dealer_email);
CREATE INDEX idx_action_type ON dealer_counter_offer_actions(action_type);
CREATE INDEX idx_action_at ON dealer_counter_offer_actions(action_at);

COMMIT;
