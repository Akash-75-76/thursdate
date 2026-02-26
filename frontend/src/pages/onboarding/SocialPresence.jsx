import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../utils/api";

export default function SocialPresence() {
    const navigate = useNavigate();

    // === STATES ===
    const [showMethodSelection, setShowMethodSelection] = useState(true);
    const [verificationMethod, setVerificationMethod] = useState(null);

    // LinkedIn states
    const [linkedinVerified, setLinkedinVerified] = useState(false);

    // Driver's License states
    const [showUpload, setShowUpload] = useState(false);
    const [uploadStep, setUploadStep] = useState("front"); // 'front' or 'back'
    const [licenseFrontPreview, setLicenseFrontPreview] = useState(null);
    const [licenseBackPreview, setLicenseBackPreview] = useState(null);
    const [licenseFrontFile, setLicenseFrontFile] = useState(null);
    const [licenseBackFile, setLicenseBackFile] = useState(null);
    const [licenseVerified, setLicenseVerified] = useState(false);
    const [uploadingLicense, setUploadingLicense] = useState(false);

    // === GLASS STYLES ===
    const BUTTON_GLASS_ACTIVE =
        "bg-white backdrop-blur-md text-black border border-white/40 shadow-lg";

    // cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            try { if (licenseFrontPreview) URL.revokeObjectURL(licenseFrontPreview); } catch { /* ignore */ }
            try { if (licenseBackPreview) URL.revokeObjectURL(licenseBackPreview); } catch { /* ignore */ }
        };
    }, [licenseFrontPreview, licenseBackPreview]);

    // Check for LinkedIn OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Handle successful LinkedIn verification
        if (params.get('linkedin_verified') === 'true') {
            const token = params.get('token');
            if (token) {
                localStorage.setItem('token', token);
                setLinkedinVerified(true);
                setVerificationMethod('linkedin');
                setShowMethodSelection(false);
                // Clean up URL
                window.history.replaceState({}, '', '/social-presence');
            }
        }

        // Handle OAuth errors
        const error = params.get('error');
        if (error) {
            let errorMessage = 'LinkedIn verification failed. Please try again.';
            if (error === 'linkedin_denied') {
                errorMessage = 'You denied access to LinkedIn. Please approve to continue.';
            } else if (error === 'linkedin_no_code') {
                errorMessage = 'No authorization code received from LinkedIn.';
            } else if (error === 'server_config') {
                errorMessage = 'Server configuration error. Please contact support.';
            }
            alert(errorMessage);
            // Clean up URL
            window.history.replaceState({}, '', '/social-presence');
        }
    }, []);

    const handleLinkedInVerification = () => {
        // Get backend URL with fallback
        const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'https://sundate-backend.onrender.com/api';
        const backendUrl = backendApiUrl.replace('/api', '');

        console.log('🔗 Redirecting to LinkedIn OAuth:', `${backendUrl}/auth/linkedin`);

        // Redirect to backend OAuth endpoint
        window.location.href = `${backendUrl}/auth/linkedin`;
    };

    const handleLicenseUpload = async () => {
        if (!licenseFrontFile || !licenseBackFile) {
            alert('Please upload both front and back photos of your license.');
            return;
        }

        try {
            setUploadingLicense(true);
            console.log('📤 Uploading license photos...');
            
            await userAPI.uploadLicense(licenseFrontFile, licenseBackFile);
            
            console.log('✅ License uploaded successfully');
            setLicenseVerified(true);
        } catch (error) {
            console.error('❌ License upload failed:', error);
            alert('Failed to upload license: ' + (error.message || 'Unknown error'));
        } finally {
            setUploadingLicense(false);
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
                    <img src="/logo.png" alt="Sundate" className="h-8 mx-auto" />
                    <div style={{ width: 24 }}></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/30 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-white h-1.5 rounded-full transition-all duration-300 shadow-md"
                        style={{ width: linkedinVerified || licenseVerified ? "100%" : "50%" }}
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

                {/* === LINKEDIN & LICENSE VERIFICATION === */}
                {!showMethodSelection && verificationMethod !== null && (
                    <div className="flex flex-col flex-grow justify-between">
                        <div>
                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setShowMethodSelection(true);
                                    setVerificationMethod(null);
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
                                                                try { URL.revokeObjectURL(licenseFrontPreview); } catch { /* ignore */ }
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
                                                                try { URL.revokeObjectURL(licenseBackPreview); } catch { /* ignore */ }
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
                                                                if (licenseFrontPreview) try { URL.revokeObjectURL(licenseFrontPreview); } catch { /* ignore */ }
                                                                setLicenseFrontPreview(url);
                                                                setLicenseFrontFile(file);
                                                            } else {
                                                                if (licenseBackPreview) try { URL.revokeObjectURL(licenseBackPreview); } catch { /* ignore */ }
                                                                setLicenseBackPreview(url);
                                                                setLicenseBackFile(file);
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
                                                    handleLicenseUpload();
                                                }
                                            }}
                                            disabled={uploadingLicense || (uploadStep === "front" ? !licenseFrontFile : !licenseBackFile)}
                                            className={`w-full py-4 rounded-full font-medium text-lg mt-8 transition ${BUTTON_GLASS_ACTIVE} disabled:opacity-50`}
                                        >
                                            {uploadingLicense ? "Uploading..." : (uploadStep === "front" ? "Continue" : "Finish")}
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

                                        {/* Continue Button */}
                                        <button
                                            onClick={() => setShowUpload(true)}
                                            className="w-full py-4 rounded-full font-medium text-lg text-white bg-white/30 backdrop-blur-md border border-white/40 shadow-lg hover:bg-white/40 transition"
                                        >
                                            Continue
                                        </button>
                                    </>
                                )
                            ) : (
                                <>
                                    {/* === LINKEDIN SCREEN === */}
                                    <h1 className="text-xl font-normal text-white mb-2 mt-2">Verify with LinkedIn</h1>
                                    <p className="text-white/70 text-xs mb-6">
                                        Click below to securely verify your LinkedIn profile. You'll be redirected to LinkedIn to approve access.
                                    </p>

                                    <div className="flex flex-col items-center py-8">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="#0A66C2" className="mb-6">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>

                                        <div className="text-white/80 text-sm text-center mb-8 max-w-sm">
                                            <p className="mb-3">This will:</p>
                                            <ul className="text-left space-y-2 text-xs">
                                                <li>✓ Open LinkedIn in a new window</li>
                                                <li>✓ Ask you to approve access</li>
                                                <li>✓ Verify your profile securely</li>
                                                <li>✓ Return you here automatically</li>
                                            </ul>
                                        </div>

                                        <button
                                            onClick={handleLinkedInVerification}
                                            className={`w-full py-4 rounded-full font-medium text-lg transition ${BUTTON_GLASS_ACTIVE}`}
                                        >
                                            Continue with LinkedIn
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

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

                        {/* === LINKEDIN VERIFIED MODAL === */}
                        {linkedinVerified && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                                <div className="bg-black/60 absolute inset-0"></div>
                                <div className="relative z-60 w-full max-w-sm p-6 rounded-3xl bg-white/5 backdrop-blur-lg flex flex-col items-center border border-white/20">
                                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4 shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </div>
                                    <div className="text-white text-lg font-semibold mb-2">LinkedIn verified</div>
                                    <div className="text-white/80 text-sm mb-4 text-center">Your LinkedIn profile has been successfully verified.</div>
                                    <div className="w-full flex gap-3">
                                        <button
                                            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium"
                                            onClick={() => navigate('/face-verification')}
                                        >
                                            Continue
                                        </button>
                                        <button
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/20"
                                            onClick={() => setLinkedinVerified(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}