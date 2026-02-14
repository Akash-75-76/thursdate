# Admin Login Production Fix Guide

## Problem
Admin login works locally but fails in production on Render.

## Root Cause
1. **Local**: Mock admin bypass (`admin@luyona.com` / `adminpassword`) works without backend validation
2. **Production**: Mock bypass is now disabled in production for security
3. **Missing Config**: `ADMIN_EMAILS` environment variable not set on Render

## Solution: Configure Admin Access on Render

### Step 1: Set ADMIN_EMAILS Environment Variable

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your `thursdate-backend` service
3. Click **Environment** tab in the left sidebar
4. Find `ADMIN_EMAILS` or click **Add Environment Variable**
5. Set the value to your admin email(s):
   ```
   ADMIN_EMAILS=arjundeshmukh26@gmail.com,chinmay@thefrick.in,varsha@thefrick.in,sanjana.acharya@thefrick.in
   ```
6. Click **Save Changes** (service will automatically redeploy)

### Step 2: Create/Login with Admin Account

**Option A: Use Existing Account**
1. If `arjundeshmukh26@gmail.com` already has an account, just login with it
2. You'll automatically have admin access

**Option B: Create New Admin Account**
1. Go to your production app
2. Register a new account with one of the emails from `ADMIN_EMAILS`
3. Complete OTP verification
4. Login - you now have admin access

### Step 3: Access Admin Panel
1. Navigate to: `https://your-app.vercel.app/admin/login`
2. Login with your admin email and password
3. You should now see the admin dashboard

## Verification

To verify ADMIN_EMAILS is set correctly on Render:

1. Check Render logs:
   ```
   ADMIN_EMAILS: Set ✓
   ```

2. Or run the setup script locally to check:
   ```bash
   cd backend
   node setup-admin.js
   ```

## Security Improvements Applied

✅ Mock admin bypass now only works in development (not production)
✅ Production requires real user accounts with emails in ADMIN_EMAILS
✅ Backend validates admin access on every admin route

## Current Admin Emails (Local)
- arjundeshmukh26@gmail.com
- chinmay@thefrick.in
- varsha@thefrick.in
- sanjana.acharya@thefrick.in

## Troubleshooting

**Still can't login?**
1. Check Render environment variables are saved
2. Wait 2-3 minutes for service to redeploy
3. Clear browser cache/cookies
4. Try registering with a new account using an email from ADMIN_EMAILS

**403 Forbidden Error?**
- Your email is not in the ADMIN_EMAILS list on Render
- Add it and redeploy

**Invalid credentials?**
- Make sure you've registered the account first
- OTP must be verified
- Password must match what you set during registration
