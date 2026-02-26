# Driving License Verification System

Complete backend implementation for manual driving license verification in the dating application.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Usage Examples](#usage-examples)
- [Admin Workflow](#admin-workflow)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Driving License Verification system provides an additional verification method alongside LinkedIn OAuth. Users upload front and back images of their driving license, which are then manually reviewed by admins.

### Key Features

✅ **User Upload Flow**
- Accept two images (front & back)
- File type and size validation
- Secure cloud storage (Cloudinary)
- Status tracking

✅ **Admin Review Flow**
- View pending verifications
- Access user profile details
- Approve or reject with reasons
- Complete audit logging

✅ **Status Management**
- Real-time status updates
- User-friendly status messages
- Re-upload capability after rejection

✅ **Security & Privacy**
- Admin-only access to documents
- Authenticated image URLs
- Role-based access control
- Complete audit trail

## 🚀 Setup

### 1. Run Database Migration

```bash
cd backend
node run-driving-license-migration.js
```

This creates:
- `driving_license_verifications` table
- `verification_audit_logs` table
- `driving_license_verified` column in users table
- Required indexes

### 2. Configure Environment Variables

Ensure these variables are set in your `.env`:

```env
# Cloudinary (already configured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@luyona.com,admin2@example.com

# JWT Secret (already configured)
JWT_SECRET=your_jwt_secret
```

### 3. Dependencies

All required dependencies are already installed:
- `multer` - File upload handling
- `cloudinary` - Image storage
- `mysql2` - Database
- `express` - API framework

### 4. Verify Installation

```bash
# Check if route is registered
curl http://localhost:5000/api/verification/driving-license/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🗄️ Database Schema

### driving_license_verifications

```sql
CREATE TABLE driving_license_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  front_image_url VARCHAR(500) NOT NULL,
  back_image_url VARCHAR(500) NOT NULL,
  verification_status ENUM('UNDER_REVIEW', 'VERIFIED', 'REJECTED'),
  verification_type VARCHAR(50) DEFAULT 'DRIVING_LICENSE',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### verification_audit_logs

```sql
CREATE TABLE verification_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  verification_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('APPROVED', 'REJECTED', 'VIEWED'),
  action_details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (verification_id) REFERENCES driving_license_verifications(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

### users (new column)

```sql
ALTER TABLE users 
ADD COLUMN driving_license_verified BOOLEAN DEFAULT FALSE;
```

## 🔌 API Endpoints

### User Endpoints

#### 1. Upload Driving License

**POST** `/api/verification/driving-license/upload`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
frontImage: File (jpg/jpeg/png, max 5MB)
backImage: File (jpg/jpeg/png, max 5MB)
```

**Response (201):**
```json
{
  "message": "Driving license uploaded successfully. Your verification is under review.",
  "verificationId": 123,
  "status": "UNDER_REVIEW",
  "submittedAt": "2026-02-26T10:30:00.000Z"
}
```

**Error Responses:**
- **400**: Missing images, invalid file type, file too large
- **400**: Already has pending verification
- **401**: Unauthorized
- **500**: Upload failed

#### 2. Check Verification Status

**GET** `/api/verification/driving-license/status`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "isVerified": false,
  "hasSubmission": true,
  "verificationId": 123,
  "status": "UNDER_REVIEW",
  "submittedAt": "2026-02-26T10:30:00.000Z",
  "reviewedAt": null,
  "rejectionReason": null,
  "statusMessage": "Your driving license is under verification process"
}
```

**Status Messages:**
- `UNDER_REVIEW`: "Your driving license is under verification process"
- `VERIFIED`: "Your driving license is verified"
- `REJECTED`: "Verification failed: [reason]"
- No submission: "No verification submitted yet"

### Admin Endpoints

All admin endpoints require:
- **Authentication**: `Authorization: Bearer <admin_token>`
- **Admin role**: User email must be in `ADMIN_EMAILS` env variable

#### 3. Get Pending Verifications

**GET** `/api/verification/driving-license/admin/pending`

**Response (200):**
```json
{
  "verifications": [
    {
      "verificationId": 123,
      "userId": 456,
      "submittedAt": "2026-02-26T10:30:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "gender": "male",
        "age": 28,
        "profilePicUrl": "https://...",
        "linkedinVerified": true
      }
    }
  ],
  "total": 1
}
```

#### 4. Get All Verifications (with filters)

**GET** `/api/verification/driving-license/admin/all?status=VERIFIED`

**Query Parameters:**
- `status` (optional): `UNDER_REVIEW`, `VERIFIED`, or `REJECTED`

**Response (200):**
```json
{
  "verifications": [...],
  "total": 10
}
```

#### 5. Get Verification Details

**GET** `/api/verification/driving-license/admin/:verificationId`

**Response (200):**
```json
{
  "verificationId": 123,
  "userId": 456,
  "status": "UNDER_REVIEW",
  "submittedAt": "2026-02-26T10:30:00.000Z",
  "reviewedAt": null,
  "reviewedBy": null,
  "rejectionReason": null,
  "images": {
    "frontImageUrl": "https://res.cloudinary.com/.../front.jpg",
    "backImageUrl": "https://res.cloudinary.com/.../back.jpg",
    "frontImageSignedUrl": "https://...",
    "backImageSignedUrl": "https://..."
  },
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "gender": "male",
    "age": 28,
    "currentLocation": "New York",
    "profilePicUrl": "https://...",
    "linkedinVerified": true,
    "drivingLicenseVerified": false
  }
}
```

**Note**: This endpoint logs an audit entry with action `VIEWED`.

#### 6. Approve Verification

**PUT** `/api/verification/driving-license/admin/:verificationId/approve`

**Response (200):**
```json
{
  "message": "Driving license verification approved successfully",
  "verificationId": 123,
  "userId": 456,
  "status": "VERIFIED"
}
```

**What happens:**
1. Sets `verification_status = 'VERIFIED'`
2. Sets `reviewed_at = NOW()`
3. Sets `reviewed_by = admin_user_id`
4. Sets `users.driving_license_verified = TRUE`
5. Creates audit log entry

**Error Responses:**
- **400**: Verification already processed
- **404**: Verification not found

#### 7. Reject Verification

**PUT** `/api/verification/driving-license/admin/:verificationId/reject`

**Body:**
```json
{
  "reason": "Document is not clear. Please upload a clearer image."
}
```

**Response (200):**
```json
{
  "message": "Driving license verification rejected",
  "verificationId": 123,
  "userId": 456,
  "status": "REJECTED",
  "rejectionReason": "Document is not clear. Please upload a clearer image."
}
```

**What happens:**
1. Sets `verification_status = 'REJECTED'`
2. Sets `reviewed_at = NOW()`
3. Sets `reviewed_by = admin_user_id`
4. Sets `rejection_reason`
5. Creates audit log entry
6. User can re-upload after rejection

**Error Responses:**
- **400**: Missing reason
- **400**: Verification already processed
- **404**: Verification not found

#### 8. Get Statistics

**GET** `/api/verification/driving-license/admin/stats`

**Response (200):**
```json
{
  "total": 100,
  "pending": 15,
  "approved": 75,
  "rejected": 10
}
```

## 🔒 Security Features

### 1. Image Storage Security
- Images stored in Cloudinary with `authenticated` access mode
- Signed URLs required to view images
- Only admins can access verification images
- Automatic URL expiration

### 2. Role-Based Access Control
```javascript
// Admin auth middleware
const adminAuth = async (req, res, next) => {
  // Verify user is authenticated
  // Check if user email is in ADMIN_EMAILS
  // Grant or deny access
};
```

### 3. Audit Logging
All admin actions are logged:
- View verification
- Approve verification
- Reject verification

Logs include:
- Admin ID
- Action type
- Timestamp
- IP address
- User agent
- Action details (e.g., rejection reason)

### 4. File Upload Validation
```javascript
// Multer configuration
- Max file size: 5MB
- Allowed types: jpg, jpeg, png
- Memory storage (no disk writes)
- Immediate upload to Cloudinary
```

### 5. Prevent Duplicate Submissions
Users cannot submit a new verification while one is under review:
```sql
SELECT * FROM driving_license_verifications 
WHERE user_id = ? AND verification_status = 'UNDER_REVIEW'
```

## 💡 Usage Examples

### Frontend Integration Example

```javascript
// User uploads driving license
async function uploadDrivingLicense(frontImage, backImage) {
  const formData = new FormData();
  formData.append('frontImage', frontImage);
  formData.append('backImage', backImage);

  const response = await fetch(
    'http://localhost:5000/api/verification/driving-license/upload',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: formData
    }
  );

  return await response.json();
}

