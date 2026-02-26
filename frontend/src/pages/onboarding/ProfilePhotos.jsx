import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, userAPI } from '../../utils/api';
import Cropper from 'react-easy-crop';

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getCroppedBlob = async (imageSrc, pixelCrop, type = 'image/jpeg', quality = 0.92) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(pixelCrop.width));
    canvas.height = Math.max(1, Math.floor(pixelCrop.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob) throw new Error('Failed to crop image');
    return blob;
};

export default function ProfilePhotos() {
    const navigate = useNavigate();
    const [showTutorial, setShowTutorial] = useState(true);
    const [facePhotos, setFacePhotos] = useState([null, null, null, null, null, null]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Crop state
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [cropFile, setCropFile] = useState(null);
    const [cropIdx, setCropIdx] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropSubmitting, setCropSubmitting] = useState(false);
    const [cropError, setCropError] = useState('');

    // Load existing face photos
    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            try {
                const userData = await userAPI.getProfile();
                if (!mounted) return;

                if (userData.facePhotos && userData.facePhotos.length > 0) {
                    // Fill the array with existing photos, pad with nulls if needed
                    const photos = [...userData.facePhotos];
                    while (photos.length < 6) photos.push(null);
                    setFacePhotos(photos.slice(0, 6));
                }
            } catch (err) {
                console.error('Failed to load face photos', err);
            }
        };
        loadProfile();
        return () => { mounted = false; };
    }, []);

    const uploadFacePhoto = async (idx, file) => {
        if (!file) return;
        setError('');

        // Set preview immediately
        setFacePhotos(prev => {
            const updated = [...prev];
            updated[idx] = URL.createObjectURL(file);
            return updated;
        });

        try {
            setUploading(true);
            const res = await uploadAPI.uploadFacePhoto(file);
            setFacePhotos(prev => {
                const updated = [...prev];
                updated[idx] = res.url;
                return updated;
            });
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const closeCrop = useCallback(() => {
        setCropOpen(false);
        setCropError('');
        setCroppedAreaPixels(null);
        setCropFile(null);
        setCropIdx(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);

        setCropSrc(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }, []);

    const handleFaceFilePicked = useCallback((idx, file) => {
        if (!file) return;
        if (!file.type?.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Please upload an image under 10MB.');
            return;
        }

        setError('');
        setCropError('');
        setCropIdx(idx);
        setCropFile(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);

        setCropSrc(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setCropOpen(true);
    }, []);

    const confirmCrop = useCallback(async () => {
        if (cropIdx === null || !cropFile || !cropSrc || !croppedAreaPixels) {
            setCropError('Please adjust the crop area.');
            return;
        }

        setCropSubmitting(true);
        setCropError('');
        try {
            const blob = await getCroppedBlob(cropSrc, croppedAreaPixels, 'image/jpeg', 0.92);
            const croppedFile = new File(
                [blob],
                `${(cropFile.name || 'face').replace(/\.[^/.]+$/, '')}-cropped.jpg`,
                {
                    type: blob.type || 'image/jpeg',
                    lastModified: Date.now(),
                }
            );

            closeCrop();
            await uploadFacePhoto(cropIdx, croppedFile);
        } catch (err) {
            console.error('[ProfilePhotos] Crop failed', err);
            setCropError(err?.message || 'Failed to crop image. Try again.');
        } finally {
            setCropSubmitting(false);
        }
    }, [closeCrop, cropFile, cropIdx, cropSrc, croppedAreaPixels]);

    const handleNext = async () => {
        if (facePhotos.filter(Boolean).length >= 4) {
            try {
                setUploading(true);
                setError('');

                // Filter out null photos and save to database
                const validPhotos = facePhotos.filter(Boolean);

                // Get current profile to merge data
                const currentProfile = await userAPI.getProfile();
                await userAPI.updateProfile({
                    ...currentProfile,
                    facePhotos: validPhotos
                });

                // Navigate to home
                navigate('/home');
            } catch (err) {
                console.error('Failed to save face photos:', err);
                setError('Failed to save photos. Please try again.');
            } finally {
                setUploading(false);
            }
        }
    };

    const canProceed = facePhotos.filter(Boolean).length >= 4;

    return (
        <div
            className="h-screen w-screen relative font-sans flex flex-col"
            style={{
                backgroundImage: "url('/bgs/faceverifybg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 pt-10 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (showTutorial) {
                                navigate(-1);
                            } else {
                                setShowTutorial(true);
                            }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="text-white text-[24px] font-semibold">
                        Sundate
                    </div>
                    <div style={{ width: 32 }}></div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 mb-6">
                    <div className="w-full bg-white/30 rounded-full h-1.5">
                        <div
                            className="bg-white h-1.5 rounded-full transition-all duration-300"
                            style={{ width: '100%' }}
                        ></div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 px-6 pb-6 flex flex-col">
                    {showTutorial ? (
                        <>
                            {/* Tutorial Page */}
                            {/* Title and Description */}
                            <div className="mb-8">
                                <h1 className="text-white text-2xl font-semibold mb-3">
                                    Show the face behind the profile
                                </h1>
                                <p className="text-white/70 text-sm leading-relaxed mb-4">
                                    Upload clear photos of yourself. A face reveal will help you build trust and genuine connections at Level 3.
                                </p>
                            </div>

                            {/* Sample Images Display */}
                            <div className="relative w-full h-80 mb-6 flex-shrink-0">
                                <img
                                    src="/faceupload1.png"
                                    alt="Face Upload 1"
                                    className="absolute w-2/5 h-2/5 rounded-lg object-cover shadow-lg"
                                    style={{ top: '5%', left: '5%', transform: 'rotate(-10deg)', zIndex: 3 }}
                                />
                                <img
                                    src="/faceupload2.png"
                                    alt="Face Upload 2"
                                    className="absolute w-2/5 h-2/5 rounded-lg object-cover shadow-lg"
                                    style={{ top: '5%', right: '5%', transform: 'rotate(5deg)', zIndex: 4 }}
                                />
                                <img
                                    src="/faceupload3.png"
                                    alt="Face Upload 3"
                                    className="absolute w-2/5 h-2/5 rounded-lg object-cover shadow-lg"
                                    style={{ bottom: '5%', left: '5%', transform: 'rotate(10deg)', zIndex: 2 }}
                                />
                                <img
                                    src="/faceupload4.png"
                                    alt="Face Upload 4"
                                    className="absolute w-2/5 h-2/5 rounded-lg object-cover shadow-lg"
                                    style={{ bottom: '5%', right: '5%', transform: 'rotate(-5deg)', zIndex: 1 }}
                                />
                                <img
                                    src="/faceupload5.png"
                                    alt="Face Upload 5"
                                    className="absolute w-2/5 h-2/5 rounded-lg object-cover shadow-lg"
                                    style={{ top: '30%', left: '30%', transform: 'rotate(12deg)', zIndex: 5 }}
                                />
                            </div>

                            {/* Note */}
                            <div className="mb-6">
                                <p className="text-white/80 text-sm font-medium mb-2">
                                    Note: You can only see other members' faces if they can see yours.
                                </p>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Next Button */}
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-white text-black hover:bg-gray-100"
                            >
                                Next
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Upload Page */}
                            {/* Title and Description */}
                            <div className="mb-6">
                                <h1 className="text-white text-2xl font-semibold mb-3">
                                    Show the face behind the profile
                                </h1>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Upload 4-5 clear photos of yourself. A face reveal helps you build trust and genuine connections at Level 3.
                                </p>
                            </div>

                            {/* Upload Grid - 3 columns, 2 rows */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {[0, 1, 2, 3, 4, 5].map(idx => (
                                    <label
                                        key={idx}
                                        className="aspect-[3/4] rounded-2xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer border border-white/30 bg-gray-700/50 hover:bg-gray-700/70 transition"
                                    >
                                        {facePhotos[idx] ? (
                                            <img
                                                src={facePhotos[idx]}
                                                alt={`Face ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-white/60 text-4xl mb-2">+</span>
                                                <span className="text-white/60 text-xs">Add more photos</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                const file = e.target.files && e.target.files[0];
                                                if (file) handleFaceFilePicked(idx, file);
                                                e.target.value = '';
                                            }}
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
                                                Uploading...
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {/* Error Message */}
                            {!canProceed && (
                                <div className="text-red-400 text-sm mb-4">
                                    This is a required field
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Next Button */}
                            <button
                                onClick={handleNext}
                                disabled={!canProceed || uploading}
                                className={`w-full py-4 rounded-full font-semibold text-base transition-all ${canProceed && !uploading
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-gray-400/50 text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                {uploading ? 'Uploading...' : 'Next'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {cropOpen && cropSrc ? (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80" onClick={closeCrop} />
                    <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="text-white font-semibold">Crop image</div>
                            <button
                                type="button"
                                onClick={closeCrop}
                                className="text-white/70 hover:text-white text-sm"
                            >
                                Close
                            </button>
                        </div>

                        <div className="relative w-full" style={{ height: 340 }}>
                            <Cropper
                                image={cropSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={3 / 4}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                            />
                        </div>

                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="text-white/70 text-xs w-12">Zoom</div>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1"
                                />
                            </div>

                            {cropError ? (
                                <div className="text-red-400 text-sm mb-3">{cropError}</div>
                            ) : null}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeCrop}
                                    disabled={cropSubmitting}
                                    className="flex-1 py-3 rounded-full font-semibold text-base"
                                    style={
                                        cropSubmitting
                                            ? {
                                                background: 'rgba(255,255,255,0.15)',
                                                color: 'rgba(255,255,255,0.6)',
                                            }
                                            : {
                                                background: 'rgba(255,255,255,0.12)',
                                                color: 'white',
                                            }
                                    }
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmCrop}
                                    disabled={cropSubmitting}
                                    className="flex-1 py-3 rounded-full font-semibold text-base"
                                    style={
                                        cropSubmitting
                                            ? {
                                                background: 'rgba(255,255,255,0.25)',
                                                color: 'rgba(255,255,255,0.8)',
                                            }
                                            : { background: 'white', color: 'black' }
                                    }
                                >
                                    {cropSubmitting ? 'Cropping...' : 'Use photo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
