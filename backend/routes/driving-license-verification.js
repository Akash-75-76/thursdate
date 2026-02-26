const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { Readable } = require('stream');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    // Accept jpg, jpeg, png
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
    }
    cb(null, true);
  },
});

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

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, userId, side) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `driving-licenses/${folder}`,
        public_id: `user_${userId}_${side}_${Date.now()}`,
        resource_type: 'image',
        // Use regular upload type with secure URLs (still private but accessible via secure_url)
        type: 'upload',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Helper function to log admin actions
const logAdminAction = async (verificationId, adminId, action, details = null, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;
    
    await pool.execute(
      `INSERT INTO verification_audit_logs 
       (verification_id, admin_id, action, action_details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [verificationId, adminId, action, details ? JSON.stringify(details) : null, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * @route   POST /api/verification/driving-license/upload
 * @desc    Upload driving license images for verification
 * @access  Private (User)
 */
router.post('/upload', auth, upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate that both images are provided
    if (!req.files || !req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({ 
        error: 'Both front and back images of driving license are required' 
      });
    }

    const frontImage = req.files.frontImage[0];
    const backImage = req.files.backImage[0];

    // Check if user already has a pending verification
    const [existingVerifications] = await pool.execute(
      `SELECT id, verification_status FROM driving_license_verifications 
       WHERE user_id = ? AND verification_status = 'UNDER_REVIEW'`,
      [userId]
    );

    if (existingVerifications.length > 0) {
      return res.status(400).json({ 
        error: 'You already have a verification request under review. Please wait for admin approval.' 
      });
    }

    // Upload images to Cloudinary
    console.log('Uploading front image to Cloudinary...');
    const frontUploadResult = await uploadToCloudinary(
      frontImage.buffer, 
      userId, 
      userId, 
      'front'
    );

    console.log('Uploading back image to Cloudinary...');
    const backUploadResult = await uploadToCloudinary(
      backImage.buffer, 
      userId, 
      userId, 
      'back'
    );

    // Store verification record in database
    const [result] = await pool.execute(
      `INSERT INTO driving_license_verifications 
       (user_id, front_image_url, back_image_url, verification_status, verification_type, submitted_at) 
       VALUES (?, ?, ?, 'UNDER_REVIEW', 'DRIVING_LICENSE', NOW())`,
      [userId, frontUploadResult.secure_url, backUploadResult.secure_url]
    );

    console.log(`Driving license verification submitted for user ${userId}`);

    res.status(201).json({
      message: 'Driving license uploaded successfully. Your verification is under review.',
      verificationId: result.insertId,
      status: 'UNDER_REVIEW',
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload driving license error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload driving license. Please try again.',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/verification/driving-license/status
 * @desc    Get user's driving license verification status
 * @access  Private (User)
 */
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's driving license verified status
    const [users] = await pool.execute(
      'SELECT driving_license_verified FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get latest verification attempt
    const [verifications] = await pool.execute(
      `SELECT id, verification_status, submitted_at, reviewed_at, rejection_reason
       FROM driving_license_verifications 
       WHERE user_id = ? 
       ORDER BY submitted_at DESC 
       LIMIT 1`,
      [userId]
    );

    const isVerified = users[0].driving_license_verified;
    const hasSubmission = verifications.length > 0;

    let statusResponse = {
      isVerified: isVerified,
      hasSubmission: hasSubmission,
    };

    if (hasSubmission) {
      const verification = verifications[0];
      statusResponse = {
        ...statusResponse,
        verificationId: verification.id,
        status: verification.verification_status,
        submittedAt: verification.submitted_at,
        reviewedAt: verification.reviewed_at,
        rejectionReason: verification.rejection_reason,
        statusMessage: getStatusMessage(verification.verification_status, verification.rejection_reason)
      };
    } else if (isVerified) {
      statusResponse.statusMessage = 'Your driving license is verified';
    } else {
      statusResponse.statusMessage = 'No verification submitted yet';
    }

    res.json(statusResponse);

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Helper function to generate user-friendly status messages
const getStatusMessage = (status, rejectionReason) => {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'Your driving license is under verification process';
    case 'VERIFIED':
      return 'Your driving license is verified';
    case 'REJECTED':
      return `Verification failed${rejectionReason ? ': ' + rejectionReason : ''}`;
    default:
      return 'Unknown status';
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @route   GET /api/verification/driving-license/admin/pending
 * @desc    Get all pending driving license verifications
 * @access  Private (Admin)
 */
router.get('/admin/pending', auth, adminAuth, async (req, res) => {
  try {
    const [verifications] = await pool.execute(
      `SELECT 
        dlv.id,
        dlv.user_id,
        dlv.front_image_url,
        dlv.back_image_url,
        dlv.verification_status,
        dlv.submitted_at,
        u.first_name,
        u.last_name,
        u.email,
        u.gender,
        u.dob,
        u.profile_pic_url,
        u.linkedin_verified
       FROM driving_license_verifications dlv
       JOIN users u ON dlv.user_id = u.id
       WHERE dlv.verification_status = 'UNDER_REVIEW'
       ORDER BY dlv.submitted_at ASC`
    );

    const transformedVerifications = verifications.map(v => {
      const dobDate = v.dob ? new Date(v.dob) : null;
      const age = dobDate ? Math.floor((new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      
      return {
        verificationId: v.id,
        userId: v.user_id,
        submittedAt: v.submitted_at,
        user: {
          firstName: v.first_name,
          lastName: v.last_name,
          email: v.email,
          gender: v.gender,
          age: age,
          profilePicUrl: v.profile_pic_url,
          linkedinVerified: v.linkedin_verified
        }
      };
    });

    res.json({
      verifications: transformedVerifications,
      total: transformedVerifications.length
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

/**
 * @route   GET /api/verification/driving-license/admin/all
 * @desc    Get all driving license verifications (with filters)
 * @access  Private (Admin)
 */
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        dlv.id,
        dlv.user_id,
        dlv.verification_status,
        dlv.submitted_at,
        dlv.reviewed_at,
        dlv.rejection_reason,
        u.first_name,
        u.last_name,
        u.email,
        u.gender,
        u.dob,
        u.profile_pic_url,
        u.linkedin_verified
      FROM driving_license_verifications dlv
      JOIN users u ON dlv.user_id = u.id
    `;
    
    const params = [];
    if (status && ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'].includes(status)) {
      query += ' WHERE dlv.verification_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY dlv.submitted_at DESC';

    const [verifications] = await pool.execute(query, params);

    const transformedVerifications = verifications.map(v => {
      const dobDate = v.dob ? new Date(v.dob) : null;
      const age = dobDate ? Math.floor((new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      
      return {
        verificationId: v.id,
        userId: v.user_id,
        status: v.verification_status,
        submittedAt: v.submitted_at,
        reviewedAt: v.reviewed_at,
        rejectionReason: v.rejection_reason,
        user: {
          firstName: v.first_name,
          lastName: v.last_name,
          email: v.email,
          gender: v.gender,
          age: age,
          profilePicUrl: v.profile_pic_url,
          linkedinVerified: v.linkedin_verified
        }
      };
    });

    res.json({
      verifications: transformedVerifications,
      total: transformedVerifications.length
    });

  } catch (error) {
    console.error('Get all verifications error:', error);
    res.status(500).json({ error: 'Failed to get verifications' });
  }
});

/**
 * @route   GET /api/verification/driving-license/admin/:verificationId
 * @desc    Get detailed information about a specific verification
 * @access  Private (Admin)
 */
router.get('/admin/:verificationId', auth, adminAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;

    const [verifications] = await pool.execute(
      `SELECT 
        dlv.id,
        dlv.user_id,
        dlv.front_image_url,
        dlv.back_image_url,
        dlv.verification_status,
        dlv.submitted_at,
        dlv.reviewed_at,
        dlv.reviewed_by,
        dlv.rejection_reason,
        u.first_name,
        u.last_name,
        u.email,
        u.gender,
        u.dob,
        u.current_location,
        u.profile_pic_url,
        u.linkedin_verified,
        u.driving_license_verified
       FROM driving_license_verifications dlv
       JOIN users u ON dlv.user_id = u.id
       WHERE dlv.id = ?`,
      [verificationId]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const v = verifications[0];
    const dobDate = v.dob ? new Date(v.dob) : null;
    const age = dobDate ? Math.floor((new Date() - dobDate) / (365.25 * 24 * 60 * 60 * 1000)) : null;

    const verificationDetails = {
      verificationId: v.id,
      userId: v.user_id,
      status: v.verification_status,
      submittedAt: v.submitted_at,
      reviewedAt: v.reviewed_at,
      reviewedBy: v.reviewed_by,
      rejectionReason: v.rejection_reason,
      images: {
        frontImageUrl: v.front_image_url,
        backImageUrl: v.back_image_url
      },
      user: {
        firstName: v.first_name,
        lastName: v.last_name,
        email: v.email,
        gender: v.gender,
        age: age,
        currentLocation: v.current_location,
        profilePicUrl: v.profile_pic_url,
        linkedinVerified: v.linkedin_verified,
        drivingLicenseVerified: v.driving_license_verified
      }
    };

    // Log that admin viewed this verification
    await logAdminAction(verificationId, req.user.userId, 'VIEWED', null, req);

    res.json(verificationDetails);

  } catch (error) {
    console.error('Get verification details error:', error);
    res.status(500).json({ error: 'Failed to get verification details' });
  }
});

/**
 * @route   PUT /api/verification/driving-license/admin/:verificationId/approve
 * @desc    Approve a driving license verification
 * @access  Private (Admin)
 */
router.put('/admin/:verificationId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const adminId = req.user.userId;

    // Check if verification exists and is pending
    const [verifications] = await pool.execute(
      'SELECT id, user_id, verification_status FROM driving_license_verifications WHERE id = ?',
      [verificationId]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const verification = verifications[0];

    if (verification.verification_status !== 'UNDER_REVIEW') {
      return res.status(400).json({ 
        error: `Verification has already been ${verification.verification_status.toLowerCase()}` 
      });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update verification status
      await connection.execute(
        `UPDATE driving_license_verifications 
         SET verification_status = 'VERIFIED', reviewed_at = NOW(), reviewed_by = ? 
         WHERE id = ?`,
        [adminId, verificationId]
      );

      // Update user's driving_license_verified flag
      await connection.execute(
        'UPDATE users SET driving_license_verified = TRUE WHERE id = ?',
        [verification.user_id]
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      // Log admin action
      await logAdminAction(verificationId, adminId, 'APPROVED', { userId: verification.user_id }, req);

      console.log(`Driving license verification ${verificationId} approved by admin ${adminId}`);

      res.json({
        message: 'Driving license verification approved successfully',
        verificationId: verificationId,
        userId: verification.user_id,
        status: 'VERIFIED'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
});

/**
 * @route   PUT /api/verification/driving-license/admin/:verificationId/reject
 * @desc    Reject a driving license verification
 * @access  Private (Admin)
 */
router.put('/admin/:verificationId/reject', auth, adminAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Check if verification exists and is pending
    const [verifications] = await pool.execute(
      'SELECT id, user_id, verification_status FROM driving_license_verifications WHERE id = ?',
      [verificationId]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const verification = verifications[0];

    if (verification.verification_status !== 'UNDER_REVIEW') {
      return res.status(400).json({ 
        error: `Verification has already been ${verification.verification_status.toLowerCase()}` 
      });
    }

    // Update verification status
    await pool.execute(
      `UPDATE driving_license_verifications 
       SET verification_status = 'REJECTED', reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ? 
       WHERE id = ?`,
      [adminId, reason.trim(), verificationId]
    );

    // Log admin action
    await logAdminAction(verificationId, adminId, 'REJECTED', { 
      userId: verification.user_id, 
      reason: reason.trim() 
    }, req);

    console.log(`Driving license verification ${verificationId} rejected by admin ${adminId}`);

    res.json({
      message: 'Driving license verification rejected',
      verificationId: verificationId,
      userId: verification.user_id,
      status: 'REJECTED',
      rejectionReason: reason.trim()
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

/**
 * @route   GET /api/verification/driving-license/admin/stats
 * @desc    Get verification statistics
 * @access  Private (Admin)
 */
router.get('/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verification_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM driving_license_verifications
    `);

    res.json({
      total: stats[0].total || 0,
      pending: stats[0].pending || 0,
      approved: stats[0].approved || 0,
      rejected: stats[0].rejected || 0
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ error: 'Failed to get verification statistics' });
  }
});

module.exports = router;
