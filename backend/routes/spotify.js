const express = require('express');
const axios = require('axios');
const router = express.Router();

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

// Token caching
let spotifyAccessToken = null;
let spotifyTokenExpiry = 0;

/**
 * Get Spotify access token using Client Credentials flow
 * @returns {Promise<string|null>} Access token or null on error
 */
async function getSpotifyAccessToken() {
  // Return cached token if still valid
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiry) {
    console.log('[Spotify Backend] Using cached token');
    return spotifyAccessToken;
  }

  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('[Spotify Backend] Credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
      return null;
    }

    console.log('[Spotify Backend] Requesting new access token...');
    console.log('[Spotify Backend DEBUG] Client ID:', SPOTIFY_CLIENT_ID);
    console.log('[Spotify Backend DEBUG] Client Secret exists:', !!SPOTIFY_CLIENT_SECRET);
    console.log('[Spotify Backend DEBUG] Client Secret length:', SPOTIFY_CLIENT_SECRET?.length);
    
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    console.log('[Spotify Backend DEBUG] Credentials Base64 length:', credentials.length);
    
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    console.log('[Spotify Backend] Token obtained successfully');
    console.log('[Spotify Backend DEBUG] Token exists:', !!response.data.access_token);
    console.log('[Spotify Backend DEBUG] Token length:', response.data.access_token?.length);
    console.log('[Spotify Backend DEBUG] Token expires in:', response.data.expires_in, 'seconds');
    
    spotifyAccessToken = response.data.access_token;
    // Set expiry to 50 minutes (tokens are valid for 1 hour)
    spotifyTokenExpiry = Date.now() + (50 * 60 * 1000);
    
    return spotifyAccessToken;
  } catch (error) {
    console.error('[Spotify Backend] Error getting access token:');
    console.error('[Spotify Backend DEBUG] Status:', error.response?.status);
    console.error('[Spotify Backend DEBUG] Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('[Spotify Backend DEBUG] Message:', error.message);
    return null;
  }
}

/**
 * Search endpoint for Spotify
 * GET /api/spotify/search?q=query&type=artist&limit=5
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Query parameter "type" is required (artist or track)' });
    }

    // Get access token
    const token = await getSpotifyAccessToken();
    if (!token) {
      console.error('[Spotify Backend DEBUG] No token available for search');
      return res.status(503).json({ error: 'Unable to authenticate with Spotify' });
    }

    // Call Spotify Search API
    const searchLimit = limit || 5;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=${searchLimit}`;
    
    console.log(`[Spotify Backend] Searching for ${type}:`, q);
    console.log('[Spotify Backend DEBUG] Search URL:', url);
    console.log('[Spotify Backend DEBUG] Token exists:', !!token);
    console.log('[Spotify Backend DEBUG] Token length:', token?.length);
    console.log('[Spotify Backend DEBUG] Token preview:', token?.substring(0, 20) + '...');
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = response.data;
    console.log(`[Spotify Backend] Found ${data.artists?.items?.length || data.tracks?.items?.length || 0} results`);

    // Return results in the format expected by frontend
    if (type === 'artist') {
      const results = (data.artists?.items || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        display: artist.name,
        image: artist.images && artist.images.length > 0 ? artist.images[artist.images.length - 1].url : null,
        subtitle: artist.genres && artist.genres.length > 0 
          ? artist.genres.slice(0, 2).map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' • ')
          : 'Artist'
      }));
      return res.json(results);
    } else if (type === 'track') {
      const results = (data.tracks?.items || []).map(track => ({
        id: track.id,
        name: track.name,
        display: track.name,
        image: track.album?.images?.[track.album.images.length - 1]?.url || null,
        subtitle: track.artists?.map(a => a.name).join(', ') || 'Song'
      }));
      return res.json(results);
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "artist" or "track"' });
    }

  } catch (error) {
    console.error('[Spotify Backend] Search error:');
    console.error('[Spotify Backend DEBUG] Status:', error.response?.status);
    console.error('[Spotify Backend DEBUG] Status Text:', error.response?.statusText);
    console.error('[Spotify Backend DEBUG] Headers:', JSON.stringify(error.response?.headers, null, 2));
    console.error('[Spotify Backend DEBUG] Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('[Spotify Backend DEBUG] Message:', error.message);
    
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error?.message || 'Internal server error', 
      message: error.message 
    });
  }
});

/**
 * Diagnostic endpoint to test Spotify integration without caching
 * GET /api/spotify/test-direct
 */
