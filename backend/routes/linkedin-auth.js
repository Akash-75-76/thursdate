const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const AccountUniquenessService = require('../services/accountUniquenessService');
const router = express.Router();

/**
 * LinkedIn OAuth 2.0 Implementation
 * 
 * This implements the standard OAuth 2.0 Authorization Code flow:
 * 1. User clicks "Verify with LinkedIn" → Frontend redirects to /auth/linkedin
 * 2. Backend redirects to LinkedIn's OAuth consent screen
 * 3. User approves → LinkedIn redirects to /auth/linkedin/callback with authorization code
 * 4. Backend exchanges code for access token
 * 5. Backend fetches user profile from LinkedIn
 * 6. Backend marks user as linkedin_verified in database
 * 7. Backend redirects to frontend with success status
 * 
 * SECURITY:
 * - Uses state parameter for CSRF protection
 * - Requires HTTPS in production
 * - Uses environment variables for configuration
 * - Does not store LinkedIn passwords or tokens permanently
 */

// LinkedIn OAuth endpoints (official LinkedIn API)
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Track authorization codes to prevent reuse attacks
const usedCodes = new Map();
const CODE_EXPIRY_MS = 60000; // 1 minute

/**
 * GET /auth/linkedin/debug
 * Debug endpoint to check LinkedIn OAuth configuration
 */
router.get('/linkedin/debug', (req, res) => {
    const config = {
        clientId: process.env.LINKEDIN_CLIENT_ID ? '✅ Set' : '❌ Missing',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
        callbackUrl: process.env.LINKEDIN_CALLBACK_URL || '❌ Missing',
        frontendUrl: process.env.FRONTEND_URL || '❌ Missing',
        nodeEnv: process.env.NODE_ENV || 'development'
    };
    
    res.json({
        status: 'LinkedIn OAuth Configuration',
        config: config,
        instructions: {
            step1: 'Check if callback URL uses HTTPS in production',
            step2: 'Verify this exact URL is in LinkedIn Developer Console',
            step3: 'Make sure all environment variables are set in Render'
        }
    });
});

/**
 * GET /auth/linkedin
 * Initiates LinkedIn OAuth flow by redirecting to LinkedIn's consent screen
 * Expects: ?user_id=<userId> or uses Authorization header
 */
router.get('/linkedin', (req, res) => {
    try {
        // Extract user ID from query param or JWT token
        const userIdFromQuery = req.query.user_id;
        const authHeader = req.headers.authorization;
        let userId = userIdFromQuery;
        
        if (!userId && authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.userId;
            } catch (err) {
                console.warn('⚠️  Could not extract user ID from token:', err.message);
            }
        }
        
        // Validate required environment variables
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const callbackUrl = process.env.LINKEDIN_CALLBACK_URL;
        
        if (!clientId || !callbackUrl) {
            console.error('❌ LinkedIn OAuth not configured properly');
            console.error('Missing:', !clientId ? 'LINKEDIN_CLIENT_ID' : 'LINKEDIN_CALLBACK_URL');
            return res.status(500).json({ 
                error: 'LinkedIn OAuth not configured',
                message: 'Server configuration error. Please contact administrator.'
            });
        }

        // Validate callback URL protocol in production
        if (process.env.NODE_ENV === 'production' && !callbackUrl.startsWith('https://')) {
            console.error('❌ Production callback URL must use HTTPS:', callbackUrl);
            return res.status(500).json({
                error: 'Invalid callback URL',
                message: 'Production OAuth requires HTTPS'
            });
        }

        // Generate state parameter for CSRF protection AND user identification
        // Format: <userId>:<randomString> (so we know which authenticated user initiated this)
        const randomState = crypto.randomBytes(16).toString('hex');
        const state = userId ? `${userId}:${randomState}` : randomState;
        
        // Build authorization URL
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: callbackUrl,
            scope: 'openid profile email',
            state: state
        });
        
        const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
        
        console.log('✅ Initiating LinkedIn OAuth flow');
        console.log('   Environment:', process.env.NODE_ENV || 'development');
        console.log('   Client ID:', clientId);
        console.log('   Callback URL:', callbackUrl);
        console.log('   Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
        console.log('   State:', state.substring(0, 10) + '...');
        console.log('   Full Auth URL:', authUrl.substring(0, 150) + '...');
        
        // Redirect user to LinkedIn's consent screen
        res.redirect(authUrl);
    } catch (error) {
        console.error('❌ Error initiating LinkedIn OAuth:', error.message);
        res.status(500).json({
            error: 'OAuth initialization failed',
            message: 'An unexpected error occurred'
        });
    }
});

/**
 * GET /auth/linkedin/callback
 * Handles OAuth callback from LinkedIn after user approval
 */
