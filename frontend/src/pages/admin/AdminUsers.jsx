import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

export default function AdminUsers() {
  // 💡 Note: users is initialized to [], which is correct.
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, approved, pending
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set filter from navigation state if provided (only on mount)
    if (location.state && location.state.filter && ['all', 'approved', 'pending'].includes(location.state.filter)) {
      setFilter(location.state.filter);
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      // When the API request fails (e.g., 500 error, though now fixed), 'data' might be undefined
      // and data.users might also be undefined, but the catch block handles the error.
      // If the request succeeds but returns an unexpected structure (e.g., data is null), 
      // the setUsers(data.users) might fail. Assuming adminAPI.getAllUsers() returns { users: [...] }
      const data = await adminAPI.getAllUsers();
      // 💡 Safety check here is optional but good practice:
      setUsers(data?.users || []); 
    } catch (err) {
      setError(err.message);
      setUsers([]); // Reset users on error
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await adminAPI.updateUserApproval(userId, approved);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, approval: approved } : user
        )
      );
      
      // Close modal if open
      if (showUserModal) {
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (err) {
      setError(err.message);
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

  const formatDate = (dateString) => {
    // Check if dateString is valid before proceeding
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

  // 💡 FIX 1: The crash likely happens when trying to access `users` before it is initialized
  // or if it was accidentally set to null/undefined. The || [] ensures it's always an array.
  const safeUsers = users || []; 
  
  // Filter and search users (Line 80 is now safely referencing safeUsers)
  const filteredUsers = safeUsers.filter(user => {
    const matchesFilter = filter === 'all' || 
      (filter === 'approved' && user.approval) ||
      (filter === 'pending' && !user.approval);
    
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    // ... (loading state remains the same)
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
              <img src="/backarrow.svg" alt="Back" width={24} height={24} />
            </button>
            <div className="text-gray-400 text-[14px] font-semibold mx-auto">
              All Users
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

  // ... (rest of the component)

  return (
    <div className="h-screen flex flex-col bg-white font-sans">
      {/* Top Bar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/admin')} className="w-6 h-6 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" width={24} height={24} />
          </button>
          <div className="text-gray-400 text-[14px] font-semibold mx-auto">
            All Users
          </div>
          <div style={{ width: 24 }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="max-w-md mx-auto w-full pt-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600 text-sm">{filteredUsers.length} of {safeUsers.length} users</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 space-y-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({safeUsers.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'approved' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {/* 💡 FIX 2: Added safeUsers to prevent calling .filter() on undefined */}
                Approved ({safeUsers.filter(u => u.approval).length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  filter === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {/* 💡 FIX 3: Added safeUsers to prevent calling .filter() on undefined */}
                Pending ({safeUsers.filter(u => !u.approval).length})
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">No users found</div>
                <div className="text-gray-300 text-sm">
                  {searchTerm ? 'Try adjusting your search' : 'No users match the current filter'}
                </div>
              </div>
            ) : (
              filteredUsers.map(user => (
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
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      user.approval 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.approval ? 'Approved' : 'Pending'}
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
                  <div className="flex gap-2 mb-3">
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
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewUserDetails(user.id)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                    {!user.approval ? (
                      <button
                        onClick={() => handleApprove(user.id, true)}
                        className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(user.id, false)}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal (remains the same) */}
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
                  <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                    selectedUser.approval 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedUser.approval ? 'Approved' : 'Pending Approval'}
                  </div>
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
                {!selectedUser.approval ? (
                  <button
                    onClick={() => handleApprove(selectedUser.id, true)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Approve User
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedUser.id, false)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Revoke Approval
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}