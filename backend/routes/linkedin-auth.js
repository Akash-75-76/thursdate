const express = require('express');
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const jwt = require('jsonwebtoken');
const router = express.Router();

// Configure LinkedIn Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/auth/linkedin/callback",
    scope: ['openid', 'profile', 'email'],
    state: false
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Profile contains: id, displayName, emails, photos
        const linkedInData = {
            linkedinId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            profileUrl: profile._json?.publicProfileUrl || `https://www.linkedin.com/in/${profile.id}`,
            accessToken
        };
        
        return done(null, linkedInData);
    } catch (error) {
        return done(error, null);
    }
}));

// Initiate OAuth flow
router.get('/linkedin', passport.authenticate('linkedin', { session: false }));

// OAuth callback handler
router.get('/linkedin/callback',
    passport.authenticate('linkedin', { session: false, failureRedirect: 'http://localhost:5173/social-presence?error=linkedin_failed' }),
    (req, res) => {
        try {
            // User data from LinkedIn is in req.user
            const linkedInData = req.user;
            
            // Generate JWT token for your app
            const token = jwt.sign(
                { 
                    linkedinId: linkedInData.linkedinId,
                    email: linkedInData.email,
                    linkedinVerified: true 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            // Redirect back to frontend with success
            res.redirect(`http://localhost:5173/social-presence?linkedin_verified=true&token=${token}&linkedin_url=${encodeURIComponent(linkedInData.profileUrl)}`);
        } catch (error) {
            console.error('LinkedIn callback error:', error);
            res.redirect('http://localhost:5173/social-presence?error=linkedin_callback_failed');
        }
    }
);

module.exports = router;
