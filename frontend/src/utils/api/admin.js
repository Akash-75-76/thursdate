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

    // ✅ Reject user with reason
    rejectUser: async (userId, reason = '') => {
        return authRequest(`/admin/users/${userId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    // Get dashboard stats
    getDashboardStats: async () => {
        return authRequest('/admin/dashboard');
    },

    // Get all reports
    getAllReports: async (status) => {
        const params = status ? `?status=${status}` : '';
        return authRequest(`/admin/reports${params}`);
    },

    // Get report details
    getReportDetails: async (reportId) => {
        return authRequest(`/admin/reports/${reportId}`);
    },

    // Update report status
    updateReportStatus: async (reportId, status, adminNotes) => {
        return authRequest(`/admin/reports/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNotes }),
        });
    },

    // Get pending license verifications
    getPendingLicenseVerifications: async () => {
        return authRequest('/verification/driving-license/admin/pending');
    },

    // Get all license verifications
    getAllLicenseVerifications: async (status) => {
        const params = status ? `?status=${status}` : '';
        return authRequest(`/verification/driving-license/admin/all${params}`);
    },

    // Get license verification details
    getLicenseVerificationDetails: async (verificationId) => {
        return authRequest(`/verification/driving-license/admin/${verificationId}`);
    },

    // Approve license verification
    approveLicenseVerification: async (verificationId) => {
        return authRequest(`/verification/driving-license/admin/${verificationId}/approve`, {
            method: 'PUT',
        });
    },

    // Reject license verification
    rejectLicenseVerification: async (verificationId, reason) => {
        return authRequest(`/verification/driving-license/admin/${verificationId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },
};
