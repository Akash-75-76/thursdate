import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

export default function WaitlistStatus() {
  const navigate = useNavigate();
  const [isUserApproved, setIsUserApproved] = useState(null); // null = loading, true = approved, false = pending/rejected
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ✅ Track rejection status
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApproval = async () => {
    try {
      setIsRefreshing(true);
      const userData = await userAPI.getProfile();
      setIsUserApproved(!!userData.approval);
      setUserName(userData.firstName || userData.email || 'User');
      
      // ✅ Check rejection status from license verification
      if (userData.drivingLicenseVerifications && userData.drivingLicenseVerifications.length > 0) {
        const latestVerification = userData.drivingLicenseVerifications[0];
        if (latestVerification.verification_status === 'REJECTED') {
          setIsRejected(true);
          setRejectionReason(latestVerification.rejection_reason || '');
        } else {
          setIsRejected(false);
          setRejectionReason('');
        }
      } else {
        setIsRejected(false);
        setRejectionReason('');
      }
    } catch (err) {
      console.error('Failed to fetch approval status:', err);
      setIsUserApproved(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApproval();
  }, []);

  // Auto-refresh when page becomes visible (e.g., returning from admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isRefreshing) {
        console.log('Page visible - refreshing approval status...');
        fetchApproval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRefreshing]);

  // Auto-navigate when approved (immediately, no delay)
  useEffect(() => {
    if (isUserApproved === true) {
      console.log('User approved! Navigating to home immediately...');
      navigate("/home");
    }
  }, [isUserApproved, navigate]);

  return (
    <div className="h-screen bg-white px-6 pt-10 flex flex-col font-sans relative">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-[#222222] text-3xl font-light hover:opacity-60 transition z-50"
        aria-label="Back"
      >
        &lt;
      </button>

      {/* Header - Common to both loading and status screens */}
      <div className="flex items-center justify-center mb-6">
        <img src="/logo_dark.png" alt="Sundate" className="h-6" />
      </div>

      {/* Main content area - centered */}
      <div className="flex flex-col flex-1 justify-center items-center text-center px-4">
        {isUserApproved === null || isRefreshing ? (
          <div className="text-gray-500">
            {isRefreshing ? 'Refreshing status...' : 'Checking approval status...'}
          </div>
        ) : isUserApproved ? (
          // Approved Screen
          <>
            {/* Success icon with green tick and burst animation */}
            <div className="mb-8 w-24 h-24 relative animate-success-burst flex justify-center items-center">
              <div className="absolute inset-0 rounded-full flex items-center justify-center
                          bg-gradient-to-br from-green-300 via-green-200 to-transparent opacity-70 animate-pulse-background-green">
              </div>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center z-10 animate-fade-in">
                <img src="/success.svg" alt="Approved Check" className="w-10 h-10 filter brightness-0 invert" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">You're account has been approved</h1>
            <p className="text-gray-500 mb-12">
              Access unlocked. You're no longer waiting — you made it. Now don't make it weird.
            </p>
          </>
        ) : isRejected ? (
          // ✅ Rejected Screen
          <>
            {/* Rejection icon with warning symbol */}
            <div className="mb-8 w-24 h-24 relative animate-success-burst flex justify-center items-center">
              <div className="absolute inset-0 bg-orange-200 rounded-full animate-pulse-background"></div>
              <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center z-10">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">Profile Update Needed</h1>
            <p className="text-gray-500 mb-8">
              Your profile didn't meet our current criteria. You can update your details and try again.
            </p>
            {rejectionReason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8 text-left">
                <div className="text-xs font-semibold text-orange-900 mb-1">Reason:</div>
                <div className="text-sm text-orange-800">{rejectionReason}</div>
              </div>
            )}
          </>
        ) : (
          // Waitlist Screen (Under Review)
          <>
            {/* Success icon with gray tick and pulse animation */}
            <div className="mb-8 w-24 h-24 relative animate-success-burst flex justify-center items-center">
              <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse-background"></div>
              <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center z-10">
                <img src="/success.svg" alt="Success Check" className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-xl font-semibold mb-2">Hi {userName}, your application is under review</h1>
            <p className="text-gray-500 mb-8">
              Your application is in the hands of the pros. Sit tight, sip your favourite beverage, and let us work our magic—matches coming soon.
            </p>

            {/* Refresh Status Button */}
            <button
              onClick={fetchApproval}
              disabled={isRefreshing}
              className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 mb-12"
            >
              {isRefreshing ? 'Checking...' : 'Check approval status'}
            </button>
          </>
        )}
      </div>

      {/* Button container - pushed to the bottom */}
      <div className="pb-6 w-full flex flex-col gap-3 justify-center">
        {isUserApproved ? (
          <button
            onClick={() => navigate("/user-intent")}
            className="w-full max-w-xs py-4 rounded-xl bg-[#222222] text-white font-medium text-sm mx-auto"
          >
            Continue
          </button>
        ) : isRejected ? (
          // ✅ Show Edit Profile and Resubmit buttons for rejected users
          <>
            <button
              onClick={() => navigate("/user-info")}
              className="w-full max-w-xs py-4 rounded-xl bg-[#222222] text-white font-medium text-sm mx-auto"
            >
              Edit Profile
            </button>
            <button
              onClick={async () => {
                try {
                  setIsRefreshing(true);
                  // Reset profile and delete rejected verification entry
                  await userAPI.resetProfileForResubmission();
                  // Navigate to user info to start fresh
                  navigate("/user-info");
                } catch (err) {
                  console.error('Resubmission failed:', err);
                  alert('Failed to reset profile. Please try again.');
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              className="w-full max-w-xs py-4 rounded-xl border-2 border-[#222222] text-[#222222] font-medium text-sm mx-auto hover:bg-gray-50 disabled:opacity-50"
            >
              {isRefreshing ? 'Resetting...' : 'Resubmit Application'}
            </button>
          </>
        ) : (
          <button
            className="w-full max-w-xs py-4 rounded-xl bg-gray-300 text-gray-500 font-medium text-sm cursor-not-allowed mx-auto"
            disabled
          >
            Waiting for Approval
          </button>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes pulse-background {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
        }

        @keyframes pulse-background-green {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; } /* Slightly larger pulse for green */
            100% { transform: scale(1); opacity: 0.7; }
        }

        @keyframes success-burst {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-pulse-background {
            animation: pulse-background 2s infinite ease-in-out;
        }
        .animate-pulse-background-green {
            animation: pulse-background-green 2s infinite ease-in-out;
        }

        .animate-success-burst {
            animation: success-burst 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
        }

        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}