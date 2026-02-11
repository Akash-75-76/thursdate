import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import emailConfirmIcon from "../../../public/email-confirm-icon.svg";
import { userAPI, authAPI } from '../../utils/api';

export default function SocialPresence() {
    const navigate = useNavigate();

    // === STATES ===
    const [email, setEmail] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [emailOTP, setEmailOTP] = useState("");
    const [emailOTPVerified, setEmailOTPVerified] = useState(false);
    const [instagram, setInstagram] = useState(""); // Reused for all inputs
    const [showInstaConfirm, setShowInstaConfirm] = useState(false);
    const [confirmInstagram, setConfirmInstagram] = useState("");
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [instaCode, setInstaCode] = useState("");
    const [codeVerified, setCodeVerified] = useState(false);
    const [showMethodSelection, setShowMethodSelection] = useState(true);
    const [verificationMethod, setVerificationMethod] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadStep, setUploadStep] = useState("front"); // 'front' or 'back'
    const [licenseFrontPreview, setLicenseFrontPreview] = useState(null);
    const [licenseBackPreview, setLicenseBackPreview] = useState(null);
    const [licenseVerified, setLicenseVerified] = useState(false);

    // OTP Timers
    const [emailResendTimer, setEmailResendTimer] = useState(30);
    const [emailCanResend, setEmailCanResend] = useState(false);

    // === GLASS STYLES ===
    const INPUT_GLASS =
        "bg-white/20 backdrop-blur-sm placeholder-white/80 text-white border-white/30";
    const BUTTON_GLASS_ACTIVE =
        "bg-white backdrop-blur-md text-black border border-white/40 shadow-lg";
    const BUTTON_GLASS_INACTIVE =
        "bg-white text-black cursor-not-allowed border border-white/20";

    // === VALIDATIONS ===
    const isEmailValid = email.trim() && /.+@.+\..+/.test(email);

    const isInputValid = () => {
        if (!instagram.trim()) return false;
        if (verificationMethod === "linkedin") return instagram.length > 0;
        return true;
    };

    const isConfirmInputValid = confirmInstagram.trim() === instagram;

    // Email OTP Timer
    useEffect(() => {
        if (showConfirm && emailResendTimer > 0) {
            const timer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (emailResendTimer === 0) {
            setEmailCanResend(true);
        }
    }, [emailResendTimer, showConfirm]);

    // cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            try { if (licenseFrontPreview) URL.revokeObjectURL(licenseFrontPreview); } catch (e) { }
            try { if (licenseBackPreview) URL.revokeObjectURL(licenseBackPreview); } catch (e) { }
        };
    }, [licenseFrontPreview, licenseBackPreview]);

    // Check for LinkedIn OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('linkedin_verified') === 'true') {
            const token = params.get('token');
            const linkedinUrl = params.get('linkedin_url');
            if (token) {
                localStorage.setItem('token', token);
                if (linkedinUrl) {
                    setInstagram(linkedinUrl);
                }
                setCodeVerified(true);
                setVerificationMethod('linkedin');
                // Clean up URL
                window.history.replaceState({}, '', '/social-presence');
            }
        }
    }, []);

    // === HANDLERS ===
    const handleSendEmailOTP = async () => {
        console.log('🔵 handleSendEmailOTP called for email:', email);
        try {
            console.log('🔵 Calling API...');
            const result = await authAPI.sendEmailOTP(email);
            console.log('✅ OTP sent successfully:', result.message);
            setShowConfirm(true);
            setEmailResendTimer(30);
            setEmailCanResend(false);
        } catch (err) {
            console.error('❌ Failed to send email OTP:', err);
            alert(err.message || 'Failed to send OTP. Please try again.');
        }
    };

    const handleResendEmailOTP = async () => {
        try {
            const result = await authAPI.resendEmailOTP(email);
            console.log('OTP resent successfully:', result.message);
            setEmailResendTimer(30);
            setEmailCanResend(false);
            setEmailOTP("");
        } catch (err) {
            console.error('Failed to resend email OTP:', err);
            alert(err.message || 'Failed to resend OTP. Please try again.');
        }
    };

    const handleVerifyEmailOTP = async () => {
        if (emailOTP.length === 6) {
            try {
                const result = await authAPI.verifyEmailOTP(email, emailOTP);
                console.log('Email verified successfully:', result.message);
                setEmailOTPVerified(true);
            } catch (err) {
                console.error('Failed to verify email OTP:', err);
                alert(err.message || 'Invalid OTP. Please try again.');
            }
        }
    };

    const handleLinkedInOAuth = () => {
        // Redirect to backend OAuth endpoint
        window.location.href = 'http://localhost:5000/auth/linkedin';
    };

    const handleStartVerification = () => {
        if (verificationMethod === "linkedin") {
            handleLinkedInOAuth();
        }
    };

    const handleConfirmAndProceed = () => {
        setShowCodeInput(true);
    };

    const handleVerifyCode = async () => {
        if (instaCode.length === 4) {
            setCodeVerified(true);

            // Save LinkedIn to database
            if (verificationMethod === "linkedin") {
                try {
                    const updateData = {
                        linkedin: instagram // Full URL or username
                    };
                    await userAPI.updateProfile(updateData);
                } catch (err) {
                    console.error('Failed to save LinkedIn profile:', err);
                    // Continue anyway - don't block user
                }
            }
        }
    };

    // === RENDER ===
    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/socialpresencebg.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 z-0"></div>

            {/* Main Content */}
            <div className="relative z-40 p-6 pt-10 flex flex-col flex-grow bg-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div style={{ width: 24 }}></div>
                    <div className="text-white/80 text-[24px] font-semibold mx-auto">
                        Sundate.
                    </div>
                    <div style={{ width: 24 }}></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-white h-1.5 rounded-full transition-all duration-300 shadow-md"
                        style={{ width: codeVerified || emailOTPVerified || licenseVerified ? "100%" : "50%" }}
                    ></div>
                </div>

                {/* === METHOD SELECTION === */}
                {showMethodSelection && (
                    <div className="flex flex-col flex-grow">
                        <h1 className="text-2xl font-normal mb-3 text-white drop-shadow-md">
                            Choose your verification method
                        </h1>
                        <p className="text-white/80 text-sm mb-8 leading-relaxed">
                            Select one option to verify your identity and continue.
                        </p>

                        <div className="flex flex-col gap-4 mb-auto">
                            {/* Gmail Option */}
                            <button
                                className="w-full py-4 rounded-full font-medium text-lg transition bg-white text-black hover:bg-gray-200 flex items-center justify-between pl-6 pr-4"
                                onClick={() => {
                                    setVerificationMethod("gmail");
                                    setShowMethodSelection(false);
                                }}
                            >
                                <span>Verify with Gmail</span>
                                <span className="text-black text-xl">&gt;</span>
                            </button>

                            {/* LinkedIn Option */}
                            <button
                                className="w-full py-4 rounded-full font-medium text-lg transition border border-white/40 text-white bg-black/30 hover:bg-black/50 flex items-center justify-between pl-6 pr-4"
                                onClick={() => {
                                    setVerificationMethod("linkedin");
                                    setShowMethodSelection(false);
                                }}
                            >
                                <span>Verify with LinkedIn</span>
                                <span className="text-white text-xl">&gt;</span>
                            </button>

                            {/* Driver's License Option */}
                            <button
                                className="w-full py-4 rounded-full font-medium text-lg transition border border-white/40 text-white bg-black/30 hover:bg-black/50 flex items-center justify-between pl-6 pr-4"
                                onClick={() => {
                                    setVerificationMethod("license");
                                    setShowMethodSelection(false);
                                }}
                            >
                                <span>Verify with Driver's License</span>
                                <span className="text-white text-xl">&gt;</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* === GMAIL VERIFICATION === */}
                {!showMethodSelection && verificationMethod === "gmail" && (
                    <div className="flex flex-col flex-grow">
                        <button
                            onClick={() => {
                                setShowMethodSelection(true);
                                setVerificationMethod(null);
                                setEmail("");
                                setShowConfirm(false);
                            }}
                            className="self-start mb-4 text-white/80 hover:text-white flex items-center gap-2"
                        >
                            <span>&lt;</span> Back
                        </button>
                        <h1 className="text-xl font-normal mb-6 text-white drop-shadow-md">
                            What's your email?
                        </h1>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your Gmail address"
                            className={`w-full px-4 py-4 border rounded-xl text-sm mb-auto transition ${INPUT_GLASS}`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isEmailValid) handleSendEmailOTP();
                            }}
                        />

                        {!showConfirm && (
                            <button
                                disabled={!isEmailValid}
                                onClick={handleSendEmailOTP}
                                className={`w-full py-4 rounded-[9999px] font-medium text-lg mt-8 transition ${!isEmailValid ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                            >
                                Next
                            </button>
                        )}

                        {/* Email OTP Modal */}
                        {showConfirm && (
                            <div className="fixed left-0 right-0 bottom-0 flex justify-center items-end pb-6 z-50">
                                <div className="w-full max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">
                                    {!emailOTPVerified ? (
                                        <>
                                            <img src={emailConfirmIcon} alt="Email" className="w-14 h-14 mb-4" />
                                            <div className="text-white text-lg font-semibold mb-2">Email Verification</div>
                                            <div className="text-white/80 text-sm mb-6 text-center">
                                                Enter the 6-digit OTP sent to {email}
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={emailOTP}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                                    setEmailOTP(val);
                                                }}
                                                placeholder="6-digit OTP"
                                                className="w-full px-4 py-4 border rounded-xl text-sm mb-2 transition bg-white/20 backdrop-blur-sm text-white placeholder-white/80 border-white/30"
                                            />
                                            <div className="text-white/60 text-xs mb-4">
                                                {emailCanResend ? (
                                                    <button onClick={handleResendEmailOTP} className="text-white underline hover:text-white/80">
                                                        Resend OTP
                                                    </button>
                                                ) : (
                                                    <span>Resend in {emailResendTimer}s</span>
                                                )}
                                            </div>
                                            <button
                                                disabled={emailOTP.length !== 6}
                                                onClick={handleVerifyEmailOTP}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${emailOTP.length !== 6 ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                            >
                                                Verify OTP
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center mb-4">
                                                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-[#4CAF50]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </span>
                                            </div>
                                            <div className="text-white text-center text-base font-semibold leading-tight mb-6">
                                                Your email has been verified successfully.
                                            </div>
                                            <button
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${BUTTON_GLASS_ACTIVE}`}
                                                onClick={() => navigate("/face-verification")}
                                            >
                                                Continue
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* === LINKEDIN & LICENSE VERIFICATION === */}
                {!showMethodSelection && verificationMethod !== "gmail" && verificationMethod !== null && (
                    <div className="flex flex-col flex-grow justify-between">
                        <div>
                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setShowMethodSelection(true);
                                    setVerificationMethod(null);
                                    setInstagram("");
                                    setShowUpload(false);
                                    setUploadStep("front");
                                }}
                                className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
                            >
                                <span>&lt;</span> Back
                            </button>

                            {/* === DRIVING LICENSE SCREEN === */}
                            {verificationMethod === "license" ? (
                                showUpload ? (
                                    // ---------- UPLOAD SCREEN ----------
                                    <div className="flex flex-col flex-grow px-6">
                                        <h1 className="text-2xl font-normal text-left text-white mb-3 drop-shadow-md">
                                            {uploadStep === "front" ? "Upload front of license" : "Upload back of license"}
                                        </h1>
                                        <p className="text-white/80 text-sm mb-8 text-left leading-relaxed">
                                            {uploadStep === "front"
                                                ? "Please upload a clear photo of the front of your driver's license."
                                                : "Please upload a clear photo of the back of your driver's license."}
                                        </p>

                                        {/* Upload Area */}
                                        <div className="flex justify-center">
                                            <label
                                                htmlFor={`license-upload-${uploadStep}`}
                                                className="flex flex-col items-center justify-center w-full max-w-[280px] h-[180px] border-2 border-dashed border-white/50 rounded-2xl bg-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition"
                                            >
                                                {uploadStep === "front" && licenseFrontPreview ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={licenseFrontPreview} alt="Front preview" className="w-full h-full object-contain rounded-2xl" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                try { URL.revokeObjectURL(licenseFrontPreview); } catch (err) { }
                                                                setLicenseFrontPreview(null);
                                                                const input = document.getElementById('license-upload-front');
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : uploadStep === "back" && licenseBackPreview ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={licenseBackPreview} alt="Back preview" className="w-full h-full object-contain rounded-2xl" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                try { URL.revokeObjectURL(licenseBackPreview); } catch (err) { }
                                                                setLicenseBackPreview(null);
                                                                const input = document.getElementById('license-upload-back');
                                                                if (input) input.value = '';
                                                            }}
                                                            className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="48"
                                                            height="48"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={1.5}
                                                            className="text-white/70 mb-2"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                                            />
                                                        </svg>
                                                        <p className="text-white text-sm font-medium">Tap to upload your photo</p>
                                                        <p className="text-white/60 text-xs mt-1">JPG, PNG or JPEG (max 10MB)</p>
                                                    </>
                                                )}
                                                <input
                                                    id={`license-upload-${uploadStep}`}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && file.size <= 10 * 1024 * 1024) {
                                                            const url = URL.createObjectURL(file);
                                                            if (uploadStep === 'front') {
                                                                if (licenseFrontPreview) try { URL.revokeObjectURL(licenseFrontPreview); } catch (err) { }
                                                                setLicenseFrontPreview(url);
                                                            } else {
                                                                if (licenseBackPreview) try { URL.revokeObjectURL(licenseBackPreview); } catch (err) { }
                                                                setLicenseBackPreview(url);
                                                            }
                                                        } else if (file) {
                                                            alert("File too large. Max 10MB.");
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {/* Continue Button */}
                                        <button
                                            onClick={() => {
                                                if (uploadStep === "front") {
                                                    setUploadStep("back");
                                                } else {
                                                    setLicenseVerified(true);
                                                }
                                            }}
                                            className={`w-full py-4 rounded-full font-medium text-lg mt-8 transition ${BUTTON_GLASS_ACTIVE}`}
                                        >
                                            {uploadStep === "front" ? "Continue" : "Finish"}
                                        </button>
                                    </div>
                                ) : (
                                    // ---------- INFO SCREEN ----------
                                    <>
                                        <h1 className="text-2xl font-normal text-white mb-3 mt-4 drop-shadow-md">
                                            Verify with Driving License
                                        </h1>
                                        <p className="text-white/80 text-sm mb-8 leading-relaxed">
                                            To complete your verification, we'll need photos of your driver's license.
                                        </p>

                                        {/* Sample Images */}
                                        <div className="flex gap-4 justify-center mb-8 px-4">
                                            <div className="flex-1 max-w-[140px]">
                                                <img
                                                    src="/frontLicense.jpg"
                                                    alt="Front of license sample"
                                                    className="w-full h-auto rounded-xl shadow-lg border border-white/20"
                                                />
                                            </div>
                                            <div className="flex-1 max-w-[140px]">
                                                <img
                                                    src="/backLicense.jpg"
                                                    alt="Back of license sample"
                                                    className="w-full h-auto rounded-xl shadow-lg border border-white/20"
                                                />
                                            </div>
                                        </div>

                                        {/* Note Box */}
                                        <div className="bg-transparent rounded-2xl p-5 mb-8">
                                            <p className="text-white/90 text-sm font-medium mb-2">Note:</p>
                                            <ul className="text-white/70 text-xs space-y-1.5 list-disc pl-5">
                                                <li>Make sure all text is readable and the photo is clear.</li>
                                                <li>Your information is encrypted and never shared with third parties.</li>
                                                <li>This verification usually takes less than 2 minutes to complete.</li>
                                            </ul>
                                        </div>
                                    </>
                                )
                            ) : (
                                <>
                                    {/* === INPUT SCREEN (LinkedIn) === */}
                                    <h1 className="text-xl font-normal text-white mb-2 mt-2">Enter your LinkedIn profile</h1>
                                    <p className="text-white/70 text-xs mb-6">We'll verify your LinkedIn profile.</p>
                                    <div className="mb-8">
                                        <div className={`flex items-center border rounded-xl ${INPUT_GLASS}`}>
                                            <span className="pl-4 pr-1 text-white/70 text-sm">in/</span>
                                            <input
                                                type="text"
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                placeholder="yourname"
                                                className="flex-1 pr-4 py-4 bg-transparent border-0 outline-none text-sm text-white placeholder-white/80"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && isInputValid()) {
                                                        handleStartVerification();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* === BUTTON BAR === */}
                        <div className="flex flex-col gap-4 pb-2">
                            {/* LinkedIn */}
                            {verificationMethod === "linkedin" && !showInstaConfirm && (
                                <button
                                    disabled={!isInputValid()}
                                    onClick={handleStartVerification}
                                    className={`w-full py-4 rounded-full font-medium text-lg transition ${!isInputValid() ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                >
                                    Verify LinkedIn
                                </button>
                            )}

                            {/* Driving License Continue */}
                            {verificationMethod === "license" && !showInstaConfirm && !showUpload && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="w-full py-4 rounded-full font-medium text-lg text-white bg-white/30 backdrop-blur-md border border-white/40 shadow-lg hover:bg-white/40 transition"
                                >
                                    Continue
                                </button>
                            )}

                            {/* === LICENSE VERIFIED MODAL === */}
                            {licenseVerified && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center">
                                    <div className="bg-black/60 absolute inset-0"></div>
                                    <div className="relative z-60 w-full max-w-sm p-6 rounded-3xl bg-white/5 backdrop-blur-lg flex flex-col items-center border border-white/20">
                                        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </div>
                                        <div className="text-white text-lg font-semibold mb-2">License verified</div>
                                        <div className="text-white/80 text-sm mb-4 text-center">Thanks — your driver's license photos were received.</div>
                                        <div className="w-full flex gap-3">
                                            <button
                                                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium"
                                                onClick={() => navigate('/face-verification')}
                                            >
                                                Continue
                                            </button>
                                            <button
                                                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/20"
                                                onClick={() => setLicenseVerified(false)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* === CONFIRMATION / OTP MODAL === */}
                        {showInstaConfirm && (
                            <div className="fixed inset-0 flex justify-center items-end pb-6 z-50 px-2">
                                <div className="w-[95vw] max-w-sm mx-auto rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl p-6 flex flex-col items-center border border-white/30">
                                    {/* Icon & Title */}
                                    <img src="/linkedin-confirm-icon.svg" alt="LinkedIn" className="w-20 h-20 mb-2" />
                                    <div className="text-white text-lg font-normal">LinkedIn Confirmation</div>

                                    {/* Re-enter Input */}
                                    {!showCodeInput && !codeVerified && (
                                        <>
                                            <div className="text-[#ACACAC] text-sm mb-6 text-center">
                                                Please confirm your LinkedIn profile for verification.
                                            </div>
                                            <div className="w-full flex items-center bg-white/10 rounded-xl px-3 py-4 mb-4 border border-white/20">
                                                <span className="text-white/70 text-sm mr-2">in/</span>
                                                <input
                                                    type="text"
                                                    value={confirmInstagram}
                                                    onChange={(e) => setConfirmInstagram(e.target.value)}
                                                    placeholder="Confirm your profile"
                                                    className="flex-1 bg-transparent outline-none text-white placeholder-white/60 text-sm"
                                                />
                                                <button
                                                    className="ml-2 text-white/70 hover:text-white"
                                                    onClick={() => setConfirmInstagram("")}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                disabled={!isConfirmInputValid}
                                                onClick={handleConfirmAndProceed}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${!isConfirmInputValid ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                            >
                                                Looks good! Continue
                                            </button>
                                        </>
                                    )}

                                    {/* Code Input */}
                                    {showCodeInput && !codeVerified && (
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="text-white text-base mb-2 text-center">
                                                Enter the 4-digit code sent to your LinkedIn DM
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={4}
                                                value={instaCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                                    setInstaCode(val);
                                                }}
                                                placeholder="4-digit code"
                                                className="w-full px-4 py-4 border rounded-xl text-sm mb-2 transition bg-white/20 backdrop-blur-sm text-white placeholder-white/80 border-white/30"
                                            />
                                            <button
                                                disabled={instaCode.length !== 4}
                                                onClick={handleVerifyCode}
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${instaCode.length !== 4 ? BUTTON_GLASS_INACTIVE : BUTTON_GLASS_ACTIVE}`}
                                            >
                                                Verify Code
                                            </button>
                                        </div>
                                    )}

                                    {/* Success */}
                                    {codeVerified && (
                                        <div className="w-full flex flex-col items-center mt-2">
                                            <div className="flex items-center justify-center mb-4">
                                                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-[#4CAF50]">
                                                    <img src="/verification-tick.svg" alt="Verified" className="w-10 h-10" />
                                                </span>
                                            </div>
                                            <div className="text-white text-center text-base font-semibold leading-tight mb-6">
                                                Your LinkedIn has been verified successfully.
                                            </div>
                                            <button
                                                className={`w-full py-4 rounded-xl font-medium text-lg transition ${BUTTON_GLASS_ACTIVE}`}
                                                onClick={() => navigate("/face-verification")}
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
