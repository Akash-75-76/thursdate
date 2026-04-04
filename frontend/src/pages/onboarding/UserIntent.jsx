// src/components/onboarding/UserIntent.jsx
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, uploadAPI } from '../../utils/api';
import { saveOnboardingState, loadOnboardingState, clearOnboardingState, STORAGE_KEYS } from '../../utils/onboardingPersistence';
import Cropper from 'react-easy-crop';
import AutocompleteInput from '../../components/AutocompleteInput';
import { searchMovies, searchTVShows, searchArtists, searchMoviesAndShows, searchArtistsAndTracks } from '../../utils/externalAPIs';
import { searchInterests, createDebouncedSearch } from '../../utils/interests';

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

export default function UserIntent() {
  const navigate = useNavigate();

  // Step control
  const totalSteps = 14;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Intent state (all steps)
  const [purpose, setPurpose] = useState(''); // Step 1
  const [relationshipVibe, setRelationshipVibe] = useState(''); // Step 2
  const [interestedGender, setInterestedGender] = useState(''); // Step 3
  const [ageRange, setAgeRange] = useState([30, 50]); // Step 4 - default to 30-50 to match UI

  const [bio, setBio] = useState(''); // Step 5
  const [bioMode, setBioMode] = useState('Read'); // 'Read' or 'Listen'
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [interests, setInterests] = useState([]); // Step 6
  const [interestInput, setInterestInput] = useState('');
  const debouncedInterestSearchRef = useRef(null);

  // Step 7: Multiple TV shows & movies
  const [tvShows, setTvShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [tvInput, setTvInput] = useState('');
  const [movieInput, setMovieInput] = useState('');

  const [watchList, setWatchList] = useState([]); // Step 8
  const [watchInput, setWatchInput] = useState('');
  const [artistsBands, setArtistsBands] = useState([]); // Step 9
  const [artistBandInput, setArtistBandInput] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState(null); // Track ID currently playing
  const [fitnessLevel, setFitnessLevel] = useState(''); // Step 10
  const [profileImageUrl, setProfileImageUrl] = useState(null); // Step 12
  const [profileImgUploading, setProfileImgUploading] = useState(false);
  const [profileImgError, setProfileImgError] = useState('');
  const [showProfilePhotoOptions, setShowProfilePhotoOptions] = useState(false);
  const [showProfileCameraModal, setShowProfileCameraModal] = useState(false);
  const [profileCameraError, setProfileCameraError] = useState('');
  const profilePhotoInputRef = useRef(null);
  const profileVideoRef = useRef(null);
  const profileCanvasRef = useRef(null);
  const audioRef = useRef(null); // For playing song previews
  const [lifestyleImageUrls, setLifestyleImageUrls] = useState([null, null, null, null, null]); // Step 12
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError] = useState('');
  const [showLifestylePhotoOptions, setShowLifestylePhotoOptions] = useState(false);
  const [showLifestyleImageCameraModal, setShowLifestyleImageCameraModal] = useState(false);
  const [lifestyleImageCameraError, setLifestyleImageCameraError] = useState('');
  const [lifestyleImageCameraIdx, setLifestyleImageCameraIdx] = useState(null);
  const lifestyleImageInputRef = useRef(null);
  const lifestyleImageVideoRef = useRef(null);
  const lifestyleImageCanvasRef = useRef(null);

  // Lifestyle image crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [cropIdx, setCropIdx] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropSubmitting, setCropSubmitting] = useState(false);
  const [cropError, setCropError] = useState('');

  // Profile photo editing state
  const [isEditingProfilePhoto, setIsEditingProfilePhoto] = useState(false);
  const [profilePhotoCropSrc, setProfilePhotoCropSrc] = useState(null);
  const [profilePhotoCrop, setProfilePhotoCrop] = useState({ x: 0, y: 0 });
  const [profilePhotoZoom, setProfilePhotoZoom] = useState(1);
  const [profilePhotoCroppedAreaPixels, setProfilePhotoCroppedAreaPixels] = useState(null);
  const [profilePhotoCropSubmitting, setProfilePhotoCropSubmitting] = useState(false);
  const [profilePhotoCropError, setProfilePhotoCropError] = useState('');
  const profilePhotoCropperRef = useRef(null);

  // Lifestyle photo editing state
  const [isEditingLifestylePhoto, setIsEditingLifestylePhoto] = useState(false);
  const [lifestylePhotoEditIdx, setLifestylePhotoEditIdx] = useState(null);
  const [lifestylePhotoCropSrc, setLifestylePhotoCropSrc] = useState(null);
  const [lifestylePhotoCrop, setLifestylePhotoCrop] = useState({ x: 0, y: 0 });
  const [lifestylePhotoZoom, setLifestylePhotoZoom] = useState(1);
  const [lifestylePhotoCroppedAreaPixels, setLifestylePhotoCroppedAreaPixels] = useState(null);
  const [lifestylePhotoCropSubmitting, setLifestylePhotoCropSubmitting] = useState(false);
  const [lifestylePhotoCropError, setLifestylePhotoCropError] = useState('');
  const lifestylePhotoCropperRef = useRef(null);

  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState(null); // 'profile' | 'lifestyle'
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [discardConfirmType, setDiscardConfirmType] = useState(null); // 'profile' | 'lifestyle'

  // Age limits
  const minAge = 30;
  const maxAge = 85;
  const [activeAgeThumb, setActiveAgeThumb] = useState(null);
  const ageSliderRef = useRef(null);



  // Load existing profile and saved onboarding state
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const userData = await userAPI.getProfile();
        if (!mounted) return;
        
        // ✅ NEW: If user returned to UserIntent but already completed it, force mark as complete
        if (userData && userData.onboardingComplete) {
          console.log('[UserIntent] User already completed onboarding, redirecting to home...');
          if (userData.approval) {
            navigate('/home', { replace: true });
          } else {
            navigate('/waitlist-status', { replace: true });
          }
          return;
        }
        
        if (userData) {
          // Load from root level (new hybrid storage)
          setInterests(userData.interests || []);
          setProfileImageUrl(userData.profilePicUrl || null);

          // Load from intent object
          if (userData.intent) {
            setPurpose(userData.intent.purpose || '');
            setRelationshipVibe(userData.intent.relationshipVibe || '');
            setInterestedGender(userData.intent.interestedGender || '');
            setAgeRange(userData.intent.preferredAgeRange || [40, 60]);
            setBio(userData.intent.bio || '');
            setTvShows(userData.intent.tvShows || []);
            setMovies(userData.intent.movies || []);
            setWatchList(userData.intent.watchList || []);
            setArtistsBands(userData.intent.artistsBands || []);
            setFitnessLevel(userData.intent.fitnessLevel || '');  // ✅ Load fitness level
            setLifestyleImageUrls(userData.intent.lifestyleImageUrls || [null, null, null, null, null]);
          }
        }

        // Load saved onboarding state from localStorage (overrides profile data)
        const savedState = loadOnboardingState(STORAGE_KEYS.USER_INTENT);
        if (savedState) {
          console.log('[UserIntent] Restoring saved onboarding state:', savedState.step);
          if (savedState.step) setStep(savedState.step);
          if (savedState.purpose) setPurpose(savedState.purpose);
          if (savedState.relationshipVibe) setRelationshipVibe(savedState.relationshipVibe);
          if (savedState.interestedGender) setInterestedGender(savedState.interestedGender);
          if (savedState.ageRange) setAgeRange(savedState.ageRange);
          if (savedState.bio) setBio(savedState.bio);
          if (savedState.interests) setInterests(savedState.interests);
          if (savedState.tvShows) setTvShows(savedState.tvShows);
          if (savedState.movies) setMovies(savedState.movies);
          if (savedState.watchList) setWatchList(savedState.watchList);
          if (savedState.artistsBands) setArtistsBands(savedState.artistsBands);
          if (savedState.fitnessLevel) setFitnessLevel(savedState.fitnessLevel);  // ✅ Load fitness level from localStorage
          if (savedState.profileImageUrl) setProfileImageUrl(savedState.profileImageUrl);
          if (savedState.lifestyleImageUrls) setLifestyleImageUrls(savedState.lifestyleImageUrls);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const res = e.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (finalTranscript) {
        setBio(prev => (prev + ' ' + finalTranscript).slice(0, 300));
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (err) => {
      console.error('Speech recognition error', err);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err) {
      console.warn('startListening failed', err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('stopListening failed', err);
    }
    setListening(false);
    setInterimTranscript('');
  };

  const toggleListening = useCallback(() => {
    if (!sttSupported) return;
    if (listening) stopListening(); else startListening();
  }, [sttSupported, listening]);

  // Setup debounced interest search - Initialize once on component mount
  useEffect(() => {
    debouncedInterestSearchRef.current = createDebouncedSearch(async (query) => {
      if (!query || query.trim().length < 2) {
        return;
      }

      try {
        await searchInterests(query);
      } catch (err) {
        console.error('[UserIntent] Interest search failed:', err);
      }
    }, 300);

    return () => {
      debouncedInterestSearchRef.current = null;
    };
  }, []);

  // Trigger debounced search when interest input changes
  useEffect(() => {
    if (debouncedInterestSearchRef.current) {
      debouncedInterestSearchRef.current(interestInput);
    }
  }, [interestInput]);

  // Auto-save onboarding state to localStorage whenever key fields change
  // ✅ FIX: Only save after initial loading is complete to avoid race condition
  useEffect(() => {
    if (initialLoading) return; // Don't save during initial load

    const state = {
      step,
      purpose,
      relationshipVibe,
      interestedGender,
      ageRange,
      bio,
      interests,
      tvShows,
      movies,
      watchList,
      artistsBands,
      fitnessLevel,  // ✅ Save fitness level
      profileImageUrl,
      lifestyleImageUrls,
    };
    console.log('[UserIntent] Auto-saving state:', { step, hasData: !!purpose || interests.length > 0 });
    saveOnboardingState(STORAGE_KEYS.USER_INTENT, state);
  }, [initialLoading, step, purpose, relationshipVibe, interestedGender, ageRange, bio, interests, tvShows, movies, watchList, artistsBands, fitnessLevel, profileImageUrl, lifestyleImageUrls]);

  useEffect(() => {
    if (bioMode !== 'Listen' && listening) {
      stopListening();
    }
  }, [bioMode, listening]);

  // ✅ Smooth age range slider drag handler
  const handleAgeSliderMove = useCallback((e) => {
    if (activeAgeThumb === null || !ageSliderRef.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = ageSliderRef.current.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    let value = Math.round(minAge + percent * (maxAge - minAge));
    
    setAgeRange((prevRange) => {
      let newRange = [...prevRange];
      if (activeAgeThumb === 0) {
        newRange[0] = Math.min(value, newRange[1] - 1);
      } else if (activeAgeThumb === 1) {
        newRange[1] = Math.max(value, newRange[0] + 1);
      }
      return newRange;
    });
  }, [activeAgeThumb, minAge, maxAge]);

  useEffect(() => {
    if (activeAgeThumb === null) return;

    document.addEventListener('mousemove', handleAgeSliderMove);
    document.addEventListener('touchmove', handleAgeSliderMove, { passive: false });
    document.addEventListener('mouseup', () => setActiveAgeThumb(null));
    document.addEventListener('touchend', () => setActiveAgeThumb(null));

    return () => {
      document.removeEventListener('mousemove', handleAgeSliderMove);
      document.removeEventListener('touchmove', handleAgeSliderMove);
      document.removeEventListener('mouseup', () => setActiveAgeThumb(null));
      document.removeEventListener('touchend', () => setActiveAgeThumb(null));
    };
  }, [activeAgeThumb, handleAgeSliderMove]);

  // Interest tag logic
  const addInterest = useCallback((val) => {
    if (!val) return;
    let trimmed = '';
    if (typeof val === 'object') {
      trimmed = (val.name || val.display || '').trim();
    } else {
      trimmed = (val || '').trim();
    }
    if (!trimmed) return;
    setInterests(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setInterestInput('');
  }, []);

  const removeInterest = useCallback((t) => {
    setInterests(prev => prev.filter(x => x !== t));
  }, []);

  // TV & Movie helpers
  const addTvShow = useCallback((selectedItem) => {
    // If called from autocomplete with full object
    if (selectedItem && typeof selectedItem === 'object') {
      const exists = tvShows.some(item =>
        typeof item === 'object' ? item.name === selectedItem.name : item === selectedItem.name
      );
      if (!exists) {
        setTvShows(prev => [...prev, selectedItem]);
        setTvInput('');
      }
    } else {
      // If called manually with string
      const trimmed = (selectedItem || tvInput).trim();
      const exists = tvShows.some(item =>
        typeof item === 'object' ? item.name === trimmed : item === trimmed
      );
      if (trimmed && !exists) {
        setTvShows(prev => [...prev, { name: trimmed, display: trimmed }]);
        setTvInput('');
      }
    }
  }, [tvShows, tvInput]);

  const _handleTvInputBlur = () => {
    if (tvInput.trim()) {
      addTvShow();
    }
  };

  const removeTvShow = useCallback((item) => {
    setTvShows(prev => prev.filter(x =>
      typeof x === 'object' && typeof item === 'object'
        ? x.name !== item.name
        : x !== item
    ));
  }, []);

  const addMovie = useCallback((selectedItem) => {
    // If called from autocomplete with full object
    if (selectedItem && typeof selectedItem === 'object') {
      const exists = movies.some(item =>
        typeof item === 'object' ? item.name === selectedItem.name : item === selectedItem.name
      );
      if (!exists) {
        setMovies(prev => [...prev, selectedItem]);
        setMovieInput('');
      }
    } else {
      // If called manually with string
      const trimmed = (selectedItem || movieInput).trim();
      const exists = movies.some(item =>
        typeof item === 'object' ? item.name === trimmed : item === trimmed
      );
      if (trimmed && !exists) {
        setMovies(prev => [...prev, { name: trimmed, display: trimmed }]);
        setMovieInput('');
      }
    }
  }, [movies, movieInput]);

  const _handleMovieInputBlur = () => {
    if (movieInput.trim()) {
      addMovie();
    }
  };

  const removeMovie = useCallback((item) => {
    setMovies(prev => prev.filter(x =>
      typeof x === 'object' && typeof item === 'object'
        ? x.name !== item.name
        : x !== item
    ));
  }, []);

  // Watchlist helpers
  const addWatchItem = useCallback((selectedItem) => {
    // If called from autocomplete with full object
    if (selectedItem && typeof selectedItem === 'object') {
      const exists = watchList.some(item =>
        typeof item === 'object' ? item.name === selectedItem.name : item === selectedItem.name
      );
      if (!exists) {
        setWatchList(prev => [...prev, selectedItem]);
        setWatchInput('');
      }
    } else {
      // If called manually with string
      const inputValue = selectedItem || watchInput;
      const items = inputValue.split(',').map(item => item.trim()).filter(item => item !== '');
      setWatchList(prev => {
        const newItems = items.filter(item =>
          !prev.some(existing =>
            typeof existing === 'object' ? existing.name === item : existing === item
          )
        ).map(item => ({ name: item, display: item }));
        return [...prev, ...newItems];
      });
      setWatchInput('');
    }
  }, [watchList, watchInput]);

  const removeWatchItem = useCallback((item) => {
    setWatchList(prev => prev.filter(x =>
      typeof x === 'object' && typeof item === 'object'
        ? x.name !== item.name
        : x !== item
    ));
  }, []);

  // Song preview handlers
  const handlePlayTrack = useCallback((track) => {
    if (!track.preview_url) {
      alert('Preview not available for this track');
      return;
    }

    if (playingTrackId === track.id) {
      // Stop if already playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingTrackId(null);
    } else {
      // Play new track
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.onended = () => setPlayingTrackId(null);
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        alert('Could not play preview');
      });
      setPlayingTrackId(track.id);
    }
  }, [playingTrackId]);

  const handleStopAllTracks = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingTrackId(null);
  }, []);

  // Artists/Bands helpers
  const addArtistBand = useCallback((selectedItem) => {
    // If called from autocomplete with full object
    if (selectedItem && typeof selectedItem === 'object') {
      const exists = artistsBands.some(item =>
        typeof item === 'object' ? item.name === selectedItem.name : item === selectedItem.name
      );
      if (!exists) {
        setArtistsBands(prev => [...prev, selectedItem]);
        setArtistBandInput('');
      }
    } else {
      // If called manually with string
      const inputValue = selectedItem || artistBandInput;
      const items = inputValue.split(',').map(item => item.trim()).filter(item => item !== '');
      setArtistsBands(prev => {
        const newItems = items.filter(item =>
          !prev.some(existing =>
            typeof existing === 'object' ? existing.name === item : existing === item
          )
        ).map(item => ({ name: item, display: item }));
        return [...prev, ...newItems];
      });
      setArtistBandInput('');
    }
  }, [artistsBands, artistBandInput]);

  const removeArtistBand = useCallback((item) => {
    setArtistsBands(prev => prev.filter(x =>
      typeof x === 'object' && typeof item === 'object'
        ? x.name !== item.name
        : x !== item
    ));
  }, []);

  // Profile image upload
  const handleProfileImageChange = useCallback(async (file) => {
    if (!file) return;
    // Set a preview URL directly from the file object
    setProfileImageUrl(URL.createObjectURL(file));

    // Upload to backend/Cloudinary
    setProfileImgError('');
    setProfileImgUploading(true);
    try {
      console.log('[UserIntent] Uploading profile picture...');
      const res = await uploadAPI.uploadProfilePicture(file);
      console.log('[UserIntent] Profile picture uploaded successfully:', res.url);
      setProfileImageUrl(res.url);
    } catch (err) {
      console.error('[UserIntent] Upload error:', err);
      setProfileImgError(err.message || 'Failed to upload image. Try again.');
    } finally {
      setProfileImgUploading(false);
    }
  }, []);

  // Trigger profile photo options modal
  const handleOpenProfilePhotoOptions = () => {
    setShowProfilePhotoOptions(true);
  };

  // Trigger file input for gallery upload
  const triggerProfileGalleryUpload = () => {
    profilePhotoInputRef.current?.click();
  };

  // Stop camera feed
  const stopProfileCamera = useCallback(() => {
    const video = profileVideoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  }, []);

  // Camera setup effect
  useEffect(() => {
    if (!showProfileCameraModal) {
      stopProfileCamera();
      return;
    }

    setProfileCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setProfileCameraError('Camera not supported on this device/browser.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const video = profileVideoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => { });
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error('Profile camera error:', err);
        setProfileCameraError('Could not access camera. Please check permissions and try again.');
      }
    })();

    return () => {
      cancelled = true;
      stopProfileCamera();
    };
  }, [showProfileCameraModal, stopProfileCamera]);

  // Capture photo from camera for profile
  const handleCaptureProfilePhoto = async () => {
    setProfileImgError('');

    const video = profileVideoRef.current;
    const canvas = profileCanvasRef.current;

    if (!video || !canvas) {
      setProfileImgError('Camera not ready. Please try again.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setProfileImgError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setProfileImgError('Could not process image. Please try again.');
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    setProfileImgUploading(true);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setProfileImgUploading(false);
        setProfileImgError('Could not capture image. Please try again.');
        return;
      }

      try {
        // Create preview URL immediately from blob
        const previewUrl = URL.createObjectURL(blob);
        setProfileImageUrl(previewUrl);

        const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
        console.log('[UserIntent] Uploading profile photo from camera, file size:', file.size);
        
        try {
          const result = await uploadAPI.uploadProfilePicture(file);
          console.log('[UserIntent] Profile photo uploaded successfully:', result);
          
          // Update with final URL from server
          setProfileImageUrl(result.url);
        } catch (uploadErr) {
          console.error('[UserIntent] Server upload failed:', uploadErr.message);
          // Keep the preview if server upload fails - user can still see the photo
          console.log('[UserIntent] Keeping preview URL as fallback');
        }
        
        setShowProfileCameraModal(false);
      } catch (err) {
        console.error('[UserIntent] Profile photo capture error:', err);
        setProfileImgError(err.message || 'Failed to process image. Please try again.');
      } finally {
        setProfileImgUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  // Stop lifestyle image camera feed
  const stopLifestyleImageCamera = useCallback(() => {
    const video = lifestyleImageVideoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  }, []);

  // Lifestyle image camera setup effect
  useEffect(() => {
    if (!showLifestyleImageCameraModal) {
      stopLifestyleImageCamera();
      return;
    }

    setLifestyleImageCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLifestyleImageCameraError('Camera not supported on this device/browser.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        const video = lifestyleImageVideoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => { });
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error('Lifestyle image camera error:', err);
        setLifestyleImageCameraError('Could not access camera. Please check permissions and try again.');
      }
    })();

    return () => {
      cancelled = true;
      stopLifestyleImageCamera();
    };
  }, [showLifestyleImageCameraModal, stopLifestyleImageCamera]);

  // Capture photo from camera for lifestyle image
  const handleCaptureLifestylePhoto = async () => {
    setImgError('');

    const video = lifestyleImageVideoRef.current;
    const canvas = lifestyleImageCanvasRef.current;

    if (!video || !canvas) {
      setImgError('Camera not ready. Please try again.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setImgError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setImgError('Could not process image. Please try again.');
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    setImgUploading(true);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setImgUploading(false);
        setImgError('Could not capture image. Please try again.');
        return;
      }

      try {
        // Create file from blob and upload directly
        const file = new File([blob], `lifestyle-photo-${lifestyleImageCameraIdx || 0}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        const idx = lifestyleImageCameraIdx !== null ? lifestyleImageCameraIdx : 0;
        await uploadLifestyleImage(idx, file);
        
        // Close camera modal after successful upload
        setShowLifestyleImageCameraModal(false);
      } catch (err) {
        console.error('[UserIntent] Lifestyle photo capture error:', err);
        setImgError(err.message || 'Failed to process image. Please try again.');
      } finally {
        setImgUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };
  const uploadLifestyleImage = async (idx, file) => {
    if (!file) return;
    // Set a preview URL directly from the file object
    setLifestyleImageUrls(prev => {
      const next = [...prev];
      next[idx] = URL.createObjectURL(file);
      return next;
    });

    // Upload to backend/Cloudinary
    setImgError('');
    setImgUploading(true);
    try {
      const res = await uploadAPI.uploadLifestyleImage(file);
      setLifestyleImageUrls(prev => {
        const next = [...prev];
        next[idx] = res.url;
        return next;
      });
    } catch (err) {
      console.error('Upload error', err);
      setImgError(err.message || 'Upload failed');
    } finally {
      setImgUploading(false);
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

  // Profile photo editing handlers
  const resetProfilePhotoCrop = useCallback(() => {
    setIsEditingProfilePhoto(false);
    setProfilePhotoCropError('');
    setProfilePhotoCroppedAreaPixels(null);
    setProfilePhotoCropSrc(null);
    setProfilePhotoCrop({ x: 0, y: 0 });
    setProfilePhotoZoom(1);
  }, []);

  const closeProfilePhotoCrop = useCallback(() => {
    // Check if there are unsaved changes
    if (profilePhotoCropSrc && profilePhotoCroppedAreaPixels) {
      setDiscardConfirmType('profile');
      setShowDiscardConfirm(true);
    } else {
      resetProfilePhotoCrop();
    }
  }, [profilePhotoCropSrc, profilePhotoCroppedAreaPixels, resetProfilePhotoCrop]);

  const confirmDiscardProfilePhoto = useCallback(() => {
    resetProfilePhotoCrop();
    setShowDiscardConfirm(false);
  }, [resetProfilePhotoCrop]);

  const handleEditProfilePhoto = useCallback(() => {
    if (!profileImageUrl) return;
    setProfilePhotoCropSrc(profileImageUrl);
    setIsEditingProfilePhoto(true);
    setProfilePhotoCropError('');
  }, [profileImageUrl]);

  const handleSaveProfilePhotoCrop = useCallback(async () => {
    if (!profilePhotoCropSrc || !profilePhotoCroppedAreaPixels) {
      setProfilePhotoCropError('Please adjust the crop area.');
      return;
    }

    setProfilePhotoCropSubmitting(true);
    setProfilePhotoCropError('');
    try {
      const blob = await getCroppedBlob(profilePhotoCropSrc, profilePhotoCroppedAreaPixels, 'image/jpeg', 0.92);
      const croppedFile = new File([blob], 'profile-photo-cropped.jpg', {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(blob);
      setProfileImageUrl(previewUrl);

      // Upload to backend
      try {
        const result = await uploadAPI.uploadProfilePicture(croppedFile);
        console.log('[UserIntent] Profile photo updated successfully:', result);
        setProfileImageUrl(result.url);
      } catch (uploadErr) {
        console.error('[UserIntent] Server upload failed:', uploadErr.message);
      }

      resetProfilePhotoCrop();
    } catch (err) {
      console.error('[UserIntent] Profile photo crop failed', err);
      setProfilePhotoCropError(err?.message || 'Failed to crop image. Try again.');
    } finally {
      setProfilePhotoCropSubmitting(false);
    }
  }, [profilePhotoCropSrc, profilePhotoCroppedAreaPixels, resetProfilePhotoCrop]);

  const handleDeleteProfilePhoto = useCallback(() => {
    setDeleteConfirmType('profile');
    setDeleteConfirmIdx(null);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteProfilePhoto = useCallback(() => {
    setProfileImageUrl(null);
    setProfileImgError('');
    setShowDeleteConfirm(false);
  }, []);

  // Lifestyle photo editing handlers
  const resetLifestylePhotoCrop = useCallback(() => {
    setIsEditingLifestylePhoto(false);
    setLifestylePhotoCropError('');
    setLifestylePhotoCroppedAreaPixels(null);
    setLifestylePhotoCropSrc(null);
    setLifestylePhotoEditIdx(null);
    setLifestylePhotoCrop({ x: 0, y: 0 });
    setLifestylePhotoZoom(1);
  }, []);

  const closeLifestylePhotoCrop = useCallback(() => {
    // Check if there are unsaved changes
    if (lifestylePhotoCropSrc && lifestylePhotoCroppedAreaPixels) {
      setDiscardConfirmType('lifestyle');
      setShowDiscardConfirm(true);
    } else {
      resetLifestylePhotoCrop();
    }
  }, [lifestylePhotoCropSrc, lifestylePhotoCroppedAreaPixels, resetLifestylePhotoCrop]);

  const confirmDiscardLifestylePhoto = useCallback(() => {
    resetLifestylePhotoCrop();
    setShowDiscardConfirm(false);
  }, [resetLifestylePhotoCrop]);

  const handleEditLifestylePhoto = useCallback((idx) => {
    if (!lifestyleImageUrls[idx]) return;
    setLifestylePhotoEditIdx(idx);
    setLifestylePhotoCropSrc(lifestyleImageUrls[idx]);
    setIsEditingLifestylePhoto(true);
    setLifestylePhotoCropError('');
  }, [lifestyleImageUrls]);

  const handleSaveLifestylePhotoCrop = useCallback(async () => {
    if (lifestylePhotoEditIdx === null || !lifestylePhotoCropSrc || !lifestylePhotoCroppedAreaPixels) {
      setLifestylePhotoCropError('Please adjust the crop area.');
      return;
    }

    setLifestylePhotoCropSubmitting(true);
    setLifestylePhotoCropError('');
    try {
      const blob = await getCroppedBlob(lifestylePhotoCropSrc, lifestylePhotoCroppedAreaPixels, 'image/jpeg', 0.92);
      const croppedFile = new File([blob], `lifestyle-photo-${lifestylePhotoEditIdx}-cropped.jpg`, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(blob);
      const idx = lifestylePhotoEditIdx;

      setLifestyleImageUrls(prev => {
        const next = [...prev];
        next[idx] = previewUrl;
        return next;
      });

      // Upload to backend
      try {
        const result = await uploadAPI.uploadLifestyleImage(croppedFile);
        console.log('[UserIntent] Lifestyle photo updated successfully:', result);
        setLifestyleImageUrls(prev => {
          const next = [...prev];
          next[idx] = result.url;
          return next;
        });
      } catch (uploadErr) {
        console.error('[UserIntent] Server upload failed:', uploadErr.message);
      }

      resetLifestylePhotoCrop();
    } catch (err) {
      console.error('[UserIntent] Lifestyle photo crop failed', err);
      setLifestylePhotoCropError(err?.message || 'Failed to crop image. Try again.');
    } finally {
      setLifestylePhotoCropSubmitting(false);
    }
  }, [lifestylePhotoCropSrc, lifestylePhotoCroppedAreaPixels, lifestylePhotoEditIdx, resetLifestylePhotoCrop]);

  const handleDeleteLifestylePhoto = useCallback((idx) => {
    setDeleteConfirmType('lifestyle');
    setDeleteConfirmIdx(idx);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteLifestylePhoto = useCallback(() => {
    setLifestyleImageUrls(prev => {
      const next = [...prev];
      next[deleteConfirmIdx] = null;
      return next;
    });
    setShowDeleteConfirm(false);
  }, [deleteConfirmIdx]);

  const handleLifestyleFilePicked = useCallback((idx, file) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      setImgError('Please upload an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImgError('Please upload an image under 10MB.');
      return;
    }

    uploadLifestyleImage(idx, file);
  }, []);

  // Trigger lifestyle gallery upload for specific slot
  const triggerLifestyleGalleryUpload = useCallback((idx) => {
    setLifestyleImageCameraIdx(idx);
    if (lifestyleImageInputRef.current) {
      lifestyleImageInputRef.current.click();
    }
  }, []);

  // Trigger lifestyle camera for specific slot
  const triggerLifestyleImageCameraCapture = useCallback((idx) => {
    setLifestyleImageCameraIdx(idx);
    setShowLifestylePhotoOptions(false);
    setLifestyleImageCameraError('');
    setShowLifestyleImageCameraModal(true);
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
      const croppedFile = new File([blob], `${(cropFile.name || 'lifestyle').replace(/\.[^/.]+$/, '')}-cropped.jpg`, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });

      closeCrop();
      await uploadLifestyleImage(cropIdx, croppedFile);
    } catch (err) {
      console.error('[UserIntent] Crop failed', err);
      setCropError(err?.message || 'Failed to crop image. Try again.');
    } finally {
      setCropSubmitting(false);
    }
  }, [closeCrop, cropFile, cropIdx, cropSrc, croppedAreaPixels]);

  // Save
  const handleFinish = async () => {
    setLoading(true);
    try {
      const currentProfile = await userAPI.getProfile();
      console.log('[UserIntent] Current profile:', currentProfile);
      console.log('[UserIntent] Profile image URL to save:', profileImageUrl);

      const updateData = {
        ...currentProfile,
        // ✅ NEW: Send interests at root level for hybrid storage
        interests,
        // ✅ FIX: Map relationshipVibe to relationshipStatus for root-level DB column
        relationshipStatus: relationshipVibe,
        // ✅ FIX: Fitness level must be at root level, not in intent
        fitnessLevel,
        intent: {
          ...currentProfile.intent,
          purpose,
          relationshipVibe,
          interestedGender,
          preferredAgeRange: ageRange,
          bio,
          // ✅ Store full objects with metadata for rich media display
          tvShows,
          movies,
          watchList,
          artistsBands,
          lifestyleImageUrls,
        },
        profilePicUrl: profileImageUrl,  // ✅ FIX: Changed from profileImageUrl to profilePicUrl to match backend
        onboardingComplete: true, // ✅ Onboarding complete - navigate to Home
      };

      console.log('[UserIntent] Saving profile with data:', updateData);
      console.log('[UserIntent] profilePicUrl in update:', updateData.profilePicUrl);

      await userAPI.updateProfile(updateData);
      // Clear saved onboarding state on successful completion
      clearOnboardingState(STORAGE_KEYS.USER_INTENT);
      // BUG FIX #7: Direct navigation based on approval status instead of navigating to '/'
      if (currentProfile.approval) {
        navigate('/home', { replace: true });
      } else {
        navigate('/waitlist-status', { replace: true });
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) return navigate(-1);
    setStep(s => Math.max(1, s - 1));
  };

  // Radio Option
  const RadioOption = ({ label, description, checked, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 mb-4 rounded-2xl transition-all text-left`}
      style={{
        background: checked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        border: checked ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.10)',
        boxShadow: checked ? 'inset 0 6px 16px rgba(0,0,0,0.45)' : '0 6px 18px rgba(0,0,0,0.35)'
      }}
    >
      <div className="flex-1 pr-4">
        <div className="text-white font-semibold text-base leading-tight">{label}</div>
        {description && <div className="text-white/75 text-sm mt-1 leading-snug">{description}</div>}
      </div>
      <div style={{ minWidth: 36 }} className="flex items-center justify-end">
        <span
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: checked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)' }}
        >
          {checked ? <span className="block w-3 h-3 rounded-full" style={{ background: 'white' }} /> : null}
        </span>
      </div>
    </button>
  );

  const renderStepHeader = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What are you looking for?</h1>
            <p className="text-white/70 text-sm leading-snug">We match you with people who share your relationship goals.</p>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What's your current relationship vibe?</h1>
            <p className="text-white/70 text-sm leading-snug">We match you with people who share your relationship goals.</p>
          </>
        );
      case 3:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Who are you interested in meeting?</h1>;
      case 4:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Preferred age range?</h1>;
      case 5:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Add your bio</h1>
            <p className="text-white/70 text-sm leading-snug">Share a little about yourself — your hobbies, passions, personality, and what makes you happy. Take your time!</p>
          </>
        );
      case 6:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">What are you excited about?</h1>
            <p className="text-white/70 text-sm leading-snug">Type your interests and click "Add" or press Enter.</p>
          </>
        );
      case 7:
        return <h1 className="text-white text-[22px] font-semibold mb-2">TV shows & movies you love?</h1>;
      case 8:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Current watch list?</h1>;
      case 9:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Your top favourite artists/bands & songs?</h1>;
      case 10:
        return <h1 className="text-white text-[22px] font-semibold mb-2">How would you describe your fitness level?</h1>;
      case 11:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload a profile picture</h1>
            <p className="text-white/70 text-sm leading-snug">Please upload a photo that keeps your identity private, showcasing your physique or a side profile instead.</p>
          </>
        );
      case 12:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload a profile picture</h1>
            <p className="text-white/70 text-sm leading-snug">Please upload a photo that keeps your identity private, showcasing your physique or a side profile instead.</p>
          </>
        );
      case 13:
        return (
          <>
            <h1 className="text-white text-[22px] font-semibold mb-2">Upload Lifestyle pictures</h1>
            <p className="text-white/70 text-sm leading-snug">Upload lifestyle shots showing your vibe or interest. There is no need to show your face&#128522;.</p>
          </>
        );
      case 14:
        return <h1 className="text-white text-[22px] font-semibold mb-2">Add 5 lifestyle images</h1>;
      default:
        return null;
    }
  }, [step]);

  const renderStepContent = useCallback(() => {
    switch (step) {
      case 1:
        return (
          <div>
            <RadioOption label="Date" description="Open to exploring and seeing where things go." checked={purpose === 'Date'} onClick={() => setPurpose('Date')} />
            <RadioOption label="Marriage" description="Looking for a meaningful, long-term relationship that could lead to marriage." checked={purpose === 'Seriously Date' || purpose === 'Marriage'} onClick={() => setPurpose('Seriously Date')} />
            <RadioOption label="Companionship" description="Wanting someone to share life and experiences with." checked={purpose === 'Companionship'} onClick={() => setPurpose('Companionship')} />
            <RadioOption label="Friends" description="Here to connect and build genuine friendships." checked={purpose === 'Friends'} onClick={() => setPurpose('Friends')} />
          </div>
        );
      case 2:
        return (
          <>
            <RadioOption label="Single" checked={relationshipVibe === 'Single'} onClick={() => setRelationshipVibe('Single')} />
            <RadioOption label="Divorced" checked={relationshipVibe === 'Divorced'} onClick={() => setRelationshipVibe('Divorced')} />
            <RadioOption label="Separated" checked={relationshipVibe === 'Separated'} onClick={() => setRelationshipVibe('Separated')} />
            <RadioOption label="It's complicated..." checked={relationshipVibe === "It's complicated..."} onClick={() => setRelationshipVibe("It's complicated...")} />
          </>
        );
      case 3:
        return (
          <>
            <RadioOption label="Women" checked={interestedGender === 'Women'} onClick={() => setInterestedGender('Women')} />
            <RadioOption label="Men" checked={interestedGender === 'Men'} onClick={() => setInterestedGender('Men')} />
            <RadioOption label="Anyone" checked={interestedGender === 'Anyone'} onClick={() => setInterestedGender('Anyone')} />
          </>
        );
      case 4:
        {
          // compute percentage positions for the thumbs relative to the full range
          const leftPct = ((ageRange[0] - minAge) / (maxAge - minAge)) * 100;
          const rightPct = ((ageRange[1] - minAge) / (maxAge - minAge)) * 100;
          return (
            <div className="flex flex-col gap-6 mt-4">
              <div className="text-center">
                <div className="text-white text-sm mb-2">Tell us your preferred age range for potential matches.</div>
              </div>

              {/* Bubbles row with dash */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold shadow-sm min-w-[56px] text-center">{ageRange[0]}</div>
                <div className="text-white/60 text-xl">—</div>
                <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold shadow-sm min-w-[56px] text-center">{ageRange[1]}</div>
              </div>

              <div className="relative w-full px-6">
                {/* Track background */}
                <div
                  ref={ageSliderRef}
                  className="relative h-3 rounded-full bg-white/10 w-full cursor-pointer"
                  onMouseDown={(e) => {
                    if (!ageSliderRef.current) return;
                    const rect = ageSliderRef.current.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const value = Math.round(minAge + Math.max(0, Math.min(1, percent)) * (maxAge - minAge));
                    const middle = (ageRange[0] + ageRange[1]) / 2;
                    setActiveAgeThumb(value < middle ? 0 : 1);
                  }}
                  onTouchStart={(e) => {
                    if (!ageSliderRef.current || !e.touches[0]) return;
                    const rect = ageSliderRef.current.getBoundingClientRect();
                    const percent = (e.touches[0].clientX - rect.left) / rect.width;
                    const value = Math.round(minAge + Math.max(0, Math.min(1, percent)) * (maxAge - minAge));
                    const middle = (ageRange[0] + ageRange[1]) / 2;
                    setActiveAgeThumb(value < middle ? 0 : 1);
                  }}
                >
                  {/* Filled segment between thumbs */}
                  <div
                    className="absolute h-full rounded-full"
                    style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%`, background: 'white' }}
                  />

                  {/* Left thumb visual (small white pill) */}
                  <button
                    type="button"
                    style={{ left: `${leftPct}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-6 rounded-full bg-white shadow-md cursor-grab active:cursor-grabbing"
                    onMouseDown={() => setActiveAgeThumb(0)}
                    onTouchStart={() => setActiveAgeThumb(0)}
                  />

                  {/* Right thumb visual (small white pill) */}
                  <button
                    type="button"
                    style={{ left: `${rightPct}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-6 rounded-full bg-white shadow-md cursor-grab active:cursor-grabbing"
                    onMouseDown={() => setActiveAgeThumb(1)}
                    onTouchStart={() => setActiveAgeThumb(1)}
                  />
                </div>
              </div>
            </div>
          );
        }

      // end case 4
      case 5:
        return (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button type="button" onClick={() => setBioMode('Read')} className={`px-4 py-2 rounded-full text-sm font-medium ${bioMode === 'Read' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>Read</button>
              <button type="button" onClick={() => setBioMode('Listen')} className={`px-4 py-2 rounded-full text-sm font-medium ${bioMode === 'Listen' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>Listen</button>
            </div>

            {bioMode === 'Read' ? (
              <div className="w-full rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <textarea
                  className="w-full rounded-lg p-4 text-base bg-transparent"
                  placeholder="Share a little about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={300}
                  style={{ color: 'white', border: 'none', minHeight: 120, resize: 'vertical' }}
                />
                <div className="text-white/60 text-xs mt-2">{bio.length}/300</div>
              </div>
            ) : (
              <div className="w-full rounded-2xl p-4 mb-4 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                {!sttSupported ? (
                  <div className="text-white/70 text-sm">Speech input isn't supported in this browser.</div>
                ) : (
                  <>
                    <div className="w-full mb-3 text-white/60 text-sm">Transcript (appended to bio):</div>
                    <div className="w-full min-h-[100px] p-3 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.02)', color: 'white', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                      <div className="whitespace-pre-wrap">{bio}{interimTranscript ? <span className="text-white/60"> {interimTranscript}</span> : null}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={toggleListening} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: listening ? 'linear-gradient(180deg, rgba(255,255,255,1), rgba(230,230,230,1))' : 'rgba(255,255,255,0.08)' }} aria-pressed={listening}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={listening ? '#000' : '#fff'} xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
                          <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 5 5 0 0 0 4 4.9V19a1 1 0 0 0 2 0v-3.1A5 5 0 0 0 19 11z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-white/60 text-xs mt-3">{listening ? 'Listening — speak now' : 'Tap the mic to start'}</div>
                  </>
                )}
              </div>
            )}

            <div className="text-white font-semibold mb-2">Some ideas to get started:</div>
            <ul className="text-white/70 text-sm list-disc ml-5 space-y-1">
              <li>I enjoy cooking, gardening, and weekend walks in nature.</li>
              <li>I love live music, small gatherings with friends, and traveling to new places.</li>
              <li>I'm thoughtful, curious, and appreciate meaningful conversations.</li>
              <li>Reading, photography, exploring history, and discovering new cuisines.</li>
            </ul>
          </>
        );
      case 6:
        return (
          <>
           <div className="flex gap-2 mb-3 w-full items-center">
  <div className="flex-1">
    <AutocompleteInput
      value={interestInput}
      onChange={e => setInterestInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addInterest(interestInput);
        }
      }}
      onSelect={(item) => addInterest(item)}
      showImage={false}
      placeholder="Add an interest..."
      searchFn={searchInterests}
      className="w-full rounded-xl p-3 text-base"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    />
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      addInterest(interestInput);
    }}
    disabled={!interestInput.trim()}
    className="px-3 sm:px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap"
    style={
      interestInput.trim()
        ? { background: 'white', color: 'black' }
        : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
    }
  >
    Add
  </button>
</div>
            <div className="flex flex-wrap gap-3 mt-3">
              {interests.map((t, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'white', color: 'black' }}>
                  {t}
                  <button onClick={() => removeInterest(t)} className="ml-3 text-black/60" aria-label={`Remove ${t}`}>×</button>
                </span>
              ))}
            </div>
          </>
        );
      case 7:
        return (
          <div className="space-y-6">
            {/* TV Shows */}
            <div>
              <label className="block text-white/80 mb-2">TV show(s) you could rewatch anytime</label>
             <div className="flex gap-2 mb-3 w-full items-center">
  <div className="flex-1">
    <AutocompleteInput
      value={tvInput}
      onChange={e => setTvInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTvShow();
        }
      }}
      onSelect={addTvShow}
      placeholder="e.g. The Office"
      searchFn={searchTVShows}
      className="w-full rounded-xl p-3 text-base"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    />
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      addTvShow();
    }}
    disabled={!tvInput.trim()}
    className="px-3 sm:px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap"
    style={
      tvInput.trim()
        ? { background: 'white', color: 'black' }
        : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
    }
  >
    Add
  </button>
</div>
              <div className="flex flex-col gap-3">
                {tvShows.map((s, i) => {
                  const itemName = typeof s === 'object' ? s.name : s;
                  const itemSubtitle = typeof s === 'object' ? s.subtitle : null;
                  const itemImage = typeof s === 'object' ? s.image : null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      {/* Thumbnail */}
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                          onError={(e) => { e.target.style.opacity = '0.3'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      )}
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{itemName}</div>
                        {itemSubtitle && (
                          <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>
                        )}
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeTvShow(s)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white"
                        aria-label={`Remove ${itemName}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Movies */}
            <div>
              <label className="block text-white/80 mb-2">Movie(s) that never get old</label>
             <div className="flex gap-2 mb-3 w-full items-center">
  <div className="flex-1">
    <AutocompleteInput
      value={movieInput}
      onChange={e => setMovieInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addMovie();
        }
      }}
      onSelect={addMovie}
      placeholder="e.g. The Godfather"
      searchFn={searchMovies}
      className="w-full rounded-xl p-3 text-base"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    />
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      addMovie();
    }}
    disabled={!movieInput.trim()}
    className="px-3 sm:px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap"
    style={
      movieInput.trim()
        ? { background: 'white', color: 'black' }
        : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
    }
  >
    Add
  </button>
</div>
              <div className="flex flex-col gap-3">
                {movies.map((m, i) => {
                  const itemName = typeof m === 'object' ? m.name : m;
                  const itemSubtitle = typeof m === 'object' ? m.subtitle : null;
                  const itemImage = typeof m === 'object' ? m.image : null;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      {/* Thumbnail */}
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                          onError={(e) => { e.target.style.opacity = '0.3'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      )}
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{itemName}</div>
                        {itemSubtitle && (
                          <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>
                        )}
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeMovie(m)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white"
                        aria-label={`Remove ${itemName}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <>
           <div className="flex gap-2 mb-3 w-full items-center">
  <div className="flex-1">
    <AutocompleteInput
      value={watchInput}
      onChange={e => setWatchInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addWatchItem();
        }
      }}
      onSelect={addWatchItem}
      placeholder="e.g. The Bear, Oppenheimer"
      searchFn={searchMoviesAndShows}
      className="w-full rounded-xl p-3 text-base"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    />
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      addWatchItem();
    }}
    disabled={!watchInput.trim()}
    className="px-3 sm:px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap"
    style={
      watchInput.trim()
        ? { background: 'white', color: 'black' }
        : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
    }
  >
    Add
  </button>
</div>
            <div className="flex flex-col gap-3 mt-3">
              {watchList.map((w, i) => {
                const itemName = typeof w === 'object' ? w.name : w;
                const itemSubtitle = typeof w === 'object' ? w.subtitle : null;
                const itemImage = typeof w === 'object' ? w.image : null;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    {/* Thumbnail */}
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt=""
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{itemName}</div>
                      {itemSubtitle && (
                        <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>
                      )}
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeWatchItem(w)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white"
                      aria-label={`Remove ${itemName}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        );
      case 9:
        return (
          <>
          <div className="flex gap-2 mb-3 w-full items-center">
  <div className="flex-1">
    <AutocompleteInput
      value={artistBandInput}
      onChange={e => setArtistBandInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addArtistBand();
        }
      }}
      onSelect={addArtistBand}
      placeholder="Add an artist/band..."
      searchFn={searchArtistsAndTracks}
      className="w-full rounded-xl p-3 text-base"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    />
  </div>

  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      addArtistBand();
    }}
    disabled={!artistBandInput.trim()}
    className="px-3 sm:px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap"
    style={
      artistBandInput.trim()
        ? { background: 'white', color: 'black' }
        : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
    }
  >
    Add
  </button>
</div>
            <div className="flex flex-col gap-3 mt-3">
              {artistsBands.map((b, i) => {
                const itemName = typeof b === 'object' ? b.name : b;
                const itemSubtitle = typeof b === 'object' ? b.subtitle : null;
                const itemImage = typeof b === 'object' ? b.image : null;
                const itemType = typeof b === 'object' ? b.type : null; // 'artist' or 'track'
                const previewUrl = typeof b === 'object' ? b.preview_url : null;
                const isPlaying = playingTrackId === b.id;
                
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    {/* Thumbnail */}
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt=""
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    )}
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {itemName}
                        {itemType === 'track' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.3)', color: '#86efac' }}>
                            🎵 SONG
                          </span>
                        )}
                      </div>
                      {itemSubtitle && (
                        <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>
                      )}
                    </div>
                    {/* Play button for tracks */}
                    {itemType === 'track' && previewUrl && (
                      <button
                        type="button"
                        onClick={() => handlePlayTrack(b)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 transition"
                        style={{
                          background: isPlaying ? 'rgba(34, 197, 94, 0.8)' : 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }}
                        title={isPlaying ? 'Stop' : 'Play preview'}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeArtistBand(b)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white"
                      aria-label={`Remove ${itemName}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        );
      case 10:
        return (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setFitnessLevel('Easygoing')}
              className="w-full py-4 px-4 rounded-xl text-white font-medium text-base transition"
              style={{
                background: fitnessLevel === 'Easygoing' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: fitnessLevel === 'Easygoing' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span>Easygoing</span>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {fitnessLevel === 'Easygoing' && <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'white'
                  }} />}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFitnessLevel('Lightly active')}
              className="w-full py-4 px-4 rounded-xl text-white font-medium text-base transition"
              style={{
                background: fitnessLevel === 'Lightly active' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: fitnessLevel === 'Lightly active' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span>Lightly active</span>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {fitnessLevel === 'Lightly active' && <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'white'
                  }} />}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFitnessLevel('Active lifestyle')}
              className="w-full py-4 px-4 rounded-xl text-white font-medium text-base transition"
              style={{
                background: fitnessLevel === 'Active lifestyle' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: fitnessLevel === 'Active lifestyle' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span>Active lifestyle</span>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {fitnessLevel === 'Active lifestyle' && <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'white'
                  }} />}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFitnessLevel('Very active')}
              className="w-full py-4 px-4 rounded-xl text-white font-medium text-base transition"
              style={{
                background: fitnessLevel === 'Very active' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: fitnessLevel === 'Very active' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span>Very active</span>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {fitnessLevel === 'Very active' && <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'white'
                  }} />}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFitnessLevel('Fitness focused')}
              className="w-full py-4 px-4 rounded-xl text-white font-medium text-base transition"
              style={{
                background: fitnessLevel === 'Fitness focused' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: fitnessLevel === 'Fitness focused' ? '1.5px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <span>Fitness focused</span>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {fitnessLevel === 'Fitness focused' && <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'white'
                  }} />}
                </div>
              </div>
            </button>
          </div>
        );
      case 11:
        return (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-sm">
              <img src="/sample1.png" alt="Sample 1" className="w-full h-auto rounded-lg" />
              <img src="/sample2.png" alt="Sample 2" className="w-full h-auto rounded-lg" />
              <img src="/sample3.png" alt="Sample 3" className="w-full h-auto rounded-lg" />
              <img src="/sample4.png" alt="Sample 4" className="w-full h-auto rounded-lg" />
            </div>
            <div className="w-full max-w-sm text-left">
              <div className="text-white text-sm mb-2">Pro Tip: Feel free to take some inspiration from the references above</div>
              <div className="text-white text-sm">Note: You can change your profile picture later</div>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="flex flex-col items-center">
            <div
              className="w-60 h-60 rounded-2xl overflow-hidden flex flex-col items-center justify-center relative cursor-pointer mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}
              onClick={profileImageUrl ? null : handleOpenProfilePhotoOptions}
            >
              {profileImageUrl ? (
                <>
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  {/* Edit and Delete Icons */}
                  <div className="absolute inset-0 flex items-start justify-between p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {/* Edit (Pencil) Icon - Top Left */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfilePhoto();
                      }}
                      className="p-2 rounded-full bg-white text-black shadow-lg hover:bg-white/90 transition"
                      title="Edit photo"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Delete (Bin) Icon - Top Right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfilePhoto();
                      }}
                      className="p-2 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition"
                      title="Delete photo"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 mb-2">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-white/60 text-sm">Tap to upload your photo</div>
                  <div className="text-white/40 text-xs">(JPG, PNG or JPEG (max 10MB))</div>
                </>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && e.target.files[0] && handleProfileImageChange(e.target.files[0])} disabled={profileImgUploading} />
              {profileImgUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/20 text-xs">Uploading...</div>}
            </div>
            {profileImgError && <div className="text-red-400 text-sm mb-2">{profileImgError}</div>}
          </div>
        );
      case 13:
        return (
          <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 mb-6 flex">
              <img src="/sample5.png" alt="Sample 5" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '5%', left: '5%', transform: 'rotate(-10deg)', zIndex: 3 }} />
              <img src="/sample6.png" alt="Sample 6" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '5%', right: '5%', transform: 'rotate(5deg)', zIndex: 4 }} />
              <img src="/sample7.png" alt="Sample 7" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ bottom: '5%', left: '5%', transform: 'rotate(10deg)', zIndex: 2 }} />
              <img src="/sample8.png" alt="Sample 8" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ bottom: '5%', right: '5%', transform: 'rotate(-5deg)', zIndex: 1 }} />
              <img src="/sample9.png" alt="Sample 9" className="absolute w-2/5 h-2/5 rounded-lg object-contain" style={{ top: '30%', left: '30%', transform: 'rotate(12deg)', zIndex: 5 }} />
            </div>
            <div className="w-full max-w-sm text-left">
              <div className="text-white text-sm mb-2">Pro Tip: Feel free to take some inspiration from the references above</div>
              <div className="text-white text-sm">Note: You can change these pictures later</div>
            </div>
          </div>
        );
      case 14:
        return (
          <>
            <div className="flex flex-wrap gap-4 justify-center mb-3">
              {[0, 1, 2, 3, 4].map(idx => (
                <div
                  key={idx}
                  className="w-24 h-24 rounded-lg overflow-hidden relative cursor-pointer transition hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.08)' }}
                >
                  {lifestyleImageUrls[idx] ? (
                    <>
                      <img src={lifestyleImageUrls[idx]} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                      {/* Edit and Delete Icons Container */}
                      <div className="absolute inset-0 flex items-start justify-between p-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        {/* Edit (Pencil) Icon - Top Left */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLifestylePhoto(idx);
                          }}
                          className="p-1 rounded-full bg-white text-black shadow-lg hover:bg-white/90 transition"
                          title="Edit photo"
                          style={{ width: 24, height: 24, minWidth: 24 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Delete (Bin) Icon - Top Right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLifestylePhoto(idx);
                          }}
                          className="p-1 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition"
                          title="Delete photo"
                          style={{ width: 24, height: 24, minWidth: 24 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setLifestyleImageCameraIdx(idx);
                        setShowLifestylePhotoOptions(true);
                      }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <span className="text-white/60 text-3xl">+</span>
                    </button>
                  )}
                  {imgUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/20 text-xs">Uploading...</div>}
                </div>
              ))}
            </div>
            {imgError && <div className="text-red-400 text-sm mb-2">{imgError}</div>}
            <div className="text-white/60 text-xs">Upload 5 images to continue.</div>
          </>
        );
      default:
        return null;
    }
  }, [
    step, purpose, relationshipVibe, interestedGender, ageRange,
    bio, interests, interestInput, tvShows, movies, tvInput, movieInput, watchList, watchInput, artistsBands, artistBandInput, fitnessLevel, profileImageUrl, lifestyleImageUrls,
    imgUploading, imgError, addInterest, removeInterest, addTvShow, removeTvShow, addMovie, removeMovie, addWatchItem, removeWatchItem, addArtistBand, removeArtistBand, handleLifestyleFilePicked, handleProfileImageChange, profileImgUploading, profileImgError,
    triggerLifestyleGalleryUpload, triggerLifestyleImageCameraCapture,
    handleEditProfilePhoto, handleDeleteProfilePhoto, handleEditLifestylePhoto, handleDeleteLifestylePhoto,
    setFitnessLevel,
    bioMode, listening, sttSupported, interimTranscript, toggleListening
  ]);

  if (initialLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div
      className="h-screen w-screen relative font-sans"
      style={{
        backgroundImage: step >= 10 ? "url('/bgs/faceverifybg.png')" : (step === 7 ? "url('/bgs/bg-mediaPreferences.png')" : (step >= 5 ? "url('/bgs/bg-personalProfile.png')" : "url('/bgs/bg-userintent.png')")),
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 h-full px-6 pt-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleBack} aria-label="Back" className="w-8 h-8 flex items-center justify-center">
            <img src="/backarrow.svg" alt="Back" className="w-5 h-5" />
          </button>
          <img src="/logo.png" alt="Sundate" className="h-7" />
          <div style={{ width: 32 }} />
        </div>

        <div className="w-full max-w-md mx-auto mb-5">
          <div className="w-full bg-white/10 rounded-full h-1">
            <div className="h-1 rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0">
          <div className="sticky top-0 z-10">
            {renderStepHeader()}
          </div>
          <div className="flex-1 overflow-y-auto mt-4 pb-6">
            {renderStepContent()}
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 px-6">
          <div className="w-full max-w-md">
            <button
              onClick={() => {
                if (step === totalSteps) handleFinish();
                else setStep(s => Math.min(totalSteps, s + 1));
              }}
              className="w-full py-3 rounded-full font-semibold text-base shadow-lg"
              style={{ background: 'white', color: 'black' }}
              disabled={loading || imgUploading || (step === 10 && !fitnessLevel)}
            >
              {loading || imgUploading ? 'Saving...' : (step === totalSteps ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </div>

      {cropOpen && cropSrc ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={closeCrop} />
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-semibold">Crop image</div>
              <button type="button" onClick={closeCrop} className="text-white/70 hover:text-white text-sm">Close</button>
            </div>

            <div className="relative w-full" style={{ height: 340 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
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

              {cropError ? <div className="text-red-400 text-sm mb-3">{cropError}</div> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeCrop}
                  disabled={cropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={cropSubmitting ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' } : { background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCrop}
                  disabled={cropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={cropSubmitting ? { background: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' } : { background: 'white', color: 'black' }}
                >
                  {cropSubmitting ? 'Cropping...' : 'Use photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Profile Photo Edit Modal */}
      {isEditingProfilePhoto && profilePhotoCropSrc ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => closeProfilePhotoCrop()} />
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-semibold">Edit profile photo</div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeProfilePhotoCrop();
                }} 
                className="text-white/70 hover:text-white text-lg"
              >
                ×
              </button>
            </div>

            <div className="relative w-full" style={{ height: 340 }}>
              <Cropper
                ref={profilePhotoCropperRef}
                image={profilePhotoCropSrc}
                crop={profilePhotoCrop}
                zoom={profilePhotoZoom}
                aspect={1}
                onCropChange={setProfilePhotoCrop}
                onZoomChange={setProfilePhotoZoom}
                onCropComplete={(_, pixels) => setProfilePhotoCroppedAreaPixels(pixels)}
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
                  value={profilePhotoZoom}
                  onChange={(e) => setProfilePhotoZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              {profilePhotoCropError ? <div className="text-red-400 text-sm mb-3">{profilePhotoCropError}</div> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeProfilePhotoCrop}
                  disabled={profilePhotoCropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={profilePhotoCropSubmitting ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' } : { background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfilePhotoCrop}
                  disabled={profilePhotoCropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={profilePhotoCropSubmitting ? { background: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' } : { background: 'white', color: 'black' }}
                >
                  {profilePhotoCropSubmitting ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lifestyle Photo Edit Modal */}
      {isEditingLifestylePhoto && lifestylePhotoCropSrc ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => closeLifestylePhotoCrop()} />
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-white font-semibold">Edit lifestyle photo</div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeLifestylePhotoCrop();
                }} 
                className="text-white/70 hover:text-white text-lg"
              >
                ×
              </button>
            </div>

            <div className="relative w-full" style={{ height: 340 }}>
              <Cropper
                ref={lifestylePhotoCropperRef}
                image={lifestylePhotoCropSrc}
                crop={lifestylePhotoCrop}
                zoom={lifestylePhotoZoom}
                aspect={1}
                onCropChange={setLifestylePhotoCrop}
                onZoomChange={setLifestylePhotoZoom}
                onCropComplete={(_, pixels) => setLifestylePhotoCroppedAreaPixels(pixels)}
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
                  value={lifestylePhotoZoom}
                  onChange={(e) => setLifestylePhotoZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              {lifestylePhotoCropError ? <div className="text-red-400 text-sm mb-3">{lifestylePhotoCropError}</div> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeLifestylePhotoCrop}
                  disabled={lifestylePhotoCropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={lifestylePhotoCropSubmitting ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' } : { background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLifestylePhotoCrop}
                  disabled={lifestylePhotoCropSubmitting}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={lifestylePhotoCropSubmitting ? { background: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' } : { background: 'white', color: 'black' }}
                >
                  {lifestylePhotoCropSubmitting ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
            <div className="p-6">
              <h2 className="text-white font-semibold text-lg mb-2">Delete Photo?</h2>
              <p className="text-white/70 text-sm mb-6">
                Are you sure you want to delete this photo? You can upload a new one anytime.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Keep Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmType === 'profile') {
                      confirmDeleteProfilePhoto();
                    } else {
                      confirmDeleteLifestylePhoto();
                    }
                  }}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={{ background: '#dc2626', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
            <div className="p-6">
              <h2 className="text-white font-semibold text-lg mb-2">Discard Changes?</h2>
              <p className="text-white/70 text-sm mb-6">
                Your edits haven't been saved. Do you want to discard these changes?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (discardConfirmType === 'profile') {
                      confirmDiscardProfilePhoto();
                    } else {
                      confirmDiscardLifestylePhoto();
                    }
                  }}
                  className="flex-1 py-3 rounded-full font-semibold text-base"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Options Modal */}
      {showProfilePhotoOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-4">
              <h2 className="text-white font-semibold text-center mb-4">Upload Profile Photo</h2>
              <div className="flex flex-col gap-3">
                {/* Gallery Option */}
                <button
                  onClick={triggerProfileGalleryUpload}
                  className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Gallery
                </button>

                {/* Camera Option */}
                <button
                  onClick={() => {
                    setShowProfilePhotoOptions(false);
                    setProfileCameraError('');
                    setShowProfileCameraModal(true);
                  }}
                  className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Camera
                </button>

                {/* Cancel Option */}
                <button
                  onClick={() => setShowProfilePhotoOptions(false)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for profile gallery upload */}
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleProfileImageChange(e.target.files[0]);
            setShowProfilePhotoOptions(false);
          }
        }}
        className="hidden"
      />

      {/* Profile Camera Modal */}
      {showProfileCameraModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Capture profile photo</span>
              <button
                onClick={() => setShowProfileCameraModal(false)}
                className="text-white/70 hover:text-white text-lg leading-none px-2"
              >
                ×
              </button>
            </div>

            <div className="px-4 pt-4 pb-3 flex flex-col items-center">
              <div className="w-full rounded-xl overflow-hidden bg-black/80 border border-white/20 mb-3">
                <video
                  ref={profileVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover bg-black"
                />
              </div>
              {profileCameraError && (
                <p className="text-xs text-red-300 mb-2 text-center px-2">{profileCameraError}</p>
              )}
              <p className="text-xs text-white/70 mb-3 text-center">
                Position your face clearly in the frame and tap capture.
              </p>
              <button
                onClick={handleCaptureProfilePhoto}
                disabled={profileImgUploading || !!profileCameraError}
                className="w-full py-3 rounded-full bg-white text-black font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {profileImgUploading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  'Capture & Continue'
                )}
              </button>
              {/* Hidden canvas used only for extracting the captured frame */}
              <canvas ref={profileCanvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}



      {/* Lifestyle Photo Options Modal */}
      {showLifestylePhotoOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-4">
              <h2 className="text-white font-semibold text-center mb-4">Add Lifestyle Photo</h2>
              <div className="flex flex-col gap-3">
                {/* Gallery Option */}
                <button
                  onClick={() => triggerLifestyleGalleryUpload(lifestyleImageCameraIdx !== null ? lifestyleImageCameraIdx : 0)}
                  className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Gallery
                </button>

                {/* Camera Option */}
                <button
                  onClick={() => triggerLifestyleImageCameraCapture(lifestyleImageCameraIdx !== null ? lifestyleImageCameraIdx : 0)}
                  className="w-full py-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Camera
                </button>

                {/* Cancel Option */}
                <button
                  onClick={() => setShowLifestylePhotoOptions(false)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for lifestyle gallery upload */}
      <input
        ref={lifestyleImageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const idx = lifestyleImageCameraIdx !== null ? lifestyleImageCameraIdx : 0;
            handleLifestyleFilePicked(idx, e.target.files[0]);
            setShowLifestylePhotoOptions(false);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Lifestyle Image Camera Modal */}
      {showLifestyleImageCameraModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Capture lifestyle photo</span>
              <button
                onClick={() => setShowLifestyleImageCameraModal(false)}
                className="text-white/70 hover:text-white text-lg leading-none px-2"
              >
                ×
              </button>
            </div>

            <div className="px-4 pt-4 pb-3 flex flex-col items-center">
              <div className="w-full rounded-xl overflow-hidden bg-black/80 border border-white/20 mb-3">
                <video
                  ref={lifestyleImageVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover bg-black"
                />
              </div>
              {lifestyleImageCameraError && (
                <p className="text-xs text-red-300 mb-2 text-center px-2">{lifestyleImageCameraError}</p>
              )}
              <p className="text-xs text-white/70 mb-3 text-center">
                Frame your lifestyle shot and tap capture.
              </p>
              <button
                onClick={handleCaptureLifestylePhoto}
                disabled={imgUploading || !!lifestyleImageCameraError}
                className="w-full py-3 rounded-full bg-white text-black font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {imgUploading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  'Capture & Continue'
                )}
              </button>
              {/* Hidden canvas used only for extracting the captured frame */}
              <canvas ref={lifestyleImageCanvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      )}


    </div>
  );
}