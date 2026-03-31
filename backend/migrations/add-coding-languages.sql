-- Migration: Add coding languages field for profile questions
-- Date: 2026-03-29
-- Purpose: Store coding languages that users know as part of their profile

ALTER TABLE users 
ADD COLUMN coding_languages TEXT COMMENT 'JSON array of coding languages user knows',
ADD COLUMN spoken_languages TEXT COMMENT 'JSON array of spoken languages user knows';

-- Create index for fast lookups if needed
CREATE INDEX idx_coding_languages ON users(coding_languages(100));
CREATE INDEX idx_spoken_languages ON users(spoken_languages(100));

-- Migration complete
SELECT 'Migration completed: Added coding_languages and spoken_languages columns' AS status;
