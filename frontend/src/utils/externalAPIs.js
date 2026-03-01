// frontend/src/utils/externalAPIs.js
// External API integrations for autocomplete suggestions

// ============= TMDB API =============
// The Movie Database API for movies and TV shows
// Get your API key from: https://www.themoviedb.org/settings/api

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92'; // Small thumbnail size

/**
 * Search for movies on TMDB
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of movie suggestions
 */
export async function searchMovies(query) {
  if (!query || !query.trim()) return [];
  
  try {
    if (!TMDB_API_KEY) {
      console.warn('TMDB API key not configured. Set VITE_TMDB_API_KEY in .env file');
      return [];
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      console.error('TMDB movie search failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Return top 5 results with title, year, poster image, and subtitle
    return (data.results || []).slice(0, 5).map(movie => ({
      id: movie.id,
      name: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      display: movie.title + (movie.release_date ? ` (${new Date(movie.release_date).getFullYear()})` : ''),
      image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
      subtitle: movie.release_date ? `Released ${new Date(movie.release_date).getFullYear()}` : 'Movie'
    }));
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error searching movies:', error);
    }
    return [];
  }
}

/**
 * Search for TV shows on TMDB
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of TV show suggestions
 */
export async function searchTVShows(query) {
  if (!query || !query.trim()) return [];
  
  try {
    if (!TMDB_API_KEY) {
      console.warn('TMDB API key not configured. Set VITE_TMDB_API_KEY in .env file');
      return [];
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      console.error('TMDB TV search failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Return top 5 results with name, year, poster image, and subtitle
    return (data.results || []).slice(0, 5).map(show => ({
      id: show.id,
      name: show.name,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      display: show.name + (show.first_air_date ? ` (${new Date(show.first_air_date).getFullYear()})` : ''),
      image: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : null,
      subtitle: show.first_air_date ? `TV Series • ${new Date(show.first_air_date).getFullYear()}` : 'TV Series'
    }));
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

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

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
