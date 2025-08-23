-- Create ratings table for technician ratings by dealers
CREATE TABLE IF NOT EXISTS ratings (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    dealer_email VARCHAR(255) NOT NULL,
    technician_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per post
    UNIQUE(post_id),
    
    -- Add indexes for performance
    INDEX idx_ratings_post_id (post_id),
    INDEX idx_ratings_dealer_email (dealer_email),
    INDEX idx_ratings_technician_email (technician_email),
    INDEX idx_ratings_rating (rating),
    INDEX idx_ratings_created_at (created_at)
);

-- Create technician_rating_summary table for quick lookups
CREATE TABLE IF NOT EXISTS technician_rating_summary (
    id BIGSERIAL PRIMARY KEY,
    technician_email VARCHAR(255) NOT NULL UNIQUE,
    total_ratings INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    five_star_count INTEGER NOT NULL DEFAULT 0,
    four_star_count INTEGER NOT NULL DEFAULT 0,
    three_star_count INTEGER NOT NULL DEFAULT 0,
    two_star_count INTEGER NOT NULL DEFAULT 0,
    one_star_count INTEGER NOT NULL DEFAULT 0,
    last_rated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Add indexes
    INDEX idx_tech_rating_summary_email (technician_email),
    INDEX idx_tech_rating_summary_avg_rating (average_rating),
    INDEX idx_tech_rating_summary_total_ratings (total_ratings)
);

-- Create trigger function to update rating summary
CREATE OR REPLACE FUNCTION update_technician_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO technician_rating_summary (
            technician_email,
            total_ratings,
            average_rating,
            five_star_count,
            four_star_count,
            three_star_count,
            two_star_count,
            one_star_count,
            last_rated_at,
            updated_at
        )
        SELECT 
            NEW.technician_email,
            COUNT(*) as total_ratings,
            ROUND(AVG(rating::numeric), 2) as average_rating,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star_count,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star_count,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star_count,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star_count,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star_count,
            MAX(created_at) as last_rated_at,
            CURRENT_TIMESTAMP as updated_at
        FROM ratings 
        WHERE technician_email = NEW.technician_email
        GROUP BY technician_email
        ON CONFLICT (technician_email) 
        DO UPDATE SET
            total_ratings = EXCLUDED.total_ratings,
            average_rating = EXCLUDED.average_rating,
            five_star_count = EXCLUDED.five_star_count,
            four_star_count = EXCLUDED.four_star_count,
            three_star_count = EXCLUDED.three_star_count,
            two_star_count = EXCLUDED.two_star_count,
            one_star_count = EXCLUDED.one_star_count,
            last_rated_at = EXCLUDED.last_rated_at,
            updated_at = EXCLUDED.updated_at;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO technician_rating_summary (
            technician_email,
            total_ratings,
            average_rating,
            five_star_count,
            four_star_count,
            three_star_count,
            two_star_count,
            one_star_count,
            last_rated_at,
            updated_at
        )
        SELECT 
            OLD.technician_email,
            COUNT(*) as total_ratings,
            COALESCE(ROUND(AVG(rating::numeric), 2), 0.00) as average_rating,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star_count,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star_count,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star_count,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star_count,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star_count,
            MAX(created_at) as last_rated_at,
            CURRENT_TIMESTAMP as updated_at
        FROM ratings 
        WHERE technician_email = OLD.technician_email
        GROUP BY technician_email
        ON CONFLICT (technician_email) 
        DO UPDATE SET
            total_ratings = EXCLUDED.total_ratings,
            average_rating = EXCLUDED.average_rating,
            five_star_count = EXCLUDED.five_star_count,
            four_star_count = EXCLUDED.four_star_count,
            three_star_count = EXCLUDED.three_star_count,
            two_star_count = EXCLUDED.two_star_count,
            one_star_count = EXCLUDED.one_star_count,
            last_rated_at = EXCLUDED.last_rated_at,
            updated_at = EXCLUDED.updated_at;
        
        -- If no ratings left, set defaults
        IF NOT EXISTS (SELECT 1 FROM ratings WHERE technician_email = OLD.technician_email) THEN
            INSERT INTO technician_rating_summary (technician_email, total_ratings, average_rating, updated_at)
            VALUES (OLD.technician_email, 0, 0.00, CURRENT_TIMESTAMP)
            ON CONFLICT (technician_email) 
            DO UPDATE SET
                total_ratings = 0,
                average_rating = 0.00,
                five_star_count = 0,
                four_star_count = 0,
                three_star_count = 0,
                two_star_count = 0,
                one_star_count = 0,
                last_rated_at = NULL,
                updated_at = CURRENT_TIMESTAMP;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_rating_summary_insert
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_rating_summary();

CREATE TRIGGER trigger_update_rating_summary_update
    AFTER UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_rating_summary();

CREATE TRIGGER trigger_update_rating_summary_delete
    AFTER DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_rating_summary();
