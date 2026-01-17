const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
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
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/auth/linkedin/callback',
        scope: 'openid profile email'
    });
    
    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
});

// OAuth callback handler
router.get('/linkedin/callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
        console.error('LinkedIn OAuth error:', error);
        return res.redirect('http://localhost:5173/social-presence?error=linkedin_auth_failed');
    }
    
    if (!code) {
        return res.redirect('http://localhost:5173/social-presence?error=linkedin_no_code');
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, null, {
            params: {
                grant_type: 'authorization_code',
                code: code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:5000/auth/linkedin/callback'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        console.log('LinkedIn access token received');
        
        // Fetch user info using OpenID Connect userinfo endpoint
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        const userInfo = userInfoResponse.data;
        console.log('LinkedIn user info:', JSON.stringify(userInfo, null, 2));
        
        // Extract profile URL (LinkedIn provides this in the userinfo response)
        const profileUrl = userInfo.sub ? `https://www.linkedin.com/in/${userInfo.sub}` : '';
        
        // Generate JWT token for your app
        const token = jwt.sign(
            { 
                linkedinId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                linkedinVerified: true 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        // Redirect back to frontend with success
        res.redirect(`http://localhost:5173/social-presence?linkedin_verified=true&token=${token}&linkedin_url=${encodeURIComponent(profileUrl)}`);
    } catch (error) {
        console.error('LinkedIn callback error:', error.response?.data || error.message);
        res.redirect('http://localhost:5173/social-presence?error=linkedin_callback_failed');
    }
});

module.exports = router;
