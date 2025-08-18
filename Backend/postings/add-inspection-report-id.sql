-- Add inspection_report_id column to PostingDashboard table
-- This links posts to their inspection reports in the tech-dashboard service

-- PostgreSQL: no USE; ensure correct DB selected by connection

-- Add the new column
ALTER TABLE PostingDashboard 
ADD COLUMN inspection_report_id BIGINT NULL;

-- Add an index for better performance when querying by inspection report ID
CREATE INDEX IF NOT EXISTS idx_inspection_report_id ON PostingDashboard(inspection_report_id);

-- Add a foreign key constraint (optional - for data integrity)
-- Note: This requires the inspection database to be accessible
-- ALTER TABLE PostingDashboard 
-- ADD CONSTRAINT fk_inspection_report_id 
-- FOREIGN KEY (inspection_report_id) REFERENCES inspection.inspection_reports(id);

-- Postgres equivalents for describe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'postingdashboard';
