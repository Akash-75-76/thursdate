/**
 * Debounce utility to delay function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Cache manager for autocomplete results
 */
export class AutocompleteCache {
  constructor(ttl = 5 * 60 * 1000) {
    // 5 minutes TTL by default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Clearbit Company Autocomplete API
 * Fetches company suggestions from Clearbit
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of company suggestions
 */
export const fetchCompanySuggestions = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company suggestions');
    }

    const data = await response.json();

    // Transform Clearbit response to our format
    return (data || [])
      .slice(0, 8)
      .map((company) => ({
        id: company.domain,
        name: company.name,
        logo: `https://logo.clearbit.com/${company.domain}?size=40`,
        domain: company.domain,
      }));
  } catch (error) {
    console.error('Error fetching company suggestions:', error);
    return [];
  }
};

/**
 * Search job titles with fuzzy matching
 * @param {string} query - Search query
 * @param {Array} jobTitles - List of job titles to search
 * @param {number} limit - Max results to return
 * @returns {Array} Matching job titles
 */
export const searchJobTitles = (query, jobTitles, limit = 8) => {
  if (!query || query.length < 1) {
    return jobTitles.slice(0, limit);
  }

  const lowerQuery = query.toLowerCase().trim();

  // Score each job title based on match quality
  const scored = jobTitles
    .map((title) => {
      const lowerTitle = title.toLowerCase();

      // Exact match at start gets highest score
      if (lowerTitle.startsWith(lowerQuery)) {
        return { title, score: 3 };
      }

      // Contains query gets medium score
      if (lowerTitle.includes(lowerQuery)) {
        return { title, score: 2 };
      }

      // Split title into words and check word-level matches
      const titleWords = lowerTitle.split(/\s+/);
      const queryWords = lowerQuery.split(/\s+/);

      let matchCount = 0;
      for (const word of queryWords) {
        if (titleWords.some((tw) => tw.startsWith(word))) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        return { title, score: 1 + matchCount * 0.5 };
      }

      // Distance-based matching (Levenshtein-inspired)
      const distance = calculateStringDistance(lowerQuery, lowerTitle);
      const similarity = 1 - distance / Math.max(lowerQuery.length, lowerTitle.length);

      if (similarity > 0.6) {
        return { title, score: similarity };
      }

      return null;
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.title);

  return scored;
};

/**
 * Calculate simple string distance for fuzzy matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Distance score
 */
const calculateStringDistance = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 0;

  const editDistance = getDistance(longer, shorter);
  return editDistance;
};

/**
 * Levenshtein distance algorithm
 * @param {string} s1 - First string
 * @param {string} s2 - Second string
 * @returns {number} Edit distance
 */
const getDistance = (s1, s2) => {
  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
};

/**
 * Highlight matching text in suggestions
 * @param {string} text - Full text
 * @param {string} query - Search query
 * @returns {Array} Array of JSX-compatible text parts
 */
export const highlightMatch = (text, query) => {
  if (!query) return [{ text, bold: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  const parts = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    // Add non-matching part
    if (index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, index),
        bold: false,
      });
    }

    // Add matching part
    parts.push({
      text: text.substring(index, index + query.length),
      bold: true,
    });

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      bold: false,
    });
  }

  return parts.length > 0
    ? parts
    : [{ text, bold: false }];
};
