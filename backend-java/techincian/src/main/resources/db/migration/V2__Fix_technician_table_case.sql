-- Fix table name casing for PostgreSQL compatibility
-- Drop and recreate with lowercase name if uppercase version exists

-- Check if uppercase table exists and rename to lowercase
DO $$ 
BEGIN
    -- If the uppercase table exists, rename it to lowercase
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Technicians') THEN
        ALTER TABLE "Technicians" RENAME TO technicians;
    END IF;
    
    -- Ensure the lowercase table exists with correct structure
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
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_technicians_email ON technicians(email);
    CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);
    CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians(location);
    CREATE INDEX IF NOT EXISTS idx_technicians_zipcode ON technicians(zipcode);
    CREATE INDEX IF NOT EXISTS idx_technicians_created_at ON technicians(created_at);
    CREATE INDEX IF NOT EXISTS idx_technicians_last_activity ON technicians(last_activity_at);
    
END $$;
