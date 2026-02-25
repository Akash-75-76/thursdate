# 🚀 Quick Production Setup (5 Minutes)

## Copy-Paste Ready Configuration

### 1️⃣ LinkedIn Developer Console
🔗 https://www.linkedin.com/developers/apps

Add this redirect URL:
```
https://sundate-backend.onrender.com/auth/linkedin/callback
```
*(Replace `sundate-backend` with your actual Render service name)*

---

### 2️⃣ Render.com Environment Variables
🔗 https://dashboard.render.com/

**Go to:** Your Service → Environment → Add Variables

Copy-paste these (update URLs):
```
LINKEDIN_CLIENT_ID=77r44xzn4w0iih
LINKEDIN_CLIENT_SECRET=WPL_AP1.FGIOezTAz7VSHGOM.VXe/Dw==
LINKEDIN_CALLBACK_URL=https://YOUR-BACKEND.onrender.com/auth/linkedin/callback
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
NODE_ENV=production
```

**Replace:**
- `YOUR-BACKEND.onrender.com` = Your actual Render backend URL
- `YOUR-FRONTEND.vercel.app` = Your actual Vercel frontend URL

---

### 3️⃣ Vercel Environment Variable
🔗 https://vercel.com/dashboard

**Go to:** Your Project → Settings → Environment Variables

Add:
```
Name:  VITE_BACKEND_API_URL
Value: https://YOUR-BACKEND.onrender.com/api
```

**Replace:** `YOUR-BACKEND.onrender.com` with your Render backend URL

Then: **Redeploy** your app (Deployments tab)

---

### 4️⃣ Database Migration

**Option A - Render Shell:**
```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -P $DB_PORT $DB_NAME < migrations/add-linkedin-verified-field.sql
```

**Option B - Local:**
```bash
mysql -h mysql-3443417d-thefrick-374d.k.aivencloud.com -u avnadmin -p -P 16790 defaultdb < backend/migrations/add-linkedin-verified-field.sql
```
Password: `AVNS_dRjdlgM65y5LTScPG4V`

---

## ✅ Test Production

1. Open: `https://YOUR-FRONTEND.vercel.app`
2. Go to Social Presence page
3. Click "Verify with LinkedIn"
4. Should redirect to LinkedIn → Approve → Return with success! ✨

---

## 🐛 If Something Breaks

| Error | Fix |
|-------|-----|
| "URL not found" | Add callback URL to LinkedIn Console |
| "Invalid redirect_uri" | URLs must match exactly (check HTTPS) |
| "Server config error" | Check Render environment variables |
| Backend logs show missing env | Verify variables saved and redeployed |

---

## 📋 Checklist

- [ ] Added production callback URL to LinkedIn
- [ ] Set 5 environment variables in Render
- [ ] Set 1 environment variable in Vercel
- [ ] Redeployed Vercel frontend
- [ ] Ran database migration
- [ ] Tested end-to-end
- [ ] Verified `linkedin_verified = TRUE` in database

---

**Done!** 🎉 LinkedIn OAuth now works in production.

**Full docs:** See `PRODUCTION_DEPLOYMENT.md` for detailed troubleshooting.
