const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper function to safely parse JSON
const safeJsonParse = (jsonString, defaultValue = null) => {
  if (!jsonString) return defaultValue;
  try {
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

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@luyona.com'];
        if (!adminEmails.includes(users[0].email)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Centralized, null-safe data transformation function
const transformUser = (user) => {
    const intent = safeJsonParse(user.intent, {});
    const dobDate = user.dob ? new Date(user.dob) : null;
    
    return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        gender: user.gender || null,
        dob: user.dob || null,
        currentLocation: user.current_location || null,
        profilePicUrl: user.profile_pic_url || null,
        intent: intent,
        onboardingComplete: !!user.onboarding_complete,
        approval: !!user.approval, 
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        age: dobDate ? Math.floor((new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        hasProfilePic: !!user.profile_pic_url,
        hasLifestyleImages: intent && intent.lifestyleImageUrls && intent.lifestyleImageUrls.filter(Boolean).length > 0,
        lifestyleImageCount: intent && intent.lifestyleImageUrls ? intent.filter(Boolean).length : 0
    };
};

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    const transformedUsers = users.map(transformUser);

    res.json({
      users: transformedUsers,
      total: transformedUsers.length,
      approved: transformedUsers.filter(u => u.approval).length,
      pending: transformedUsers.filter(u => !u.approval).length,
      completedOnboarding: transformedUsers.filter(u => u.onboardingComplete).length
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get waitlisted users (users not yet approved)
router.get('/waitlist', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      WHERE approval = false
      ORDER BY created_at ASC
    `);

    const transformedUsers = users.map(transformUser);

    res.json({
      users: transformedUsers,
      total: transformedUsers.length
    });

  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Approve or reject a user
router.put('/users/:userId/approval', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { userId } = req.params;
    const { approval, reason } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute(
      'UPDATE users SET approval = ? WHERE id = ?',
      [approval, userId]
    );

    res.json({ 
      message: `User ${approval ? 'approved' : 'rejected'} successfully`,
      userId: userId,
      approval: approval
    });

  } catch (error) {
    console.error('Update approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get user details (admin only)
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { userId } = req.params;

    const [users] = await pool.execute(`
      SELECT 
        id, email, first_name, last_name, gender, dob, 
        current_location, favourite_travel_destination, last_holiday_places, 
        favourite_places_to_go, profile_pic_url, intent, 
        onboarding_complete, approval, created_at, updated_at
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

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
        intent: safeJsonParse(user.intent, {}),
        profilePicUrl: user.profile_pic_url || null,
        onboardingComplete: !!user.onboarding_complete,
        approval: !!user.approval,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        age: user.dob ? Math.floor((new Date() - new Date(user.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    };

    res.json(transformedUser);

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get admin dashboard statistics
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    if (!(await validateConnection())) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalResult[0].total;

    const [approvedResult] = await pool.execute('SELECT COUNT(*) as approved FROM users WHERE approval = true');
    const approvedUsers = approvedResult[0].approved;

    const [pendingResult] = await pool.execute('SELECT COUNT(*) as pending FROM users WHERE approval = false');
    const pendingUsers = pendingResult[0].pending;

    const [onboardingResult] = await pool.execute('SELECT COUNT(*) as completed FROM users WHERE onboarding_complete = true');
    const completedOnboarding = onboardingResult[0].completed;

    const [profilePicResult] = await pool.execute('SELECT COUNT(*) as withPic FROM users WHERE profile_pic_url IS NOT NULL');
    const usersWithProfilePic = profilePicResult[0].withPic;

    const [recentResult] = await pool.execute(`
      SELECT COUNT(*) as recent FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    const recentRegistrations = recentResult[0].recent;

    const stats = {
      totalUsers,
      approvedUsers,
      pendingUsers,
      completedOnboarding,
      usersWithProfilePic,
      recentRegistrations,
      approvalRate: totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

module.exports = router;
