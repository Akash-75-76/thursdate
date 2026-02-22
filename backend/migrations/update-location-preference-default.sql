-- Migration: Update default location preference from 'same_city' to 'anywhere'
-- Date: 2026-02-22
-- Purpose: Change default location matching preference to 'anywhere' for better global reach

-- Update existing users who have 'same_city' (the old default) to 'anywhere' (new default)
-- This only affects users who never explicitly set their preference
UPDATE users 
SET location_preference = 'anywhere' 
WHERE location_preference = 'same_city' OR location_preference IS NULL;

-- Update the column default for new users
ALTER TABLE users 
MODIFY COLUMN location_preference VARCHAR(50) DEFAULT 'anywhere' COMMENT 'Location matching preference: same_city, nearby_cities, anywhere';

-- Migration complete
SELECT 'Migration completed: Updated location_preference default to anywhere' AS status;
