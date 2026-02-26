-- Add Driving License Verification System
-- This migration creates the infrastructure for manual driving license verification

-- Create driving_license_verifications table
CREATE TABLE IF NOT EXISTS driving_license_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  front_image_url VARCHAR(500) NOT NULL COMMENT 'Cloudinary URL for front image',
  back_image_url VARCHAR(500) NOT NULL COMMENT 'Cloudinary URL for back image',
  verification_status ENUM('UNDER_REVIEW', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNDER_REVIEW',
  verification_type VARCHAR(50) NOT NULL DEFAULT 'DRIVING_LICENSE',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL COMMENT 'Admin user ID who reviewed',
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_status (verification_status),
  INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores driving license verification submissions and admin review status';

-- Add driving_license_verified field to users table (only if it doesn't exist)
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'driving_license_verified'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN driving_license_verified BOOLEAN DEFAULT FALSE COMMENT ''Driving license verification status''',
  'SELECT ''Column driving_license_verified already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index for quick verification lookups (only if it doesn't exist)
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_driving_license_verified'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_driving_license_verified ON users(driving_license_verified)',
  'SELECT ''Index idx_driving_license_verified already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS verification_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  verification_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('APPROVED', 'REJECTED', 'VIEWED') NOT NULL,
  action_details TEXT NULL COMMENT 'JSON with additional details like rejection reason',
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (verification_id) REFERENCES driving_license_verifications(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_verification_id (verification_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for all admin actions on driving license verifications';

SELECT 'Migration completed: Added driving license verification system' AS status;
