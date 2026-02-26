import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

export default function AdminWaitlist() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [approving, setApproving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getWaitlist();
      console.log('Waitlist data received:', data);
      console.log('First user license data:', data.users?.[0]?.licensePhotos, data.users?.[0]?.licenseStatus);
      setUsers(data.users || []); 
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      setApproving(true);
      await adminAPI.updateUserApproval(userId, approved);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, approval: approved } : user
        )
      );
      
      if (showUserModal) {
        setShowUserModal(false);
        setSelectedUser(null);
      }
      
      fetchWaitlist();
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const userDetails = await adminAPI.getUserDetails(userId);
      setSelectedUser(userDetails);
      setShowUserModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const viewLicensePhotos = (user) => {
    // Handle both array format (old endpoint) and object format (new endpoint)
    let photos = user.licensePhotos;
    
    // If it's an array, convert to object format
    if (Array.isArray(photos)) {
      photos = {
        front: photos[0] || null,
        back: photos[1] || null
      };
    }
    
    setSelectedLicense({
      userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      photos: photos,
      status: user.licenseStatus
    });
    setShowLicenseModal(true);
  };

  const getLicenseStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ License Pending' },
      verified: { bg: 'bg-green-100', text: 'text-green-700', label: '✓ License Verified' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '✗ License Rejected' },
      none: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'No License' }
    };
    return badges[status] || badges.none;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              Waitlist Management
            </div>
            <div style={{ width: 24 }}></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      {/* Top Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            Waitlist Management
          </div>
          <div style={{ width: 24 }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="max-w-md mx-auto w-full pt-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">Pending Approvals</h1>
            <p className="text-gray-600 text-sm">{(users || []).length} users waiting for approval</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-4">
            {(users || []).length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">No pending approvals</div>
                <div className="text-gray-300 text-sm">All users have been reviewed</div>
              </div>
            ) : (
              (users || []).map(user => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  {/* User Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {user.profilePicUrl ? (
                        <img 
                          src={user.profilePicUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email
                        }
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-1 font-medium">{user.age || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gender:</span>
                      <span className="ml-1 font-medium">{user.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-1 font-medium">{user.currentLocation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <span className="ml-1 font-medium">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      user.hasProfilePic 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.hasProfilePic ? 'Has Photo' : 'No Photo'}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      user.hasLifestyleImages 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.hasLifestyleImages ? `${user.lifestyleImageCount} Lifestyle` : 'No Lifestyle'}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      user.onboardingComplete 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.onboardingComplete ? 'Complete' : 'Incomplete'}
                    </div>
                    {(() => {
                      const badge = getLicenseStatusBadge(user.licenseStatus || 'none');
                      return (
                        <div className={`px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </div>
                      );
                    })()}
                    {user.linkedinVerified && (
                      <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        ✓ LinkedIn
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {(user.licensePhotos && (
                      (Array.isArray(user.licensePhotos) && user.licensePhotos.length > 0) ||
                      user.licensePhotos.front
                    )) && (
                      <button
                        onClick={() => viewLicensePhotos(user)}
                        className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        View License Photos
                      </button>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewUserDetails(user.id)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApprove(user.id, true)}
                        disabled={approving}
                        className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {approving ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApprove(user.id, false)}
                        disabled={approving}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {approving ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">User Details</h2>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Profile Picture */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  {selectedUser.profilePicUrl ? (
                    <img 
                      src={selectedUser.profilePicUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-2">
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : 'No Name'
                    }
                  </div>
                  <div className="text-gray-500">{selectedUser.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Age:</span> {selectedUser.age || 'N/A'}</div>
                  <div><span className="text-gray-500">Gender:</span> {selectedUser.gender || 'N/A'}</div>
                  <div><span className="text-gray-500">Location:</span> {selectedUser.currentLocation || 'N/A'}</div>
                  <div><span className="text-gray-500">Joined:</span> {formatDate(selectedUser.createdAt)}</div>
                </div>
              </div>

              {/* Intent Data */}
              {selectedUser.intent && (
                <div className="space-y-2">
                  <div className="font-semibold text-sm text-gray-700">Profile Information</div>
                  
                  {selectedUser.intent.bio && (
                    <div>
                      <div className="text-xs text-gray-500">Bio</div>
                      <div className="text-sm bg-gray-50 p-2 rounded">{selectedUser.intent.bio}</div>
                    </div>
                  )}

                  {selectedUser.intent.interests && selectedUser.intent.interests.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500">Interests</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.intent.interests.map((interest, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.intent.lifestyleImageUrls && selectedUser.intent.lifestyleImageUrls.filter(Boolean).length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500">Lifestyle Images ({selectedUser.intent.lifestyleImageUrls.filter(Boolean).length})</div>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedUser.intent.lifestyleImageUrls.filter(Boolean).map((url, idx) => (
                          <img key={idx} src={url} alt={`Lifestyle ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleApprove(selectedUser.id, true)}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve User'}
                </button>
                <button
                  onClick={() => handleApprove(selectedUser.id, false)}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {approving ? 'Rejecting...' : 'Reject User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Photos Modal */}
      {showLicenseModal && selectedLicense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowLicenseModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Driving License Verification</h2>
                  <p className="text-sm text-gray-500">{selectedLicense.userName}</p>
                </div>
                <button 
                  onClick={() => setShowLicenseModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2">
                {(() => {
                  const badge = getLicenseStatusBadge(selectedLicense.status);
                  return (
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Front Photo */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Front of License</div>
                {selectedLicense.photos?.front ? (
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={selectedLicense.photos.front} 
                      alt="License Front" 
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"%3E%3Crect fill="%23f3f4f6" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                    No front photo available
                  </div>
                )}
              </div>

              {/* Back Photo */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Back of License</div>
                {selectedLicense.photos?.back ? (
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={selectedLicense.photos.back} 
                      alt="License Back" 
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"%3E%3Crect fill="%23f3f4f6" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                    No back photo available
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Verification Tips:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Verify the name matches the user's profile</li>
                    <li>Check the photo on the license matches profile picture</li>
                    <li>Ensure the license is not expired</li>
                    <li>Verify the document appears authentic (no tampering)</li>
                  </ul>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowLicenseModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
