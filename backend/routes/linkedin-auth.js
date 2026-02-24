const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const router = express.Router();

// LinkedIn OAuth endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

// Initiate OAuth flow
router.get('/linkedin', (req, res) => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        scope: 'openid profile email'
    });
    
    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
});

// OAuth callback handler
router.get('/linkedin/callback', async (req, res) => {
    console.log('📥 LinkedIn callback received');
    console.log('Query params:', req.query);
    
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log('🌐 Frontend URL:', frontendUrl);
    
    if (error) {
        console.error('❌ LinkedIn OAuth error:', error);
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_auth_failed`);
    }
    
    if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect(`${frontendUrl}/social-presence?error=linkedin_no_code`);
    }
    
    console.log('✅ Authorization code received');
    
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
        
        // Redirect back to frontend with success
        const redirectUrl = `${frontendUrl}/social-presence?linkedin_verified=true&token=${encodeURIComponent(token)}&linkedin_url=${encodeURIComponent(profileUrl)}`;
        console.log('🔄 Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ LinkedIn callback error:', error.response?.data || error.message);
        console.error('❌ Full error:', error);
        res.redirect(`${frontendUrl}/social-presence?error=linkedin_callback_failed`);
    }
});

module.exports = router;