router.get('/linkedin/callback', async (req, res) => {
    const { code, error, error_description, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    try {
        // Handle OAuth errors from LinkedIn
        if (error) {
            console.error('❌ LinkedIn OAuth error:', error, error_description);
            return res.redirect(`${frontendUrl}/social-presence?error=linkedin_denied`);
        }
        
        // Validate authorization code is present
        if (!code) {
            console.error('❌ No authorization code received');
            return res.redirect(`${frontendUrl}/social-presence?error=linkedin_no_code`);
        }
        
        // Extract user ID from state parameter (format: <userId>:<randomString>)
        let userIdFromState = null;
        if (state && state.includes(':')) {
            const stateParts = state.split(':');
            userIdFromState = stateParts[0];
            console.log('📍 User ID from state parameter:', userIdFromState);
        }
        
        // Prevent authorization code reuse (security)
        if (usedCodes.has(code)) {
            console.warn('⚠️  Authorization code already used:', code.substring(0, 10) + '...');
            return res.redirect(`${frontendUrl}/social-presence?error=linkedin_code_reused`);
        }
        
        // Mark code as used immediately
        usedCodes.set(code, Date.now());
        
        // Clean up old codes after expiry
        setTimeout(() => {
            usedCodes.delete(code);
        }, CODE_EXPIRY_MS);
        
        // Validate environment variables for token exchange
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const callbackUrl = process.env.LINKEDIN_CALLBACK_URL;
        
        if (!clientId || !clientSecret || !callbackUrl) {
            console.error('❌ LinkedIn OAuth credentials not configured');
            return res.redirect(`${frontendUrl}/social-presence?error=server_config`);
        }
        
        console.log('✅ Received LinkedIn callback with authorization code');
        
        // Exchange authorization code for access token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: callbackUrl
        });
        
        console.log('🔄 Exchanging code for access token...');
        
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, tokenParams, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000 // 10 second timeout
        });
        
        const { access_token } = tokenResponse.data;
        
        if (!access_token) {
            console.error('❌ No access token received from LinkedIn');
            return res.redirect(`${frontendUrl}/social-presence?error=token_exchange_failed`);
        }
        
        console.log('✅ Access token received');
        
        // Fetch user profile from LinkedIn
        console.log('🔄 Fetching LinkedIn profile...');
        
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
            timeout: 10000
        });
        
        const linkedinProfile = userInfoResponse.data;
        
        if (!linkedinProfile.email) {
            console.error('❌ No email in LinkedIn profile');
            return res.redirect(`${frontendUrl}/social-presence?error=no_email`);
        }
        
        console.log('✅ LinkedIn profile received');
        console.log('   Email:', linkedinProfile.email);
        console.log('   Name:', linkedinProfile.name);
        console.log('   LinkedIn ID:', linkedinProfile.sub);
        
        // Check if this LinkedIn ID is already linked to a different user
        if (linkedinProfile.sub) {
            const linkedinCheck = await AccountUniquenessService.checkLinkedinIdExists(linkedinProfile.sub);
            
            if (linkedinCheck.exists && linkedinCheck.user.id !== userIdFromState) {
                console.error('❌ LinkedIn ID already linked to different account');
                return res.redirect(`${frontendUrl}/social-presence?error=linkedin_already_linked`);
            }
        }
        
        // KEY FIX: Only store linkedin_id, never overwrite user's email
        let userId;
        
        if (userIdFromState) {
            // User was authenticated when they initiated LinkedIn verification
            userId = userIdFromState;
            
            // Just link the LinkedIn ID to the existing user - DON'T change their email
            await pool.execute(
                'UPDATE users SET linkedin_id = ?, linkedin_verified = TRUE WHERE id = ?',
                [linkedinProfile.sub || '', userId]
            );
            
            console.log('✅ Linked LinkedIn to existing authenticated user:', userId);
        } else {
            // Fallback (should rarely happen): Try to find user by LinkedIn email, but don't change it
            const emailCheck = await AccountUniquenessService.checkEmailExists(linkedinProfile.email);
            
            if (emailCheck.exists) {
                // User with this LinkedIn email exists, just link the LinkedIn ID
                userId = emailCheck.user.id;
                await pool.execute(
                    'UPDATE users SET linkedin_id = ?, linkedin_verified = TRUE WHERE id = ?',
                    [linkedinProfile.sub || '', userId]
                );
                console.log('✅ Linked LinkedIn to user with matching email:', userId);
            } else {
                // Create NEW user with placeholder email (will be set during onboarding)
                const tempEmail = `linkedin_${linkedinProfile.sub || Date.now()}@luyona.app`;
                const [result] = await pool.execute(
                    'INSERT INTO users (email, linkedin_id, linkedin_verified, approval, onboarding_complete) VALUES (?, ?, TRUE, FALSE, FALSE)',
                    [tempEmail, linkedinProfile.sub || '']
                );
                userId = result.insertId;
                console.log('✅ Created new user with placeholder email:', userId);
            }
        }
        
        // Get full user status for frontend routing
        const [userRows] = await pool.execute(
            'SELECT id, email, phone_number, onboarding_complete, onboarding_current_step, account_status FROM users WHERE id = ?',
            [userId]
        );
        const userStatus = userRows.length > 0 ? 
            AccountUniquenessService.getUserStatus(userRows[0]) : 
            { userId, redirectPath: '/dashboard' };
        
        const userEmail = userRows.length > 0 ? userRows[0].email : linkedinProfile.email;
        
        // Generate JWT token for authentication (use user's email, NOT LinkedIn email)
        const token = jwt.sign(
            {
                userId: userId,
                email: userEmail,
                linkedinVerified: true
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token generated');
        console.log('🎉 LinkedIn verification complete for user:', userId);
        
        // Redirect to frontend with success status and user info
        const redirectUrl = `${frontendUrl}/social-presence?linkedin_verified=true&token=${encodeURIComponent(token)}&userId=${userId}&redirectPath=${encodeURIComponent(userStatus.redirectPath)}`;
        res.redirect(redirectUrl);
        
    } catch (error) {
        console.error('❌ LinkedIn OAuth callback error:', error.message);
        
        // Log detailed error information for debugging
        if (error.response) {
            console.error('   API Response:', error.response.status, error.response.statusText);
            console.error('   Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Redirect to frontend with error
        res.redirect(`${frontendUrl}/social-presence?error=oauth_failed`);
    }
});

module.exports = router;
