const express = require('express');
const axios = require('axios');
const router = express.Router();

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

/**
 * Search for movies on TMDB
 * GET /api/tmdb/search/movies?query=query
 */
router.get('/search/movies', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter "query" is required' });
    }

    if (!TMDB_API_KEY) {
      console.error('[TMDB Backend] API key not configured. Set TMDB_API_KEY in .env');
      return res.status(503).json({ error: 'TMDB API key not configured' });
    }

    console.log('[TMDB Backend] Searching for movies:', query);

    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          page: 1
        },
        timeout: 5000
      }
    );

    if (!response.data.results) {
      return res.json([]);
    }

    // Transform results for frontend
    const movies = response.data.results.slice(0, 5).map(movie => ({
      id: movie.id,
      title: movie.title,
      name: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      display: movie.title + (movie.release_date ? ` (${new Date(movie.release_date).getFullYear()})` : ''),
      image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
      subtitle: movie.release_date ? `Released ${new Date(movie.release_date).getFullYear()}` : 'Movie'
    }));

    res.json(movies);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('[TMDB Backend] Request timeout');
      return res.status(503).json({ error: 'TMDB API timeout' });
    }

    if (error.response?.status === 401) {
      console.error('[TMDB Backend] Invalid API key');
      return res.status(503).json({ error: 'Invalid TMDB API key' });
    }

    console.error('[TMDB Backend] Error searching movies:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

/**
 * Search for TV shows on TMDB
 * GET /api/tmdb/search/tv?query=query
 */
router.get('/search/tv', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter "query" is required' });
    }

    if (!TMDB_API_KEY) {
      console.error('[TMDB Backend] API key not configured. Set TMDB_API_KEY in .env');
      return res.status(503).json({ error: 'TMDB API key not configured' });
    }

    console.log('[TMDB Backend] Searching for TV shows:', query);

    const response = await axios.get(
      `${TMDB_BASE_URL}/search/tv`,
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          page: 1
        },
        timeout: 5000
      }
    );

    if (!response.data.results) {
      return res.json([]);
    }

    // Transform results for frontend
    const shows = response.data.results.slice(0, 5).map(show => ({
      id: show.id,
      name: show.name,
      poster_path: show.poster_path,
      first_air_date: show.first_air_date,
      overview: show.overview,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      display: show.name + (show.first_air_date ? ` (${new Date(show.first_air_date).getFullYear()})` : ''),
      image: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : null,
      subtitle: show.first_air_date ? `TV Series • ${new Date(show.first_air_date).getFullYear()}` : 'TV Series'
    }));

    res.json(shows);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('[TMDB Backend] Request timeout');
      return res.status(503).json({ error: 'TMDB API timeout' });
    }

    if (error.response?.status === 401) {
      console.error('[TMDB Backend] Invalid API key');
      return res.status(503).json({ error: 'Invalid TMDB API key' });
    }

    console.error('[TMDB Backend] Error searching TV shows:', error.message);
    res.status(500).json({ error: 'Failed to search TV shows' });
  }
});

/**
 * Combined search for movies and TV shows
 * GET /api/tmdb/search/all?query=query
 */
router.get('/search/all', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter "query" is required' });
    }

    // Make both requests in parallel
    const [moviesRes, showsRes] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: { api_key: TMDB_API_KEY, query: query, page: 1 },
        timeout: 5000
      }).catch(e => ({ data: { results: [] } })),
      axios.get(`${TMDB_BASE_URL}/search/tv`, {
        params: { api_key: TMDB_API_KEY, query: query, page: 1 },
        timeout: 5000
      }).catch(e => ({ data: { results: [] } }))
    ]);

    const movies = (moviesRes.data.results || []).map(movie => ({
      id: movie.id,
      title: movie.title,
      name: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      display: movie.title + (movie.release_date ? ` (${new Date(movie.release_date).getFullYear()})` : ''),
      image: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
      subtitle: movie.release_date ? `Released ${new Date(movie.release_date).getFullYear()}` : 'Movie'
    }));

    const shows = (showsRes.data.results || []).map(show => ({
      id: show.id,
      name: show.name,
      poster_path: show.poster_path,
      first_air_date: show.first_air_date,
      overview: show.overview,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      display: show.name + (show.first_air_date ? ` (${new Date(show.first_air_date).getFullYear()})` : ''),
      image: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : null,
      subtitle: show.first_air_date ? `TV Series • ${new Date(show.first_air_date).getFullYear()}` : 'TV Series'
    }));

    // Combine and slice to top 5
    res.json([...movies, ...shows].slice(0, 5));
  } catch (error) {
    console.error('[TMDB Backend] Error searching:', error.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

module.exports = router;
