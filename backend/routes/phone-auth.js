// backend/routes/phone-auth.js
// Phone number authentication routes
// Handles: OTP generation, verification, phone-based login/signup

const express = require('express');
const router = express.Router();
const phoneValidator = require('../utils/phoneValidator');
const phoneAuthService = require('../services/phoneAuthService');
const OTPService = require('../services/otpService');

// ============= ROUTE HANDLERS =============

/**
 * POST /api/phone-auth/send-otp
 * Generate and send OTP to phone number
 * 
 * Request body:
 * {
 *   "phoneNumber": "5551234567" or "(555) 123-4567",
 *   "otpType": "login" | "signup" | "verification" (default: "login")
 * }
 * 
 * Response: { success: boolean, message: string, expiresIn: number (seconds) }
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber, otpType = 'login' } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format
    const validation = phoneValidator.validatePhone(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const cleanedPhone = validation.cleaned;

    // Check resend cooldown
    const { allowed, secondsRemaining } = await OTPService.canResendOTP(cleanedPhone);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'} before requesting a new OTP`,
        retryAfter: secondsRemaining
      });
    }

    // Generate and store OTP
    const otpResult = await OTPService.generateAndStoreOTP(cleanedPhone, otpType);

    // Send OTP via SMS
    await OTPService.sendOTPViaSMS(cleanedPhone, otpResult.otp);

    console.log(`📱 OTP sent to ${phoneValidator.formatPhoneDisplay(cleanedPhone)}`);

    // Return response (OTP is returned for development/testing only - remove in production)
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${phoneValidator.formatPhoneDisplay(cleanedPhone)}`,
      expiresIn: otpResult.ttl_minutes * 60, // seconds
      maskedPhone: phoneValidator.maskPhoneNumber(cleanedPhone),
      // Remove in production: otp: otpResult.otp
    });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/phone-auth/verify-otp
 * Verify OTP and authenticate user (login/signup)
 * 
 * Request body:
 * {
 *   "phoneNumber": "5551234567",
 *   "otp": "123456"
 * }
 * 
 * Response: { success: boolean, token: string, user: {...}, redirectPath: string }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    // Validate inputs
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Validate and clean phone number
    const validation = phoneValidator.validatePhone(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const cleanedPhone = validation.cleaned;

    // Verify OTP
    const verifyResult = await OTPService.verifyOTP(cleanedPhone, otp);

    if (!verifyResult.success) {
      return res.status(401).json({
        success: false,
        message: verifyResult.message,
        remainingAttempts: verifyResult.remainingAttempts
      });
    }

    // Authenticate user (create new or retrieve existing)
    const authResult = await phoneAuthService.authenticatePhone(cleanedPhone);

    console.log(`✅ User authenticated: ${cleanedPhone}`);

    // Set HTTP-only cookies for security
    res.cookie('authToken', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return response with token
    return res.status(200).json({
      success: true,
      message: authResult.isNewUser ? 'Account created successfully' : 'Logged in successfully',
      token: authResult.token,
      userId: authResult.userId,  // ✅ ADD userId to response
      user: authResult.user,
      isNewUser: authResult.isNewUser,
      userStatus: authResult.userStatus,
      redirectPath: authResult.redirectPath
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/phone-auth/resend-otp
 * Resend OTP to phone number (respects cooldown)
 * 
 * Request body:
 * {
 *   "phoneNumber": "5551234567"
 * }
 * 
 * Response: { success: boolean, message: string, expiresIn: number }
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format
    const validation = phoneValidator.validatePhone(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const cleanedPhone = validation.cleaned;

    // Check resend cooldown
    const { allowed, secondsRemaining } = await OTPService.canResendOTP(cleanedPhone);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'} before requesting OTP again`,
        retryAfter: secondsRemaining
      });
    }

    // Get current OTP status
    const status = await OTPService.getOTPStatus(cleanedPhone);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'No pending OTP request. Please request a new one.'
      });
    }

    // Generate new OTP
    const otpResult = await OTPService.generateAndStoreOTP(cleanedPhone, status.otpType);

    // Send new OTP via SMS
    await OTPService.sendOTPViaSMS(cleanedPhone, otpResult.otp);

    console.log(`📱 OTP resent to ${phoneValidator.formatPhoneDisplay(cleanedPhone)}`);

    return res.status(200).json({
      success: true,
      message: `New verification code sent to ${phoneValidator.formatPhoneDisplay(cleanedPhone)}`,
      expiresIn: otpResult.ttl_minutes * 60
    });
  } catch (error) {
    console.error('Error in resend-otp:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resending OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/phone-auth/check-phone
 * Check if phone number is available (for signup validation)
 * 
 * Request body:
 * {
 *   "phoneNumber": "5551234567"
 * }
 * 
 * Response: { available: boolean, message: string }
 */
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format
    const validation = phoneValidator.validatePhone(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const cleanedPhone = validation.cleaned;

    // Check phone availability
    const available = await phoneAuthService.isPhoneAvailable(cleanedPhone);

    return res.status(200).json({
      success: true,
      available,
      message: available 
        ? 'Phone number is available' 
        : 'An account already exists with this phone number'
    });
  } catch (error) {
    console.error('Error in check-phone:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking phone number. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/phone-auth/otp-status/:phoneNumber
 * Get current OTP status for a phone number (for frontend UI)
 * 
 * Response: { status: {...} | null, timeRemaining: number }
 */
router.get('/otp-status/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate and clean phone number
    const validation = phoneValidator.validatePhone(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const cleanedPhone = validation.cleaned;

    // Get OTP status
    const status = await OTPService.getOTPStatus(cleanedPhone);
    const timeRemaining = await OTPService.getOTPTimeRemaining(cleanedPhone);

    return res.status(200).json({
      success: true,
      status,
      timeRemaining: Math.max(0, timeRemaining)
    });
  } catch (error) {
    console.error('Error in otp-status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting OTP status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/phone-auth/validate-phone
 * Validate phone number format (client-side utility endpoint)
 * 
 * Request body:
 * {
 *   "phoneNumber": "5551234567" or "(555) 123-4567"
 * }
 * 
 * Response: { valid: boolean, cleaned: string, formatted: string, error: string }
 */
router.post('/validate-phone', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const validation = phoneValidator.validatePhone(phoneNumber);

    return res.status(200).json({
      success: true,
      valid: validation.valid,
      cleaned: validation.cleaned,
      formatted: validation.cleaned ? phoneValidator.formatPhoneDisplay(validation.cleaned) : null,
      error: validation.error
    });
  } catch (error) {
    console.error('Error in validate-phone:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating phone number',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============= EXPORTS =============

module.exports = router;
