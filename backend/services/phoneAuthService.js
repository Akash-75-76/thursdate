// backend/services/phoneAuthService.js
// Service for handling phone number based authentication
// Provides utilities for phone signup/login flow with unique phone number constraint

const pool = require('../config/db');
const jwt = require('jsonwebtoken');

class PhoneAuthService {
  /**
   * Check if phone number already exists in database
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object>} - User object if exists, null otherwise
   */
  async checkPhoneExists(phoneNumber) {
    try {
      const [users] = await pool.execute(
        'SELECT id, email, approval, onboarding_complete, onboarding_current_step FROM users WHERE phone_number = ?',
        [phoneNumber]
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error checking phone existence:', error);
      throw error;
    }
  }

  /**
   * Create new user with phone number (signup)
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object>} - New user object with id, email, approval status
   */
  async createUserWithPhone(phoneNumber) {
    try {
      // Check if phone already exists
      const existingUser = await this.checkPhoneExists(phoneNumber);
      if (existingUser) {
        throw new Error('Account already exists. Please login.');
      }

      // Generate temporary email for new user (since email is UNIQUE)
      const tempEmail = `phone_${phoneNumber}_${Date.now()}@luyona.app`;

      // Create user with phone number
      const [result] = await pool.execute(
        `INSERT INTO users 
         (phone_number, email, password, phone_verified, approval, onboarding_complete, onboarding_current_step) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [phoneNumber, tempEmail, '', true, false, false, 1]
      );

      console.log(`✅ New user created with phone: ${phoneNumber} (ID: ${result.insertId})`);

      return {
        id: result.insertId,
        email: tempEmail,
        phoneNumber,
        approval: false,
        onboardingComplete: false,
        onboardingCurrentStep: 1
      };
    } catch (error) {
      console.error('Error creating user with phone:', error);
      throw error;
    }
  }

  /**
   * Get user by phone number
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object>} - User object with all auth-related fields
   */
  async getUserByPhone(phoneNumber) {
    try {
      const [users] = await pool.execute(
        `SELECT id, email, phone_number, approval, onboarding_complete, 
                onboarding_current_step, phone_verified FROM users WHERE phone_number = ?`,
        [phoneNumber]
      );

      if (users.length === 0) {
        return null;
      }

      const user = users[0];
      return {
        id: user.id,
        email: user.email,
        phoneNumber: user.phone_number,
        approval: user.approval,
        onboardingComplete: user.onboarding_complete,
        onboardingCurrentStep: user.onboarding_current_step || 1,
        phoneVerified: user.phone_verified
      };
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  /**
   * Update phone verification status
   * @param {number} userId - User ID
   * @param {boolean} verified - Verification status
   */
  async updatePhoneVerified(userId, verified = true) {
    try {
      await pool.execute(
        'UPDATE users SET phone_verified = ? WHERE id = ?',
        [verified, userId]
      );
    } catch (error) {
      console.error('Error updating phone verification:', error);
      throw error;
    }
  }

  /**
   * Authenticate user or create new user with phone number
   * Returns: { userId, isNewUser, userData, token }
   * @param {string} phoneNumber - 10-digit phone number
   * @returns {Promise<Object>} - Auth result with token and user data
   */
  async authenticatePhone(phoneNumber) {
    try {
      let user = await this.checkPhoneExists(phoneNumber);
      let isNewUser = false;

      if (!user) {
        // NEW USER - Create account
        user = await this.createUserWithPhone(phoneNumber);
        isNewUser = true;
        console.log(`📝 New signup with phone: ${phoneNumber}`);
      } else {
        // EXISTING USER - Update verification status
        await this.updatePhoneVerified(user.id, true);
        console.log(`✅ Existing user login with phone: ${phoneNumber}`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Determine user status and redirect path
      const { userStatus, redirectPath } = this.getUserStatus(user, isNewUser);

      return {
        success: true,
        userId: user.id,
        isNewUser,
        token,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          approval: user.approval,
          onboardingComplete: user.onboardingComplete,
          onboardingCurrentStep: user.onboardingCurrentStep
        },
        userStatus,
        redirectPath
      };
    } catch (error) {
      console.error('Error in authenticatePhone:', error);
      throw error;
    }
  }

  /**
   * Determine user status and redirect path based on approval and onboarding
   * @param {Object} user - User object
   * @param {boolean} isNewUser - Is new signup
   * @returns {Object} - { userStatus, redirectPath }
   */
  getUserStatus(user, isNewUser) {
    // NEW USER - redirect to onboarding
    if (isNewUser) {
      return {
        userStatus: 'new_signup',
        redirectPath: '/onboarding/step/1'
      };
    }

    // EXISTING USER - handle approval states
    if (user.approval === false && !user.onboardingComplete) {
      return {
        userStatus: 'incomplete_onboarding',
        redirectPath: `/onboarding/step/${user.onboardingCurrentStep || 1}`
      };
    }

    if (user.approval === 'pending' || user.approval === 'review') {
      return {
        userStatus: 'under_review',
        redirectPath: '/review/status'
      };
    }

    if (user.approval === 'rejected') {
      return {
        userStatus: 'rejected',
        redirectPath: '/profile/edit'
      };
    }

    if (user.approval === true) {
      return {
        userStatus: 'approved',
        redirectPath: '/dashboard'
      };
    }

    // Default
    return {
      userStatus: 'active',
      redirectPath: '/dashboard'
    };
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} - True if valid 10-digit number
   */
  validatePhoneNumber(phoneNumber) {
    const cleaned = String(phoneNumber).replace(/\D/g, '');
    return cleaned.length === 10;
  }

  /**
   * Clean phone number (remove non-digits)
   * @param {string} phoneNumber - Phone number to clean
   * @returns {string} - Cleaned 10-digit number
   */
  cleanPhoneNumber(phoneNumber) {
    return String(phoneNumber).replace(/\D/g, '');
  }

  /**
   * Check if phone number is available (not registered)
   * @param {string} phoneNumber - 10-digit phone number to check
   * @returns {Promise<boolean>} - True if available, false if already registered
   */
  async isPhoneAvailable(phoneNumber) {
    try {
      const user = await this.checkPhoneExists(phoneNumber);
      return user === null;
    } catch (error) {
      console.error('Error checking phone availability:', error);
      throw error;
    }
  }

  /**
   * Get user status summary
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User status and flags
   */
  async getUserStatusSummary(userId) {
    try {
      const [users] = await pool.execute(
        `SELECT id, phone_number, approval, onboarding_complete, 
                onboarding_current_step, phone_verified FROM users WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return null;
      }

      const user = users[0];
      const { userStatus, redirectPath } = this.getUserStatus({
        approval: user.approval,
        onboardingComplete: user.onboarding_complete,
        onboardingCurrentStep: user.onboarding_current_step,
        phoneNumber: user.phone_number
      }, false);

      return {
        userId: user.id,
        phoneNumber: user.phone_number,
        phoneVerified: user.phone_verified,
        approved: user.approval === true,
        onboardingComplete: user.onboarding_complete,
        onboardingCurrentStep: user.onboarding_current_step,
        userStatus,
        redirectPath
      };
    } catch (error) {
      console.error('Error getting user status summary:', error);
      throw error;
    }
  }
}

module.exports = new PhoneAuthService();
