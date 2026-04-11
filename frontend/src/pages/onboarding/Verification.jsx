import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../../utils/tokenManager";
import { API_BASE_URL } from "../../utils/config";

const API_URL = API_BASE_URL;

const BUTTON_SOLID =
  "bg-white text-black text-base font-medium rounded-full transition duration-200 hover:bg-gray-100 disabled:opacity-60";
const INPUT_CLEAN =
  "w-full p-4 rounded-lg bg-black/40 text-white border border-white/20 placeholder-white/60 focus:ring-1 focus:ring-white focus:border-white transition";

const Header = () => (
  <div className="pt-10 w-full text-center z-10">
    <img src="/logo.png" alt="Sundate" className="h-6 mx-auto" />
  </div>
);

export default function Verification() {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const [emailTimer, setEmailTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedUserData, setVerifiedUserData] = useState(null);

  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  useEffect(() => {
    if (step === "email-otp" && emailTimer > 0) {
      const interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, emailTimer]);

  const handleSendOtp = async () => {
    if (mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/phone-auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: mobileNumber, otpType: 'signup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // For development - log the OTP
      if (data.otp) {
        console.log('Development OTP:', data.otp);
      }

      setTimer(120);
      setStep("otp");
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/phone-auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: mobileNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      console.log('DEBUG Frontend: Phone OTP response:', data);
      console.log('DEBUG Frontend: data.userId =', data.userId);
      console.log('DEBUG Frontend: data.user =', data.user);
      console.log('DEBUG Frontend: Keys in response:', Object.keys(data));

      // ✅ FIX: Store token from OTP verification response
      if (data.token) {
        setToken(data.token);
        console.log('✅ Token stored after phone OTP verification');
      }

      // ✅ FIX: Store user data and show success screen
      // userId is at the TOP LEVEL of response, not nested in user
      const userData = {
        isNewUser: data.isNewUser,
        userId: data.userId,  // ← Get from top level
        user: data.user,
        redirectPath: data.redirectPath,
      };

      console.log('DEBUG Frontend: Storing verifiedUserData:', userData);
      setVerifiedUserData(userData);
      setStep("success");
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Navigate based on user status after showing success screen
  const handleSuccessNext = () => {
    // Move to email collection step
    setStep("email");
  };

  // ✅ NEW: Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!email || !/^.+@.+\..+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpType: 'signup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email OTP');
      }

      // For development - log the OTP
      if (data.otp) {
        console.log('Development Email OTP:', data.otp);
      }

      setEmailTimer(30);
      setStep("email-otp");
    } catch (err) {
      setError(err.message || 'Failed to send email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Verify Email OTP and complete signup
  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userIdToPass = verifiedUserData?.userId;  // ← Get from top level
      console.log('DEBUG Frontend: Sending email OTP verification:', { 
        email, 
        otp: emailOtp, 
        userId: userIdToPass,
        verifiedUserData 
      });
      
      const response = await fetch(`${API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ✅ Pass userId from phone verification so backend can update that user
        body: JSON.stringify({ 
          email, 
          otp: emailOtp,
          userId: userIdToPass
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // ✅ Store token from email OTP verification
      if (data.token) {
        setToken(data.token);
        console.log('✅ Token stored after email OTP verification');
      }

      // ✅ Now perform final routing based on user status
      const { isNewUser, user: userData, redirectPath } = data;

      if (userData) {
        // EXISTING USER - Check onboarding status
        if (userData.onboardingComplete) {
          if (userData.accountStatus === 'approved') {
            navigate('/home');
          } else {
            // For any non-approved status, keep on waitlist page until approved
            navigate('/waitlist-status');
          }
          return;
        }

        // User has not completed full onboarding
        // Check if they completed UserInfo (has firstName and lastName)
        if (userData.firstName && userData.lastName) {
          // Completed UserInfo, move to UserIntent
          navigate('/user-intent');
          return;
        }

        // Not started or in the middle of UserInfo
        navigate('/user-info');
        return;
      }

      // NEW USER - Use redirectPath or default to /user-info
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate('/user-info');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Resend Email OTP
  const handleResendEmailOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/resend-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpType: 'signup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email OTP');
      }

      // For development - log the OTP
      if (data.otp) {
        console.log('Development Email OTP:', data.otp);
      }

      setEmailTimer(30);
      setEmailOtp("");
    } catch (err) {
      setError(err.message || 'Failed to resend email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MobileStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Verify your number
      </h2>
      <p className="text-white/80 text-sm mb-8">
        Let's get your number verified with an OTP
      </p>

      <input
        type="tel"
        value={mobileNumber}
        onChange={(e) => {
          setMobileNumber(e.target.value.replace(/[^0-9]/g, ''));
          setError("");
        }}
        placeholder="Enter Mobile number"
        className={INPUT_CLEAN + " mb-4"}
        maxLength={10}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}
    </>
  );

  const OtpStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Enter verification code
      </h2>
      <p className="text-white/80 text-sm mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-white">
          +91 {mobileNumber || "9833540192"}
        </span>
      </p>

      <input
        type="number"
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.slice(0, 6));
          setError("");
        }}
        placeholder="------"
        className={INPUT_CLEAN + " text-center tracking-widest text-lg mb-4"}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <div className="w-full mb-10 text-left text-sm">
        {timer > 0 ? (
          <p className="text-white/70">
            {(() => {
              const min = Math.floor(timer / 60);
              const sec = timer % 60;
              return `Resend OTP in ${min}:${sec.toString().padStart(2, "0")}`;
            })()}
          </p>
        ) : (
          <button
            onClick={handleSendOtp}
            className="text-white font-medium hover:text-white/80"
          >
            Resend OTP
          </button>
        )}
      </div>
    </>
  );

  const SuccessStep = (
    <div className="flex flex-col items-center text-center py-12">
      <div className="relative w-26 h-26 mb-6 flex items-center justify-center" style={{ width: '104px', height: '104px' }}>
        {/* Three concentric circles behind the tick icon */}
        <span className="absolute rounded-full z-0 verification-pulse" style={{ width: '140px', height: '140px', background: '#4CAF50', opacity: 0.2 }}></span>
        <span className="absolute rounded-full z-0 verification-pulse" style={{ width: '110px', height: '110px', background: '#4CAF50', opacity: 0.4, animationDelay: '0.4s' }}></span>
        <span className="absolute rounded-full z-0" style={{ width: '80px', height: '80px', background: '#4CAF50', opacity: 0.7 }}></span>
        {/* Main success icon */}
        <span className="relative flex items-center justify-center rounded-full z-10" style={{ width: '104px', height: '104px', background: 'rgba(76,175,80,0.12)' }}>
          <img
            src="/verification-tick.svg"
            alt="Success"
            className="w-10 h-10"
            style={{ width: '30px', height: '30px' }}
          />
        </span>
      </div>
      <h2 className="text-white text-lg font-semibold mb-2 pt-4">
        Phone verified
      </h2>
      <p className="text-white/80 text-sm mb-10">
        Now let's verify your email
      </p>
    </div>
  );

  const EmailStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Enter your email
      </h2>
      <p className="text-white/80 text-sm mb-8">
        We'll send you a verification code
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        placeholder="Enter your email"
        className={INPUT_CLEAN + " mb-4"}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}
    </>
  );

  const EmailOtpStep = (
    <>
      <h2 className="text-white text-lg font-semibold mb-2">
        Enter verification code
      </h2>
      <p className="text-white/80 text-sm mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-white">
          {email}
        </span>
      </p>

      <input
        type="text"
        maxLength={6}
        value={emailOtp}
        onChange={(e) => {
          setEmailOtp(e.target.value.replace(/[^0-9]/g, ''));
          setError("");
        }}
        placeholder="------"
        className={INPUT_CLEAN + " text-center tracking-widest text-lg mb-4"}
      />

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <div className="w-full mb-10 text-left text-sm">
        {emailTimer > 0 ? (
          <p className="text-white/70">
            Resend OTP in {emailTimer}s
          </p>
        ) : (
          <button
            onClick={handleResendEmailOtp}
            className="text-white font-medium hover:text-white/80"
          >
            Resend OTP
          </button>
        )}
      </div>
    </>
  );

  // ✅ NEW: Handle back navigation
  const handleBackStep = () => {
    if (step === "email-otp") {
      setStep("email");
    } else if (step === "email") {
      setStep("success");
    } else if (step === "success") {
      setStep("otp");
    } else if (step === "otp") {
      // Reset to mobile step
      setStep("mobile");
      setOtp("");
      setMobileNumber("");
      setError("");
    } else if (step === "mobile") {
      // Go back to gateway
      navigate(-1);
    }
  };

  // Determine which step content to render
  let content;
  if (step === "mobile") content = MobileStep;
  else if (step === "otp") content = OtpStep;
  else if (step === "success") content = SuccessStep;
  else if (step === "email") content = EmailStep;
  else if (step === "email-otp") content = EmailOtpStep;
  else content = MobileStep;

  return (
    <div className="h-screen w-screen flex flex-col items-center relative px-6">
      {/* Background with blur */}
      <div
        className="absolute inset-0 bg-black/40 z-0"
        style={{
          backgroundImage: `url('/bgs/bg-verification.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
        }}
      ></div>

      {/* Foreground overlay for readability */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Back Button */}
      <button
        onClick={handleBackStep}
        className="absolute top-6 left-6 text-white text-3xl font-light hover:opacity-80 transition z-50"
        aria-label="Back"
      >
        &lt;
      </button>

      <Header />

      {/* Content pinned to top, not middle */}
      <div className="relative z-10 w-full max-w-sm mt-12">
        {content}
      </div>

      {/* Bottom button section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8 flex justify-center">
        <div className="w-full max-w-sm space-y-3">
          {/* Main Action Button */}
          <div>
            {step === "mobile" && (
              <button
                onClick={handleSendOtp}
                disabled={loading || mobileNumber.length < 10}
                className={BUTTON_SOLID + " w-full py-4 rounded-full"}
              >
                {loading ? 'Sending...' : 'Next'}
              </button>
            )}
            {step === "otp" && (
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className={BUTTON_SOLID + " w-full py-4 rounded-full"}
              >
                {loading ? 'Verifying...' : 'Next'}
              </button>
            )}
            {step === "success" && (
              <button
                onClick={handleSuccessNext}
                className={BUTTON_SOLID + " w-full py-4 rounded-full"}
              >
                Next
              </button>
            )}
            {step === "email" && (
              <button
                onClick={handleSendEmailOtp}
                disabled={loading || !email || !/^.+@.+\..+/.test(email)}
                className={BUTTON_SOLID + " w-full py-4 rounded-full"}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            )}
            {step === "email-otp" && (
              <button
                onClick={handleVerifyEmailOtp}
                disabled={loading || emailOtp.length !== 6}
                className={BUTTON_SOLID + " w-full py-4 rounded-full"}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