// Check verification status
async function checkVerificationStatus() {
  const response = await fetch(
    'http://localhost:5000/api/verification/driving-license/status',
    {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );

  return await response.json();
}

// Admin: Get pending verifications
async function getPendingVerifications() {
  const response = await fetch(
    'http://localhost:5000/api/verification/driving-license/admin/pending',
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );

  return await response.json();
}

// Admin: Approve verification
async function approveVerification(verificationId) {
  const response = await fetch(
    `http://localhost:5000/api/verification/driving-license/admin/${verificationId}/approve`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return await response.json();
}

// Admin: Reject verification
async function rejectVerification(verificationId, reason) {
  const response = await fetch(
    `http://localhost:5000/api/verification/driving-license/admin/${verificationId}/reject`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    }
  );

  return await response.json();
}
```

### cURL Examples

```bash
# Upload driving license (user)
curl -X POST http://localhost:5000/api/verification/driving-license/upload \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "frontImage=@/path/to/front.jpg" \
  -F "backImage=@/path/to/back.jpg"

# Check status (user)
curl http://localhost:5000/api/verification/driving-license/status \
  -H "Authorization: Bearer USER_TOKEN"

# Get pending verifications (admin)
curl http://localhost:5000/api/verification/driving-license/admin/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Approve verification (admin)
curl -X PUT http://localhost:5000/api/verification/driving-license/admin/123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Reject verification (admin)
curl -X PUT http://localhost:5000/api/verification/driving-license/admin/123/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Document is not clear"}'
```

## 👨‍💼 Admin Workflow

### Step-by-Step Review Process

1. **View Pending Verifications**
   ```
   GET /admin/pending
   ```
   - See list of all users awaiting review
   - View basic user info and submission time

2. **Select Verification to Review**
   ```
   GET /admin/:verificationId
   ```
   - View detailed user profile
   - See front and back images
   - Check LinkedIn verification status
   - Review submission timestamp

3. **Make Decision**
   
   **Option A: Approve**
   ```
   PUT /admin/:verificationId/approve
   ```
   - User's `driving_license_verified` flag set to `true`
   - User receives "verified" badge
   - Status changes to `VERIFIED`
   
   **Option B: Reject**
   ```
   PUT /admin/:verificationId/reject
   Body: { "reason": "..." }
   ```
   - User notified with rejection reason
   - User can re-upload documents
   - Status changes to `REJECTED`

4. **Audit Trail Created**
   - All actions logged automatically
   - Includes timestamp, admin ID, IP address
   - Viewable in `verification_audit_logs` table

## 🔧 Troubleshooting

### Issue: "File size exceeds 5MB limit"
**Solution**: Ask user to compress image or upload smaller file

### Issue: "Only image files are allowed"
**Solution**: Ensure file is JPG, JPEG, or PNG format

### Issue: "Admin access required"
**Solution**: 
1. Check if user email is in `ADMIN_EMAILS` environment variable
2. Verify email is comma-separated correctly
3. Restart server after changing env variables

### Issue: "Cloudinary upload failed"
**Solution**:
1. Verify Cloudinary credentials in `.env`
2. Check Cloudinary dashboard for quota limits
3. Test connection: `cloudinary.api.ping()`

### Issue: "Already has pending verification"
**Solution**: 
1. User must wait for current verification to be reviewed
2. Admin should approve/reject current verification
3. Or admin can delete the pending verification from database

### Issue: Cannot view images (404)
**Solution**:
1. Images are authenticated - need signed URLs
2. Check Cloudinary access mode is set correctly
3. Verify `frontImageSignedUrl` is being used, not direct URL

### Database Migration Failed
**Solution**:
```bash
# Check if tables exist
mysql -u root -p thursdate -e "SHOW TABLES LIKE 'driving_license%';"

# Re-run migration
node run-driving-license-migration.js

# Check migration logs for specific errors
```

## 📊 Database Queries

### Useful Admin Queries

```sql
-- Count verifications by status
SELECT verification_status, COUNT(*) as count
FROM driving_license_verifications
GROUP BY verification_status;

-- Find users with verified licenses
SELECT u.id, u.email, u.first_name, u.last_name
FROM users u
WHERE u.driving_license_verified = TRUE;

-- View recent admin actions
SELECT 
  val.id,
  val.action,
  val.created_at,
  u.email as admin_email,
  dlv.user_id
FROM verification_audit_logs val
JOIN users u ON val.admin_id = u.id
JOIN driving_license_verifications dlv ON val.verification_id = dlv.id
ORDER BY val.created_at DESC
LIMIT 10;

-- Find verifications pending for more than 24 hours
SELECT 
  dlv.id,
  dlv.user_id,
  u.email,
  dlv.submitted_at,
  TIMESTAMPDIFF(HOUR, dlv.submitted_at, NOW()) as hours_pending
FROM driving_license_verifications dlv
JOIN users u ON dlv.user_id = u.id
WHERE dlv.verification_status = 'UNDER_REVIEW'
  AND dlv.submitted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## 🎯 Best Practices

### For Users
1. ✅ Upload clear, well-lit images
2. ✅ Ensure all text is readable
3. ✅ Upload images in correct orientation
4. ✅ Don't blur or edit the license
5. ✅ Wait for review before re-submitting

### For Admins
1. ✅ Review verifications promptly
2. ✅ Provide clear rejection reasons
3. ✅ Check both front and back images
4. ✅ Verify name matches profile
5. ✅ Look for signs of tampering

### For Developers
1. ✅ Keep Cloudinary credentials secure
2. ✅ Monitor storage usage and costs
3. ✅ Regularly check audit logs
4. ✅ Set up monitoring for failed uploads
5. ✅ Implement rate limiting if needed

## 🚀 Future Enhancements

### Potential Additions
- [ ] Email notifications on approval/rejection
- [ ] SMS notifications
- [ ] Automated OCR validation
- [ ] Real-time status updates via WebSocket
- [ ] Bulk approval/rejection
- [ ] Admin dashboard with analytics
- [ ] Rate limiting on upload endpoint
- [ ] Image quality validation
- [ ] Duplicate detection
- [ ] Verification expiry (re-verify after X months)

### Optional Features (if requested)
```javascript
// Email notification example
const sendVerificationEmail = async (userId, status, reason = null) => {
  // Implement with SendGrid
};

// Rate limiting example
const rateLimit = require('express-rate-limit');
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 uploads per window
  message: 'Too many upload attempts. Please try again later.'
});
```

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check database integrity
4. Verify environment variables
5. Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: February 26, 2026  
**Maintained By**: Backend Team
