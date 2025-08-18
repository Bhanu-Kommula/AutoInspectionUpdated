-- Add inspection_report_id column to PostingDashboard table
-- This links posts to their inspection reports in the tech-dashboard service

USE postings;

-- Add the new column
ALTER TABLE PostingDashboard 
ADD COLUMN inspection_report_id BIGINT NULL;

-- Add an index for better performance when querying by inspection report ID
CREATE INDEX idx_inspection_report_id ON PostingDashboard(inspection_report_id);

-- Add a foreign key constraint (optional - for data integrity)
-- Note: This requires the inspection database to be accessible
-- ALTER TABLE PostingDashboard 
-- ADD CONSTRAINT fk_inspection_report_id 
-- FOREIGN KEY (inspection_report_id) REFERENCES inspection.inspection_reports(id);

-- Show the updated table structure
DESCRIBE PostingDashboard;

-- Show sample data with the new column
SELECT id, name, status, inspection_report_id FROM PostingDashboard LIMIT 5;
