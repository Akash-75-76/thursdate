# 🚀 DEPLOYMENT CHECKLIST - LinkedIn OAuth Configuration

## Before You Start

Make sure you have:
- [ ] Access to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
- [ ] Access to [Render Dashboard](https://dashboard.render.com/)
- [ ] Access to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Your production URLs:
  - Backend: `https://sundate-backend.onrender.com`
  - Frontend: `https://your-frontend.vercel.app` (update this)

---

## ✅ Deployment Steps

### 1️⃣ LinkedIn Developer Console

**URL**: https://www.linkedin.com/developers/apps

**Action**: Add production callback URL

- [ ] Go to your app (Client ID: `77r44xzn4w0iih`)
- [ ] Click "Auth" tab
- [ ] Under "Redirect URLs", add:
  ```
  https://sundate-backend.onrender.com/auth/linkedin/callback
  ```
- [ ] Keep existing localhost URL:
  ```
  http://localhost:5000/auth/linkedin/callback
  ```
- [ ] Click "Update"

**✅ Verification**: You should see 2 redirect URLs listed

---

### 2️⃣ Render.com (Backend)

**URL**: https://dashboard.render.com/

**Action**: Set environment variables

- [ ] Select service: **sundate-backend**
- [ ] Click "Environment" in sidebar
- [ ] Add/Update these 5 variables:

| Variable | Value |
|----------|-------|
| `LINKEDIN_CLIENT_ID` | `77r44xzn4w0iih` |
| `LINKEDIN_CLIENT_SECRET` | `WPL_AP1.7HC24pMHdvWWyYEx.KpXfQw==` |
| `LINKEDIN_CALLBACK_URL` | `https://sundate-backend.onrender.com/auth/linkedin/callback` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` ⚠️ UPDATE THIS |
| `JWT_SECRET` | `supersecretkey123` |

- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy (2-3 minutes)

**✅ Verification**: Go to "Logs" tab, you should see server restart

---

### 3️⃣ Vercel (Frontend)

**URL**: https://vercel.com/dashboard

**Action**: Set environment variable

- [ ] Select your project
- [ ] Click "Settings" → "Environment Variables"
- [ ] Add this variable:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_BACKEND_API_URL` | `https://sundate-backend.onrender.com/api` | ✅ Production, ✅ Preview, ✅ Development |

⚠️ **Important**: Include `/api` at the end

- [ ] Click "Save"
- [ ] Go to "Deployments" tab
- [ ] Click "..." on latest deployment → "Redeploy"
- [ ] Wait for build to complete (1-2 minutes)

**✅ Verification**: Check deployment logs for successful build

---

### 4️⃣ Test Production

- [ ] Open your production frontend: `https://your-frontend.vercel.app`
- [ ] Navigate to LinkedIn verification page
- [ ] Open browser console (F12)
- [ ] Click "Verify with LinkedIn"
- [ ] Check console for log:
  ```
  🔗 LinkedIn OAuth - Redirecting to: https://sundate-backend.onrender.com/auth/linkedin
  ```
- [ ] You should see LinkedIn consent screen
- [ ] After approval, you should be redirected back with success

**✅ Verification**: User can complete LinkedIn verification flow

---

### 5️⃣ Test Locally (Regression Test)

- [ ] Make sure `backend/.env` has:
  ```
  LINKEDIN_CALLBACK_URL=http://localhost:5000/auth/linkedin/callback
  FRONTEND_URL=http://localhost:5173
  ```
- [ ] Make sure `frontend/.env` has:
  ```
  VITE_BACKEND_API_URL=http://localhost:5000/api
  ```
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Test at `http://localhost:5173`
- [ ] LinkedIn verification should still work locally

**✅ Verification**: Local development still works

---

## 🐛 Troubleshooting

### Issue: "URL not found" in production

**Cause**: Environment variables not set in Render

**Fix**:
1. Go to Render Dashboard → Environment
2. Verify all 5 variables are present
3. Click "Manual Deploy" → "Deploy latest commit"

---

### Issue: "redirect_uri_mismatch"

**Cause**: LinkedIn Console URL doesn't match callback URL

**Fix**:
1. Check Render environment variable `LINKEDIN_CALLBACK_URL`
2. Check LinkedIn Developer Console "Redirect URLs"
3. Make sure they match EXACTLY (including https/http)

---

### Issue: Frontend still crashes

**Cause**: Old code still deployed

**Fix**:
1. Pull latest code with the fix
2. Commit and push to git
3. Vercel will auto-deploy
4. Or manually redeploy in Vercel Dashboard

---

### Issue: Logs show "undefined" for callback URL

**Cause**: Environment variables not loaded

**Fix**:
1. Render Dashboard → Environment
2. Make sure `LINKEDIN_CALLBACK_URL` is set
3. Click "Save Changes" (forces redeploy)
4. Wait 3 minutes
5. Check logs again

---

## 📊 Quick Health Check

Run these checks after deployment:

### Check Backend Logs (Render):
```
Should see in logs when server starts:
✅ Cloudinary connection successful
✅ Server running on port 10000
✅ Socket.IO server ready
```

### Check Frontend Build (Vercel):
```
Should see in build logs:
✅ vite v4.x.x building for production...
✅ ✓ built in X seconds
```

### Check LinkedIn OAuth Init:
```
When clicking "Verify with LinkedIn", backend logs should show:
🔄 STEP 1: Initiating LinkedIn OAuth flow
Client ID: 77r44xzn4w0iih
Callback URL: https://sundate-backend.onrender.com/auth/linkedin/callback
```

### Check LinkedIn Callback:
```
After user approves, backend logs should show:
📥 STEP 2: LinkedIn Callback
✅ LinkedIn access token received
✅ LinkedIn user info received
✅ JWT token generated
```

---

## 🎯 Sign-Off Checklist

Before marking as "DONE":

- [ ] LinkedIn Developer Console shows 2 redirect URLs (local + production)
- [ ] Render shows all 5 environment variables set
- [ ] Vercel shows `VITE_BACKEND_API_URL` environment variable
- [ ] Production frontend successfully redirects to LinkedIn
- [ ] After LinkedIn approval, user is redirected back successfully
- [ ] Browser console shows correct backend URL in logs
- [ ] Backend logs show successful OAuth flow (STEP 1, 2, 3)
- [ ] Local development still works (regression test passed)
- [ ] No errors in Render logs
- [ ] No errors in Vercel build logs
- [ ] No errors in browser console

---

## 📝 Documentation Updated

- [x] `frontend/src/pages/onboarding/SocialPresence.jsx` - Added fallback
- [x] `backend/.env.example` - Added LinkedIn configuration
- [x] `LINKEDIN_OAUTH_FIX.md` - Complete fix guide
- [x] `DEPLOYMENT_CHECKLIST.md` - This file

---

## 🔗 Important Links

- **LinkedIn Developer Console**: https://www.linkedin.com/developers/apps
- **Render Dashboard**: https://dashboard.render.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **LinkedIn OAuth Docs**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication

---

**Last Updated**: February 24, 2026

**Status**: 
- ✅ Frontend bug fixed
- ⏳ Awaiting production deployment configuration
- 📝 Testing checklist ready
