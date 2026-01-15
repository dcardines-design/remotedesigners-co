-- Add status column to saved_jobs table for kanban board tracking
ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'saved';

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON saved_jobs(status);

-- Update any existing rows to have 'saved' status
UPDATE saved_jobs SET status = 'saved' WHERE status IS NULL;
