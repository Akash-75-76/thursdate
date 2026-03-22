-- BUG FIX #2 & #6: Add onboarding_current_step column to track user progress
-- This migration adds the ability to track which step of onboarding a user is on
-- Enables users to resume from their last step instead of restarting from step 1

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_current_step INT DEFAULT 1 AFTER onboarding_complete;

-- Create index for faster queries on onboarding progress
CREATE INDEX IF NOT EXISTS idx_onboarding_step ON users(onboarding_current_step);

-- Note: Backfill logic for existing users
-- Users with completed profiles (firstName + lastName set) but onboarding_complete=false should have step=7
-- Users with onboarding_complete=true should have step=14
INSERT IGNORE INTO users_onboarding_backfill (user_id, calculated_step)
SELECT id, CASE 
    WHEN onboarding_complete = true THEN 14
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 7
    ELSE 1
END as calculated_step
FROM users
WHERE onboarding_current_step = 1;

-- Update the backfilled data
UPDATE users u
JOIN users_onboarding_backfill b ON u.id = b.user_id
SET u.onboarding_current_step = b.calculated_step;

-- Cleanup
DROP TABLE IF EXISTS users_onboarding_backfill;
