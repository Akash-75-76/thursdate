# 🚀 Interests Refactoring + Onboarding Fixes - Deployment Checklist

**Version:** 1.0  
**Date:** 2024  
**Components:** Backend + Frontend  
**Status:** Ready for Production

---

## Pre-Deployment Verification (Lead)

- [ ] All tests passed (see TESTING_REPORT.md)
- [ ] No merge conflicts or blocking PRs
- [ ] Approval from QA team
- [ ] Any on-call rotations notified
- [ ] Rollback plan reviewed (see below)

---

## Backend Deployment

### 1. Database Migration (CRITICAL - Execute First)

```bash
# Location: backend/migrations/add-onboarding-current-step.sql

sqlite3 database.db < add-onboarding-current-step.sql
# OR
mysql -u root -p database_name < add-onboarding-current-step.sql
# OR
psql -U postgres -d database_name -f add-onboarding-current-step.sql
```

**Verify Migration:**
```sql
-- Check column exists
DESCRIBE users;  -- Should show onboarding_current_step INT DEFAULT 1

-- Check index created
SHOW INDEX FROM users WHERE Column_name = 'onboarding_current_step';

-- Sample check
SELECT id, firstName, onboarding_current_step FROM users LIMIT 5;
```

**Expected:**
- ✅ Column added to users table
- ✅ Existing users backfilled with correct step (1, 7, or 14)
- ✅ Index created on onboarding_current_step

### 2. Deploy Backend Code

**Files Changed:**
- `backend/server.js` - (Review any config changes)
- `backend/routes/user.js` - (Step tracking + rejection status)
- `backend/config/db.js` - (No changes needed)

**Deploy Steps:**
```bash
cd backend

# 1. Verify syntax
node -c server.js
node -c routes/user.js

# 2. Backup current version
cp -r . ../backend_backup_$(date +%Y%m%d_%H%M%S)

# 3. Pull new code
git pull origin main

# 4. Install/update dependencies (if needed)
npm install

# 5. Run pre-deploy check
node pre-deploy-check.js

# 6. Start server (staging first)
npm start
```

**Verify Backend:**
```bash
# Check health endpoint
curl http://localhost:5000/health

# Test user profile endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/user/profile

# Should return drivingLicenseVerifications field
```

---

## Frontend Deployment

### 1. Key Files Changed

- `src/utils/interests.js` - ⭐ **Completely refactored** (Hardcoded → Datamuse API)
- `src/pages/onboarding/UserIntent.jsx` - Updated with debounce + API integration
- `src/pages/onboarding/Login.jsx` - Fixed routing logic
- `src/utils/onboardingPersistence.js` - Extended expiry (7→30 days)

### 2. Deploy Steps

```bash
cd frontend

# 1. Verify syntax
node -c src/utils/interests.js
node -c src/pages/onboarding/UserIntent.jsx

# 2. Backup current version
cp -r . ../frontend_backup_$(date +%Y%m%d_%H%M%S)

# 3. Pull new code
git pull origin main

# 4. Install/update dependencies
npm install

# 5. Build production bundle
npm run build

# Expected: ✅ Built successfully in ~9 seconds

# 6. Test build locally
npm run dev
# Navigate to: http://localhost:5173
```

### 3. Verify Frontend Build

```bash
# Check build output
ls -lh dist/
# Expected: dist/index.html, dist/assets/

# Verify no errors in build
npm run build 2>&1 | grep -i error
# Expected: No output (no errors)

# Verify assets
file dist/assets/*.js
# Expected: JavaScript data or application/wasm
```

### 4. Manual Testing Checklist

**Onboarding Flow (Fresh User):**
- [ ] Start signup → Should progress through all steps smoothly
- [ ] Reach Step 6 (Interests) → Type in search box
- [ ] Verify suggestions appear after 300ms
- [ ] Type more characters → Verify suggestions update
- [ ] Pause typing → Verify no extra API calls in console
- [ ] Continue onboarding → Finish without errors

**Interests Specifically:**
- [ ] Type "photo" → Receive photography-related suggestions
- [ ] Type "cook" → Receive cooking-related suggestions
- [ ] Type "climb" → Receive climbing-related suggestions
- [ ] Select 1-5 interests → Verify stored in localStorage
- [ ] Refresh page → Verify interests persist
- [ ] Clear browser cache → Re-enter interests

**Resume Functionality:**
- [ ] Complete Step 2 (UserInfo)
- [ ] Logout
- [ ] Login again
- [ ] Should go to Step 3 (UserIntent), not Step 1 ✅ **BUG FIX #1**
- [ ] Logout again
- [ ] Login after 30+ days → Should still go to correct step (DB tracks) ✅ **BUG FIX #2**

**Login Routing:**
- [ ] Fresh user → Send to /user-info
- [ ] User with name only → Send to /user-intent
- [ ] User fully approved → Send to /home
- [ ] User pending → Send to /waitlist-status

**Error Handling:**
- [ ] Disconnect internet → Try searching interests
- [ ] Should show empty list gracefully (no crash)
- [ ] Reconnect → Search again → Should work

---

## Staging Environment

### 1. Deploy to Staging

```bash
# Add staging remote if not exists
git remote add staging your-staging-repo

# Deploy both backend and frontend
git push staging main

# Verify staging deploys successfully
# Check logs for errors
```

### 2. Staging Smoke Tests

**Endpoint Tests:**
```bash
# Test login + profile fetch + step return
curl -X POST https://staging.yourapp.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"..."}'

# Verify response includes onboarding_current_step
```

**UI Tests:**
- [ ] Login to staging
- [ ] Navigate to onboarding
- [ ] Test interests search with various queries
- [ ] Verify localStorage persists
- [ ] Test logout/login resume

