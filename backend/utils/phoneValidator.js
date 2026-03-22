// backend/utils/phoneValidator.js
// Phone number validation and formatting utilities

/**
 * Validate phone number with various format checks
 * @param {string} phoneNumber - Raw phone input
 * @returns {Object} - { valid: boolean, cleaned: string, error: string }
 */
function validatePhone(phoneNumber) {
  // Input validation
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      valid: false,
      cleaned: null,
      error: 'Phone number must be a non-empty string'
    };
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check length
  if (cleaned.length !== 10) {
    return {
      valid: false,
      cleaned: null,
      error: `Phone number must be exactly 10 digits. Got ${cleaned.length} digits.`
    };
  }

  // Check for all zeros or obviously fake numbers
  if (/^0+$/.test(cleaned)) {
    return {
      valid: false,
      cleaned: null,
      error: 'Phone number cannot be all zeros'
    };
  }

  // Check for obviously invalid patterns (e.g., 1-11-111-1111)
  if (/^1{10}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned: null,
      error: 'Phone number cannot be all the same digit'
    };
  }

  // Valid 10-digit US phone number
  return {
    valid: true,
    cleaned,
    error: null
  };
}

/**
 * Format phone number for display
 * @param {string} phoneNumber - 10-digit phone number
 * @returns {string} - Formatted as (XXX) XXX-XXXX
 */
function formatPhoneDisplay(phoneNumber) {
  const cleaned = String(phoneNumber).replace(/\D/g, '');
  if (cleaned.length !== 10) return phoneNumber;

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Check if phone number looks like a valid US number
 * @param {string} phoneNumber - Phone number to check
 * @returns {boolean} - True if valid
 */
function isValidUSPhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;

  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length !== 10) return false;

  // Check for invalid patterns
  if (/^([0-9])\1{9}$/.test(cleaned)) return false; // All same digit

  // Valid phone number
  return true;
}

/**
 * Get phone number without formatting
 * @param {string} phoneNumber - Any phone format
 * @returns {string} - 10-digit number or empty string if invalid
 */
function getCleanedPhone(phoneNumber) {
  if (!phoneNumber) return '';
  const cleaned = String(phoneNumber).replace(/\D/g, '');
  return cleaned.length === 10 ? cleaned : '';
}

/**
 * Check if two phone numbers are the same (accounting for formatting)
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} - True if same
 */
function phoneNumbersMatch(phone1, phone2) {
  const clean1 = String(phone1 || '').replace(/\D/g, '');
  const clean2 = String(phone2 || '').replace(/\D/g, '');
  return clean1 === clean2 && clean1.length === 10;
}

/**
 * Mask phone number for security (show last 4 digits only)
 * @param {string} phoneNumber - 10-digit phone number
 * @returns {string} - Masked format: (XXX) XXX-1234
 */
function maskPhoneNumber(phoneNumber) {
  const cleaned = String(phoneNumber || '').replace(/\D/g, '');
  if (cleaned.length !== 10) return '(XXX) XXX-XXXX';

  const lastFour = cleaned.slice(6);
  return `(XXX) XXX-${lastFour}`;
}

/**
 * Validate phone number for OTP/SMS compatibility
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
function validatePhoneForSMS(phoneNumber) {
  const validation = validatePhone(phoneNumber);

  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error
    };
  }

  // Additional checks for SMS compatibility
  const cleaned = validation.cleaned;

  // Check for common invalid area codes
  const areaCode = cleaned.slice(0, 3);

  // Invalid area codes: 0xx, 1xx
  if (areaCode[0] === '0' || areaCode === '1' + areaCode[1] + areaCode[2]) {
    return {
      valid: false,
      error: 'Invalid area code for SMS'
    };
  }

  return {
    valid: true,
    error: null
  };
}

module.exports = {
  validatePhone,
  formatPhoneDisplay,
  isValidUSPhone,
  getCleanedPhone,
  phoneNumbersMatch,
  maskPhoneNumber,
  validatePhoneForSMS
};
