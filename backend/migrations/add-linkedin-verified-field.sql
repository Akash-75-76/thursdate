-- Add LinkedIn verification status field
-- This migration adds a boolean field to track if user's LinkedIn is verified

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT FALSE COMMENT 'LinkedIn OAuth verification status';

-- Add index for quick verification status lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_verified ON users(linkedin_verified);

SELECT 'Migration completed: Added linkedin_verified field' AS status;
