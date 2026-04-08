// frontend/src/utils/api/referral.js

import { authRequest } from '../apiClient';
import { API_BASE_URL } from '../config';

export const referralAPI = {
  // Get pending referral requests for current user (as referrer)
  getPendingRequests: async () => {
    return authRequest('/referral/pending-requests');
  },

  // Get my referral status (if I was referred)
  getMyStatus: async () => {
    return authRequest('/referral/my-status');
  },

  // Get referral statistics
  getStats: async () => {
    return authRequest('/referral/stats');
  },

  // Get all referrals I've created
  getMyReferrals: async () => {
    return authRequest('/referral/my-referrals');
  },

  // Search for users to suggest as referrers
  searchReferrers: async (query) => {
    const response = await authRequest(`/referral/search-referrers?query=${encodeURIComponent(query)}`);
    return response;
  },

  // Create a referral request during onboarding
  createReferralRequest: async (referrerName, referrerPhone, referrerUserId) => {
    return authRequest('/referral/create-request', {
      method: 'POST',
      body: JSON.stringify({
        referrerName,
        referrerPhone,
        referrerUserId
      })
    });
  },

  // Accept a referral request
  acceptReferral: async (requestId) => {
    return authRequest(`/referral/${requestId}/accept`, {
      method: 'PUT'
    });
  },

  // Reject referral with "I know them" response
  rejectReferralKnown: async (requestId) => {
    return authRequest(`/referral/${requestId}/reject-known`, {
      method: 'PUT'
    });
  },

  // Reject referral with "I don't know" response
  rejectReferralUnknown: async (requestId) => {
    return authRequest(`/referral/${requestId}/reject-unknown`, {
      method: 'PUT'
    });
  },

  // Dismiss a referral notification
  dismissReferral: async (requestId) => {
    return authRequest(`/referral/${requestId}/dismiss`, {
      method: 'PUT'
    });
  }
};
