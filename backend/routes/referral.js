const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply a referral code for the currently authenticated user
router.post('/apply', auth, async (req, res) => {
  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  const normalizedCode = code.trim();

  if (normalizedCode.length === 0) {
    return res.status(400).json({ error: 'Referral code cannot be empty' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Look up the referral code
    const [codes] = await connection.execute(
      'SELECT id, referrer_user_id, max_uses, uses, expires_at FROM referral_codes WHERE code = ?',
      [normalizedCode]
    );

    if (codes.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Invalid or expired referral code', codeStatus: 'not_found' });
    }

    const referral = codes[0];

    // Check expiry
    if (referral.expires_at && new Date(referral.expires_at) <= new Date()) {
      await connection.rollback();
      return res.status(410).json({ error: 'This referral code has expired', codeStatus: 'expired' });
    }

    // Check remaining uses (if max_uses is not null)
    if (referral.max_uses !== null && referral.max_uses >= 0 && referral.uses >= referral.max_uses) {
      await connection.rollback();
      return res.status(409).json({ error: 'This referral code has already been used up', codeStatus: 'exhausted' });
    }

    const userId = req.user.userId;

    // Ensure this user has not already used any referral code
    const [existing] = await connection.execute(
      'SELECT id FROM referral_usages WHERE referred_user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'You have already used a referral code', codeStatus: 'already_used' });
    }

    // Record usage
    await connection.execute(
      'INSERT INTO referral_usages (referral_code_id, referred_user_id) VALUES (?, ?)',
      [referral.id, userId]
    );

    // Increment usage count
    await connection.execute(
      'UPDATE referral_codes SET uses = uses + 1 WHERE id = ?',
      [referral.id]
    );

    // Mark advantage on the user
    await connection.execute(
      'UPDATE users SET referred_by_user_id = ?, referred_by_code = ?, referral_advantage = 1 WHERE id = ?',
      [referral.referrer_user_id, normalizedCode, userId]
    );

    await connection.commit();

    return res.json({
      success: true,
      codeStatus: 'applied',
      referrerUserId: referral.referrer_user_id,
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (rollbackErr) { console.error('Referral rollback error:', rollbackErr); }
    }
    console.error('Referral apply error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
