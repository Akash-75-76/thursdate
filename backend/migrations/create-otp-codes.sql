-- backend/migrations/create-otp-codes.sql
-- Migration: Create OTP codes table for phone authentication
-- Stores temporary OTP codes for phone number verification

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL,
  otp_type VARCHAR(50) DEFAULT 'login' COMMENT 'Type of OTP: login, signup, verification',
  attempts_remaining INT DEFAULT 5 COMMENT 'Remaining verification attempts',
  expires_at DATETIME NOT NULL COMMENT 'OTP expiration timestamp',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_phone_number (phone_number),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log the migration
SELECT 'OTP codes table created' as migration_status;
