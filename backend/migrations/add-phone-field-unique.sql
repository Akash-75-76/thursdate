-- Add unique phone_number field to users table
-- Prevents multiple accounts from same phone number

ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE DEFAULT NULL;

-- Create index on phone_number for faster lookups
CREATE INDEX idx_phone_number ON users(phone_number);

-- Add column to track phone verification status
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- Log the migration
INSERT INTO migration_log (name, executed_at) VALUES ('add-phone-field-unique', NOW());
