const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const otpManager = require('../utils/otpManager');
const AccountUniquenessService = require('../services/accountUniquenessService');
const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Registration attempt for:', email);
    
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if email already exists using AccountUniquenessService
    const emailCheck = await AccountUniquenessService.checkEmailExists(email);
    if (emailCheck.exists) {
      console.log('❌ Email already registered:', email);
      return res.status(409).json({ 
        error: 'This email is already registered. Please login instead.',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with default approval and onboarding status set to false
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, false, false]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Get full user status for frontend routing
    const [userRows] = await pool.execute(
      'SELECT id, email, phone_number, onboarding_complete, onboarding_current_step, account_status FROM users WHERE id = ?',
      [result.insertId]
    );
    const userStatus = userRows.length > 0 ? 
      AccountUniquenessService.getUserStatus(userRows[0]) : 
      { userId: result.insertId, redirectPath: '/onboarding' };
    
    console.log('✅ User created successfully:', email);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      userId: result.insertId,
      user: userStatus,
      redirectPath: userStatus.redirectPath
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== EMAIL OTP ENDPOINTS =====

// Send Email OTP
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // ✅ FIX: Allow sending OTP for any email (signup or login)
    // The /verify-email-otp endpoint handles the logic for new vs existing users
    // This allows both new signups and existing user logins to work smoothly
    
    // Check rate limit
    const rateLimit = otpManager.checkRateLimit(email);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: `Too many requests. Please try again in ${rateLimit.waitTime} seconds.`,
        waitTime: rateLimit.waitTime
      });
    }
    
    // Check if can resend
    const canResend = otpManager.canResend(email);
    if (!canResend.allowed) {
      return res.status(429).json({ 
        error: `Please wait ${canResend.waitTime} seconds before requesting a new code.`,
        waitTime: canResend.waitTime
      });
    }
    
    // Generate OTP
    const otp = otpManager.generateOTP();
    
    // Send email
    const emailResult = await emailService.sendOTP(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
    
    // Store OTP
    otpManager.storeOTP(email, otp);
    
    console.log(`OTP sent to ${email}: ${otp} (dev mode)`);
    
    res.json({
      message: 'OTP sent successfully',
      remaining: rateLimit.remaining,
      // Only include OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
    
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('📥 Verify OTP Request:', { email, otp, type: typeof otp, length: otp?.length });
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Normalize OTP (trim whitespace, convert to string)
    const normalizedOTP = String(otp).trim();
    
    if (normalizedOTP.length !== 6) {
      return res.status(400).json({ error: 'OTP must be 6 digits' });
    }
    
    // Verify OTP
    const result = otpManager.verifyOTP(email, normalizedOTP);
    
    if (!result.valid) {
      return res.status(400).json({ 
        error: result.error,
        attemptsRemaining: result.attemptsRemaining
      });
    }
    
    // OTP verified successfully - now check/create user and generate token
    console.log(`Email verified successfully for: ${email}`);
    
    // Check if user exists using AccountUniquenessService
    const existingCheck = await AccountUniquenessService.checkEmailExists(email);
    
    let userId;
    let userData = {};
    let isNewUser = false;
    
    if (!existingCheck.exists) {
      // ✅ NEW USER - CREATE ACCOUNT
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
        [email, '', false, false] // Empty password for OTP-only users
      );
      userId = result.insertId;
      isNewUser = true;
      console.log(`✅ New user created via OTP: ${email} (ID: ${userId})`);
    } else {
      // ✅ EXISTING USER - LOGIN
      const user = existingCheck.user;
      userId = user.id;
      console.log(`✅ Existing user logged in via OTP: ${email} (ID: ${userId})`);
    }
    
    // Get full user status
    const [userRows] = await pool.execute(
      'SELECT id, email, phone_number, onboarding_complete, onboarding_current_step, account_status FROM users WHERE id = ?',
      [userId]
    );
    const userStatus = userRows.length > 0 ? 
      AccountUniquenessService.getUserStatus(userRows[0]) : 
      { userId, redirectPath: isNewUser ? '/onboarding' : '/dashboard' };
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      verified: true,
      token,
      userId,
      user: userStatus,
      redirectPath: userStatus.redirectPath,
      isNewUser
    });
    
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
});

