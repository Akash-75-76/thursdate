-- Add unique constraints for email, phone, linkedinId, and googleId to prevent duplicate accounts
-- Purpose: Ensure one email, phone, linkedinId, and googleId corresponds to only one user account
-- This migration adds missing unique constraints and new OAuth fields

-- Step 1: Add google_id field if it doesn't exist
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- Step 2: Add unique index for google_id
CREATE UNIQUE INDEX idx_google_id ON users(google_id);

-- Step 3: Rename and add unique constraint for LinkedIn OAuth ID
-- First, rename existing linkedin column to linkedin_id for clarity
ALTER TABLE users CHANGE COLUMN linkedin linkedin_id VARCHAR(255) UNIQUE DEFAULT NULL;

-- Step 4: Add unique index for linkedin_id
CREATE UNIQUE INDEX idx_linkedin_id ON users(linkedin_id);

-- Step 5: Ensure email has unique index (should already exist, but confirm)
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS unique_email(email);

-- Step 6: Ensure phone_number has unique index (should already exist, but confirm)
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS unique_phone(phone_number);

-- Step 7: Add social auth verification flags if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_verified BOOLEAN DEFAULT FALSE;
-- linkedin_verified should already exist from previous migration

-- Add account status tracking fields for edge cases
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status ENUM('pending', 'under_review', 'approved', 'rejected', 'suspended') DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_timestamp TIMESTAMP DEFAULT NULL;

-- Create index for account_status to quickly filter by status
CREATE INDEX idx_account_status ON users(account_status);
