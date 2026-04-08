import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI } from '../../utils/api';
import ReferralConfirmationModal from '../../components/ReferralConfirmationModal';

export default function ReferralSettings() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ referralCount: 0, waitlistPriority: 50 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, accepted, rejected
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsData, pendingData, referralsData] = await Promise.all([
        referralAPI.getStats(),
        referralAPI.getPendingRequests(),
        referralAPI.getMyReferrals()
      ]);

      setStats(statsData);
      setPendingRequests(pendingData.requests || []);
      setReferrals(referralsData.referrals || []);
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    await fetchReferralData();
    setSelectedRequest(null);
    setActiveTab(status === 'accepted' ? 'accepted' : 'rejected');
  };

  const getAcceptedReferrals = () => referrals.filter(r => r.status === 'accepted');
  const getRejectedReferrals = () => referrals.filter(r => ['rejected_known', 'rejected_unknown'].includes(r.status));

  const renderStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: '✓ Accepted' },
      rejected_known: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Known - Rejected' },
      rejected_unknown: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unknown - Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 100) return 'High Priority ⭐';
    if (priority >= 50) return 'Standard Priority';
    return 'Lower Priority';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            <p className="text-gray-600 mt-1">Manage your referral requests and statistics</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-semibold">Total Referrals</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.referralCount}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-semibold">Waitlist Priority</p>
            <p className="text-lg font-bold text-blue-600 mt-2">{getPriorityLabel(stats.waitlistPriority)}</p>
            <p className="text-xs text-gray-500 mt-1">Score: {stats.waitlistPriority}/100</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-4 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 py-4 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'accepted'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Accepted ({getAcceptedReferrals().length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 py-4 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'rejected'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({getRejectedReferrals().length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending referral requests</p>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{request.newUserName}</p>
                          {request.referrerPhone && (
                            <p className="text-sm text-gray-600">📱 {request.referrerPhone}</p>
                          )}
                        </div>
                        {renderStatusBadge(request.status)}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex-1 min-w-[120px] py-2 bg-green-500 text-white text-sm font-semibold rounded hover:bg-green-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex-1 min-w-[120px] py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="space-y-4">
                {getAcceptedReferrals().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No accepted referrals yet</p>
                ) : (
                  getAcceptedReferrals().map((request) => (
                    <div key={request.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{request.newUserName}</p>
                          {request.first_name && request.last_name && (
                            <p className="text-sm text-gray-600">{request.first_name} {request.last_name}</p>
                          )}
                          {request.email && (
                            <p className="text-xs text-gray-600">{request.email}</p>
                          )}
                        </div>
                        <span className="text-green-600 font-semibold">✓ Confirmed</span>
                      </div>
                      {request.confirmedAt && (
                        <p className="text-xs text-gray-600 mt-2">
                          Confirmed {new Date(request.confirmedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div className="space-y-4">
                {getRejectedReferrals().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No rejected referrals</p>
                ) : (
                  getRejectedReferrals().map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{request.newUserName}</p>
                          {request.email && (
                            <p className="text-xs text-gray-600">{request.email}</p>
                          )}
                        </div>
                        {renderStatusBadge(request.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help section */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-2">
          <p className="font-semibold text-blue-900">ℹ️ How Referrals Work</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ <span className="font-semibold">Accepted:</span> Your referral gets priority (100 points)</li>
            <li>✓ <span className="font-semibold">Known:</span> Standard priority (50 points)</li>
            <li>✓ <span className="font-semibold">Unknown:</span> Lower priority (10 points)</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <ReferralConfirmationModal
          referralRequest={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAction={(status) => handleRequestAction(selectedRequest.id, status)}
        />
      )}
    </div>
  );
}
