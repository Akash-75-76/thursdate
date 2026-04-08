import { useState, useEffect } from 'react';
import { referralAPI } from '../utils/api';

/**
 * Custom hook to manage referral confirmation requests
 * Checks for pending requests and provides UI state management
 */
export function useReferralRequests() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRequest, setCurrentRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch pending requests on mount
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await referralAPI.getPendingRequests();
      
      if (data.requests && data.requests.length > 0) {
        setPendingRequests(data.requests);
        // Auto-show modal for the first pending request
        setCurrentRequest(data.requests[0]);
        setShowModal(true);
      } else {
        setPendingRequests([]);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error fetching pending referrals:', err);
      setError(err.message || 'Failed to load pending referrals');
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleRequestAction = async (status) => {
    // Remove current request from list
    if (currentRequest) {
      setPendingRequests(prev => prev.filter(r => r.id !== currentRequest.id));
      
      // Show next request if available
      if (pendingRequests.length > 1) {
        const nextRequest = pendingRequests.find(r => r.id !== currentRequest.id);
        setCurrentRequest(nextRequest);
        setShowModal(true);
      } else {
        setCurrentRequest(null);
        setShowModal(false);
      }
    }
  };

  return {
    pendingRequests,
    loading,
    error,
    currentRequest,
    showModal,
    setShowModal,
    fetchPendingRequests,
    handleModalClose,
    handleRequestAction
  };
}
