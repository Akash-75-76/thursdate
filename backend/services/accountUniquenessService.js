/**
 * Account Uniqueness Validation Service
 * Ensures one email, phone, linkedinId, and googleId correspond to only one user account
 */

const pool = require('../config/db');

class AccountUniquenessService {
  /**
   * Check if email already exists
   * @param {string} email - User email
   * @param {number} excludeUserId - Optional: exclude specific user ID (for updates)
   * @returns {Promise<{exists: boolean, userId: number|null, user: object|null}>}
   */
  static async checkEmailExists(email, excludeUserId = null) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      let query = 'SELECT id, email, onboarding_complete, account_status, approval FROM users WHERE LOWER(email) = ?';
      const params = [normalizedEmail];

      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }

      const [results] = await pool.execute(query, params);

      if (results.length > 0) {
        return {
          exists: true,
          userId: results[0].id,
          user: results[0],
        };
      }

      return {
        exists: false,
        userId: null,
        user: null,
      };
    } catch (err) {
      console.error('Error checking email existence:', err);
      throw new Error('Database error checking email');
    }
  }

  /**
   * Check if phone number already exists
   * @param {string} phoneNumber - User phone number
   * @param {number} excludeUserId - Optional: exclude specific user ID (for updates)
   * @returns {Promise<{exists: boolean, userId: number|null, user: object|null}>}
   */
  static async checkPhoneExists(phoneNumber, excludeUserId = null) {
    try {
      if (!phoneNumber) {
        return { exists: false, userId: null, user: null };
      }

      let query = 'SELECT id, phone_number, onboarding_complete, account_status, approval FROM users WHERE phone_number = ?';
      const params = [phoneNumber];

      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }

      const [results] = await pool.execute(query, params);

      if (results.length > 0) {
        return {
          exists: true,
          userId: results[0].id,
          user: results[0],
        };
      }

      return {
        exists: false,
        userId: null,
        user: null,
      };
    } catch (err) {
      console.error('Error checking phone existence:', err);
      throw new Error('Database error checking phone');
    }
  }

  /**
   * Check if LinkedIn ID already exists
   * @param {string} linkedinId - LinkedIn OAuth ID
   * @param {number} excludeUserId - Optional: exclude specific user ID (for updates)
   * @returns {Promise<{exists: boolean, userId: number|null, user: object|null}>}
   */
  static async checkLinkedinIdExists(linkedinId, excludeUserId = null) {
    try {
      if (!linkedinId) {
        return { exists: false, userId: null, user: null };
      }

      let query = 'SELECT id, linkedin_id, email, onboarding_complete, account_status FROM users WHERE linkedin_id = ?';
      const params = [linkedinId];

      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }

      const [results] = await pool.execute(query, params);

      if (results.length > 0) {
        return {
          exists: true,
          userId: results[0].id,
          user: results[0],
        };
      }

      return {
        exists: false,
        userId: null,
        user: null,
      };
    } catch (err) {
      console.error('Error checking LinkedIn ID existence:', err);
      throw new Error('Database error checking LinkedIn ID');
    }
  }

  /**
   * Check if Google ID already exists
   * @param {string} googleId - Google OAuth ID
   * @param {number} excludeUserId - Optional: exclude specific user ID (for updates)
   * @returns {Promise<{exists: boolean, userId: number|null, user: object|null}>}
   */
  static async checkGoogleIdExists(googleId, excludeUserId = null) {
    try {
      if (!googleId) {
        return { exists: false, userId: null, user: null };
      }

      let query = 'SELECT id, google_id, email, onboarding_complete, account_status FROM users WHERE google_id = ?';
      const params = [googleId];

      if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
      }

      const [results] = await pool.execute(query, params);

      if (results.length > 0) {
        return {
          exists: true,
          userId: results[0].id,
          user: results[0],
        };
      }

      return {
        exists: false,
        userId: null,
        user: null,
      };
    } catch (err) {
      console.error('Error checking Google ID existence:', err);
      throw new Error('Database error checking Google ID');
    }
  }

  /**
   * Validate signup data - check all uniqueness constraints
   * @param {object} data - Signup data { email?, phoneNumber?, linkedinId?, googleId? }
   * @returns {Promise<{valid: boolean, error: string|null, conflicts: object}>}
   */
  static async validateSignupData(data) {
    try {
      const conflicts = {};

      // Check email if provided
      if (data.email) {
        const emailCheck = await this.checkEmailExists(data.email);
        if (emailCheck.exists) {
          conflicts.email = {
            registered: true,
            userId: emailCheck.userId,
            message: 'This email is already registered.',
          };
        }
      }

      // Check phone if provided
      if (data.phoneNumber) {
        const phoneCheck = await this.checkPhoneExists(data.phoneNumber);
        if (phoneCheck.exists) {
          conflicts.phoneNumber = {
            registered: true,
            userId: phoneCheck.userId,
            message: 'This phone number is already registered.',
          };
        }
      }

      // Check LinkedIn ID if provided
      if (data.linkedinId) {
        const linkedinCheck = await this.checkLinkedinIdExists(data.linkedinId);
        if (linkedinCheck.exists) {
          conflicts.linkedinId = {
            registered: true,
            userId: linkedinCheck.userId,
            message: 'This LinkedIn account is already linked to another user.',
          };
        }
      }

      // Check Google ID if provided
      if (data.googleId) {
        const googleCheck = await this.checkGoogleIdExists(data.googleId);
        if (googleCheck.exists) {
          conflicts.googleId = {
            registered: true,
            userId: googleCheck.userId,
            message: 'This Google account is already linked to another user.',
          };
        }
      }

      if (Object.keys(conflicts).length > 0) {
        const conflictKeys = Object.keys(conflicts);
        const primaryConflict = conflictKeys[0];
        
        return {
          valid: false,
          error: conflicts[primaryConflict].message + ' Please login instead.',
          conflicts,
        };
      }

      return {
        valid: true,
        error: null,
        conflicts: {},
      };
    } catch (err) {
      console.error('Error validating signup data:', err);
      throw new Error('Validation error');
    }
  }

  /**
   * Get user by any identifier (email, phone, linkedinId, googleId)
   * Used for login/authentication flow
   * @param {object} identifiers - { email?, phoneNumber?, linkedinId?, googleId? }
   * @returns {Promise<object|null>}
   */
  static async getUserByIdentifier(identifiers) {
    try {
      let query = 'SELECT * FROM users WHERE ';
      const params = [];
      const conditions = [];

      if (identifiers.email) {
        conditions.push('LOWER(email) = LOWER(?)');
        params.push(identifiers.email);
      }

      if (identifiers.phoneNumber) {
        conditions.push('phone_number = ?');
        params.push(identifiers.phoneNumber);
      }

      if (identifiers.linkedinId) {
        conditions.push('linkedin_id = ?');
        params.push(identifiers.linkedinId);
      }

      if (identifiers.googleId) {
        conditions.push('google_id = ?');
        params.push(identifiers.googleId);
      }

      if (conditions.length === 0) {
        return null;
      }

      query += conditions.join(' OR ');

      const [results] = await pool.execute(query, params);

      return results.length > 0 ? results[0] : null;
    } catch (err) {
      console.error('Error getting user by identifier:', err);
      throw new Error('Database error');
    }
  }

  /**
   * Get user redirect path based on account status
   * @param {object} user - User object from database
   * @returns {string} - Redirect path based on account status
   */
  static getUserRedirectPath(user) {
    // Handle edge cases based on account status
    if (!user.onboarding_complete) {
      return '/onboarding';
    }

    switch (user.account_status) {
      case 'under_review':
        return '/under-review';
      case 'rejected':
        return '/profile-rejected';
      case 'approved':
        return '/dashboard';
      case 'suspended':
        return '/account-suspended';
      default:
        return '/dashboard';
    }
  }

  /**
   * Get comprehensive user status for frontend routing
   * @param {object} user - User object from database
   * @returns {object} - Status information for frontend
   */
  static getUserStatus(user) {
    return {
      userId: user.id,
      email: user.email,
      phoneNumber: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      onboardingComplete: user.onboarding_complete,
      onboardingCurrentStep: user.onboarding_current_step || 1,
      accountStatus: user.account_status,
      approval: user.approval,
      redirectPath: this.getUserRedirectPath(user),
      requiresAction: this.userRequiresAction(user),
    };
  }

  /**
   * Check if user requires immediate action
   * @param {object} user - User object from database
   * @returns {boolean}
   */
  static userRequiresAction(user) {
    if (!user.onboarding_complete) return true;
    if (user.account_status === 'under_review') return true;
    if (user.account_status === 'rejected') return true;
    if (user.account_status === 'suspended') return true;
    return false;
  }
}

module.exports = AccountUniquenessService;
