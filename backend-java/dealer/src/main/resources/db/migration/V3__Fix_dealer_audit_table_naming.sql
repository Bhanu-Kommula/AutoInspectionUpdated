-- Rename legacy table created as unquoted CamelCase to snake_case expected by JPA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'dealerauditlog'
    ) THEN
        EXECUTE 'ALTER TABLE public.dealerauditlog RENAME TO dealer_audit_log';
    END IF;
END $$;

-- Recreate helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_dealer_audit_dealer_id ON dealer_audit_log (dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_audit_email ON dealer_audit_log (email);
CREATE INDEX IF NOT EXISTS idx_dealer_audit_updated_at ON dealer_audit_log (updated_at);


