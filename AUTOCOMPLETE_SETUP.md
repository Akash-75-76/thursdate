# Autocomplete Feature - Setup Guide

## Overview
The onboarding process now includes real-time autocomplete suggestions for:
- **TV Shows** (TMDB API)
- **Movies** (TMDB API)
- **Watchlist** (TMDB API - combined movies and shows)
- **Artists/Bands** (Spotify Web API)

## Features
✅ Real-time suggestions while typing  
✅ Debounced API calls (400ms) for performance  
✅ Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)  
✅ Click to select suggestions  
✅ Free-text input fallback (original functionality preserved)  
✅ Loading indicators  
✅ Error handling with silent fallback  
✅ Matches existing UI design (no visual changes)

## Setup Instructions

### 1. Get TMDB API Key
1. Go to [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key

### 2. Get Spotify API Credentials
1. Go to [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (or create one)
3. Click "Create an App"
4. Fill in app name and description
5. Accept the terms
6. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment Variables
1. Create a `.env` file in the `frontend` folder (if not exists)
2. Copy the contents from `.env.example`
3. Replace the placeholder values:

```env
# TMDB (The Movie Database) API Key
VITE_TMDB_API_KEY=your_actual_tmdb_api_key

# Spotify API Credentials
VITE_SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
```

### 4. Restart Development Server
```bash
cd frontend
npm run dev
```

## Files Added
- **`frontend/src/utils/externalAPIs.js`** - External API integrations (TMDB & Spotify)
- **`frontend/src/components/AutocompleteInput.jsx`** - Reusable autocomplete component

## Files Modified
- **`frontend/src/pages/onboarding/UserIntent.jsx`** - Updated inputs to use autocomplete
- **`frontend/.env.example`** - Added API key documentation

## How It Works

### User Experience
1. User types into any of the supported input fields
2. After 400ms of inactivity, an API call is made
3. Suggestions appear in a dropdown below the input
4. User can:
   - Click on a suggestion
   - Use keyboard (↑↓ arrows + Enter)
   - Continue typing custom text
   - Press Esc to close suggestions

### Technical Implementation
- **Debouncing**: Prevents excessive API calls while typing
- **AbortController**: Cancels previous requests when new ones are made
- **Graceful Fallback**: If API fails or keys are missing, input works as plain text
- **No Backend Changes**: All API calls are client-side only
- **Environment Variables**: API keys stored securely in `.env` (not committed to git)

## API Usage

### TMDB API
- **Endpoint**: `https://api.themoviedb.org/3/search/movie` and `/search/tv`
- **Rate Limit**: 40 requests per 10 seconds (sufficient for autocomplete)
- **Cost**: Free tier available

### Spotify Web API
- **Authentication**: Client Credentials Flow
- **Endpoint**: `https://api.spotify.com/v1/search`
- **Rate Limit**: Varies by account type (sufficient for autocomplete)
- **Cost**: Free tier available

## Troubleshooting

### No suggestions appearing?
1. Check browser console for errors
2. Verify API keys are correctly set in `.env`
3. Ensure dev server was restarted after adding `.env`
4. Check network tab for API responses

### "API key not configured" warning?
- Make sure your `.env` file exists in the `frontend` folder
- Verify environment variable names start with `VITE_`
- Restart the dev server

### Suggestions loading slowly?
- Normal behavior: API calls are debounced by 400ms
- Network latency may cause additional delay
- TMDB and Spotify APIs are generally fast (<500ms)

## Future Enhancements (Optional)
- Cache API responses to reduce duplicate requests
- Add image thumbnails to suggestions
- Implement fuzzy matching for better relevance
- Add "songs" field with Spotify track search
- Consider backend proxy to hide API keys

## Important Notes
- ✅ **No changes to form submission** - Data is stored exactly as before
- ✅ **No changes to UI design** - Dropdown matches existing theme
- ✅ **No changes to backend** - All APIs are external, client-side only
- ✅ **Backwards compatible** - Works with or without API keys (fallback to plain text)
- ⚠️ **API keys in .env** - Never commit `.env` to git (already in `.gitignore`)

## Security Considerations
While API keys are stored in `.env` files:
- Frontend builds embed these keys in the bundle
- Not ideal for production (keys are visible in browser)
- Consider moving to backend proxy for production
- TMDB and Spotify APIs have rate limiting built-in
- Free tier restrictions prevent abuse

For production, consider:
1. Backend API proxy to hide keys
2. Rate limiting on your backend
3. User-based quotas
