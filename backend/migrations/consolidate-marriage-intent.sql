-- Migration: Consolidate Marriage and Seriously Date intents
-- Date: 2026-02-22
-- Purpose: Update users who selected "Marriage" to use "Seriously Date" as the consolidated option

-- Update users with "Marriage" purpose to "Seriously Date"
-- This uses JSON_SET to update the purpose field within the intent JSON
UPDATE users 
SET intent = JSON_SET(intent, '$.purpose', 'Seriously Date')
WHERE JSON_EXTRACT(intent, '$.purpose') = 'Marriage';

-- Migration complete
SELECT CONCAT('Migration completed: Updated ', ROW_COUNT(), ' users from Marriage to Seriously Date') AS status;
