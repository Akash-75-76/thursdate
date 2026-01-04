// frontend/src/utils/apiClient.js

import { API_BASE_URL } from './config';
import { getToken } from './tokenManager';
import { isMockMode } from './mockMode';

// Helper function to make authenticated requests
export const authRequest = async (url, options = {}, forceLiveMode = false) => {
    // If it's an admin endpoint or forceLiveMode is true, always use live mode
    const isAdminEndpoint = url.startsWith('/admin');
    const shouldUseMockMode = isMockMode() && !isAdminEndpoint && !forceLiveMode;
    
    if (shouldUseMockMode) {
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found (Mock Mode)');
        }
        return {}; 
    }
    
    // LIVE MODE: Proceed with actual backend call
    const token = getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': options.method === 'POST' && options.body instanceof FormData ? undefined : 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    // 🛑 FIX: Read the response body as text first to prevent JSON.parse errors on empty bodies.
    const responseText = await response.text();
    const isJson = response.headers.get('content-type')?.includes('application/json');

    if (!response.ok) {
        // If the request failed (4xx or 5xx)
        if (responseText && isJson) {
            // Attempt to parse the error message if it's JSON
            try {
                const error = JSON.parse(responseText);
                throw new Error(error.error || 'Request failed');
            } catch (e) {
                // If parsing the error fails, throw a generic message
                throw new Error('Request failed: ' + responseText);
            }
        }
        throw new Error('Request failed with status: ' + response.status);
    }
    
    // 🛑 FIX: Return an empty object if there is no response body (e.g., 204 No Content).
    if (!responseText) {
        return {};
    }

    // Safely parse the JSON response
    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error("JSON parsing error:", e, "Response Text:", responseText);
        // Throw an error to ensure the calling component knows the fetch failed
        throw new Error("Failed to process server response (JSON error).");
    }
};