**API Tests:**
- [ ] Datamuse API responds (no blocks/filters)
- [ ] Response times < 500ms
- [ ] Error handling works

### 3. Monitoring Setup

```bash
# Monitor these metrics:
- API call count to Datamuse (should decrease vs before)
- User onboarding completion rate (should improve)
- Error rates in logs (should be ~0 for new code)
- Login routing correctness (should fix the reported bug)
```

---

## Production Deployment

### 1. Pre-Production Checklist

- [ ] All staging tests passed
- [ ] Team approval obtained
- [ ] On-call engineer standing by
- [ ] Communication sent (if needed)
- [ ] Database backed up
- [ ] Rollback plan ready

### 2. Deployment

```bash
# Option 1: Standard Push
git push origin main
git push origin production

# Option 2: Manual deployment (Render, Vercel, etc.)
# Follow your platform's deployment instructions
```

### 3. Post-Deployment Verification

**Immediate (First 5 minutes):**
```bash
# Check server health
curl https://yourapp.com/health
# Expected: 200 OK

# Check API responsiveness
curl https://yourapp.com/api/health
# Expected: 200 OK with metadata

# Monitor error logs
tail -f logs/error.log
# Expected: No errors related to interests or routing
```

**Within 1 Hour:**
- [ ] Access signup page → No errors in console
- [ ] Complete partial signup → Verify resume works
- [ ] Test interests search → Verify suggestions appear
- [ ] Check database → Verify migration applied
- [ ] Monitor API usage → Should be lower than before

**Within 4 Hours:**
- [ ] Monitor user metrics → Completion rate improving
- [ ] Check support tickets → No related complaints
- [ ] Review logs → No patterns of errors
- [ ] Performance metrics → No slowdowns

---

## Rollback Plan

### Quick Rollback (< 5 minutes)

**If critical issue found:**

```bash
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. Revert database (if needed)
# Restore from backup:
sqlite3 database.db < database_backup.sql

# 3. Redeploy previous version
# Follow your deployment process
```

### Database Rollback (if migration caused issues)

```bash
# Backup current state
mysqldump -u root -p database_name > database_rollback_backup.sql

# Drop column (if needed)
ALTER TABLE users DROP COLUMN onboarding_current_step;

# OR restore from previous backup
mysql -u root -p database_name < database_backup_before_migration.sql
```

### Frontend Rollback

```bash
# Revert frontend code
git revuert HEAD -- src/

# Redeploy previous build
npm run build
# Deploy to CDN/server
```

---

## Post-Deployment Monitoring

### 24-Hour Metrics

Track these KPIs:
- [ ] Error rate < 0.1%
- [ ] API response times < 500ms (interests search)
- [ ] User onboarding completion rate increase
- [ ] No spike in login failures
- [ ] No spike in support tickets

### Check These Logs

```bash
# Errors related to interests
grep "interest" logs/error.log | head -20

# Errors related to onboarding
grep "onboarding" logs/error.log | head -20

# Datamuse API errors
grep "Datamuse\|api.datamuse" logs/error.log | head -20

# Login/routing errors
grep "routing\|login" logs/error.log | head -20
```

### Expected Improvements

- ✅ User restarts from correct step (not always step 1)
- ✅ API calls to Datamuse ~86% lower
- ✅ Onboarding completion rate improves
- ✅ No "interests" related errors
- ✅ Mobile users can resume on different device

---

## Rollback Triggers

**Return to previous version if:**

1. ❌ More than 1% API errors
2. ❌ Database migration fails
3. ❌ Login routing broken (users always go to step 1)
4. ❌ Interests empty/null crash
5. ❌ Build fails to compile
6. ❌ Response times > 2 seconds
7. ❌ User data corruption detected

**Do NOT rollback for:**
- ✅ Chunk size warnings (already there)
- ✅ Minor UI changes
- ✅ Expected behavior changes

---

## Communication

### Before Deployment
```
Subject: Deploying Interests Refactoring + Onboarding Fixes

We're deploying improvements to:
1. Onboarding progress persistence (users won't restart from step 1)
2. Interests suggestions (now dynamic via Datamuse API)
3. Database step tracking for cross-device resume
4. 30-day localStorage persistence (was 7 days)

Expected user impact: Better, faster onboarding experience
Estimated downtime: None (rolling deployment)
Rollback: Available if issues found
```

### After Deployment
```
Subject: Deployment Complete - Interests & Onboarding Update

Deployed successfully at [TIME]
Monitoring for issues...
Key improvements:
- Users now resume from correct step
- Interests search faster with API suggestions
- Cross-device onboarding resume enabled
```

---

## Success Criteria

✅ **Deployment Successful If:**

1. [ ] All tests passing
2. [ ] No errors in logs (first hour)
3. [ ] Users can complete onboarding
4. [ ] Interests search returns suggestions
5. [ ] Resume functionality works across devices
6. [ ] Login routing sends users to correct step
7. [ ] No performance degradation
8. [ ] Error rate < 0.1%

---

## Support Contacts

**If deployed successfully:**
- Monitor for 24 hours
- Check metrics every 4 hours
- Update stakeholders

**If issues found:**
- Enable specific logging
- Check rollback plan above
- Document issue for postmortem

---

## Approval Sign-Off

- **Release Manager:** _________________ Date: _______
- **QA Lead:** _________________ Date: _______
- **Tech Lead:** _________________ Date: _______
- **Deployed By:** _________________ Date: _______

---

*This checklist is comprehensive but not exhaustive. Adapt based on your infrastructure and operational practices.*