// Resend Email OTP
router.post('/resend-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Check if can resend
    const canResend = otpManager.canResend(email);
    if (!canResend.allowed) {
      return res.status(429).json({ 
        error: `Please wait ${canResend.waitTime} seconds before requesting a new code.`,
        waitTime: canResend.waitTime
      });
    }
    
    // Check rate limit
    const rateLimit = otpManager.checkRateLimit(email);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: `Too many requests. Please try again in ${rateLimit.waitTime} seconds.`,
        waitTime: rateLimit.waitTime
      });
    }
    
    // Clear old OTP
    otpManager.clearOTP(email);
    
    // Generate new OTP
    const otp = otpManager.generateOTP();
    
    // Send email
    const emailResult = await emailService.sendOTP(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
    
    // Store new OTP
    otpManager.storeOTP(email, otp);
    
    console.log(`OTP resent to ${email}: ${otp} (dev mode)`);
    
    res.json({
      message: 'OTP resent successfully',
      remaining: rateLimit.remaining,
      // Only include OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
    
  } catch (error) {
    console.error('Resend email OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
});

// ===== END EMAIL OTP ENDPOINTS =====

// ===== SMS OTP ENDPOINTS (2factor.in) =====

// Store session IDs temporarily (maps mobile number to 2factor session ID)
const sessionStore = new Map();

// Send SMS OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber || mobileNumber.length < 10) {
      return res.status(400).json({ error: 'Valid mobile number is required' });
    }
    
    // Clean mobile number (remove any non-digits)
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      return res.status(400).json({ error: 'Mobile number must be 10 digits' });
    }
    
    // CHECK IF PHONE NUMBER EXISTS using AccountUniquenessService
    const phoneCheck = await AccountUniquenessService.checkPhoneExists(cleanNumber);
    const userExists = phoneCheck.exists;
    
    // Send OTP via 2factor.in
    const result = await smsService.sendOTP(cleanNumber);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Failed to send OTP' });
    }
    
    // Store session ID for verification
    sessionStore.set(cleanNumber, {
      sessionId: result.sessionId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      userExists // Store whether user already exists
    });
    
    console.log(`📱 OTP sent for: ${cleanNumber} (User exists: ${userExists})`);
    
    res.json({
      message: 'OTP sent successfully to your mobile number',
      success: true,
      userExists // Frontend can use this for UX (show "Login" vs "Signup" text)
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify SMS OTP endpoint - HANDLES SIGNUP/LOGIN WITH PHONE UNIQUENESS
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    
    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }
    
    // Clean mobile number
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }
    
    // Get session ID from store
    const sessionData = sessionStore.get(cleanNumber);
    
    if (!sessionData) {
      return res.status(400).json({ error: 'OTP session not found. Please request a new OTP.' });
    }
    
    // Check if session expired
    if (Date.now() > sessionData.expiresAt) {
      sessionStore.delete(cleanNumber);
      return res.status(400).json({ error: 'OTP session expired. Please request a new OTP.' });
    }
    
    // Verify OTP with 2factor.in
    const result = await smsService.verifyOTP(sessionData.sessionId, otp);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Invalid OTP' });
    }
    
    // OTP VERIFIED ✅ - NOW HANDLE SIGNUP VS LOGIN
    console.log(`✅ OTP verified for: ${cleanNumber}`);
    
    // Check if user exists using AccountUniquenessService
    const phoneCheck = await AccountUniquenessService.checkPhoneExists(cleanNumber);
    
    let userId;
    let userStatus;
    let isNewUser = false;
    
    if (!phoneCheck.exists) {
      // ✅ NO USER FOUND - CREATE NEW USER (SIGNUP)
      console.log(`📝 Creating new user with phone: ${cleanNumber}`);
      
      // Generate a temporary email since email is UNIQUE and required
      const tempEmail = `phone_${cleanNumber}_${Date.now()}@luyona.app`;
      
      const [insertResult] = await pool.execute(
        'INSERT INTO users (phone_number, email, password, phone_verified, approval, onboarding_complete, onboarding_current_step) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cleanNumber, tempEmail, '', true, false, false, 1]
      );
      
      userId = insertResult.insertId;
      isNewUser = true;
      
      console.log(`✅ New user created: ID ${userId}, Phone: ${cleanNumber}`);
    } else {
      // ✅ USER EXISTS - LOGIN FLOW
      userId = phoneCheck.user.id;
      
      console.log(`✅ Existing user logging in: ID ${userId}, Phone: ${cleanNumber}`);
      
      // Update phone_verified flag if not already set
      await pool.execute(
        'UPDATE users SET phone_verified = ? WHERE id = ?',
        [true, userId]
      );
    }
    
    // Clear session
    sessionStore.delete(cleanNumber);
    
    // Get full user status for routing
    const [userRows] = await pool.execute(
      'SELECT id, email, phone_number, onboarding_complete, onboarding_current_step, account_status FROM users WHERE id = ?',
      [userId]
    );
    userStatus = userRows.length > 0 ? 
      AccountUniquenessService.getUserStatus(userRows[0]) : 
      { userId, redirectPath: isNewUser ? '/onboarding' : '/dashboard' };
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, phoneNumber: cleanNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      verified: true,
      token,
      userId,
      user: userStatus,
      redirectPath: userStatus.redirectPath,
      isNewUser
    });
    
    console.log(`🎉 Auth complete for ${cleanNumber}: Status=${userStatus.accountStatus}, NewUser=${isNewUser}`);
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
});

// ===== END SMS OTP ENDPOINTS =====

// Delete account endpoint
router.delete('/account', auth, async (req, res) => {
  try {
    // Delete user from database
    await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
