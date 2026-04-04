# TMDB API Production Fix - Setup Guide

## Problem Solved
✅ API key was exposed in frontend (security risk)
✅ API key was missing in production (undefined env variable)  
✅ Direct API calls failed without proper error handling

## What Changed

### 1. Created Backend TMDB Proxy
- **File**: `backend/routes/tmdb.js` (NEW)
- **Endpoints**:
  - `GET /api/tmdb/search/movies?query=...`
  - `GET /api/tmdb/search/tv?query=...`
  - `GET /api/tmdb/search/all?query=...` (combined search)
- **Features**:
  - Secure API key handling (never exposed to frontend)
  - Same data transformation as before
  - Better error handling
  - 5-second timeout per request

### 2. Updated Frontend API Calls
- **File**: `frontend/src/utils/externalAPIs.js` (MODIFIED)
- **Changes**:
  - `searchMovies()` → calls `GET /api/tmdb/search/movies`
  - `searchTVShows()` → calls `GET /api/tmdb/search/tv`
  - `searchMoviesAndShows()` → uses both (unchanged logic)
  - Removed direct TMDB API references
  - Removed exposed API key from frontend

### 3. Updated Backend Server
- **File**: `backend/server.js` (MODIFIED)
- **Change**: Added route `app.use('/api/tmdb', require('./routes/tmdb'))`

## Production Setup (REQUIRED)

### Local Development
1. Add to `backend/.env`:
```env
TMDB_API_KEY=your_tmdb_api_key_here
```

2. Restart backend server

### Render (Production)
1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add new environment variable:
   - **Key**: `TMDB_API_KEY`
   - **Value**: Your TMDB API key
5. Deploy (auto-redeploy on env var change)

### Get TMDB API Key
1. Visit https://www.themoviedb.org/settings/api
2. Sign up for API key (free)
3. Copy the API key from your account settings
4. Add to environment variables (local and production)

## Testing

### Local Testing
```bash
# Start backend with TMDB env var set
npm run dev

# Test endpoint in browser or curl
curl "http://localhost:5000/api/tmdb/search/movies?query=Inception"
```

### Expected Response
```json
[
  {
    "id": 27205,
    "title": "Inception",
    "year": 2010,
    "display": "Inception (2010)",
    "image": "https://image.tmdb.org/t/p/w92/...",
    "subtitle": "Released 2010"
  }
]
```

## Verification Checklist

- [ ] TMDB_API_KEY added to local `backend/.env`
- [ ] Backend restarted (see console: should not warn about API key)
- [ ] Movie search works in local development
- [ ] TMDB_API_KEY added to Render environment variables
- [ ] Production backend deployed
- [ ] Production frontend can search movies/TV shows
- [ ] Console shows `[TMDB] Found X movies` (no 401 errors)

## Security Benefits

✅ API key never exposed in frontend or network requests
✅ API key stored only on backend (secure in Render env)
✅ Frontend can't be compromised to leak API key
✅ Rate limiting is applied at API level (by IP, not API key)
✅ Same pattern used for Spotify (consistent architecture)

## Troubleshooting

### "TMDB API key not configured" Error
- **Solution**: Add `TMDB_API_KEY` to environment variables

### 401 Unauthorized in Production
- **Check**: Is TMDB_API_KEY set in Render environment?
- **Check**: Is the API key valid (not expired)?
- **Check**: Did you redeploy after adding the env var?

### Empty Results
- Could be valid (no matches found)
- Check browser console for `[TMDB]` logs
- Verify API key has search permissions enabled

### 503 Service Unavailable
- Backend couldn't reach TMDB API
- Could be network issue or TMDB API down
- Check TMDB status: https://status.themoviedb.org/

## Migration Notes

If users bookmarked TMDB API keys in frontend before:
- Those are no longer used (safe to ignore/delete)
- All TMDB searches now go through secure backend
- Frontend no longer needs VITE_TMDB_API_KEY
