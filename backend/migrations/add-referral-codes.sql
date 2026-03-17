-- Add referral-related columns to users table (if not already present)
ALTER TABLE users
  ADD COLUMN referred_by_user_id INT NULL AFTER approval,
  ADD COLUMN referred_by_code VARCHAR(32) NULL AFTER referred_by_user_id,
  ADD COLUMN referral_advantage TINYINT(1) NOT NULL DEFAULT 0 AFTER referred_by_code;

-- Table to store referral codes issued to users
CREATE TABLE IF NOT EXISTS referral_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  referrer_user_id INT NOT NULL,
  max_uses INT DEFAULT 1,
  uses INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_referrer_user_id (referrer_user_id)
);

-- Table to track which users have applied which referral codes
CREATE TABLE IF NOT EXISTS referral_usages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referral_code_id INT NOT NULL,
  referred_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_referral_user (referral_code_id, referred_user_id),
  INDEX idx_referred_user (referred_user_id)
);
