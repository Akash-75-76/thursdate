import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI } from '../../utils/api';

export default function Referral() {
  const navigate = useNavigate();
  
  // Main flow state
  const [step, setStep] = useState(1); // 1: Intro, 2: Contact Modal, 3: Referrer Entry, 4: Confirmation
  
  // Referrer data state
  const [referrerName, setReferrerName] = useState('');
  const [referrerPhone, setReferrerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [referrerUserId, setReferrerUserId] = useState(null);
  
  // UI state
  const [showContactModal, setShowContactModal] = useState(false);
  const [skipReferral, setSkipReferral] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showReferrerConfirmation, setShowReferrerConfirmation] = useState(false);
  const [referrerToConfirm, setReferrerToConfirm] = useState({ name: 'Om Gaikwad', phone: '7218992913' });

  // Progress calculation
  const progress = (step === 1 || step === 2) ? 25 : (step === 3) ? 50 : 100;

  // Search for referrers with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const results = await referralAPI.searchReferrers(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle referrer selection from search results
  const handleSelectReferrer = (user) => {
    setReferrerName(user.name);
    setReferrerPhone(user.phone || '');
    setReferrerUserId(user.id);
    setShowSearchResults(false);
  };

  // Handle contact modal action
  const handleContactModalAction = () => {
    setShowContactModal(false);
    setStep(3); // Move to referrer entry step
  };

  // Handle moving to next step (from intro to contact modal)
  const handleNext = () => {
    setShowContactModal(true);
    setStep(2);
  };

  // Handle form submission (referrer data entry)
  const handleSubmit = async () => {
    if (skipReferral) {
      // Skip referral - navigate directly without showing confirmation modal
      navigate('/face-verification');
      return;
    }

    if (!referrerName.trim() || !referrerPhone.trim()) {
      setError('Please enter both name and phone number');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await referralAPI.createReferralRequest(
        referrerName.trim(),
        referrerPhone.trim(),
        referrerUserId || null
      );

      setStep(4); // Move to confirmation
    } catch (err) {
      console.error('Referral submission failed:', err);
      setError(err.message || 'Failed to submit referral request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else if (step === 2) {
      setStep(1);
      setShowContactModal(false);
    } else if (step === 3) {
      setStep(1);
    } else if (step === 4) {
      setStep(3);
    }
  };

  return (
    <div
      className="h-screen flex flex-col font-sans relative"
      style={{
        backgroundImage: "url('/bgs/bg-referral-bokeh.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-10 pb-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 text-white text-3xl font-light hover:opacity-80 transition z-50"
          aria-label="Back"
        >
          &lt;
        </button>

        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Sundate" className="h-7" />
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-8">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content Sections */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="flex flex-col flex-1 justify-between">
              <div className="mt-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl px-6 py-6 border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-30 h-30 flex items-center justify-center">
                      <img src="/people.svg" alt="Referral Icon" className="w-30 h-30" />
                    </div>
                  </div>
                  <h1 className="text-[20px] font-semibold text-white mb-2 text-center">
                    Add your referrals
                  </h1>
                  <p className="text-[13px] text-white/80 leading-snug max-w-xs text-center mx-auto">
                    You're not getting in alone. Drop a name, get their nod, and we'll hold the door.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full">
                <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-full bg-white text-black text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.6)] active:scale-[0.98] transition-transform"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Referrer Entry with Search */}
          {step === 3 && (
            <div className="flex flex-col flex-1 justify-between">
              <div className="space-y-6 overflow-y-auto">
                <div>
                  <h1 className="text-xl font-semibold mb-6 text-white drop-shadow-md">
                    Who referred you?
                  </h1>
                  <p className="text-white/80 text-sm">
                    Help us understand how you discovered Sundate
                  </p>
                </div>

                {/* Referrer Name Input with Search */}
                <div>
                  <label className="text-white text-sm font-semibold mb-2 block">
                    Referrer Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={referrerName}
                      onChange={(e) => {
                        setReferrerName(e.target.value);
                        setSearchQuery(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                    />

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectReferrer(user)}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                          >
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-xs text-white/60">{user.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Referrer Phone Input */}
                <div>
                  <label className="text-white text-sm font-semibold mb-2 block">
                    Referrer Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={referrerPhone}
                    onChange={(e) => setReferrerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white focus:bg-white/30 transition-all"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm">
                    {error}
                  </div>
                )}

                {/* Skip option */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setSkipReferral(!skipReferral)}
                    className="text-white/60 hover:text-white/90 text-sm font-semibold transition-colors"
                  >
                    {skipReferral ? '✓ Skip referral' : 'Skip referral '}
                  </button>
                </div>
              </div>

              {/* Submit Button at Bottom */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!referrerName && !skipReferral) || (!referrerPhone && !skipReferral)}
                className="w-full py-4 rounded-xl bg-white text-blue-600 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
              >
                {isSubmitting ? 'Submitting...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 4: Confirmation Modal */}
          {step === 4 && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-6 border border-pink-400/50 backdrop-blur-sm">
                {/* Checkmark */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center">
                    <div className="text-6xl text-green-400">✓</div>
                  </div>
                </div>

                {/* Thank you message */}
                <div>
                  <h1 className="text-4xl font-bold text-white mb-3">
                    Thank you!
                  </h1>
                  <p className="text-pink-100 text-lg">
                    Referral request sent for confirmation
                  </p>
                </div>

                {/* Referrer Details */}
                <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-left space-y-3">
                  <p className="text-pink-100 text-sm font-semibold uppercase tracking-wider">Referrer Details</p>
                  <div className="space-y-2">
                    <p className="text-white font-bold text-lg">{referrerName || 'Skipped'}</p>
                    <p className="text-pink-50 text-sm">{referrerPhone || 'No phone provided'}</p>
                  </div>
                </div>

                {/* Success message */}
                <p className="text-pink-50 text-sm leading-relaxed">
                  {referrerUserId
                    ? 'Once they confirm, you\'ll get priority on the waitlist!'
                    : 'Once confirmation is received, you\'ll get priority on the waitlist!'}
                </p>

                {/* Continue Button */}
                <button
                  onClick={() => navigate('/face-verification')}
                  className="w-full py-4 rounded-xl bg-white text-pink-600 font-bold text-lg hover:bg-pink-50 transition-all shadow-lg active:scale-95"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Permission Modal (iOS-style) */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#515151] rounded-xl shadow-lg w-72 text-center overflow-hidden">
            <div className="p-4 pt-5">
              <p className="text-white text-[17px] font-semibold mb-1">
                "Sundate" would like to access your contacts
              </p>
              <p className="text-[#D0D0D0] text-[13px] leading-tight px-2">
                To better understand your connection to our community, we recommend allowing full access on the next steps
              </p>
            </div>
            <div className="flex border-t border-[#636363]">
              <button
                onClick={handleContactModalAction}
                className="flex-1 py-2 text-blue-400 font-normal text-[17px] border-r border-[#636363]"
              >
                Don't allow
              </button>
              <button
                onClick={handleContactModalAction}
                className="flex-1 py-2 text-blue-400 font-normal text-[17px]"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referrer Confirmation Modal */}
      {showReferrerConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600 rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-8 border border-pink-300/60 animate-fade-in">
            
            {/* Decorative Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 backdrop-blur-sm">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">Referral Confirmation</h2>
              <p className="text-white/95 text-sm leading-relaxed font-medium">
                {referrerToConfirm.name} has listed you as their referrer
              </p>
            </div>

            {/* Message */}
            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-5 text-center">
              <p className="text-white font-semibold text-lg">
                Please confirm if you know them
              </p>
            </div>

            {/* Referrer Details Card */}
            <div className="bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-3 pb-4 border-b border-white/20">
                <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">{referrerToConfirm.name.charAt(0)}</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-lg">{referrerToConfirm.name}</p>
                  <p className="text-pink-100 text-xs font-semibold">Referrer</p>
                </div>
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</p>
                <p className="text-white font-semibold text-base">{referrerToConfirm.phone}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowReferrerConfirmation(false)}
                className="w-full py-3 rounded-xl bg-white text-rose-600 font-bold text-base hover:bg-pink-50 transition-all shadow-lg active:scale-95 hover:shadow-xl"
              >
                ✓ Yes, I referred {referrerToConfirm.name.split(' ')[0]}
              </button>
              <button
                onClick={() => setShowReferrerConfirmation(false)}
                className="w-full py-3 rounded-xl bg-white/25 border-2 border-white/50 text-white font-semibold text-base hover:bg-white/35 transition-all backdrop-blur-sm active:scale-95"
              >
                I know them, but didn't refer
              </button>
              <button
                onClick={() => setShowReferrerConfirmation(false)}
                className="w-full py-3 rounded-xl bg-white/15 border-2 border-white/30 text-white font-semibold text-base hover:bg-white/25 transition-all backdrop-blur-sm active:scale-95"
              >
                I don't know them
              </button>
              <button
                onClick={() => setShowReferrerConfirmation(false)}
                className="w-full py-2 text-white/80 font-semibold text-sm hover:text-white transition-all pt-3"
              >
                Review later
              </button>
            </div>
          </div>
        </div>
      )}

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
