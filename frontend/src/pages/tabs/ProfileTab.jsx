import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { userAPI, uploadAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import MediaItemCard from "../../components/MediaItemCard";
import AutocompleteInput from "../../components/AutocompleteInput";
import { searchMovies, searchTVShows, searchArtists, searchMoviesAndShows } from "../../utils/externalAPIs";
import { formatLocationLabel, searchLocations } from "../../services/locationService";

export default function ProfileTab() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const profilePhotoInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError("");
      try {
        const userData = await userAPI.getProfile();
        console.log('[ProfileTab] Loaded user data:', userData);
        console.log('[ProfileTab] Profile picture URL:', userData.profilePicUrl);
        console.log('[ProfileTab] Face photos:', userData.facePhotos);
        console.log('[ProfileTab] Using photo:', userData.profilePicUrl || userData.facePhotos?.[0] || 'none');
        setUserInfo(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  function getAge(dob) {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const lifestyleImages = userInfo?.intent?.lifestyleImageUrls?.filter(Boolean) || [];
  const [currentLifestyleImageIndex, setCurrentLifestyleImageIndex] = useState(0);



  useEffect(() => {
    setCurrentLifestyleImageIndex(0);
  }, [lifestyleImages]);

  const handleBackgroundTap = () => {
    if (!lifestyleImages || lifestyleImages.length === 0) return;
    setCurrentLifestyleImageIndex((prev) => (prev + 1) % lifestyleImages.length);
  };

  const handleEditClick = (section) => {
    setEditingSection(section);
    if (section === 'header') {
      setEditFormData({
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        dob: userInfo?.dob || '',
        height: userInfo?.height || '',
        gender: userInfo?.gender || '',
        jobTitle: userInfo?.intent?.profileQuestions?.jobTitle || '',
        relationshipStatus: userInfo?.relationshipStatus || '',
        fromLocation: userInfo?.fromLocation || '',
        currentLocation: userInfo?.currentLocation || '',
      });
    } else if (section === 'lifestyleImages') {
      setEditFormData({
        lifestyleImages: [...(userInfo?.intent?.lifestyleImageUrls?.filter(Boolean) || [])],
      });
    } else if (section === 'bio') {
      setEditFormData({
        bio: userInfo?.intent?.bio || '',
      });
    } else if (section === 'work') {
      setEditFormData({
        jobTitle: userInfo?.intent?.profileQuestions?.jobTitle || '',
        company: userInfo?.intent?.profileQuestions?.companyName || '',
        school: userInfo?.intent?.profileQuestions?.education || '',
        educationLevel: userInfo?.intent?.profileQuestions?.educationLevel || '',
      });
    } else if (section === 'personal') {
      setEditFormData({
        personalPhotos: [...(userInfo?.facePhotos?.filter(Boolean) || [])],
      });
    } else if (section === 'interests') {
      setEditFormData({
        interests: [...(userInfo?.interests || [])],
        newInterest: '',
      });
    } else if (section === 'entertainment') {
      setEditFormData({
        watchList: [...(userInfo?.intent?.watchList || [])],
        tvShows: [...(userInfo?.intent?.tvShows || [])],
        movies: [...(userInfo?.intent?.movies || [])],
        artistsBands: [...(userInfo?.intent?.artistsBands || [])],
        newWatchList: '',
        newTvShow: '',
        newMovie: '',
        newArtist: '',
      });
    } else if (section === 'lifestyle') {
      setEditFormData({
        pets: userInfo?.pets || '',
        foodPreference: userInfo?.foodPreference || '',
        sleepSchedule: userInfo?.intent?.profileQuestions?.sleepSchedule || '',
        drinking: userInfo?.drinking || '',
        smoking: userInfo?.smoking || '',
      });
    } else if (section === 'personality') {
      setEditFormData({
        dateBill: userInfo?.intent?.profileQuestions?.dateBill || '',
        relationshipValues: userInfo?.intent?.profileQuestions?.relationshipValues?.[0] || '',
      });
    } else if (section === 'deepDive') {
      // Convert favouriteTravelDestination array to string for editing
      const favDestString = Array.isArray(userInfo?.favouriteTravelDestination)
        ? userInfo.favouriteTravelDestination.map(d => d.name).join(', ')
        : userInfo?.favouriteTravelDestination || '';

      setEditFormData({
        favouriteTravelDestination: favDestString,
        kidsPreference: userInfo?.kidsPreference || '',
        religiousLevel: userInfo?.religiousLevel || '',
        religion: userInfo?.intent?.profileQuestions?.religion || '',
        livingSituation: userInfo?.intent?.profileQuestions?.livingSituation || '',
        favoriteCafe: userInfo?.favoriteCafe || '',
      });
    } else if (section === 'languages') {
      setEditFormData({
        languages: [...(userInfo?.intent?.profileQuestions?.languages || [])],
        newLanguage: '',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      let updateData;

      if (editingSection === 'header') {
        // Prepare the data for API
        updateData = {
          ...editFormData,
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              jobTitle: editFormData.jobTitle,
            },
          },
        };
      } else if (editingSection === 'lifestyleImages') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            lifestyleImageUrls: editFormData.lifestyleImages,
          },
        };
      } else if (editingSection === 'bio') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            bio: editFormData.bio,
          },
        };
      } else if (editingSection === 'work') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              jobTitle: editFormData.jobTitle,
              companyName: editFormData.company,
              education: editFormData.school,
              educationLevel: editFormData.educationLevel,
            },
          },
        };
      } else if (editingSection === 'personal') {
        updateData = {
          facePhotos: editFormData.personalPhotos,
        };
      } else if (editingSection === 'interests') {
        updateData = {
          interests: editFormData.interests,
        };
      } else if (editingSection === 'entertainment') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            watchList: editFormData.watchList,
            tvShows: editFormData.tvShows,
            movies: editFormData.movies,
            artistsBands: editFormData.artistsBands,
          },
        };
      } else if (editingSection === 'lifestyle') {
        updateData = {
          pets: editFormData.pets,
          foodPreference: editFormData.foodPreference,
          drinking: editFormData.drinking,
          smoking: editFormData.smoking,
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              sleepSchedule: editFormData.sleepSchedule,
            },
          },
        };
      } else if (editingSection === 'personality') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              dateBill: editFormData.dateBill,
              relationshipValues: editFormData.relationshipValues ? [editFormData.relationshipValues] : [],
            },
          },
        };
      } else if (editingSection === 'deepDive') {
        // Convert comma-separated string to array of objects for favouriteTravelDestination
        const favDestArray = editFormData.favouriteTravelDestination
          ? editFormData.favouriteTravelDestination
            .split(',')
            .map(dest => dest.trim())
            .filter(dest => dest.length > 0)
            .map(dest => ({ id: Date.now() + Math.random(), name: dest, details: '' }))
          : [];

        updateData = {
          favouriteTravelDestination: favDestArray,
          kidsPreference: editFormData.kidsPreference,
          religiousLevel: editFormData.religiousLevel,
          favoriteCafe: editFormData.favoriteCafe || '',
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              religion: editFormData.religion,
              livingSituation: editFormData.livingSituation,
            },
          },
        };
      } else if (editingSection === 'languages') {
        updateData = {
          intent: {
            ...userInfo?.intent,
            profileQuestions: {
              ...userInfo?.intent?.profileQuestions,
              languages: editFormData.languages,
            },
          },
        };
      }

      await userAPI.updateProfile(updateData);      // Refresh user data
      const userData = await userAPI.getProfile();
      setUserInfo(userData);
      setEditingSection(null);
      setEditFormData({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLifestyleImage = (index) => {
    const updatedImages = editFormData.lifestyleImages.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, lifestyleImages: updatedImages }));
  };

  const handleAddLifestyleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      
      // ✅ Use upload API which has compression
      const result = await uploadAPI.uploadLifestyleImage(file);
      console.log('[ProfileTab] Lifestyle upload successful:', result.url);

      setEditFormData(prev => ({
        ...prev,
        lifestyleImages: [...prev.lifestyleImages, result.url],
      }));
    } catch (err) {
      console.error('[ProfileTab] Lifestyle upload error:', err);
      setError(err.message || 'Failed to upload lifestyle image');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePersonalPhoto = (index) => {
    const updatedPhotos = editFormData.personalPhotos.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, personalPhotos: updatedPhotos }));
  };

  const handleAddPersonalPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      
      // ✅ Use upload API which has compression & face validation
      const result = await uploadAPI.uploadFacePhoto(file);
      console.log('[ProfileTab] Face photo upload successful:', result.url);

      setEditFormData(prev => ({
        ...prev,
        personalPhotos: [...prev.personalPhotos, result.url],
      }));
    } catch (err) {
      console.error('[ProfileTab] Face photo upload error:', err);
      setError(err.message || 'Failed to upload personal photo');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Profile photo upload handler
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      console.log('[ProfileTab] Uploading profile photo:', file.name, 'Size:', file.size);
      
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size too large. Maximum 20MB allowed.');
      }
      
      // Use the uploadAPI which has proper token handling and configuration
      const result = await uploadAPI.uploadProfilePicture(file);
      
      console.log('[ProfileTab] Upload successful:', result.url);

      // Update userInfo immediately
      setUserInfo(prev => ({
        ...prev,
        profilePicUrl: result.url,
      }));

      // Save to backend
      await userAPI.updateProfile({
        profilePicUrl: result.url,
      });

      console.log('[ProfileTab] Profile updated successfully');
      setEditingSection(null);
    } catch (err) {
      console.error('[ProfileTab] Upload error:', err);
      // Provide specific error messages
      if (err.message?.includes('No authentication token')) {
        setError('Authentication failed. Please log in again.');
      } else if (err.message?.includes('File size')) {
        setError(err.message);
      } else if (err.message?.includes('Upload failed')) {
        setError('Failed to upload. Please check your network and try again.');
      } else {
        setError(err.message || 'Failed to upload profile photo');
      }
    } finally {
      setLoading(false);
      // Reset file input
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }
    }
  };

  // Interests handlers
  const handleRemoveInterest = (index) => {
    setEditFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddInterest = () => {
    if (editFormData.newInterest?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), prev.newInterest.trim()],
        newInterest: '',
      }));
    }
  };

  // Entertainment handlers
  const handleRemoveEntertainmentItem = (category, index) => {
    setEditFormData(prev => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index),
    }));
  };

  const handleAddEntertainmentItem = (category, selectedItem) => {
    if (!selectedItem) return;

    // Check if item already exists (by name/title)
    const itemName = typeof selectedItem === 'object' ? (selectedItem.title || selectedItem.name) : selectedItem;
    const exists = editFormData[category]?.some(item => {
      const existingName = typeof item === 'object' ? (item.title || item.name) : item;
      return existingName === itemName;
    });

    if (!exists) {
      setEditFormData(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), selectedItem],
      }));
    }
  };

  // Languages handlers
  const handleRemoveLanguage = (index) => {
    setEditFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddLanguage = () => {
    if (editFormData.newLanguage?.trim()) {
      setEditFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), prev.newLanguage.trim()],
        newLanguage: '',
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const searchLocationSuggestions = useCallback(async (query) => {
    const suggestions = await searchLocations(query, { limit: 5 });
    return suggestions.map((suggestion) => ({
      ...suggestion,
      name: suggestion.city || suggestion.display || suggestion.name,
      subtitle: suggestion.name,
      display: formatLocationLabel(suggestion),
    }));
  }, []);

  const handleLocationSelect = (field, suggestion) => {
    handleInputChange(field, formatLocationLabel(suggestion));
  };

  return (
    <div className="h-screen w-full font-sans overflow-hidden fixed inset-0" onClick={(e) => { if (e.target === e.currentTarget) handleBackgroundTap(); }}>
      {/* Blurred Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: (lifestyleImages && lifestyleImages.length > 0)
            ? `url(${lifestyleImages[currentLifestyleImageIndex]})`
            : "url('/bgs/bg-profile.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Content Layer */}
      <div className="relative h-full w-full flex flex-col">
        {/* Top Bar (FIXED) */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4">
          <div style={{ width: 40 }}></div>
          <div className="text-white text-xl font-semibold">Profile</div>
          {editingSection ? (
            <button
              onClick={handleCancelEdit}
              className="text-white/80 text-sm hover:text-white transition"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
            >
              <img src="/settings.svg" alt="Settings" className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Scrollable CARD WRAPPER */}
        <div className="px-4 pb-20 h-[calc(100vh-120px)]">
          <div className="bg-white/1 backdrop-blur-2xl rounded-3xl p-5 pb-8 border border-white/20 shadow-lg h-full overflow-y-auto" style={{ backdropFilter: 'blur(60px) saturate(150%)' }}>

            {/* --- ALL YOUR ORIGINAL CONTENT BELOW --- */}

            {loading && <div className="text-center text-white mt-8">Loading...</div>}
            {error && <div className="text-red-400 text-center mt-8">{error}</div>}

            {/* Profile Header */}
            {editingSection === 'header' ? (
              // Edit Mode
              <div className="mb-6">
                {/* Profile Picture with Edit Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/50">
                      {userInfo?.profilePicUrl ? (
                        <img src={userInfo.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/30"></div>
                      )}
                    </div>
                    <button 
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center border-2 border-white hover:bg-white transition cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Nickname */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Nickname</label>
                    <input
                      type="text"
                      value={editFormData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Alex"
                    />
                  </div>

                  {/* Age - Disabled */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Age</label>
                    <input
                      type="text"
                      value={editFormData.dob || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Height - Disabled */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Height</label>
                    <input
                      type="text"
                      value={editFormData.height || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Info Text */}
                  <div className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                    <svg className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/70 text-xs">Some details (like Name, age, & height) are fixed and cannot be changed.</span>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Gender</label>
                    <select
                      value={editFormData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="Male" className="bg-gray-800 text-white">Male</option>
                      <option value="Female" className="bg-gray-800 text-white">Female</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Job title</label>
                    <input
                      type="text"
                      value={editFormData.jobTitle || ''}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Director"
                    />
                  </div>

                  {/* Current Relationship */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Current relationship</label>
                    <select
                      value={editFormData.relationshipStatus || ''}
                      onChange={(e) => handleInputChange('relationshipStatus', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="Single" className="bg-gray-800 text-white">Single</option>
                      <option value="Divorced" className="bg-gray-800 text-white">Divorced</option>
                      <option value="Separated" className="bg-gray-800 text-white">Separated</option>
                      <option value="Widowed" className="bg-gray-800 text-white">Widowed</option>
                      <option value="Complicated" className="bg-gray-800 text-white">It's Complicated</option>
                    </select>
                  </div>

                  {/* Currently Living */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Currently living</label>
                    <AutocompleteInput
                      value={editFormData.fromLocation || ''}
                      onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                      onSelect={(suggestion) => handleLocationSelect('fromLocation', suggestion)}
                      placeholder="Bandra, Mumbai"
                      searchFn={searchLocationSuggestions}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      showImage={false}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">City</label>
                    <AutocompleteInput
                      value={editFormData.currentLocation || ''}
                      onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                      onSelect={(suggestion) => handleLocationSelect('currentLocation', suggestion)}
                      placeholder="HSR, Bangalore"
                      searchFn={searchLocationSuggestions}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      showImage={false}
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                  >
                    Save changes
                  </button>
                </div>

                {/* Hidden File Input for Profile Photo */}
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              // View Mode
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50">
                    {userInfo?.profilePicUrl ? (
                      <img src={userInfo.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/30"></div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-lg font-semibold">
                        {userInfo?.firstName || ''}, {userInfo?.dob ? getAge(userInfo.dob) : ''}
                      </div>
                      <div className="text-white/70 text-sm">
                        {userInfo?.intent?.profileQuestions?.jobTitle || 'Not specified'}
                      </div>
                      <div className="text-white/60 text-xs">
                        {userInfo?.fromLocation || userInfo?.currentLocation || ''}
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditClick('header')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Info Icons */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileMale.svg" alt="Gender" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.gender || 'Gender'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 40 39" fill="none">
                    <rect width="39.6947" height="38.7431" rx="19.3716" fill="white" fill-opacity="0.1"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M19.9372 11.0394C18.9822 11.1564 18.0772 11.4954 17.6952 11.8094C15.4672 13.6514 14.2092 16.0864 13.5562 18.2094C13.275 19.1088 13.0867 20.0347 12.9942 20.9724C12.9602 21.3554 12.9292 21.7564 12.9872 22.1394C13.3702 22.5734 13.9122 22.8884 14.4152 23.1584C15.4662 23.7234 17.0452 24.3094 19.1682 24.5454C20.3702 24.6794 21.8882 24.7554 23.2882 24.6434C24.7412 24.5264 25.8552 24.2214 26.4332 23.7584C27.4072 22.9794 27.6532 22.0704 27.5642 21.2744C27.4692 20.4184 26.9882 19.6944 26.5042 19.3714C25.6692 18.8154 24.7292 18.7594 23.8432 18.9914C22.9312 19.2314 22.1822 19.7514 21.8282 20.1774C21.7394 20.2846 21.6292 20.372 21.5046 20.4342C21.3801 20.4963 21.2439 20.5317 21.1049 20.5382C20.9659 20.5447 20.827 20.5221 20.6973 20.4719C20.5675 20.4216 20.4496 20.3448 20.3512 20.2464C19.8012 19.6964 18.8662 19.5364 17.6132 20.3714C17.4765 20.4627 17.3194 20.5189 17.1558 20.535C16.9922 20.5511 16.8272 20.5266 16.6753 20.4637C16.5234 20.4009 16.3894 20.3015 16.2851 20.1745C16.1807 20.0474 16.1093 19.8966 16.0772 19.7354C15.7912 18.3014 15.9402 16.7774 16.2042 15.5204C16.4702 14.2614 16.8702 13.1784 17.1642 12.5924C17.2473 12.4266 17.375 12.2871 17.5328 12.1896C17.6907 12.0921 17.8726 12.0405 18.0582 12.0405C18.2437 12.0405 18.4256 12.0921 18.5835 12.1896C18.7414 12.2871 18.869 12.4266 18.9522 12.5924C19.1552 12.9964 19.5262 13.3584 19.9582 13.5104C20.2932 13.2994 20.5842 13.0044 20.8202 12.6894C21.2542 12.1114 21.3992 11.5644 21.2062 11.0814C20.8142 10.9414 20.3402 10.9904 19.9372 11.0394ZM21.4202 9.07544C21.9042 9.16844 22.6112 9.41044 22.9522 10.0924C23.6992 11.5864 23.0822 13.0064 22.4202 13.8894C21.9882 14.4654 21.4322 15.0074 20.7852 15.3394C20.6502 15.4094 20.3752 15.5394 20.0582 15.5394C19.4672 15.5394 18.8882 15.2704 18.4132 14.9344C18.3232 15.2404 18.2362 15.5764 18.1612 15.9324C18.0129 16.6155 17.9325 17.3116 17.9212 18.0104C18.9742 17.6704 20.0512 17.7064 20.9792 18.2304C21.6766 17.6828 22.4787 17.2836 23.3362 17.0574C24.6362 16.7164 26.1962 16.7634 27.6132 17.7074C28.6282 18.3844 29.3972 19.6594 29.5522 21.0544C29.7142 22.5084 29.2092 24.0984 27.6822 25.3204C26.6042 26.1824 24.9612 26.5154 23.4492 26.6364C21.8842 26.7624 20.2312 26.6764 18.9482 26.5334C16.5702 26.2694 14.7442 25.6054 13.4682 24.9204C12.6312 24.4704 11.4862 23.8484 11.1232 22.8954C10.8782 22.2494 10.9422 21.4654 11.0022 20.7934C11.0822 19.9124 11.2782 18.8124 11.6452 17.6204C12.3772 15.2414 13.8102 12.4264 16.4212 10.2684C17.2242 9.60444 18.5682 9.19244 19.6932 9.05444C20.2732 8.98344 20.8832 8.97344 21.4202 9.07544Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.fitnessLevel || 'Fitness'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileRelationship.svg" alt="Relationship" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1">{userInfo?.relationshipStatus || 'Status'}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileOriginalLocation.svg" alt="From Location" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1 max-w-[60px] truncate text-center">
                  {userInfo?.fromLocation || 'From'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <img src="/profileLocation.svg" alt="Current Location" className="w-6 h-6" />
                </div>
                <span className="text-white/80 text-[10px] mt-1 truncate max-w-[60px] text-center">
                  {userInfo?.currentLocation || 'Current'}
                </span>
              </div>
            </div>

            {/* Lifestyle Pictures */}
            {editingSection === 'lifestyleImages' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {editFormData.lifestyleImages?.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/10">
                      <img src={img} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveLifestyleImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Button */}
                  {editFormData.lifestyleImages?.length < 6 && (
                    <label className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-dashed border-white/30 cursor-pointer hover:bg-white/15 transition">
                      <span className="text-white text-3xl mb-1">+</span>
                      <span className="text-white/70 text-xs text-center px-2">Add more photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddLifestyleImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Lifestyle Pictures</h3>
                  <button
                    onClick={() => handleEditClick('lifestyleImages')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                  <div className="grid grid-cols-3 gap-2">
                    {lifestyleImages.slice(0, 5).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                        <img src={img} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {lifestyleImages.length < 5 && (
                      <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-dashed border-white/30">
                        <span className="text-white/50 text-xs">+ Add more photos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bio */}
            {editingSection === 'bio' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Bio</h3>
                </div>

                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50 min-h-[120px] resize-none"
                  placeholder="Write something about yourself..."
                  rows={5}
                />

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              userInfo?.intent?.bio && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Bio</h3>
                    <button
                      onClick={() => handleEditClick('bio')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <p className="text-white/90 text-sm leading-relaxed">{userInfo.intent.bio}</p>
                  </div>
                </div>
              )
            )}

            {/* Work & Education */}
            {editingSection === 'work' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Work & Education</h3>
                </div>

                <div className="space-y-4">
                  {/* Job Title */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Job Title</label>
                    <input
                      type="text"
                      value={editFormData.jobTitle || ''}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Product Designer"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Company</label>
                    <input
                      type="text"
                      value={editFormData.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Frick"
                    />
                  </div>

                  {/* School / College / University Name */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">School / College / University Name</label>
                    <input
                      type="text"
                      value={editFormData.school || ''}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      placeholder="Ex, NID Bangalore"
                    />
                  </div>

                  {/* Level of Education - Dropdown */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Level of Education</label>
                    <select
                      value={editFormData.educationLevel || ''}
                      onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select level</option>
                      <option value="High School" className="bg-gray-800 text-white">High School</option>
                      <option value="Undergraduate" className="bg-gray-800 text-white">Undergraduate</option>
                      <option value="Postgraduate" className="bg-gray-800 text-white">Postgraduate</option>
                      <option value="Doctorate" className="bg-gray-800 text-white">Doctorate</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  {/* Add Work Button */}
                  <button className="w-full py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/20 transition flex items-center justify-center gap-2">
                    <span>Add Work</span>
                    <span className="text-xl">+</span>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            ) : (
              (userInfo?.intent?.profileQuestions?.jobTitle || userInfo?.intent?.profileQuestions?.education) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Work & Education</h3>
                    <button
                      onClick={() => handleEditClick('work')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-3">
                    {userInfo?.intent?.profileQuestions?.jobTitle && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                          <img src="/profileWork.svg" alt="Work" className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.jobTitle}</div>
                          {userInfo?.intent?.profileQuestions?.companyName && (
                            <div className="text-white/70 text-xs">{userInfo.intent.profileQuestions.companyName}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {userInfo?.intent?.profileQuestions?.education && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                          <img src="/profileEducation.svg" alt="Education" className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.education}</div>
                          {userInfo?.intent?.profileQuestions?.educationLevel && (
                            <div className="text-white/70 text-xs">{userInfo.intent.profileQuestions.educationLevel}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Personal Photos */}
            {editingSection === 'personal' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {editFormData.personalPhotos?.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/10">
                      <img src={photo} alt={`Personal ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePersonalPhoto(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Button */}
                  {editFormData.personalPhotos?.length < 6 && (
                    <label className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-dashed border-white/30 cursor-pointer hover:bg-white/15 transition">
                      <span className="text-white text-3xl mb-1">+</span>
                      <span className="text-white/70 text-xs text-center px-2">Add more photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddPersonalPhoto}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-6"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Personal Photos</h3>
                  <button
                    onClick={() => handleEditClick('personal')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                  <div className="grid grid-cols-3 gap-2">
                    {userInfo?.facePhotos && userInfo.facePhotos.length > 0 ? (
                      userInfo.facePhotos.map((photo, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-white/10">
                          <img src={photo} alt={`Personal ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <>
                        {[...Array(3)].map((_, idx) => (
                          <div key={idx} className="aspect-square rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-dashed border-white/30">
                            <span className="text-white/50 text-xs">+ Add photo</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interests */}
            {editingSection === 'interests' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-3">Interests</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {editFormData.interests?.map((interest, idx) => (
                    <div key={idx} className="relative px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 pr-8">
                      <span className="text-white text-xs font-medium">{interest}</span>
                      <button
                        onClick={() => handleRemoveInterest(idx)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Interest */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={editFormData.newInterest || ''}
                    onChange={(e) => handleInputChange('newInterest', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                    placeholder="Add an interest"
                    className="flex-1 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50"
                  />
                  <button
                    onClick={handleAddInterest}
                    className="px-4 py-2.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/40 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                >
                  Save changes
                </button>
              </div>
            ) : (
              // View Mode
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-base font-semibold">Interests</h3>
                  <button
                    onClick={() => handleEditClick('interests')}
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {userInfo?.interests && userInfo.interests.length > 0 ? (
                    userInfo.interests.map((interest, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                        <span className="text-white text-xs font-medium">{interest}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/50 text-sm">No interests added yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Entertainment */}
            {editingSection === 'entertainment' ? (
              // Edit Mode
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-base font-semibold">Entertainment</h3>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="text-white/70 text-sm hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>

                <div className="backdrop-blur-[25px] bg-white/10 rounded-2xl p-4 border border-white/20 space-y-6 shadow-[inset_0px_0px_60px_20px_rgba(255,255,255,0.15)]">
                  {/* Watchlist */}
                  <div>
                    <div className="text-white text-sm font-medium mb-3">Watchlist</div>
                    <div className="flex flex-col gap-3 mb-3">
                      {editFormData.watchList?.map((item, idx) => {
                        const itemName = typeof item === 'object' ? item.name : item;
                        const itemSubtitle = typeof item === 'object' ? item.subtitle : null;
                        const itemImage = typeof item === 'object' ? item.image : null;
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            {itemImage ? (
                              <img src={itemImage} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} onError={(e) => { e.target.style.opacity = '0.3'; }} />
                            ) : (
                              <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{itemName}</div>
                              {itemSubtitle && <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>}
                            </div>
                            <button type="button" onClick={() => handleRemoveEntertainmentItem('watchList', idx)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white" aria-label={`Remove ${itemName}`}>×</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <AutocompleteInput
                        value={editFormData.newWatchList || ''}
                        onChange={e => handleInputChange('newWatchList', e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editFormData.newWatchList?.trim()) {
                            e.preventDefault();
                            handleAddEntertainmentItem('watchList', { name: editFormData.newWatchList.trim(), display: editFormData.newWatchList.trim() });
                            handleInputChange('newWatchList', '');
                          }
                        }}
                        onSelect={(selected) => { handleAddEntertainmentItem('watchList', selected); handleInputChange('newWatchList', ''); }}
                        searchFn={searchMoviesAndShows}
                        placeholder="Search movies or TV shows..."
                        className="flex-1 rounded-xl p-3 text-base"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (editFormData.newWatchList?.trim()) { handleAddEntertainmentItem('watchList', { name: editFormData.newWatchList.trim(), display: editFormData.newWatchList.trim() }); handleInputChange('newWatchList', ''); } }}
                        disabled={!editFormData.newWatchList?.trim()}
                        className="px-5 py-3 rounded-xl font-medium text-sm"
                        style={editFormData.newWatchList?.trim() ? { background: 'white', color: 'black' } : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                      >Add</button>
                    </div>
                  </div>

                  {/* TV Shows */}
                  <div>
                    <div className="text-white text-sm font-medium mb-3">TV Shows</div>
                    <div className="flex flex-col gap-3 mb-3">
                      {editFormData.tvShows?.map((show, idx) => {
                        const itemName = typeof show === 'object' ? show.name : show;
                        const itemSubtitle = typeof show === 'object' ? show.subtitle : null;
                        const itemImage = typeof show === 'object' ? show.image : null;
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            {itemImage ? (
                              <img src={itemImage} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} onError={(e) => { e.target.style.opacity = '0.3'; }} />
                            ) : (
                              <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{itemName}</div>
                              {itemSubtitle && <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>}
                            </div>
                            <button type="button" onClick={() => handleRemoveEntertainmentItem('tvShows', idx)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white" aria-label={`Remove ${itemName}`}>×</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <AutocompleteInput
                        value={editFormData.newTvShow || ''}
                        onChange={e => handleInputChange('newTvShow', e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editFormData.newTvShow?.trim()) {
                            e.preventDefault();
                            handleAddEntertainmentItem('tvShows', { name: editFormData.newTvShow.trim(), display: editFormData.newTvShow.trim() });
                            handleInputChange('newTvShow', '');
                          }
                        }}
                        onSelect={(selected) => { handleAddEntertainmentItem('tvShows', selected); handleInputChange('newTvShow', ''); }}
                        searchFn={searchTVShows}
                        placeholder="e.g. The Office"
                        className="flex-1 rounded-xl p-3 text-base"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (editFormData.newTvShow?.trim()) { handleAddEntertainmentItem('tvShows', { name: editFormData.newTvShow.trim(), display: editFormData.newTvShow.trim() }); handleInputChange('newTvShow', ''); } }}
                        disabled={!editFormData.newTvShow?.trim()}
                        className="px-5 py-3 rounded-xl font-medium text-sm"
                        style={editFormData.newTvShow?.trim() ? { background: 'white', color: 'black' } : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                      >Add</button>
                    </div>
                  </div>

                  {/* Movies */}
                  <div>
                    <div className="text-white text-sm font-medium mb-3">Movies</div>
                    <div className="flex flex-col gap-3 mb-3">
                      {editFormData.movies?.map((movie, idx) => {
                        const itemName = typeof movie === 'object' ? movie.name : movie;
                        const itemSubtitle = typeof movie === 'object' ? movie.subtitle : null;
                        const itemImage = typeof movie === 'object' ? movie.image : null;
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            {itemImage ? (
                              <img src={itemImage} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} onError={(e) => { e.target.style.opacity = '0.3'; }} />
                            ) : (
                              <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{itemName}</div>
                              {itemSubtitle && <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>}
                            </div>
                            <button type="button" onClick={() => handleRemoveEntertainmentItem('movies', idx)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white" aria-label={`Remove ${itemName}`}>×</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <AutocompleteInput
                        value={editFormData.newMovie || ''}
                        onChange={e => handleInputChange('newMovie', e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editFormData.newMovie?.trim()) {
                            e.preventDefault();
                            handleAddEntertainmentItem('movies', { name: editFormData.newMovie.trim(), display: editFormData.newMovie.trim() });
                            handleInputChange('newMovie', '');
                          }
                        }}
                        onSelect={(selected) => { handleAddEntertainmentItem('movies', selected); handleInputChange('newMovie', ''); }}
                        searchFn={searchMovies}
                        placeholder="e.g. The Godfather"
                        className="flex-1 rounded-xl p-3 text-base"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (editFormData.newMovie?.trim()) { handleAddEntertainmentItem('movies', { name: editFormData.newMovie.trim(), display: editFormData.newMovie.trim() }); handleInputChange('newMovie', ''); } }}
                        disabled={!editFormData.newMovie?.trim()}
                        className="px-5 py-3 rounded-xl font-medium text-sm"
                        style={editFormData.newMovie?.trim() ? { background: 'white', color: 'black' } : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                      >Add</button>
                    </div>
                  </div>

                  {/* Artists/Bands */}
                  <div>
                    <div className="text-white text-sm font-medium mb-3">Tunes</div>
                    <div className="flex flex-col gap-3 mb-3">
                      {editFormData.artistsBands?.map((artist, idx) => {
                        const itemName = typeof artist === 'object' ? artist.name : artist;
                        const itemSubtitle = typeof artist === 'object' ? artist.subtitle : null;
                        const itemImage = typeof artist === 'object' ? artist.image : null;
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            {itemImage ? (
                              <img src={itemImage} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} onError={(e) => { e.target.style.opacity = '0.3'; }} />
                            ) : (
                              <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-medium truncate">{itemName}</div>
                              {itemSubtitle && <div className="text-white/60 text-xs truncate">{itemSubtitle}</div>}
                            </div>
                            <button type="button" onClick={() => handleRemoveEntertainmentItem('artistsBands', idx)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white" aria-label={`Remove ${itemName}`}>×</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <AutocompleteInput
                        value={editFormData.newArtist || ''}
                        onChange={e => handleInputChange('newArtist', e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && editFormData.newArtist?.trim()) {
                            e.preventDefault();
                            handleAddEntertainmentItem('artistsBands', { name: editFormData.newArtist.trim(), display: editFormData.newArtist.trim() });
                            handleInputChange('newArtist', '');
                          }
                        }}
                        onSelect={(selected) => { handleAddEntertainmentItem('artistsBands', selected); handleInputChange('newArtist', ''); }}
                        searchFn={searchArtists}
                        placeholder="Add an artist/band..."
                        className="flex-1 rounded-xl p-3 text-base"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (editFormData.newArtist?.trim()) { handleAddEntertainmentItem('artistsBands', { name: editFormData.newArtist.trim(), display: editFormData.newArtist.trim() }); handleInputChange('newArtist', ''); } }}
                        disabled={!editFormData.newArtist?.trim()}
                        className="px-5 py-3 rounded-xl font-medium text-sm"
                        style={editFormData.newArtist?.trim() ? { background: 'white', color: 'black' } : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                      >Add</button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.intent?.watchList?.length > 0 || userInfo?.intent?.tvShows?.length > 0 || userInfo?.intent?.movies?.length > 0 || userInfo?.intent?.artistsBands?.length > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Entertainment</h3>
                    <button
                      onClick={() => handleEditClick('entertainment')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    {/* Watchlist */}
                    {userInfo?.intent?.watchList && userInfo.intent.watchList.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-sm font-medium mb-2">Watchlist</div>
                        <div className="flex flex-col">
                          {userInfo.intent.watchList.map((item, idx) => (
                            <MediaItemCard
                              key={idx}
                              type={item.first_air_date ? 'tv' : 'movie'}
                              item={item}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TV Shows */}
                    {userInfo?.intent?.tvShows && userInfo.intent.tvShows.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-sm font-medium mb-2">TV Shows</div>
                        <div className="flex flex-col">
                          {userInfo.intent.tvShows.map((show, idx) => (
                            <MediaItemCard
                              key={idx}
                              type="tv"
                              item={show}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Movies */}
                    {userInfo?.intent?.movies && userInfo.intent.movies.length > 0 && (
                      <div className="mb-4">
                        <div className="text-white/70 text-sm font-medium mb-2">Movies</div>
                        <div className="flex flex-col">
                          {userInfo.intent.movies.map((movie, idx) => (
                            <MediaItemCard
                              key={idx}
                              type="movie"
                              item={movie}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artists/Bands */}
                    {userInfo?.intent?.artistsBands && userInfo.intent.artistsBands.length > 0 && (
                      <div>
                        <div className="text-white/70 text-sm font-medium mb-2">Tunes</div>
                        <div className="flex flex-col">
                          {userInfo.intent.artistsBands.map((artist, idx) => (
                            <MediaItemCard
                              key={idx}
                              type="artist"
                              item={artist}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Lifestyle */}
            {editingSection === 'lifestyle' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Lifestyle</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* Pet Preference */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Pet Preference</label>
                    <select
                      value={editFormData.pets || ''}
                      onChange={(e) => handleInputChange('pets', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Dog Lover" className="bg-gray-800 text-white">Dog Lover</option>
                      <option value="Cat Lover" className="bg-gray-800 text-white">Cat Lover</option>
                      <option value="Pet-free" className="bg-gray-800 text-white">Pet-free</option>
                      <option value="All the Pets" className="bg-gray-800 text-white">All the Pets</option>
                      <option value="Want a Pet" className="bg-gray-800 text-white">Want a Pet</option>
                      <option value="Allergic to Pets" className="bg-gray-800 text-white">Allergic to Pets</option>
                    </select>
                  </div>

                  {/* Food Preference */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Food Preference</label>
                    <select
                      value={editFormData.foodPreference || ''}
                      onChange={(e) => handleInputChange('foodPreference', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Vegetarian" className="bg-gray-800 text-white">Vegetarian</option>
                      <option value="Vegan" className="bg-gray-800 text-white">Vegan</option>
                      <option value="Non-vegetarian" className="bg-gray-800 text-white">Non-vegetarian</option>
                      <option value="Eggetarian" className="bg-gray-800 text-white">Eggetarian</option>
                      <option value="Jain" className="bg-gray-800 text-white">Jain</option>
                      <option value="Halal" className="bg-gray-800 text-white">Halal</option>
                      <option value="Kosher" className="bg-gray-800 text-white">Kosher</option>
                    </select>
                  </div>

                  {/* Morning/Night Person */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Morning/Night Person</label>
                    <select
                      value={editFormData.sleepSchedule || ''}
                      onChange={(e) => handleInputChange('sleepSchedule', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select schedule</option>
                      <option value="Early Bird" className="bg-gray-800 text-white">Early Bird</option>
                      <option value="Night Owl" className="bg-gray-800 text-white">Night Owl</option>
                      <option value="In Between" className="bg-gray-800 text-white">In Between</option>
                    </select>
                  </div>

                  {/* Drinking */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Drinking</label>
                    <select
                      value={editFormData.drinking || ''}
                      onChange={(e) => handleInputChange('drinking', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Yes" className="bg-gray-800 text-white">Yes</option>
                      <option value="No" className="bg-gray-800 text-white">No</option>
                      <option value="Socially" className="bg-gray-800 text-white">Socially</option>
                      <option value="Occasionally" className="bg-gray-800 text-white">Occasionally</option>
                      <option value="Trying to Quit" className="bg-gray-800 text-white">Trying to Quit</option>
                    </select>
                  </div>

                  {/* Smoking */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Smoking</label>
                    <select
                      value={editFormData.smoking || ''}
                      onChange={(e) => handleInputChange('smoking', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Yes" className="bg-gray-800 text-white">Yes</option>
                      <option value="No" className="bg-gray-800 text-white">No</option>
                      <option value="Socially" className="bg-gray-800 text-white">Socially</option>
                      <option value="Occasionally" className="bg-gray-800 text-white">Occasionally</option>
                      <option value="Trying to Quit" className="bg-gray-800 text-white">Trying to Quit</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.pets || userInfo?.foodPreference || userInfo?.intent?.profileQuestions?.sleepSchedule || userInfo?.drinking || userInfo?.smoking) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Lifestyle</h3>
                    <button
                      onClick={() => handleEditClick('lifestyle')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.pets && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profilePetPreference.svg" alt="Pet Preference" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Pet Preference</div>
                            <div className="text-white font-medium text-sm">{userInfo.pets}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.foodPreference && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileFoodPreference.svg" alt="Food Preference" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Food Preference</div>
                            <div className="text-white font-medium text-sm">{userInfo.foodPreference}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.sleepSchedule && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileMorningPerson.svg" alt="Morning/Night Person" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Morning/Night Person</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.sleepSchedule}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.drinking && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileDrinking.svg" alt="Drinking" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Drinking</div>
                            <div className="text-white font-medium text-sm">{userInfo.drinking}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.smoking && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileSmoking.svg" alt="Smoking" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Smoking</div>
                            <div className="text-white font-medium text-sm">{userInfo.smoking}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Personality & Social Style */}
            {editingSection === 'personality' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Personality & Social Style</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* When the Bill Arrives */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">When the Bill Arrives</label>
                    <select
                      value={editFormData.dateBill || ''}
                      onChange={(e) => handleInputChange('dateBill', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Split the bill" className="bg-gray-800 text-white">Split the bill</option>
                      <option value="I'll pay" className="bg-gray-800 text-white">I'll pay</option>
                      <option value="Treat me" className="bg-gray-800 text-white">Treat me</option>
                      <option value="We'll figure it out" className="bg-gray-800 text-white">We'll figure it out</option>
                    </select>
                  </div>

                  {/* What I look for in a relationship */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">What I look for in a relationship</label>
                    <input
                      type="text"
                      value={editFormData.relationshipValues || ''}
                      onChange={(e) => handleInputChange('relationshipValues', e.target.value)}
                      placeholder="e.g., Trust, Communication, Adventure"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              (userInfo?.intent?.profileQuestions?.dateBill || userInfo?.intent?.profileQuestions?.relationshipValues || userInfo?.intent?.profileQuestions?.livingSituation) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Personality & Social Style</h3>
                    <button
                      onClick={() => handleEditClick('personality')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.intent?.profileQuestions?.dateBill && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileBill.svg" alt="Bill" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">When the Bill Arrives</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.dateBill}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.relationshipValues && userInfo.intent.profileQuestions.relationshipValues.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileLook.svg" alt="Relationship Values" className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white/70 text-xs mb-1">What I look for in a relationship</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.relationshipValues.join(', ')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Deep Dive */}
            {editingSection === 'deepDive' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-4">Deep Dive</h3>

                <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 space-y-4">
                  {/* Favorite Destination */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Favorite Destination</label>
                    <input
                      type="text"
                      value={editFormData.favouriteTravelDestination || ''}
                      onChange={(e) => handleInputChange('favouriteTravelDestination', e.target.value)}
                      placeholder="e.g., Paris, Bali, Tokyo"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                    />
                  </div>

                  {/* Thoughts on Kids */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Thoughts on Kids</label>
                    <select
                      value={editFormData.kidsPreference || ''}
                      onChange={(e) => handleInputChange('kidsPreference', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select preference</option>
                      <option value="Want kids" className="bg-gray-800 text-white">Want kids</option>
                      <option value="Don't want kids" className="bg-gray-800 text-white">Don't want kids</option>
                      <option value="Have kids" className="bg-gray-800 text-white">Have kids</option>
                      <option value="Open to kids" className="bg-gray-800 text-white">Open to kids</option>
                      <option value="Not sure yet" className="bg-gray-800 text-white">Not sure yet</option>
                    </select>
                  </div>

                  {/* Religious Level */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Religious Level</label>
                    <select
                      value={editFormData.religiousLevel || ''}
                      onChange={(e) => handleInputChange('religiousLevel', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select level</option>
                      <option value="Very Religious" className="bg-gray-800 text-white">Very Religious</option>
                      <option value="Religious" className="bg-gray-800 text-white">Religious</option>
                      <option value="Spiritual" className="bg-gray-800 text-white">Spiritual</option>
                      <option value="Not Religious" className="bg-gray-800 text-white">Not Religious</option>
                      <option value="Atheist" className="bg-gray-800 text-white">Atheist</option>
                      <option value="Agnostic" className="bg-gray-800 text-white">Agnostic</option>
                    </select>
                  </div>

                  {/* Religion */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Religion</label>
                    <select
                      value={editFormData.religion || ''}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select religion</option>
                      <option value="Hindu" className="bg-gray-800 text-white">Hindu</option>
                      <option value="Muslim" className="bg-gray-800 text-white">Muslim</option>
                      <option value="Christian" className="bg-gray-800 text-white">Christian</option>
                      <option value="Sikh" className="bg-gray-800 text-white">Sikh</option>
                      <option value="Buddhist" className="bg-gray-800 text-white">Buddhist</option>
                      <option value="Jain" className="bg-gray-800 text-white">Jain</option>
                      <option value="Jewish" className="bg-gray-800 text-white">Jewish</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                      <option value="Prefer not to say" className="bg-gray-800 text-white">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Living Situation */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Living Situation</label>
                    <select
                      value={editFormData.livingSituation || ''}
                      onChange={(e) => handleInputChange('livingSituation', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white focus:outline-none focus:border-white/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" className="bg-gray-800 text-white">Select situation</option>
                      <option value="Live alone" className="bg-gray-800 text-white">Live alone</option>
                      <option value="Live with roommates" className="bg-gray-800 text-white">Live with roommates</option>
                      <option value="Live with parents" className="bg-gray-800 text-white">Live with parents</option>
                      <option value="Live with family" className="bg-gray-800 text-white">Live with family</option>
                      <option value="Own place" className="bg-gray-800 text-white">Own place</option>
                    </select>
                  </div>

                  {/* Favorite Café */}
                  <div>
                    <label className="text-white/70 text-xs mb-1 block">Favorite Café or Restaurant</label>
                    <textarea
                      placeholder="E.g., 'Starbucks downtown' or 'The local Italian café'"
                      value={editFormData.favoriteCafe || ''}
                      onChange={(e) => handleInputChange('favoriteCafe', e.target.value)}
                      maxLength={200}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/50 resize-none"
                      rows="3"
                    />
                    <p className="text-white/50 text-xs text-right mt-1">{(editFormData.favoriteCafe || '').length}/200</p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition mt-4"
                >
                  Save changes
                </button>
              </div>
            ) : (
              ((Array.isArray(userInfo?.favouriteTravelDestination) && userInfo.favouriteTravelDestination.length > 0) ||
                userInfo?.kidsPreference ||
                userInfo?.religiousLevel ||
                userInfo?.intent?.profileQuestions?.livingSituation ||
                userInfo?.favoriteCafe) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Deep Dive</h3>
                    <button
                      onClick={() => handleEditClick('deepDive')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30">
                    <div className="space-y-3">
                      {userInfo?.favouriteTravelDestination && Array.isArray(userInfo.favouriteTravelDestination) && userInfo.favouriteTravelDestination.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileFavDestination.svg" alt="Destination" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Favorite Destination</div>
                            <div className="text-white font-medium text-sm">
                              {userInfo.favouriteTravelDestination.map((dest, idx) => (
                                <span key={dest.id || idx}>
                                  {dest.name}
                                  {dest.details && ` - ${dest.details}`}
                                  {idx < userInfo.favouriteTravelDestination.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {userInfo?.kidsPreference && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileKids.svg" alt="Kids" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Thoughts on Kids</div>
                            <div className="text-white font-medium text-sm">{userInfo.kidsPreference}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.religiousLevel && userInfo?.intent?.profileQuestions?.religion && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileReligiousView.svg" alt="Religious View" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Religious View</div>
                            <div className="text-white font-medium text-sm">{userInfo.religiousLevel} {userInfo.intent.profileQuestions.religion}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.intent?.profileQuestions?.livingSituation && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <img src="/profileLivingSituation.svg" alt="Living Situation" className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Living Situation</div>
                            <div className="text-white font-medium text-sm">{userInfo.intent.profileQuestions.livingSituation}</div>
                          </div>
                        </div>
                      )}

                      {userInfo?.favoriteCafe && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                            <span className="text-base">☕</span>
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">Favorite Café or Restaurant</div>
                            <div className="text-white font-medium text-sm">{userInfo.favoriteCafe}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Languages */}
            {editingSection === 'languages' ? (
              // Edit Mode
              <div className="mb-6">
                <h3 className="text-white text-base font-semibold mb-3">Languages</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {editFormData.languages?.map((language, idx) => (
                    <div key={idx} className="relative px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 pr-8">
                      <span className="text-white text-xs font-medium">{language}</span>
                      <button
                        onClick={() => handleRemoveLanguage(idx)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Language */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={editFormData.newLanguage || ''}
                    onChange={(e) => handleInputChange('newLanguage', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                    placeholder="Add a language"
                    className="flex-1 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50"
                  />
                  <button
                    onClick={handleAddLanguage}
                    className="px-4 py-2.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/30 text-white hover:bg-white/40 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition"
                >
                  Save changes
                </button>
              </div>
            ) : (
              userInfo?.intent?.profileQuestions?.languages && userInfo.intent.profileQuestions.languages.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-base font-semibold">Languages</h3>
                    <button
                      onClick={() => handleEditClick('languages')}
                      className="text-white/80 text-sm hover:text-white transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userInfo.intent.profileQuestions.languages.map((language, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                        <span className="text-white text-xs font-medium">{language}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 