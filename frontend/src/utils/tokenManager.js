// frontend/src/utils/tokenManager.js

// Helper function to get auth token from localStorage
export const getToken = () => localStorage.getItem('token');

// Helper function to set auth token in localStorage
export const setToken = (token) => localStorage.setItem('token', token);

// Helper function to remove auth token from localStorage
export const removeToken = () => {
    localStorage.removeItem('token');
    // We keep mockUserProfile, as we want to preserve the offline progress.
};
