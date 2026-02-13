-- Migration: Add city-based location matching
-- Date: 2026-02-13
-- Purpose: Enable city-based matching for better user experience

-- Add city column to extract from current_location
ALTER TABLE users 
ADD COLUMN city VARCHAR(100) COMMENT 'City extracted from current_location for matching',
ADD COLUMN location_preference VARCHAR(50) DEFAULT 'same_city' COMMENT 'Location matching preference: same_city, nearby_cities, anywhere';

-- Create index for fast city-based matching
CREATE INDEX idx_city ON users(city);
CREATE INDEX idx_location_preference ON users(location_preference);

-- Migration complete
SELECT 'Migration completed: Added city and location_preference columns with indexes' AS status;
