/**
 * Foursquare Places API Utility
 * Handles café and restaurant suggestions via backend API with debouncing and caching
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300; // ms
const placeCache = new Map();

/**
 * Get autocomplete suggestions for places using backend Foursquare API
 * @param {string} input - User input
 * @returns {Promise<Array>} - Array of place suggestions
 */
export const getPlaceSuggestions = async (input) => {
    if (!input || input.trim().length < 2) {
        console.log('⚠️ Skipping search - input too short:', input?.length);
        return [];
    }

    const cacheKey = input.toLowerCase();
    
    // Check cache
    if (placeCache.has(cacheKey)) {
        const cached = placeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📦 Using cached suggestions for:', input, '- Count:', cached.data.length);
            return cached.data;
        }
        placeCache.delete(cacheKey);
    }

    try {
        const url = `/api/user/places/search?q=${encodeURIComponent(input)}`;
        console.log('🌐 Calling backend URL:', url);
        
        const response = await fetch(url);
        
        console.log('📬 Response status:', response.status, response.statusText);
        console.log('📬 Response headers:', {
            'content-type': response.headers.get('content-type'),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend API error:', response.status);
            console.error('Response body (first 500 chars):', errorText.substring(0, 500));
            
            // Check if response is HTML (404 error page, etc)
            if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
                console.error('⚠️ RECEIVED HTML INSTEAD OF JSON - Route may not exist or middleware redirected');
            }
            return [];
        }

        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('⚠️ Unexpected content-type:', contentType);
            const responseText = await response.text();
            console.error('Response preview:', responseText.substring(0, 300));
            return [];
        }

        const data = await response.json();
        console.log('📥 Response data:', data);
        const places = data.places || [];
        
        console.log(`✅ Backend returned ${places.length} places for query: "${input}"`);

        // Cache the results
        placeCache.set(cacheKey, {
            data: places,
            timestamp: Date.now(),
        });

        return places;
    } catch (error) {
        console.error('❌ Places API error:', error.message);
        console.error('Error type:', error.name);
        console.error('Stack:', error.stack?.substring(0, 300));
        return [];
    }
};

/**
 * Get detailed place information (already have it from suggestions)
 * @param {string} fsqId - Foursquare Place ID
 * @param {object} place - Full place object from suggestions
 * @returns {Promise<object>} - Place details
 */
export const getPlaceDetails = async (fsqId, place) => {
    // With Foursquare backend, we already have all the details from the suggestions
    // Just return the place object in normalized format
    return {
        placeId: place.fsq_id,
        name: place.name,
        address: place.address,
        city: place.city,
        country: place.country,
        lat: place.latitude,
        lng: place.longitude,
    };
};

/**
 * Create a session token (not needed for Foursquare but kept for compatibility)
 * @returns {object} - Session token object
 */
export const createSessionToken = () => {
    return { token: null }; // Foursquare doesn't use session tokens like Google
};

/**
 * Clear the place cache
 */
export const clearPlaceCache = () => {
    placeCache.clear();
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay = DEBOUNCE_DELAY) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
