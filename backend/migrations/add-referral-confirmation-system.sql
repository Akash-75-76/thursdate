-- Add referral fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referredBy INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referralCount INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlistPriority INT DEFAULT 50;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referred_by ON users(referredBy);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON users(waitlistPriority DESC);

-- Create ReferralRequest table
CREATE TABLE IF NOT EXISTS referral_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  newUserId INT NOT NULL,
  newUserName VARCHAR(200) NOT NULL,
  referrerUserId INT,
  referrerPhone VARCHAR(20),
  referrerName VARCHAR(200),
  status ENUM('pending', 'accepted', 'rejected_known', 'rejected_unknown') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmedAt TIMESTAMP NULL,
  FOREIGN KEY (newUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referrerUserId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_new_user (newUserId),
  INDEX idx_referrer (referrerUserId),
  INDEX idx_status (status),
  UNIQUE KEY unique_referral (newUserId)
);

-- Create notifications table (for in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  referralRequestId INT,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referralRequestId) REFERENCES referral_requests(id) ON DELETE CASCADE,
  INDEX idx_user_id (userId),
  INDEX idx_read (read)
);
