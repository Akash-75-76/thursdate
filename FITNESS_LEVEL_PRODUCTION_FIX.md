# Fitness Level Production Fix - Setup Guide

## Problem
Fitness level shows as "Not specified" in production, but displays correctly on localhost.

## Root Cause
The `fitness_level` column was missing from the production database. It exists locally because the migration was run, but wasn't added to the production migrations list.

## Solution

### Step 1: Run the Migration on Production

You have two options:

#### Option A: Use Render Dashboard (Recommended)
1. Go to your Render dashboard
2. Select your backend service
3. Click **"Shell"** tab
4. Run this command:
   ```bash
   node run-fitness-level-migration.js
   ```
5. You'll see: `✅ Fitness level migration completed successfully!`

#### Option B: Run Locally with Production DB
1. Make sure `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in your `.env` point to production
2. Run:
   ```bash
   npm install
   node run-fitness-level-migration.js
   ```

### Step 2: Verify the Fix

After running the migration:
1. Redeploy the backend (Render auto-deploys on git push, or manually trigger)
2. Log out and log back in to refresh user data
3. View a profile - fitness level should now show correctly instead of "Not specified"

### What the Migration Does
- Adds `fitness_level` VARCHAR(50) column to `users` table
- Stores values like: "Easygoing", "Lightly active", "Active lifestyle", "Very active", "Fitness focused"
- Safe to run - checks if column exists before adding

## Testing

After deployment, check:
```javascript
// In browser console on any profile:
console.log(currentUser.fitnessLevel)
// Should show: "Easygoing" (or whatever was selected during onboarding)
// NOT: null or "Not specified"
```

## Verification Checklist

- [ ] Migration ran successfully on production DB
- [ ] Backend redeployed after migration
- [ ] User logged out and back in
- [ ] Profile shows fitness level (not "Not specified")
- [ ] All match cards display fitness level correctly

## Future Deployments

The fitness level migration is now included in `run-all-migrations.js`, so any new production databases will automatically include it.

## If Still Not Fixed

If fitness level still shows as "Not specified" after running the migration:

1. **Check if column was actually added**:
   - Go to Render Shell
   - Run: `mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME`
   - Run: `DESCRIBE users;` - look for `fitness_level` row
   
2. **Check what value is stored**:
   - Run: `SELECT id, fitness_level FROM users LIMIT 5;`
   - If all values are NULL, data needs to be re-entered during onboarding

3. **Verify API is returning it**:
   - Open DevTools
   - Make a profile request and check response has `fitnessLevel` field
   - If missing, restart backend after running migration

4. **Check frontend is receiving it**:
   - Open DevTools → Network tab
   - Look at user profile response
   - Should have `"fitnessLevel": "Easygoing"` (or value)
