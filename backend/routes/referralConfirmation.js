const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// ===== GET ENDPOINTS =====

// Get user's pending referral requests (for referrer)
router.get('/pending-requests', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [requests] = await pool.execute(
      `SELECT * FROM referral_requests 
       WHERE referrerUserId = ? AND status = 'pending'
       ORDER BY createdAt DESC`,
      [userId]
    );
    
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Get referral status for current user (if they were referred)
router.get('/my-status', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get the referral request for this user
    const [request] = await pool.execute(
      `SELECT * FROM referral_requests WHERE newUserId = ?`,
      [userId]
    );
    
    if (request.length === 0) {
      return res.json({ status: 'none' });
    }
    
    res.json(request[0]);
  } catch (error) {
    console.error('Error fetching referral status:', error);
    res.status(500).json({ error: 'Failed to fetch referral status' });
  }
});

// Get referral stats for current user
router.get('/stats', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [user] = await pool.execute(
      `SELECT referralCount, waitlistPriority FROM users WHERE id = ?`,
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      referralCount: user[0].referralCount || 0,
      waitlistPriority: user[0].waitlistPriority || 50
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all referrals created by current user
router.get('/my-referrals', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [requests] = await pool.execute(
      `SELECT rr.*, u.first_name, u.last_name, u.email 
       FROM referral_requests rr
       LEFT JOIN users u ON rr.newUserId = u.id
       WHERE rr.referrerUserId = ?
       ORDER BY rr.createdAt DESC`,
      [userId]
    );
    
    res.json({ referrals: requests });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Search for users to suggest as referrers
router.get('/search-referrers', auth.verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.userId;
    
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }
    
    // Search by name or phone
    const [results] = await pool.execute(
      `SELECT id, first_name, last_name, email FROM users 
       WHERE id != ? AND (
         CONCAT(first_name, ' ', last_name) LIKE ? OR
         email LIKE ?
       )
       LIMIT 10`,
      [userId, `%${query}%`, `%${query}%`]
    );
    
    const formattedResults = results.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || u.email,
      email: u.email
    }));
    
    res.json({ users: formattedResults });
  } catch (error) {
    console.error('Error searching referrers:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ===== POST ENDPOINTS =====

// Create referral request (from new user during onboarding)
router.post('/create-request', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { referrerName, referrerPhone, referrerUserId } = req.body;
    
    // Get current user's name
    const [user] = await pool.execute(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newUserName = `${user[0].first_name || ''} ${user[0].last_name || ''}`.trim();
    
    // Create referral request
    const [result] = await pool.execute(
      `INSERT INTO referral_requests 
       (newUserId, newUserName, referrerUserId, referrerPhone, referrerName, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, newUserName, referrerUserId || null, referrerPhone, referrerName]
    );
    
    // Create notification for referrer
    if (referrerUserId) {
      const message = `${newUserName} has listed you as their referrer on Sundate. Please confirm if you know them.`;
      
      await pool.execute(
        `INSERT INTO notifications 
         (userId, referralRequestId, type, message)
         VALUES (?, ?, 'referral_request', ?)`,
        [referrerUserId, result.insertId, message]
      );
    }
    
    res.json({ 
      message: 'Referral request sent for confirmation',
      requestId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating referral request:', error);
    res.status(500).json({ error: 'Failed to create referral request' });
  }
});

// ===== PUT ENDPOINTS (Confirm/Reject Referral) =====

// Accept referral request
router.put('/:requestId/accept', auth.verifyToken, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;
    
    // Get referral request
    const [request] = await pool.execute(
      `SELECT * FROM referral_requests WHERE id = ?`,
      [requestId]
    );
    
    if (request.length === 0) {
      return res.status(404).json({ error: 'Referral request not found' });
    }
    
    const referralRequest = request[0];
    
    // Verify this is the correct referrer
    if (referralRequest.referrerUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update referral request status
    await pool.execute(
      `UPDATE referral_requests SET status = 'accepted', confirmedAt = NOW() WHERE id = ?`,
      [requestId]
    );
    
    // Update referred user
    await pool.execute(
      `UPDATE users SET referredBy = ?, waitlistPriority = 100 WHERE id = ?`,
      [userId, referralRequest.newUserId]
    );
    
    // Increment referrer's count
    await pool.execute(
      `UPDATE users SET referralCount = referralCount + 1 WHERE id = ?`,
      [userId]
    );
    
    res.json({ message: 'Referral accepted' });
  } catch (error) {
    console.error('Error accepting referral:', error);
    res.status(500).json({ error: 'Failed to accept referral' });
  }
});

// Reject referral with "I know them" option
router.put('/:requestId/reject-known', auth.verifyToken, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;
    
    const [request] = await pool.execute(
      `SELECT * FROM referral_requests WHERE id = ?`,
      [requestId]
    );
    
    if (request.length === 0) {
      return res.status(404).json({ error: 'Referral request not found' });
    }
    
    if (request[0].referrerUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update referral request status
    await pool.execute(
      `UPDATE referral_requests SET status = 'rejected_known', confirmedAt = NOW() WHERE id = ?`,
      [requestId]
    );
    
    // Update referred user's priority to 50
    await pool.execute(
      `UPDATE users SET waitlistPriority = 50 WHERE id = ?`,
      [request[0].newUserId]
    );
    
    res.json({ message: 'Referral rejected (known)' });
  } catch (error) {
    console.error('Error rejecting referral:', error);
    res.status(500).json({ error: 'Failed to reject referral' });
  }
});

// Reject referral with "I don't know" option
router.put('/:requestId/reject-unknown', auth.verifyToken, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;
    
    const [request] = await pool.execute(
      `SELECT * FROM referral_requests WHERE id = ?`,
      [requestId]
    );
    
    if (request.length === 0) {
      return res.status(404).json({ error: 'Referral request not found' });
    }
    
    if (request[0].referrerUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update referral request status
    await pool.execute(
      `UPDATE referral_requests SET status = 'rejected_unknown', confirmedAt = NOW() WHERE id = ?`,
      [requestId]
    );
    
    // Update referred user's priority to 10
    await pool.execute(
      `UPDATE users SET waitlistPriority = 10 WHERE id = ?`,
      [request[0].newUserId]
    );
    
    res.json({ message: 'Referral rejected (unknown)' });
  } catch (error) {
    console.error('Error rejecting referral:', error);
    res.status(500).json({ error: 'Failed to reject referral' });
  }
});

// Dismiss referral notification (without action)
router.put('/:requestId/dismiss', auth.verifyToken, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.userId;
    
    // Verify ownership
    const [request] = await pool.execute(
      `SELECT * FROM referral_requests WHERE id = ?`,
      [requestId]
    );
    
    if (request.length === 0 || request[0].referrerUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Mark notifications as read
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE referralRequestId = ? AND userId = ?`,
      [requestId, userId]
    );
    
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Error dismissing referral:', error);
    res.status(500).json({ error: 'Failed to dismiss referral' });
  }
});

module.exports = router;
