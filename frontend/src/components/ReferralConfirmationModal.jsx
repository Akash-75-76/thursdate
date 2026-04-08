import React, { useState } from 'react';
import { referralAPI } from '../utils/api';

export default function ReferralConfirmationModal({ referralRequest, onClose, onAction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      setError('');
      await referralAPI.acceptReferral(referralRequest.id);
      onAction('accepted');
    } catch (err) {
      setError(err.message || 'Failed to accept referral');
      setIsProcessing(false);
    }
  };

  const handleRejectKnown = async () => {
    try {
      setIsProcessing(true);
      setError('');
      await referralAPI.rejectReferralKnown(referralRequest.id);
      onAction('rejected_known');
    } catch (err) {
      setError(err.message || 'Failed to process request');
      setIsProcessing(false);
    }
  };

  const handleRejectUnknown = async () => {
    try {
      setIsProcessing(true);
      setError('');
      await referralAPI.rejectReferralUnknown(referralRequest.id);
      onAction('rejected_unknown');
    } catch (err) {
      setError(err.message || 'Failed to process request');
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setIsProcessing(true);
      await referralAPI.dismissReferral(referralRequest.id);
      onClose();
    } catch (err) {
      console.error('Failed to dismiss:', err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-rose-700 w-full max-w-xs rounded-2xl shadow-xl p-4 space-y-4 border border-pink-400/60 animate-fade-in">
        
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className="text-white/70 hover:text-white disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Decorative Icon */}
        <div className="-mt-2 flex justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 backdrop-blur-sm">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white drop-shadow-lg">Referral Confirmation</h2>
          <p className="text-white/90 text-xs leading-snug font-medium">
            {referralRequest.newUserName} listed you as their referrer
          </p>
        </div>

        {/* Message */}
        <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-lg p-3 text-center">
          <p className="text-white font-semibold text-xs">
            Please confirm if you know them
          </p>
        </div>

        {/* User details card */}
        {(referralRequest.referrerName || referralRequest.referrerPhone) && (
          <div className="bg-white/20 backdrop-blur-md border border-white/40 rounded-lg p-3 space-y-2 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-white/20">
              <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{referralRequest.newUserName.charAt(0)}</span>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-xs">{referralRequest.newUserName}</p>
                <p className="text-pink-100 text-xs font-semibold">Referred User</p>
              </div>
            </div>
            {referralRequest.referrerPhone && (
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">Phone</p>
                <p className="text-white font-semibold text-xs">{referralRequest.referrerPhone}</p>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/30 border border-red-300/50 rounded-lg p-2 text-xs text-white backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-1.5 pt-0.5">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-full py-2 rounded-lg bg-white text-rose-700 font-bold text-xs hover:bg-pink-50 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Yes, I referred ' + referralRequest.newUserName.split(' ')[0]}
          </button>

          <button
            onClick={handleRejectKnown}
            disabled={isProcessing}
            className="w-full py-2 rounded-lg bg-white/25 border-2 border-white/50 text-white font-semibold text-xs hover:bg-white/35 transition-all backdrop-blur-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I know them, but didn't refer
          </button>

          <button
            onClick={handleRejectUnknown}
            disabled={isProcessing}
            className="w-full py-2 rounded-lg bg-white/15 border-2 border-white/30 text-white font-semibold text-xs hover:bg-white/25 transition-all backdrop-blur-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I don't know them
          </button>
        </div>

        {/* Dismiss option */}
        <button
          onClick={handleDismiss}
          disabled={isProcessing}
          className="w-full py-1 text-white/70 font-semibold text-xs hover:text-white transition-all disabled:opacity-50"
        >
          Review later
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
