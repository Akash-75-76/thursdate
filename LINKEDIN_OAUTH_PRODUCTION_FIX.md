# 🔧 LinkedIn OAuth Production Fix Guide

## 🐛 Problem
LinkedIn authentication works locally but fails on production with error:
```
ERR_INVALID_REDIRECT
sundate-backend.onrender.com sent an invalid response
```

## 🎯 Root Cause
The LinkedIn OAuth callback URL and environment variables are configured for localhost, not production URLs.

## ✅ Solution: 3-Step Fix

---

### **Step 1: Update LinkedIn Developer App Settings**

1. Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
2. Select your app (Client ID: `77r44xzn4w0iih`)
3. Click on **"Auth"** tab
4. Under **"OAuth 2.0 settings"**, find **"Redirect URLs"**
5. **ADD** this production callback URL:
   ```
   https://sundate-backend.onrender.com/auth/linkedin/callback
   ```
   ⚠️ Keep the localhost URL for development:
   ```
   http://localhost:5000/auth/linkedin/callback
   ```

6. Click **"Update"** to save

---

### **Step 2: Configure Environment Variables on Render.com**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service: **sundate-backend**
3. Click **"Environment"** in the left sidebar
4. **Add/Update** these environment variables:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `LINKEDIN_CLIENT_ID` | `77r44xzn4w0iih` | From LinkedIn Developer App |
   | `LINKEDIN_CLIENT_SECRET` | `WPL_AP1.7HC24pMHdvWWyYEx.KpXfQw==` | From LinkedIn Developer App |
   | `LINKEDIN_CALLBACK_URL` | `https://sundate-backend.onrender.com/auth/linkedin/callback` | ⚠️ **CRITICAL**: Must match LinkedIn settings |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Replace with your actual Vercel URL |

5. Click **"Save Changes"**
6. Render will **automatically redeploy** your backend

---

### **Step 3: Update Frontend LinkedIn Button (if needed)**

Verify your frontend LinkedIn button points to the correct production backend URL:

```javascript
// frontend/src/pages/onboarding/SocialPresence.jsx (or wherever LinkedIn button is)
const handleLinkedInVerification = () => {
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://sundate-backend.onrender.com';
  window.location.href = `${backendUrl}/auth/linkedin`;
};
```

---

## 🔍 How to Find Your Frontend URL

If you don't know your Vercel frontend URL:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Copy the **Production Domain** (e.g., `https://thursdate.vercel.app`)
4. Use this as your `FRONTEND_URL` in Render environment variables

---

## 📊 OAuth Flow (For Understanding)

```
User clicks "Verify with LinkedIn"
    ↓
Frontend redirects to: https://sundate-backend.onrender.com/auth/linkedin
    ↓
Backend redirects to: LinkedIn OAuth consent page
    ↓
User approves → LinkedIn redirects to: 
    https://sundate-backend.onrender.com/auth/linkedin/callback?code=...
    ↓
Backend exchanges code for access token
    ↓
Backend fetches user info from LinkedIn
    ↓
Backend saves to database & generates JWT
    ↓
Backend redirects to: 
    https://your-frontend.vercel.app/social-presence?linkedin_verified=true&token=...
    ↓
Frontend handles success ✅
```

---

## 🧪 Testing After Fix

1. Open your production frontend URL
2. Navigate to LinkedIn verification step
3. Click "Verify with LinkedIn"
4. You should see LinkedIn consent screen
5. After approval, you should be redirected back to your app with success

---

## 🚨 Common Issues

### Issue: "redirect_uri_mismatch" error
**Cause:** Callback URL in LinkedIn app doesn't match `LINKEDIN_CALLBACK_URL`
**Fix:** Make sure they match exactly (including https:// and trailing slashes)

### Issue: Still redirecting to localhost
**Cause:** Environment variables not updated on Render
**Fix:** Check Render dashboard → Environment → Verify variables → Force redeploy

### Issue: "Invalid client credentials"
**Cause:** Wrong Client ID or Secret
**Fix:** Copy-paste credentials again from LinkedIn Developer App

---

## 📝 Quick Checklist

- [ ] LinkedIn Developer App has production callback URL
- [ ] Render has `LINKEDIN_CALLBACK_URL` set to production URL
- [ ] Render has `FRONTEND_URL` set to Vercel URL
- [ ] Render has correct `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- [ ] Backend redeployed after environment variable changes
- [ ] Tested on production

---

## 🔗 Useful Links

- [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
- [Render Dashboard](https://dashboard.render.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [LinkedIn OAuth 2.0 Docs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)

---

## 💡 Pro Tips

1. **Keep localhost URLs for development**: Don't remove localhost callback URLs from LinkedIn app - you need both!

2. **Environment variables take precedence**: Render environment variables override `.env` file (which isn't deployed anyway)

3. **Check logs**: If still not working, check Render logs:
   - Render Dashboard → Your Service → Logs
   - Look for "LinkedIn callback error" messages

4. **Test locally first**: Make sure it works on localhost before debugging production

---

**Need Help?** Check the LinkedIn callback route code at:
`backend/routes/linkedin-auth.js`
