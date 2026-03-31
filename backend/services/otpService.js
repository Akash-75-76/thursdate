// backend/services/otpService.js
// Service for generating, storing, and verifying OTPs (one-time passwords)
// Handles OTP lifecycle for phone number authentication
// 
// ✅ MOCK OTP ENABLED - Change OTP_MODE=real in .env to enable real SMS service
// Current Mode: Mock (uses 123456 for all OTPs)

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
    },
    // ✅ OTP_MODE: Determines if using mock or real SMS service
    // Set via environment variable: OTP_MODE=mock|real
    MODE: process.env.OTP_MODE || 'mock'
  };

  /**
   * ✅ MOCK OTP VALUE - Used in mock mode for all phone verifications
   * When OTP_MODE=mock, this OTP is accepted for any phone number
   * Useful for development and testing
   */
  static MOCK_OTP = '123456';

  /**
   * Generate a random 6-digit OTP
   * ✅ MOCK MODE: Returns '123456' for all calls
   * 
   * @returns {string} - 6-digit OTP (e.g., "123456")
   */
  static generateOTP() {
    // ✅ MOCK OTP: Return fixed OTP in mock mode
    if (this.CONFIG.MODE === 'mock') {
      return this.MOCK_OTP; // Always return '123456' in mock mode
    }

    // 🔴 REAL OTP: Generate random 6-digit OTP
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    return otp;
  }

  /**
   * Create and store OTP for phone number
   * ✅ MOCK MODE: Stores '123456' and logs to console
   * 
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} otpType - Type of OTP (signup, login, verification)
   * @returns {Promise<Object>} - { otp, expiresAt, phoneNumber }
   */
  static async generateAndStoreOTP(phoneNumber, otpType = 'login') {
    try {
      // Generate OTP (mock or real based on OTP_MODE)
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);

      // ✅ MOCK MODE: Log mock OTP to console for development
      if (this.CONFIG.MODE === 'mock') {
        console.log(`\n${'━'.repeat(60)}`);
        console.log(`🔐 MOCK OTP ENABLED`);
        console.log(`📱 Mock OTP for ${phoneNumber} is: ${otp}`);
        console.log(`⏱️  Expires in ${this.CONFIG.OTP_EXPIRY_MINUTES} minutes`);
        console.log(`💡 Enter "${otp}" to verify the phone number`);
        console.log(`${'━'.repeat(60)}\n`);
      }

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

      console.log(`✅ OTP generated for ${phoneNumber} (Type: ${otpType}, Mode: ${this.CONFIG.MODE})`);

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
   * ✅ MOCK MODE: Accepts '123456' for any phone number
   * 
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} enteredOTP - OTP entered by user
   * @returns {Promise<Object>} - { success: boolean, message: string, remainingAttempts: number }
   */
  static async verifyOTP(phoneNumber, enteredOTP) {
    try {
      const cleanedEnteredOTP = String(enteredOTP).trim();

      // ✅ MOCK MODE: Accept '123456' for any phone number
      if (this.CONFIG.MODE === 'mock') {
        if (cleanedEnteredOTP === this.MOCK_OTP) {
          console.log(`✅ MOCK OTP verified successfully for ${phoneNumber}`);
          
          // Still ensure OTP record exists and delete it (for consistency)
          await pool.execute('DELETE FROM otp_codes WHERE phone_number = ?', [phoneNumber]);
          
          // Mark phone as verified in users table
          await pool.execute(
            'UPDATE users SET phone_verified = true WHERE phone_number = ?',
            [phoneNumber]
          );

          return {
            success: true,
            message: 'Phone number verified successfully',
            remainingAttempts: this.CONFIG.MAX_ATTEMPTS,
            mode: 'mock'
          };
        } else {
          console.log(`❌ MOCK OTP verification failed for ${phoneNumber} - Expected: ${this.MOCK_OTP}, Got: ${cleanedEnteredOTP}`);
          return {
            success: false,
            message: `Incorrect OTP. Please enter '${this.MOCK_OTP}' to verify.`,
            remainingAttempts: 5,
            mode: 'mock'
          };
        }
      }

      // 🔴 REAL MODE: Standard OTP verification against database
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
  static async canResendOTP(phoneNumber) {
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
  static async getOTPStatus(phoneNumber) {
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
  static async deleteOTP(phoneNumber) {
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
  static async cleanupExpiredOTPs() {
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
  static async getOTPTimeRemaining(phoneNumber) {
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
   * ✅ UTILITY: Get current OTP mode
   * @returns {string} - Current mode: "mock" or "real"
   */
  static getMode() {
    return this.CONFIG.MODE;
  }

  /**
   * ✅ UTILITY: Check if running in mock mode
   * @returns {boolean} - true if OTP_MODE=mock
   */
  static isMockMode() {
    return this.CONFIG.MODE === 'mock';
  }

  /**
   * ✅ UTILITY: Get mock OTP value for testing/documentation
   * @returns {string} - The mock OTP ("123456")
   */
  static getMockOTPValue() {
    return this.MOCK_OTP;
  }

  /**
   * Send OTP via SMS
   * ✅ MOCK MODE: Just logs to console, doesn't send SMS
   * 🔴 REAL MODE: Placeholder for actual SMS provider integration
   * 
   * @param {string} phoneNumber - 10-digit phone number
   * @param {string} otp - OTP to send
   * @returns {Promise<Object>} - { success: boolean, messageId: string }
   */
  static async sendOTPViaSMS(phoneNumber, otp) {
    try {
      // ✅ MOCK MODE: Don't send SMS, just log
      if (this.CONFIG.MODE === 'mock') {
        console.log(`\n${'━'.repeat(60)}`);
        console.log(`📱 MOCK SMS MESSAGE (Not Sent)`);
        console.log(`To: ${phoneNumber}`);
        console.log(`Message: Your Sundate verification code is ${otp}`);
        console.log(`Expires in: ${this.CONFIG.OTP_EXPIRY_MINUTES} minutes`);
        console.log(`${'━'.repeat(60)}\n`);

        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phoneNumber,
          otp,
          mode: 'mock',
          note: 'Mock mode - SMS not actually sent'
        };
      }

      // 🔴 REAL MODE: Integrate with SMS provider here
      // Example providers: Twilio, SendGrid, AWS SNS, etc.
      // TODO: Replace this with actual SMS sending logic
      console.log(`\n⚠️  REAL MODE - SMS Provider Not Configured`);
      console.log(`📱 SMS would be sent to ${phoneNumber}: Your verification code is ${otp}`);
      console.log(`⚠️  Please configure your SMS provider (Twilio, SendGrid, etc.)\n`);

      // For now, return success even in real mode (placeholder)
      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        phoneNumber,
        otp,
        mode: 'real',
        note: 'Real mode - SMS provider not configured yet'
      };
    } catch (error) {
      console.error('Error sending OTP via SMS:', error);
      throw error;
    }
  }
}

module.exports = OTPService;
