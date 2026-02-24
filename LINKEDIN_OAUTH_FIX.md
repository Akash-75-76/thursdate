# 🔧 LinkedIn OAuth Production Fix - Complete Guide

## 🚨 Problem Statement

**Symptom**: LinkedIn verification works on localhost but fails in production with:
- "URL not found" error
- "ERR_INVALID_REDIRECT" error
- Or redirect to wrong URL

**Root Cause**: OAuth redirect URI mismatch between:
1. What's registered in LinkedIn Developer Console
2. What's configured in environment variables
3. What the backend is actually sending to LinkedIn

---

## ✅ THE FIX (Step-by-Step)

### 📋 **STEP 0: Gather Information (Required)**

Before starting, you need to know:

1. **Your Frontend Production URL**
   - Example: `https://thursdate.vercel.app`
   - Find it in [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → "Domains"

2. **Your Backend Production URL**
   - Example: `https://sundate-backend.onrender.com`
   - Find it in [Render Dashboard](https://dashboard.render.com/) → Your Service → "Settings"

3. **Your LinkedIn App Credentials**
   - Client ID: `77r44xzn4w0iih` (from your current .env)
   - Client Secret: `WPL_AP1.7HC24pMHdvWWyYEx.KpXfQw==` (from your current .env)
   - Get them from: [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)

---

### 🔧 **STEP 1: Fix Frontend Code (CRITICAL BUG)**

**✅ ALREADY FIXED** - The code now has a fallback:

```javascript
// frontend/src/pages/onboarding/SocialPresence.jsx
const handleLinkedInOAuth = () => {
    const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'https://sundate-backend.onrender.com/api';
    const backendUrl = backendApiUrl.replace('/api', '');
    
    console.log('🔗 LinkedIn OAuth - Redirecting to:', `${backendUrl}/auth/linkedin`);
    window.location.href = `${backendUrl}/auth/linkedin`;
};
```

**What this fixes**: Prevents crash when `VITE_BACKEND_API_URL` is undefined.

---

### 🌐 **STEP 2: Configure LinkedIn Developer Console**

1. Go to: https://www.linkedin.com/developers/apps
2. Sign in with LinkedIn account
3. Click on your app (or create one if needed)
4. Go to **"Auth"** tab
5. Scroll to **"OAuth 2.0 settings"**
6. Under **"Redirect URLs"**, you must have BOTH:

   ```
   http://localhost:5000/auth/linkedin/callback
   https://sundate-backend.onrender.com/auth/linkedin/callback
   ```

   ⚠️ **CRITICAL**: 
   - URLs must match EXACTLY (https vs http, trailing slashes)
   - Replace `sundate-backend.onrender.com` with YOUR actual backend URL
   - Keep localhost for local development

7. Click **"Update"** to save changes

---

### 🚀 **STEP 3: Configure Render.com (Backend Environment Variables)**

1. Go to: https://dashboard.render.com/
2. Select your backend service: **sundate-backend**
3. Click **"Environment"** in left sidebar
4. Add/Update these variables:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `LINKEDIN_CLIENT_ID` | `77r44xzn4w0iih` | From LinkedIn Developer Console |
   | `LINKEDIN_CLIENT_SECRET` | `WPL_AP1.7HC24pMHdvWWyYEx.KpXfQw==` | From LinkedIn Developer Console |
   | `LINKEDIN_CALLBACK_URL` | `https://sundate-backend.onrender.com/auth/linkedin/callback` | ⚠️ Must match LinkedIn Console EXACTLY |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Replace with YOUR Vercel URL |
   | `JWT_SECRET` | `supersecretkey123` | Use your existing value |

5. Click **"Save Changes"**
6. Render will automatically redeploy (wait 2-3 minutes)

**⚠️ IMPORTANT**: 
- `.env` and `.env.production` files are NOT deployed to Render
- Environment variables MUST be set in Render Dashboard
- After saving, Render automatically redeploys

---

### 🎨 **STEP 4: Configure Vercel (Frontend Environment Variables)**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **"Settings"** → **"Environment Variables"**
4. Add this variable:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `VITE_BACKEND_API_URL` | `https://sundate-backend.onrender.com/api` | Production, Preview, Development |

   ⚠️ **Note**: Include `/api` at the end

5. Click **"Save"**
6. **Redeploy**: Go to "Deployments" → Click "..." on latest deployment → "Redeploy"

**Why this is needed**: 
- Vite environment variables must be set at build time
- The `.env.production` file is not enough if you're building locally
- Vercel needs these variables to inject them during build

---

### 🧪 **STEP 5: Test the Complete Flow**

#### **Test Production:**

1. Open your production frontend: `https://your-frontend.vercel.app`
2. Navigate to the LinkedIn verification page
3. Click "Verify with LinkedIn"
4. **Expected behavior:**
   - You should see LinkedIn's consent screen
   - URL should be: `https://www.linkedin.com/oauth/v2/authorization?...`
   - After approval, you should be redirected back to your app
   - You should see success message

5. **Check browser console** for this log:
   ```
   🔗 LinkedIn OAuth - Redirecting to: https://sundate-backend.onrender.com/auth/linkedin
   ```

#### **Test Locally:**

1. Make sure `.env` files are correct:
   ```bash
   # backend/.env
   LINKEDIN_CALLBACK_URL=http://localhost:5000/auth/linkedin/callback
   FRONTEND_URL=http://localhost:5173

   # frontend/.env
   VITE_BACKEND_API_URL=http://localhost:5000/api
   ```

2. Run both servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. Test at: `http://localhost:5173`

---

## 🔍 Debugging Production Issues

### Check Render Logs:

1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Look for these lines when testing:

```
🔄 STEP 1: Initiating LinkedIn OAuth flow
Client ID: 77r44xzn4w0iih
Callback URL: https://sundate-backend.onrender.com/auth/linkedin/callback
📥 STEP 2: LinkedIn Callback
```

### Common Errors & Solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| **"URL not found"** | Render env variables not set | Go to Render Dashboard → Environment |
| **"redirect_uri_mismatch"** | LinkedIn Console URL doesn't match `LINKEDIN_CALLBACK_URL` | Make them match EXACTLY |
| **Frontend crashes** | `VITE_BACKEND_API_URL` undefined | Already fixed with fallback |
| **"Invalid client credentials"** | Wrong Client ID or Secret | Copy-paste from LinkedIn Developer Console |
| **Redirects to localhost** | Environment variables not loaded | Redeploy on Render after setting variables |

### Verify Environment Variables are Loaded:

**Check Render (Backend):**
```bash
# In Render Shell (Dashboard → Shell tab)
echo $LINKEDIN_CALLBACK_URL
echo $FRONTEND_URL
```

**Check Vercel (Frontend):**
```javascript
// Add this temporarily in your code:
console.log('Backend URL:', import.meta.env.VITE_BACKEND_API_URL);
```

---

## 📊 OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Verify with LinkedIn"                       │
│    Frontend: https://your-frontend.vercel.app               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend redirects to Backend:                           │
│    https://sundate-backend.onrender.com/auth/linkedin       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend redirects to LinkedIn:                           │
│    https://www.linkedin.com/oauth/v2/authorization          │
│    - client_id: 77r44xzn4w0iih                              │
│    - redirect_uri: https://sundate-backend.onrender.com/... │
│    - scope: openid profile email                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User approves on LinkedIn                                │
│    LinkedIn redirects back with authorization code:         │
│    https://sundate-backend.onrender.com/auth/linkedin/      │
│           callback?code=AQT...&state=...                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend exchanges code for access token                  │
│    POST https://www.linkedin.com/oauth/v2/accessToken       │
│    - code: AQT...                                            │
│    - redirect_uri: (MUST MATCH EXACTLY)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend fetches user info from LinkedIn                  │
│    GET https://api.linkedin.com/v2/userinfo                 │
│    Authorization: Bearer {access_token}                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend saves to database & generates JWT                │
│    - Save LinkedIn profile URL                              │
│    - Generate app JWT token                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend redirects to Frontend with success:              │
│    https://your-frontend.vercel.app/social-presence?        │
│           linkedin_verified=true&token=...                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend handles success                                 │
│    - Stores JWT token in localStorage                       │
│    - Shows success message                                  │
│    - User continues onboarding                              │
└─────────────────────────────────────────────────────────────┘
```

**⚠️ CRITICAL**: The `redirect_uri` in steps 3 and 5 MUST be identical.

---

## 🔐 Security Checklist

- [x] **OAuth 2.0 Used**: ✅ No manual credential handling
- [x] **LinkedIn Handles Login**: ✅ Users log in on LinkedIn.com, not in your app
- [x] **HTTPS in Production**: ✅ All production URLs use HTTPS
- [x] **JWT Tokens Secured**: ✅ Using JWT_SECRET for signing
- [x] **Callback on Backend**: ✅ Backend handles OAuth callback (not frontend-only route)
- [x] **State Parameter**: ✅ Used for CSRF protection

---

## 📝 Quick Reference

### Current Configuration:

| Item | Local | Production |
|------|-------|------------|
| **Frontend** | `http://localhost:5173` | `https://your-frontend.vercel.app` |
| **Backend** | `http://localhost:5000` | `https://sundate-backend.onrender.com` |
| **LinkedIn Client ID** | `77r44xzn4w0iih` | `77r44xzn4w0iih` (same) |
| **Callback URL** | `http://localhost:5000/auth/linkedin/callback` | `https://sundate-backend.onrender.com/auth/linkedin/callback` |

### Backend Routes:

- **Initiate OAuth**: `GET /auth/linkedin`
  - Redirects to LinkedIn
- **OAuth Callback**: `GET /auth/linkedin/callback`
  - Receives code from LinkedIn
  - Exchanges for token
  - Saves to database
  - Redirects to frontend

### Files Modified:

- ✅ `frontend/src/pages/onboarding/SocialPresence.jsx` - Added fallback for backend URL
- ✅ `backend/.env.example` - Added LinkedIn configuration documentation

---

## 🎯 Final Verification Checklist

Before considering this fixed, verify:

- [ ] LinkedIn Developer Console has production callback URL registered
- [ ] Render has all 5 environment variables set correctly
- [ ] Vercel has `VITE_BACKEND_API_URL` set correctly
- [ ] Both platforms have been redeployed after setting variables
- [ ] Tested on production and LinkedIn consent screen appears
- [ ] After approval, user is redirected back to your app successfully
- [ ] Browser console shows correct backend URL in logs
- [ ] Database shows LinkedIn profile URL saved for user
- [ ] JWT token is stored in localStorage
- [ ] User can continue to next onboarding step

---

## 🆘 Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Check Render Logs**: Look for error messages
2. **Check Browser Console**: Look for JavaScript errors
3. **Check Network Tab**: See what URLs are being called
4. **Verify LinkedIn App Status**: Make sure it's not in draft mode
5. **Try Different LinkedIn Account**: Some accounts have restrictions
6. **Clear Browser Cache**: Old redirects might be cached
7. **Wait 5 Minutes**: Environment variable changes take time to propagate

**Get Help**:
- LinkedIn OAuth Docs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- Render Support: https://render.com/docs
- Vercel Support: https://vercel.com/docs

---

**Last Updated**: February 24, 2026
**Status**: Frontend bug fixed, deployment configuration steps documented
