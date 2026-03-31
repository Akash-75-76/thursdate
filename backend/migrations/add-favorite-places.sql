-- Migration: Add favorite_places field for Places Autocomplete
-- Date: 2026-03-29
-- Purpose: Store user's favorite cafes and restaurants with place details

ALTER TABLE users 
ADD COLUMN favorite_places TEXT COMMENT 'JSON array of favorite places with place_id, name, address, lat, lng';

-- Create index for fast lookups if needed
CREATE INDEX idx_favorite_places ON users(favorite_places(100));

-- Migration complete
SELECT 'Migration completed: Added favorite_places column' AS status;
