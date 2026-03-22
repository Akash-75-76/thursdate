-- backend/migrations/add-phone-number.sql
-- Migration: Add phone number authentication support to users table
-- Adds phone_number column with UNIQUE constraint for phone-based login/signup

-- Add phone_number column with UNIQUE constraint
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE NULL AFTER email;

-- Add phone verification flag
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false AFTER phone_number;

-- Add index for phone number lookups
CREATE INDEX idx_phone_number ON users(phone_number);

-- Log the migration
SELECT 'Phone number columns added to users table' as migration_status;
