// frontend/src/utils/api/admin.js

import { authRequest } from '../apiClient';

// Admin API (LIVE MODE ONLY)
export const adminAPI = {
    // Get all users
    getAllUsers: async () => {
        return authRequest('/admin/users');
    },

    // Get waitlisted users
    getWaitlist: async () => {
        return authRequest('/admin/waitlist');
    },

    // Get user details
    getUserDetails: async (userId) => {
        return authRequest(`/admin/users/${userId}`);
    },

    // Approve/Reject user
    updateUserApproval: async (userId, approval, reason = '') => {
        return authRequest(`/admin/users/${userId}/approval`, {
            method: 'PUT',
            body: JSON.stringify({ approval, reason }),
        });
    },

    // Get dashboard stats
    getDashboardStats: async () => {
        return authRequest('/admin/dashboard');
    },
};
