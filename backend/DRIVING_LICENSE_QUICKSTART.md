# 🚀 Driving License Verification - Quick Start

Get the driving license verification feature up and running in 5 minutes.

## ⚡ Quick Setup

### 1. Run the Migration

```bash
cd backend
npm run migrate:driving-license
```

### 2. Test the Setup

```bash
node test-driving-license-verification.js
```

### 3. Start the Server

```bash
npm start
```

That's it! The feature is ready to use.

## 📝 Quick Test with Postman

### Option 1: Import Collection
1. Open Postman
2. Click Import
3. Select file: `Driving_License_Verification.postman_collection.json`
4. Set variables:
   - `baseUrl`: http://localhost:5000
   - `userToken`: Your user JWT token
   - `adminToken`: Your admin JWT token

### Option 2: Manual Test

**User Upload:**
```
POST http://localhost:5000/api/verification/driving-license/upload
Headers:
  Authorization: Bearer YOUR_USER_TOKEN
Body (form-data):
  frontImage: [select file]
  backImage: [select file]
```

**Check Status:**
```
GET http://localhost:5000/api/verification/driving-license/status
Headers:
  Authorization: Bearer YOUR_USER_TOKEN
```

**Admin - View Pending:**
```
GET http://localhost:5000/api/verification/driving-license/admin/pending
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Admin - Approve:**
```
PUT http://localhost:5000/api/verification/driving-license/admin/{verificationId}/approve
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

## 🔑 Required Environment Variables

Make sure these are in your `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=thursdate

# Cloudinary (for image storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin access
ADMIN_EMAILS=admin@luyona.com,admin2@example.com

# JWT
JWT_SECRET=your_jwt_secret
```

## 📚 API Endpoints Overview

### User Endpoints
- `POST /api/verification/driving-license/upload` - Upload license images
- `GET /api/verification/driving-license/status` - Check status

### Admin Endpoints
- `GET /admin/pending` - Get pending verifications
- `GET /admin/all?status=VERIFIED` - Get all (with filters)
- `GET /admin/:id` - Get verification details
- `PUT /admin/:id/approve` - Approve verification
- `PUT /admin/:id/reject` - Reject with reason
- `GET /admin/stats` - Get statistics

## ✅ Verification Flow

```
User uploads → Status: UNDER_REVIEW
     ↓
Admin reviews
     ↓
   ┌─────┴─────┐
   ↓           ↓
Approve      Reject
   ↓           ↓
VERIFIED    REJECTED
             ↓
        User re-uploads
```

## 🔒 Admin Access

To become an admin:
1. Add your email to `ADMIN_EMAILS` in `.env`
2. Restart the server
3. Use your normal user token (the middleware checks email)

Example:
```env
ADMIN_EMAILS=john@example.com,sarah@example.com
```

## 📊 Database Tables Created

- `driving_license_verifications` - Stores upload submissions
- `verification_audit_logs` - Logs all admin actions
- `users.driving_license_verified` - Boolean flag on user

## 🎯 Common Use Cases

### As a User
1. Upload license → `POST /upload`
2. Wait for review
3. Check status → `GET /status`
4. If rejected → Upload again

### As an Admin
1. Get pending list → `GET /admin/pending`
2. View details → `GET /admin/:id`
3. Make decision:
   - Approve → `PUT /admin/:id/approve`
   - Reject → `PUT /admin/:id/reject` with reason

## 🐛 Troubleshooting

**Migration fails:**
```bash
# Check database connection
mysql -u root -p

# Re-run migration
npm run migrate:driving-license
```

**"Admin access required":**
- Check if your email is in `ADMIN_EMAILS`
- Verify format: `email1@domain.com,email2@domain.com`
- Restart server after changing `.env`

**Upload fails:**
- Max file size is 5MB
- Only jpg, jpeg, png allowed
- Both images required
- Can't upload while one is pending

**Can't view images:**
- Images use authenticated Cloudinary URLs
- Use the `signedUrl` fields in the response
- Direct URLs won't work publicly

## 📖 Full Documentation

For complete documentation, see: [DRIVING_LICENSE_VERIFICATION.md](./DRIVING_LICENSE_VERIFICATION.md)

Includes:
- Complete API reference
- Security features
- Database queries
- Frontend integration examples
- Best practices
- Future enhancements

## 💡 Tips

1. **Test uploads first** - Use small test images initially
2. **Check logs** - Server logs show detailed upload progress
3. **Use Postman** - Import the collection for easy testing
4. **Monitor Cloudinary** - Check usage and storage limits
5. **Regular cleanup** - Archive old rejected verifications

## 🎉 You're All Set!

The system is now ready. Start testing with the Postman collection or integrate with your frontend.

**Need help?** Check the full documentation or review the test script output.

---

**Created:** February 26, 2026  
**Version:** 1.0.0
