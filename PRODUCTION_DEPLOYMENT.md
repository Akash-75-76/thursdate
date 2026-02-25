# 🚀 Production Deployment Guide (Render + Vercel)

## ✅ Quick Deployment Checklist

This guide assumes you've already deployed:
- **Backend** on Render.com
- **Frontend** on Vercel

Follow these steps to enable LinkedIn OAuth in production.

---

## 📋 Step 1: LinkedIn Developer Console Setup

### Add Production Redirect URL

1. Go to: **https://www.linkedin.com/developers/apps**
2. Select your app (Client ID: `77r44xzn4w0iih`)
3. Click **"Auth"** tab
4. Under **"OAuth 2.0 settings"** → **"Redirect URLs"**, add **BOTH**:
   ```
   http://localhost:5000/auth/linkedin/callback
   https://sundate-backend.onrender.com/auth/linkedin/callback
   ```
   ⚠️ Replace `sundate-backend.onrender.com` with your actual Render backend URL

5. Click **"Update"**

---

## 🔧 Step 2: Configure Render.com (Backend)

### Find Your Backend URL
1. Go to: **https://dashboard.render.com/**
2. Click on your backend service
3. Copy the URL (e.g., `https://sundate-backend.onrender.com` or `https://your-service.onrender.com`)

### Set Environment Variables

1. In Render Dashboard → Your Service → **"Environment"** (left sidebar)
2. Add/Update these variables:

```env
LINKEDIN_CLIENT_ID=77r44xzn4w0iih
LINKEDIN_CLIENT_SECRET=WPL_AP1.FGIOezTAz7VSHGOM.VXe/Dw==
LINKEDIN_CALLBACK_URL=https://YOUR-BACKEND.onrender.com/auth/linkedin/callback
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
JWT_SECRET=supersecretkey123
NODE_ENV=production
```

**Important replacements:**
- Replace `YOUR-BACKEND.onrender.com` with your actual Render backend URL
- Replace `YOUR-FRONTEND.vercel.app` with your actual Vercel frontend URL

3. Click **"Save Changes"**
4. Render will automatically redeploy (wait 2-3 minutes)

---

## 🔧 Step 3: Configure Vercel (Frontend)

### Find Your Frontend URL
1. Go to: **https://vercel.com/dashboard**
2. Click on your project
3. Copy the **Production Domain** (e.g., `https://thursdate.vercel.app`)

### Set Environment Variable

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add this variable:

```
Name:  VITE_BACKEND_API_URL
Value: https://YOUR-BACKEND.onrender.com/api
```

**Important:** Replace `YOUR-BACKEND.onrender.com` with your actual Render backend URL

3. Select **"Production"** environment
4. Click **"Save"**
5. Go to **Deployments** tab
6. Click **"Redeploy"** on the latest deployment (or push new commit)

---

## 🗄️ Step 4: Run Database Migration

### Option A: Using Render Shell (Recommended)

1. In Render Dashboard → Your Service → **"Shell"** tab
2. Run:
   ```bash
   cd /opt/render/project/src
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME < migrations/add-linkedin-verified-field.sql
   ```

### Option B: Using Local MySQL Client

```bash
mysql -h mysql-3443417d-thefrick-374d.k.aivencloud.com -u avnadmin -p -P 16790 defaultdb < backend/migrations/add-linkedin-verified-field.sql
```

**When prompted, enter password:** `AVNS_dRjdlgM65y5LTScPG4V`

---

## ✅ Step 5: Verify Configuration

### Check Environment Variables

#### Render (Backend)
Go to your service → Environment and verify:
- ✅ `LINKEDIN_CLIENT_ID` is set
- ✅ `LINKEDIN_CLIENT_SECRET` is set
- ✅ `LINKEDIN_CALLBACK_URL` uses HTTPS and points to your Render URL
- ✅ `FRONTEND_URL` points to your Vercel URL
- ✅ `NODE_ENV=production`

