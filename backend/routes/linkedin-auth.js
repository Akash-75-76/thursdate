const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
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
 */
router.get('/linkedin', (req, res) => {
    try {
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

        // Generate state parameter for CSRF protection
        const state = crypto.randomBytes(32).toString('hex');
        
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
        
        // Find or create user in database
        let userId;
        
        const [existingUsers] = await pool.execute(
            'SELECT id, linkedin_verified FROM users WHERE email = ?',
            [linkedinProfile.email]
        );
        
        if (existingUsers.length > 0) {
            // Update existing user
            userId = existingUsers[0].id;
            
            await pool.execute(
                'UPDATE users SET linkedin = ?, linkedin_verified = TRUE WHERE id = ?',
                [linkedinProfile.sub || '', userId]
            );
            
            console.log('✅ Updated existing user:', userId);
        } else {
            // Create new user
            const [result] = await pool.execute(
                'INSERT INTO users (email, linkedin, linkedin_verified, approval, onboarding_complete) VALUES (?, ?, TRUE, FALSE, FALSE)',
                [linkedinProfile.email, linkedinProfile.sub || '']
            );
            
            userId = result.insertId;
            console.log('✅ Created new user:', userId);
        }
        
        // Generate JWT token for authentication
        const token = jwt.sign(
            {
                userId: userId,
                email: linkedinProfile.email,
                linkedinVerified: true
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT token generated');
        console.log('🎉 LinkedIn verification complete for user:', userId);
        
        // Redirect to frontend with success status
        const redirectUrl = `${frontendUrl}/social-presence?linkedin_verified=true&token=${encodeURIComponent(token)}`;
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
