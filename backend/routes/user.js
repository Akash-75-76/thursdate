const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, defaultValue = null) => {
    if (!jsonString) return defaultValue;
    try {
        // Only parse if it's a string; sometimes MySQL drivers return objects/arrays directly
        if (typeof jsonString === 'string') {
            return JSON.parse(jsonString);
        }
        return jsonString;
    } catch (error) {
        console.error('JSON parse error:', error);
        return defaultValue;
    }
};

// Helper function to validate database connection
const validateConnection = async () => {
    try {
        await pool.execute('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database connection validation failed:', error);
        return false;
    }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const [users] = await pool.execute(
            'SELECT id, email, first_name, last_name, gender, dob, current_location, favourite_travel_destination, last_holiday_places, favourite_places_to_go, profile_pic_url, approval, intent, onboarding_complete, is_private FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        
        // 💡 CRITICAL FIX: Add defensive null checks (using || null) for all nullable columns 
        // and explicitly convert boolean-like fields to proper booleans (using !!).
        const transformedUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name || null,
            lastName: user.last_name || null,
            gender: user.gender || null,
            dob: user.dob || null,
            currentLocation: user.current_location || null,
            favouriteTravelDestination: user.favourite_travel_destination || null,
            lastHolidayPlaces: safeJsonParse(user.last_holiday_places, []),
            favouritePlacesToGo: safeJsonParse(user.favourite_places_to_go, []),
            profilePicUrl: user.profile_pic_url || null,
            intent: safeJsonParse(user.intent, {}),
            onboardingComplete: !!user.onboarding_complete, // Ensure boolean
            approval: !!user.approval,                     // Ensure boolean
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            isPrivate: !!user.is_private,                  // Ensure boolean
        };
        
        res.json(transformedUser);
        
    } catch (error) {
        console.error('Get profile error:', error);
        // Returning the error message helps debug live issues
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Save user profile (for onboarding)
router.post('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl
        } = req.body;
        
        let formattedDob = dob ? new Date(dob).toISOString().split('T')[0] : null;
        const lastHolidayPlacesJson = JSON.stringify(lastHolidayPlaces || []);
        const favouritePlacesToGoJson = JSON.stringify(favouritePlacesToGo || []);
        
        await pool.execute(
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, approval = false
            WHERE id = ?`,
            [
                firstName, lastName, gender, formattedDob, currentLocation, 
                favouriteTravelDestination, lastHolidayPlacesJson, 
                favouritePlacesToGoJson, profilePicUrl, req.user.userId
            ]
        );
        
        res.json({ message: 'Profile saved successfully' });
        
    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        if (!(await validateConnection())) {
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const [currentUsers] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.userId]);
        if (currentUsers.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentUser = currentUsers[0];
        const currentIntent = safeJsonParse(currentUser.intent, {});
        
        const {
            firstName, lastName, gender, dob, currentLocation, favouriteTravelDestination,
            lastHolidayPlaces, favouritePlacesToGo, profilePicUrl, intent, onboardingComplete,
            isPrivate
        } = req.body;
        
        let finalIntent = { ...currentIntent, ...intent };
        const intentJson = JSON.stringify(finalIntent); 
        
        // 💡 CRITICAL: Determine the final approval status. 
        // We ensure that if onboardingComplete is set to true (meaning user finished the app),
        // we explicitly set APPROVAL TO FALSE to put them on the waitlist.
        let finalApprovalStatus = currentUser.approval; // Preserve current status by default
        if (onboardingComplete === true) {
            finalApprovalStatus = false; 
        } else if (onboardingComplete === false) {
            // Allow the frontend to explicitly set onboardingComplete to false,
            // but don't automatically change the approval state.
        }


        const updateData = [
            firstName !== undefined ? firstName : currentUser.first_name,
            lastName !== undefined ? lastName : currentUser.last_name,
            gender !== undefined ? gender : currentUser.gender,
            dob ? new Date(dob).toISOString().split('T')[0] : currentUser.dob, 
            currentLocation !== undefined ? currentLocation : currentUser.current_location,
            favouriteTravelDestination !== undefined ? favouriteTravelDestination : currentUser.favourite_travel_destination,
            JSON.stringify(lastHolidayPlaces !== undefined ? lastHolidayPlaces : safeJsonParse(currentUser.last_holiday_places, [])),
            JSON.stringify(favouritePlacesToGo !== undefined ? favouritePlacesToGo : safeJsonParse(currentUser.favourite_places_to_go, [])),
            profilePicUrl !== undefined ? profilePicUrl : currentUser.profile_pic_url,
            intentJson,
            onboardingComplete !== undefined ? onboardingComplete : currentUser.onboarding_complete,
            isPrivate !== undefined ? isPrivate : currentUser.is_private,
            finalApprovalStatus, // 👈 ADDED to the updateData array
            req.user.userId
        ];
        
        await pool.execute(
            `UPDATE users SET 
                first_name = ?, last_name = ?, gender = ?, dob = ?, 
                current_location = ?, favourite_travel_destination = ?, 
                last_holiday_places = ?, favourite_places_to_go = ?, 
                profile_pic_url = ?, intent = ?, onboarding_complete = ?,
                is_private = ?, 
                approval = ?  
            WHERE id = ?`,
            updateData // The array now matches the number of placeholders
        );
        
        res.json({ message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ❌ SECURITY FLAW & DUPLICATE ROUTE - THIS MUST BE REMOVED/MOVED
// The admin approval logic should live in backend/routes/admin.js
router.put('/approve/:userId', auth, async (req, res) => {
    // This entire route should be removed as it's a security flaw and duplicated logic.
    // The correct endpoint is in admin.js: PUT /admin/users/:userId/approval
    res.status(403).json({ error: 'Route deprecated. Use /admin/users/:userId/approval' });
});

module.exports = router;