// frontend/src/utils/interests.js
// Interest suggestions using comprehensive local database
// No external API - all interests stored locally for reliability

import { searchInterestsDatabase, TOTAL_INTERESTS } from './interestsDatabase';

/**
 * Fetch interest suggestions from local database
 * @param {string} query - User input (e.g., "cricket", "photo", "music")
 * @returns {Promise<Array>} Array of suggestion objects {id, name, display}
 */
export async function fetchInterestSuggestions(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const results = searchInterestsDatabase(query);
    console.log(`[Interests] Found ${results.length} suggestions for "${query.trim()}"`);
    return results;
  } catch (error) {
    console.error('[Interests] Database search failed:', error);
    return [];
  }
}

/**
 * Debounce wrapper for interest search
 * Prevents API calls on every keystroke
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in ms (default 300ms)
 * @returns {Function} Debounced callback
 */
export function createDebouncedSearch(callback, delay = 300) {
  let timeoutId = null;
  
  return function debouncedSearch(query) {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      callback(query);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Search interests - wrapped version for backward compatibility
 * This maintains the same interface as the old searchInterests function
 * @param {string} query - User input
 * @returns {Promise<Array>} Suggestions (hybrid API + DB)
 */
export async function searchInterests(query) {
  return fetchInterestSuggestions(query);
}

export default { fetchInterestSuggestions, searchInterests, createDebouncedSearch };
