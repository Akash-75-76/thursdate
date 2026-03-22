// backend/services/otpService.js
// Service for generating, storing, and verifying OTPs (one-time passwords)
// Handles OTP lifecycle for phone number authentication

const pool = require('../config/db');
const crypto = require('crypto');

class OTPService {
  /**
   * Configuration constants
   */
  static CONFIG = {
    OTP_LENGTH: 6,              // 6-digit OTP (e.g., 123456)
    OTP_EXPIRY_MINUTES: 15,     // OTPs valid for 15 minutes
    MAX_ATTEMPTS: 5,            // Maximum verification attempts
    RESEND_COOLDOWN_SECONDS: 60, // Cooldown between resend requests (prevent abuse)
    OTP_TYPE: {
      SIGNUP: 'signup',
      LOGIN: 'login',
      VERIFICATION: 'verification'
    }
  };

  /**
   * Generate a random 6-digit OTP
   * @returns {string} - 6-digit OTP (e.g., "123456")
   */
  static generateOTP() {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Create and store OTP for phone number
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} otpType - Type of OTP (signup, login, verification)
   * @returns {Promise<Object>} - { otp, expiresAt, phoneNumber }
   */
  async generateAndStoreOTP(phoneNumber, otpType = 'login') {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Check if OTP record exists for this phone
      const [existing] = await pool.execute(
        'SELECT id FROM otp_codes WHERE phone_number = ?',
        [phoneNumber]
      );

      if (existing.length > 0) {
        // Update existing OTP record
        await pool.execute(
          `UPDATE otp_codes 
           SET code = ?, expires_at = ?, attempts_remaining = ?, otp_type = ?, created_at = NOW()
           WHERE phone_number = ?`,
          [otp, expiresAt, this.CONFIG.MAX_ATTEMPTS, otpType, phoneNumber]
        );
      } else {
        // Insert new OTP record
        await pool.execute(
          `INSERT INTO otp_codes (phone_number, code, expires_at, attempts_remaining, otp_type, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [phoneNumber, otp, expiresAt, this.CONFIG.MAX_ATTEMPTS, otpType]
        );
      }

      console.log(`✅ OTP generated for ${phoneNumber} (Type: ${otpType})`);

      return {
        otp,
        expiresAt,
        phoneNumber,
        ttl_minutes: this.CONFIG.OTP_EXPIRY_MINUTES
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP for phone number
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} enteredOTP - OTP entered by user
   * @returns {Promise<Object>} - { success: boolean, message: string, remainingAttempts: number }
   */
  async verifyOTP(phoneNumber, enteredOTP) {
    try {
      // Get OTP record
      const [records] = await pool.execute(
        'SELECT * FROM otp_codes WHERE phone_number = ?',
        [phoneNumber]
      );

      if (records.length === 0) {
        return {
          success: false,
          message: 'No OTP found for this phone number',
          remainingAttempts: 0
        };
      }

      const record = records[0];
      const now = new Date();

      // Check if OTP expired
      if (new Date(record.expires_at) < now) {
        // Delete expired OTP
        await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
          remainingAttempts: 0
        };
      }

      // Check attempts remaining
      if (record.attempts_remaining <= 0) {
        // Delete record after max attempts
        await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          remainingAttempts: 0
        };
      }

      // Verify OTP
      const cleanedEnteredOTP = String(enteredOTP).trim();
      const cleanedStoredOTP = String(record.code).trim();

      if (cleanedEnteredOTP === cleanedStoredOTP) {
        // OTP is correct - mark as verified and delete
        await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);

        // Mark phone as verified in users table (if user exists)
        await pool.execute(
          'UPDATE users SET phone_verified = true WHERE phone_number = ?',
          [phoneNumber]
        );

        console.log(`✅ OTP verified successfully for ${phoneNumber}`);

        return {
          success: true,
          message: 'Phone number verified successfully',
          remainingAttempts: this.CONFIG.MAX_ATTEMPTS
        };
      } else {
        // OTP is incorrect - decrement attempts
        const newAttempts = record.attempts_remaining - 1;

        if (newAttempts <= 0) {
          // Delete after final failed attempt
          await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);
          console.log(`❌ OTP verification failed (max attempts) for ${phoneNumber}`);

          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.',
            remainingAttempts: 0
          };
        } else {
          // Update remaining attempts
          await pool.execute(
            'UPDATE otp_codes SET attempts_remaining = ? WHERE phone_number = ?',
            [newAttempts, phoneNumber]
          );
          console.log(`❌ OTP verification failed for ${phoneNumber} (${newAttempts} attempts remaining)`);

          return {
            success: false,
            message: `Incorrect OTP. ${newAttempts} attempt${newAttempts === 1 ? '' : 's'} remaining.`,
            remainingAttempts: newAttempts
          };
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Check if OTP is resend allowed (cooldown check)
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object>} - { allowed: boolean, secondsRemaining: number }
   */
  async canResendOTP(phoneNumber) {
    try {
      const [records] = await pool.execute(
        'SELECT created_at FROM otp_codes WHERE phone_number = ?',
        [phoneNumber]
      );

      if (records.length === 0) {
        return { allowed: true, secondsRemaining: 0 };
      }

      const createdAt = new Date(records[0].created_at).getTime();
      const now = Date.now();
      const secondsElapsed = Math.floor((now - createdAt) / 1000);
      const secondsRemaining = Math.max(0, this.CONFIG.RESEND_COOLDOWN_SECONDS - secondsElapsed);

      return {
        allowed: secondsRemaining === 0,
        secondsRemaining
      };
    } catch (error) {
      console.error('Error checking resend cooldown:', error);
      throw error;
    }
  }

  /**
   * Get OTP status for phone number
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object|null>} - OTP status: { phone_number, otp_type, attempts_remaining, expires_at }
   */
  async getOTPStatus(phoneNumber) {
    try {
      const [records] = await pool.execute(
        `SELECT phone_number, otp_type, attempts_remaining, expires_at 
         FROM otp_codes WHERE phone_number = ?`,
        [phoneNumber]
      );

      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      const now = new Date();
      const isExpired = new Date(record.expires_at) < now;

      return {
        phoneNumber: record.phone_number,
        otpType: record.otp_type,
        attemptsRemaining: record.attempts_remaining,
        expiresAt: record.expires_at,
        expired: isExpired
      };
    } catch (error) {
      console.error('Error getting OTP status:', error);
      throw error;
    }
  }

  /**
   * Delete OTP record (manual cleanup)
   * @param {string} phoneNumber - 10-digit phone number
   */
  async deleteOTP(phoneNumber) {
    try {
      await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);
      console.log(`🗑️ OTP deleted for ${phoneNumber}`);
    } catch (error) {
      console.error('Error deleting OTP:', error);
      throw error;
    }
  }

  /**
   * Clean up expired OTPs (database maintenance)
   * @returns {Promise<number>} - Number of expired OTPs deleted
   */
  async cleanupExpiredOTPs() {
    try {
      const [result] = await pool.execute(
        'DELETE FROM otp_codes WHERE expires_at < NOW()'
      );

      const deletedCount = result.affectedRows;
      console.log(`🧹 Cleaned up ${deletedCount} expired OTPs`);

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw error;
    }
  }

  /**
   * Get time remaining until OTP expires (in seconds)
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<number>} - Seconds remaining, or -1 if OTP doesn't exist
   */
  async getOTPTimeRemaining(phoneNumber) {
    try {
      const [records] = await pool.execute(
        'SELECT expires_at FROM otp_codes WHERE phone_number = ?',
        [phoneNumber]
      );

      if (records.length === 0) {
        return -1; // OTP doesn't exist
      }

      const expiresAt = new Date(records[0].expires_at).getTime();
      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

      return secondsRemaining;
    } catch (error) {
      console.error('Error getting OTP time remaining:', error);
      throw error;
    }
  }

  /**
   * Send OTP via SMS (placeholder for actual SMS provider integration)
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} otp - OTP to send
   * @returns {Promise<Object>} - { success: boolean, messageId: string }
   */
  async sendOTPViaSMS(phoneNumber, otp) {
    try {
      // TODO: Integrate with SMS provider (Twilio, SendGrid, etc.)
      // This is a placeholder that should be replaced with actual SMS implementation

      console.log(`📱 SMS sent to ${phoneNumber}: Your verification code is ${otp}`);

      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        phoneNumber,
        otp // Remove this in production - only for development
      };
    } catch (error) {
      console.error('Error sending OTP via SMS:', error);
      throw error;
    }
  }
}

module.exports = OTPService;