router.get('/test-direct', async (req, res) => {
  console.log('\n========== SPOTIFY DIRECT TEST ==========');
  
  try {
    // Step 1: Verify environment variables
    console.log('[TEST] Step 1: Environment Variables');
    console.log('[TEST] CLIENT_ID exists:', !!SPOTIFY_CLIENT_ID);
    console.log('[TEST] CLIENT_ID value:', SPOTIFY_CLIENT_ID);
    console.log('[TEST] CLIENT_SECRET exists:', !!SPOTIFY_CLIENT_SECRET);
    console.log('[TEST] CLIENT_SECRET length:', SPOTIFY_CLIENT_SECRET?.length);
    console.log('[TEST] CLIENT_SECRET first 4 chars:', SPOTIFY_CLIENT_SECRET?.substring(0, 4));
    console.log('[TEST] CLIENT_SECRET last 4 chars:', SPOTIFY_CLIENT_SECRET?.substring(SPOTIFY_CLIENT_SECRET.length - 4));
    
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Credentials not configured', step: 1 });
    }
    
    // Step 2: Generate Base64 credentials
    console.log('\n[TEST] Step 2: Generate Base64 Credentials');
    const authString = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
    console.log('[TEST] Auth string length:', authString.length);
    const credentials = Buffer.from(authString).toString('base64');
    console.log('[TEST] Base64 credentials length:', credentials.length);
    console.log('[TEST] Base64 first 20 chars:', credentials.substring(0, 20));
    
    // Step 3: Request fresh token (bypass cache)
    console.log('\n[TEST] Step 3: Request Fresh Token (no cache)');
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const tokenBody = 'grant_type=client_credentials';
    const tokenHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    };
    
    console.log('[TEST] Token URL:', tokenUrl);
    console.log('[TEST] Token Body:', tokenBody);
    console.log('[TEST] Token Headers:', JSON.stringify(tokenHeaders, null, 2));
    
    const tokenResponse = await axios.post(tokenUrl, tokenBody, { headers: tokenHeaders });
    
    console.log('[TEST] Token Response Status:', tokenResponse.status);
    console.log('[TEST] Token Response Data:', {
      access_token: tokenResponse.data.access_token ? `${tokenResponse.data.access_token.substring(0, 20)}...` : 'MISSING',
      token_type: tokenResponse.data.token_type,
      expires_in: tokenResponse.data.expires_in,
      scope: tokenResponse.data.scope || 'none'
    });
    
    const freshToken = tokenResponse.data.access_token;
    
    if (!freshToken) {
      return res.status(500).json({ error: 'No token received', step: 3 });
    }
    
    // Step 4: Perform search with fresh token
    console.log('\n[TEST] Step 4: Perform Search with Fresh Token');
    const searchUrl = 'https://api.spotify.com/v1/search?q=Drake&type=artist&limit=1';
    const searchHeaders = {
      'Authorization': `Bearer ${freshToken}`
    };
    
    console.log('[TEST] Search URL:', searchUrl);
    console.log('[TEST] Search Headers:', JSON.stringify(searchHeaders, null, 2));
    console.log('[TEST] Token being used:', `${freshToken.substring(0, 30)}...`);
    
    const searchResponse = await axios.get(searchUrl, { headers: searchHeaders });
    
    console.log('[TEST] Search Response Status:', searchResponse.status);
    console.log('[TEST] Search Response Data:', {
      total: searchResponse.data.artists?.total,
      items: searchResponse.data.artists?.items?.length
    });
    
    console.log('\n========== TEST SUCCESS ==========\n');
    
    return res.json({
      success: true,
      token_obtained: true,
      token_length: freshToken.length,
      search_status: searchResponse.status,
      results_found: searchResponse.data.artists?.items?.length || 0,
      message: 'All steps completed successfully'
    });
    
  } catch (error) {
    console.error('\n[TEST] ========== TEST FAILED ==========');
    console.error('[TEST] Error at:', error.config?.url || 'unknown');
    console.error('[TEST] Error Status:', error.response?.status);
    console.error('[TEST] Error Status Text:', error.response?.statusText);
    console.error('[TEST] Error Data:', error.response?.data);
    console.error('[TEST] Error Message:', error.message);
    console.error('[TEST] Error Response Headers:', error.response?.headers);
    console.log('========================================\n');
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      step: error.config?.url?.includes('token') ? 'token_generation' : 'search_request'
    });
  }
});

module.exports = router;
