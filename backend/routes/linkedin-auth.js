const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const router = express.Router();

// LinkedIn OAuth endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Track used authorization codes to prevent double-use
const usedCodes = new Set();
const CODE_EXPIRY_MS = 60000; // 1 minute

// PKCE storage (code_verifier per state)
const pkceStore = new Map();

// Generate PKCE challenge
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
    return crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url');
}

// Initiate OAuth flow
router.get('/linkedin', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log('\n========================================');
    console.log('🔄 STEP 1: Initiating LinkedIn OAuth flow');
    console.log('Timestamp:', timestamp);
    console.log('Client ID:', process.env.LINKEDIN_CLIENT_ID);
    console.log('Callback URL:', process.env.LINKEDIN_CALLBACK_URL);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('========================================\n');
    
    // Validate environment variables
    if (!process.env.LINKEDIN_CLIENT_ID) {
        console.error('❌ LINKEDIN_CLIENT_ID not set!');
        return res.status(500).json({ error: 'LinkedIn OAuth not configured', message: 'LINKEDIN_CLIENT_ID is missing' });
    }
    if (!process.env.LINKEDIN_CALLBACK_URL) {
        console.error('❌ LINKEDIN_CALLBACK_URL not set!');
        return res.status(500).json({ error: 'LinkedIn OAuth not configured', message: 'LINKEDIN_CALLBACK_URL is missing' });
    }
    
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL;
    
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store code_verifier with state for later retrieval
    pkceStore.set(state, codeVerifier);
    setTimeout(() => {
        pkceStore.delete(state);
        console.log(`🗑️  Cleaned up PKCE state ${state}`);
    }, CODE_EXPIRY_MS);
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });
    
    const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
    console.log('🔗 Full Authorization URL:', authUrl);
    console.log('📍 Exact redirect_uri sent to LinkedIn:', redirectUri);
    console.log('🔐 PKCE enabled - code_challenge:', codeChallenge.substring(0, 20) + '...');
    console.log('🔑 State:', state);
    res.redirect(authUrl);
});

