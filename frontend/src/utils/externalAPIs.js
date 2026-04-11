// frontend/src/utils/externalAPIs.js
// External API integrations for autocomplete suggestions
import { API_BASE_URL } from "./config";

// ============= TMDB API =============
// The Movie Database API (via secure backend proxy)
// Backend proxy keeps API key safe and works in production

const BACKEND_API_URL = API_BASE_URL;

/**
 * Search for movies on TMDB (via backend proxy)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of movie suggestions
 */
export async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  
  try {
    console.log('[TMDB] Searching for movies:', query);
    const response = await fetch(
      `${BACKEND_API_URL}/tmdb/search/movies?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      console.error('TMDB movie search failed:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[TMDB] Found', data.length, 'movies');
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching movies:', error);
    }
    return [];
  }
}

/**
 * Search for TV shows on TMDB (via backend proxy)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of TV show suggestions
 */
export async function searchTVShows(query) {
  if (!query || !query.trim()) return [];
  
  try {
    console.log('[TMDB] Searching for TV shows:', query);
    const response = await fetch(
      `${BACKEND_API_URL}/tmdb/search/tv?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      console.error('TMDB TV search failed:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[TMDB] Found', data.length, 'TV shows');
    return data;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching TV shows:', error);
    }
    return [];
  }
}

// ============= Spotify API =============
// Spotify Web API for artists and tracks
// Backend proxy handles authentication to keep credentials secure

/**
 * Search for artists on Spotify (via backend)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of artist suggestions
 */
export async function searchArtists(query) {
  if (!query || !query.trim()) return [];
  
  try {
    console.log('[Spotify] Searching for artist:', query);
    const response = await fetch(
      `${BACKEND_API_URL}/spotify/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
      {
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!response.ok) {
      console.error('[Spotify] Artist search failed:', response.status);
      return [];
    }

    const results = await response.json();
    console.log('[Spotify] Found', results.length, 'artists');
    return results;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching artists:', error);
    }
    return [];
  }
}

/**
 * Search for tracks on Spotify (via backend)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of track suggestions
 */
export async function searchTracks(query) {
  if (!query || !query.trim()) return [];
  
  try {
    console.log('[Spotify] Searching for track:', query);
    const response = await fetch(
      `${BACKEND_API_URL}/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!response.ok) {
      console.error('[Spotify] Track search failed:', response.status);
      return [];
    }

    const results = await response.json();
    console.log('[Spotify] Found', results.length, 'tracks');
    return results;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching tracks:', error);
    }
    return [];
  }
}

/**
 * Generic search function that handles both movies and TV shows
 * @param {string} query - Search query
 * @returns {Promise<Array>} Combined movie and TV show results
 */
export async function searchMoviesAndShows(query) {
  if (!query || !query.trim()) return [];
  
  try {
    const [movies, shows] = await Promise.all([
      searchMovies(query),
      searchTVShows(query)
    ]);
    
    // Combine and sort by relevance (could be improved with fuzzy matching)
    return [...movies, ...shows].slice(0, 5);
  } catch (error) {
    console.error('Error searching movies and shows:', error);
    return [];
  }
}

/**
 * Search for both artists and tracks on Spotify (via backend)
 * Used for favorite artists/bands field to show both singers and songs
 * @param {string} query - Search query
 * @returns {Promise<Array>} Combined artist and track suggestions
 */
export async function searchArtistsAndTracks(query) {
  if (!query || !query.trim()) return [];
  
  try {
    console.log('[Spotify] Searching for artists and tracks:', query);
    
    // Fetch both artists and tracks in parallel
    const [artists, tracks] = await Promise.all([
      searchArtists(query),
      searchTracks(query)
    ]);
    
    // Combine results: show 3 artists + 2 tracks (or adjust as needed)
    const combined = [
      ...artists.slice(0, 3),
      ...tracks.slice(0, 2)
    ];
    
    console.log('[Spotify] Found', artists.length, 'artists and', tracks.length, 'tracks');
    return combined;
  } catch (error) {
    console.error('Error searching artists and tracks:', error);
    return [];
  }
}
