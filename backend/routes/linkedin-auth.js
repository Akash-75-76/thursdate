const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

// LinkedIn OAuth endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Track used authorization codes to prevent double-use
const usedCodes = new Set();
const CODE_EXPIRY_MS = 60000; // 1 minute

// Initiate OAuth flow
router.get('/linkedin', (req, res) => {
    console.log('🔄 Initiating LinkedIn OAuth flow...');
    console.log('📍 Client ID:', process.env.LINKEDIN_CLIENT_ID);
    console.log('📍 Callback URL:', process.env.LINKEDIN_CALLBACK_URL);
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        scope: 'openid profile email'
    });
    
    const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
    console.log('🔗 Redirecting to:', authUrl);
    res.redirect(authUrl);
});

// OAuth callback handler
router.get('/linkedin/callback', async (req, res) => {
    const callbackTime = new Date();
    console.log('📥 LinkedIn callback received at:', callbackTime.toISOString());
    console.log('Query params:', req.query);
    
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log('🌐 Frontend URL:', frontendUrl);
    console.log('📍 Callback URL (from env):', process.env.LINKEDIN_CALLBACK_URL);
    
    if (error) {
        console.error('❌ LinkedIn OAuth error:', error);
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_auth_failed`);
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_no_code`);
    }
    
    // Check if code was already used (prevent double-processing)
    if (usedCodes.has(code)) {
        console.warn('⚠️  Authorization code already used - ignoring duplicate request');
        return res.redirect(`${frontendUrl}/social-presence?linkedin_verified=true&status=already_processed`);
    }
    
    // Mark code as used immediately
    usedCodes.add(code);
    setTimeout(() => usedCodes.delete(code), CODE_EXPIRY_MS); // Clean up after 1 minute
    
    console.log('✅ Authorization code received (length:', code.length, ')');
    console.log('⏱️  Starting token exchange immediately...');
    
    try {
        // Exchange code for access token
        console.log('🔄 Exchanging LinkedIn code for access token...');
        
        // Create form data for token exchange (LinkedIn requires application/x-www-form-urlencoded in body, not query params)
        const formData = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: process.env.LINKEDIN_CALLBACK_URL
        });
        
        console.log('📤 Token request params:', {
            grant_type: 'authorization_code',
            code: code.substring(0, 20) + '...',
            client_id: process.env.LINKEDIN_CLIENT_ID,
            redirect_uri: process.env.LINKEDIN_CALLBACK_URL
        });
        
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        console.log('✅ LinkedIn access token received');
        
        // Fetch user info using OpenID Connect userinfo endpoint
        console.log('🔄 Fetching LinkedIn user info...');
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        const userInfo = userInfoResponse.data;
        console.log('✅ LinkedIn user info received:', JSON.stringify(userInfo, null, 2));
        
        // Extract profile URL (LinkedIn provides this in the userinfo response)
        const profileUrl = userInfo.sub ? `https://www.linkedin.com/in/${userInfo.sub}` : '';
        console.log('📍 LinkedIn profile URL:', profileUrl);
        
        // Find or create user in database
        console.log('🔄 Checking database for existing user...');
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [userInfo.email]
        );
        
        let userId;
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            console.log('✅ Found existing user:', userId);
            // Update LinkedIn info for existing user
            await pool.execute(
                'UPDATE users SET linkedin = ? WHERE id = ?',
                [profileUrl, userId]
            );
            console.log('✅ Updated LinkedIn URL for existing user');
        } else {
            console.log('🔄 Creating new user...');
            // Create new user
            const [result] = await pool.execute(
                'INSERT INTO users (email, linkedin, approval, onboarding_complete) VALUES (?, ?, ?, ?)',
                [userInfo.email, profileUrl, false, false]
            );
            userId = result.insertId;
            console.log('✅ Created new user:', userId);
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
        
        // Redirect with shortened URL to avoid browser issues with long URLs
        const redirectUrl = `${frontendUrl}/social-presence?linkedin_verified=true&token=${encodeURIComponent(token)}`;
        console.log('🔄 Redirecting to:', redirectUrl.substring(0, 120) + '...');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ LinkedIn callback error:', error.response?.data || error.message);
        console.error('❌ Error status:', error.response?.status);
        
        if (error.response?.data) {
            console.error('❌ LinkedIn error details:', JSON.stringify(error.response.data, null, 2));
            
            // Check for specific error types
            if (error.response.data.error === 'invalid_request') {
                console.error('💡 Hint: This usually means:');
                console.error('   1. Authorization code expired (30 second timeout)');
                console.error('   2. Code was already used (can only use once)');
                console.error('   3. redirect_uri mismatch between initial request and token exchange');
                console.error('   4. Verify redirect_uri in LinkedIn Developer Console matches:', process.env.LINKEDIN_CALLBACK_URL);
            }
        }
        
        console.error('❌ Full error:', error);
        res.redirect(`${frontendUrl}/social-presence?error=linkedin_callback_failed`);
    }
});

module.exports = router;