// OAuth callback handler
router.get('/linkedin/callback', async (req, res) => {
    const callbackTime = new Date();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log('\n========================================');
    console.log(`📥 STEP 2: LinkedIn Callback [${requestId}]`);
    console.log('Timestamp:', callbackTime.toISOString());
    console.log('All Query Params:', JSON.stringify(req.query, null, 2));
    console.log('Request Headers:', JSON.stringify({
        'user-agent': req.headers['user-agent'],
        'referer': req.headers['referer']
    }, null, 2));
    console.log('========================================\n');
    
    const { code, error, state } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL;
    
    // Retrieve code_verifier from PKCE store
    const codeVerifier = pkceStore.get(state);
    if (!codeVerifier) {
        console.error('❌ No code_verifier found for state:', state);
        console.error('State may have expired or is invalid');
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_state_invalid`);
    }
    console.log('🔐 Retrieved code_verifier for state:', state);
    
    // Validate environment variables
    if (!redirectUri) {
        console.error('❌ CRITICAL: LINKEDIN_CALLBACK_URL not set!');
        return res.status(500).send('Server configuration error: LINKEDIN_CALLBACK_URL not set');
    }
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        console.error('❌ CRITICAL: LinkedIn credentials not set!');
        return res.status(500).send('Server configuration error: LinkedIn credentials missing');
    }
    
    console.log('📍 Exact redirect_uri to use in token exchange:', redirectUri);
    console.log('🏠 Frontend URL for final redirect:', frontendUrl);
    console.log('🕐 State parameter from auth flow:', state);
    
    if (error) {
        console.error('❌ LinkedIn OAuth error:', error);
        console.error('Error description:', req.query.error_description);
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_auth_failed`);
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_no_code`);
    }
    
    const codePrefix = code.substring(0, 15);
    console.log('📝 Authorization code prefix:', codePrefix + '...');
    
    // Check if code was already used (prevent double-processing)
    if (usedCodes.has(code)) {
        console.warn(`⚠️  [${requestId}] Authorization code ${codePrefix}... already used`);
        console.warn('This is a duplicate request - returning cached success response');
        return res.redirect(`${frontendUrl}/social-presence?linkedin_verified=true&status=already_processed`);
    }
    
    // Mark code as used immediately
    console.log(`✅ [${requestId}] Marking code ${codePrefix}... as USED`);
    usedCodes.add(code);
    setTimeout(() => {
        usedCodes.delete(code);
        console.log(`🗑️  Cleaned up code ${codePrefix}... from cache`);
    }, CODE_EXPIRY_MS);
    
    console.log(`⏱️  [${requestId}] Starting token exchange NOW...`);
    
    try {
        // Exchange code for access token
        console.log('\n========================================');
        console.log(`🔄 STEP 3: Token Exchange [${requestId}]`);
        console.log('========================================\n');
        
        // CRITICAL: Use EXACT same redirect_uri as in authorization request
        const tokenExchangeParams = {
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: redirectUri, // Use the exact same variable
            code_verifier: codeVerifier // PKCE verification
        };
        
        console.log('📤 Token Exchange Parameters:');
        console.log('  - grant_type:', tokenExchangeParams.grant_type);
        console.log('  - code:', codePrefix + '... (length: ' + code.length + ')');
        console.log('  - client_id:', tokenExchangeParams.client_id);
        console.log('  - client_secret:', '***' + process.env.LINKEDIN_CLIENT_SECRET?.slice(-4));
        console.log('  - redirect_uri:', tokenExchangeParams.redirect_uri);
        console.log('  - code_verifier:', codeVerifier.substring(0, 20) + '...');
        console.log('\n🔍 Redirect URI Match Check:');
        console.log('  Auth Request:  ', redirectUri);
        console.log('  Token Exchange:', tokenExchangeParams.redirect_uri);
        console.log('  Match:', redirectUri === tokenExchangeParams.redirect_uri ? '✅ YES' : '❌ NO');
        
        const formData = new URLSearchParams(tokenExchangeParams);
        
        console.log('\n📡 Sending POST to:', LINKEDIN_TOKEN_URL);
        const tokenStartTime = Date.now();
        
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000 // 15 second timeout
        });
        
        const tokenEndTime = Date.now();
        const { access_token } = tokenResponse.data;
        console.log(`✅ LinkedIn access token received (took ${tokenEndTime - tokenStartTime}ms)`);
        
        // Fetch user info using OpenID Connect userinfo endpoint
        console.log('🔄 Fetching LinkedIn user info...');
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
            timeout: 10000 // 10 second timeout
        });
        
        const userInfo = userInfoResponse.data;
        console.log('✅ LinkedIn user info received:', JSON.stringify(userInfo, null, 2));
        
        // Extract profile URL (LinkedIn provides this in the userinfo response)
        const profileUrl = userInfo.sub ? `https://www.linkedin.com/in/${userInfo.sub}` : '';
        console.log('📍 LinkedIn profile URL:', profileUrl);
        
        // Find or create user in database
        console.log('🔄 Checking database for existing user...');
        let userId;
        
        try {
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [userInfo.email]
            );
            
            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                console.log('✅ Found existing user:', userId);
                // Update LinkedIn info for existing user
                try {
                    await pool.execute(
                        'UPDATE users SET linkedin = ? WHERE id = ?',
                        [profileUrl, userId]
                    );
                    console.log('✅ Updated LinkedIn URL for existing user');
                } catch (updateError) {
                    console.error('❌ Failed to update LinkedIn URL:', updateError.message);
                    throw new Error(`DATABASE_UPDATE_FAILED: ${updateError.message}`);
                }
            } else {
                console.log('🔄 Creating new user...');
                // Create new user
                try {
                    const [result] = await pool.execute(
                        'INSERT INTO users (email, linkedin, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
                        [userInfo.email, profileUrl, false, false]
                    );
                    userId = result.insertId;
                    console.log('✅ Created new user:', userId);
                } catch (insertError) {
                    console.error('❌ Failed to create user:', insertError.message);
                    throw new Error(`DATABASE_INSERT_FAILED: ${insertError.message}`);
                }
            }
        } catch (dbError) {
            console.error('❌ Database operation failed:', dbError.message);
            if (dbError.message.includes('DATABASE_')) {
                throw dbError;
            }
            throw new Error(`DATABASE_ERROR: ${dbError.message}`);
        }
        
        // Generate JWT token for your app with userId
        console.log('🔄 Generating JWT token...');
        const token = jwt.sign(
            { 
                userId: userId,
                linkedinId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                linkedinVerified: true 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        console.log('✅ JWT token generated');
        
        // Redirect with LinkedIn URL so frontend can display verification
        const redirectUrl = `${frontendUrl}/social-presence?linkedin_verified=true&token=${encodeURIComponent(token)}&linkedin_url=${encodeURIComponent(profileUrl)}`;
        console.log(`\n✅ [${requestId}] SUCCESS - OAuth flow completed`);
        console.log('🔄 Redirecting to:', redirectUrl.substring(0, 150) + '...\n');
        console.log('========================================\n');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('\n========================================');
        console.error(`❌ STEP 3 FAILED [${requestId}]`);
        console.error('========================================\n');
        
        console.error('Error Type:', error.name);
        console.error('Error Message:', error.message);
        
        if (error.response) {
            console.error('\n📡 LinkedIn API Response:');
            console.error('  Status:', error.response.status, error.response.statusText);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 400 && error.response.data?.error === 'invalid_request') {
                console.error('\n💡 TROUBLESHOOTING - Invalid Request Error:');
                console.error('This usually means ONE of the following:\n');
                console.error('  1️⃣  REDIRECT_URI MISMATCH');
                console.error('      - LinkedIn Developer Console:', '(check your app settings)');
                console.error('      - Environment Variable:', redirectUri);
                console.error('      - They must match EXACTLY (including trailing slashes, http/https)\n');
                console.error('  2️⃣  AUTHORIZATION CODE EXPIRED');
                console.error('      - Codes expire in ~30 seconds');
                console.error('      - Time from callback to token exchange:', `${Date.now() - callbackTime.getTime()}ms\n`);
                console.error('  3️⃣  CODE ALREADY USED');
                console.error('      - Authorization codes are single-use only');
                console.error('      - This code:', codePrefix + '...\n');
                console.error('  4️⃣  EXTERNAL MEMBER BINDING');
                console.error('      - LinkedIn account may be linked to another app');
                console.error('      - Try with a different LinkedIn test account\n');
                console.error('Full error from LinkedIn:', error.response.data.error_description);
            }
            
            console.error('\n📤 What we sent to LinkedIn:');
            console.error('  URL:', LINKEDIN_TOKEN_URL);
            console.error('  grant_type: authorization_code');
            console.error('  code:', codePrefix + '... (length: ' + code.length + ')');
            console.error('  client_id:', process.env.LINKEDIN_CLIENT_ID);
            console.error('  redirect_uri:', redirectUri);
        } else if (error.request) {
            console.error('\n📡 No response from LinkedIn');
            console.error('Request was made but no response received');
            console.error('Check network connectivity');
        } else {
            console.error('\n⚠️  Error setting up the request');
            console.error(error.message);
        }
        
        console.error('\n========================================\n');
        res.redirect(`${frontendUrl}/social-presence?error=linkedin_callback_failed`);
    }
});

module.exports = router;