#### Vercel (Frontend)
Go to Settings → Environment Variables and verify:
- ✅ `VITE_BACKEND_API_URL` points to your Render API URL (with `/api`)

#### LinkedIn Developer Console
- ✅ Production callback URL is added
- ✅ Callback URL uses HTTPS
- ✅ URL matches `LINKEDIN_CALLBACK_URL` exactly

---

## 🧪 Step 6: Test Production

1. Open your production frontend: `https://YOUR-FRONTEND.vercel.app`
2. Navigate to the Social Presence verification page
3. Click **"Verify with LinkedIn"**
4. You should be redirected to LinkedIn's consent screen
5. Click **"Allow"** to approve
6. You should be redirected back to your app
7. Success modal should appear
8. Check database:
   ```sql
   SELECT email, linkedin_verified FROM users WHERE email = 'your-test-email@example.com';
   ```
   Should show `linkedin_verified = 1`

---

## 🐛 Troubleshooting

### Error: "URL not found" or 404

**Problem:** Callback URL mismatch  
**Fix:** Ensure these match EXACTLY:
- LinkedIn Console redirect URL
- `LINKEDIN_CALLBACK_URL` in Render
- Should be: `https://YOUR-BACKEND.onrender.com/auth/linkedin/callback`

### Error: "Invalid redirect_uri"

**Problem:** Production callback URL not added to LinkedIn  
**Fix:** Go to LinkedIn Developer Console → Auth → Add production URL

### Frontend shows "Server configuration error"

**Problem:** Environment variables not set in Render  
**Fix:** Check Render Dashboard → Environment → Verify all variables are set

### Redirect goes to wrong URL after approval

**Problem:** `FRONTEND_URL` in Render is incorrect  
**Fix:** Update `FRONTEND_URL` to match your actual Vercel URL

### "Cannot find module" error in Render

**Problem:** Migration not deployed  
**Fix:** Ensure `backend/migrations/add-linkedin-verified-field.sql` is in your repository

---

## 📊 Production URLs Summary

Fill these in with your actual URLs:

```
LinkedIn Developer Console:
├── Callback URL: https://YOUR-BACKEND.onrender.com/auth/linkedin/callback

Render (Backend):
├── Service URL: https://YOUR-BACKEND.onrender.com
├── LINKEDIN_CLIENT_ID: 77r44xzn4w0iih
├── LINKEDIN_CLIENT_SECRET: WPL_AP1.FGIOezTAz7VSHGOM.VXe/Dw==
├── LINKEDIN_CALLBACK_URL: https://YOUR-BACKEND.onrender.com/auth/linkedin/callback
├── FRONTEND_URL: https://YOUR-FRONTEND.vercel.app
└── NODE_ENV: production

Vercel (Frontend):
├── Domain: https://YOUR-FRONTEND.vercel.app
└── VITE_BACKEND_API_URL: https://YOUR-BACKEND.onrender.com/api
```

---

## 🎉 Success Indicators

✅ LinkedIn consent screen appears when clicking "Verify with LinkedIn"  
✅ After approval, redirects back to your Vercel app  
✅ Success modal shows "LinkedIn verified"  
✅ Database shows `linkedin_verified = TRUE` for the user  
✅ JWT token is stored in localStorage  
✅ Can proceed to next onboarding step  

---

## 🔒 Security Checklist

✅ All production URLs use HTTPS  
✅ No localhost URLs in production config  
✅ Environment variables set in Render (not in code)  
✅ JWT_SECRET is secure (not default value)  
✅ LinkedIn credentials not committed to git  
✅ NODE_ENV=production in Render  

---

## 📞 Support

If you encounter issues:

1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
3. Check browser console for errors
4. Verify environment variables are saved correctly

**Common mistakes:**
- Forgetting to add production callback URL to LinkedIn
- Using HTTP instead of HTTPS in production
- Typos in Render/Vercel URLs
- Not redeploying after setting environment variables
