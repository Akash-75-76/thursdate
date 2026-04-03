# Sundate Onboarding Flow - Complete Field Mapping

## Overview
The onboarding process is divided into **7 major stages**, each collecting specific user information. Users move through these sequentially until reaching `onboarding_complete = true` and `approval = true`.

---

## Stage 1: Authentication
**Path:** `/signup` → `/verification`  
**Status:** Creates user account with unauthenticated entry  
**Fields Collected:**

### Signup.jsx
- ✅ **Email** (required)
- ✅ **Email OTP** (6-digit verification code)

### Verification.jsx
- ✅ **Phone Number** (10 digits)
- ✅ **Phone OTP** (6-digit verification code)

**Backend:** User record created with `approval = false`, `onboarding_complete = false`

---

## Stage 2: Personal Details (UserInfo.jsx)
**Path:** `/user-info`  
**Steps:** ~6 steps collected across multiple screens  
**User State:** `onboarding_current_step = 1`  
**Fields Collected:**

### Personal Information
- ✅ **First Name** (text)
- ✅ **Last Name** (text)
- ✅ **Gender** (Male/Female/Non-binary/Other + custom text option)
- ✅ **Date of Birth** (date picker: MM/DD/YYYY)

### Location Details
- ✅ **Current Location** (from location/autocomplete service) → extractCity() for city field
- ✅ **From Location** (hometown/autocomplete)
- ✅ **Favorite Travel Destinations** (array of 3+ locations/strings)
- ✅ **Last Holiday Places** (text field)

### Professional Info
- ✅ **Job Title** (autocomplete from predefined list)
- ✅ **Company Name** (autocomplete)

### Photo(s)
- ✅ **Face Verification Photo** (1 candidate photo for AWS Rekognition verification)

**Saved To:**
```javascript
UPDATE users SET
  first_name, last_name, gender, dob,
  current_location, city, from_location,
  favourite_travel_destination (JSON),
  last_holiday_places,
  profile_pic_url,
  face_photo_url,
  intent (JSON with profileQuestions),
  onboarding_current_step = 7  // ← Marks UserInfo as complete
WHERE id = ?
```

---

## Stage 3: Profile Photos (ProfilePhotos.jsx)
**Path:** `/profile-photos`  
**Purpose:** Collect multiple personal photos for profile  
**User State:** `onboarding_current_step = 7`  
**Fields Collected:**

- ✅ **Face Photos** (6 slots, can upload faces/lifestyle mixed)
  - Each photo: upload → crop (interactive) → save to Cloudinary
  - Stored as JSON array: `face_photos = ["url1", "url2", ...]`

**Stored As:** `face_photos` (JSON array at root user level)

---

## Stage 4: Lifestyle & Preference Questions (ProfileQuestions.jsx)
**Path:** `/profile-questions`  
**Steps:** 15 multi-step form  
**User State:** Intermediate steps tracked in localStorage  
**Fields Collected:**

### Education & Languages (Steps 1-2)
- ✅ **Education Level** (Dropdown: High School/Bachelor's/Master's/PhD/etc)
- ✅ **Education Detail** (text: school/institution name)
- ✅ **Spoken Languages** (autocomplete multi-select from language list)

### Physical Attributes (Step 3)
- ✅ **Height** (slider 140-220cm OR ft/inches)
  - Stored as: `intent.profileQuestions.height` (number)

### Tech Skills (Steps 4-5)
- ✅ **Can Code?** (yes/no toggle)
- ✅ **Coding Languages** (if yes: multi-select autocomplete)
  - Stored as: `codingLanguages` (JSON array at root level)

### Work & Professional (Step 6)
- ✅ **Job Title** (autocomplete - may already exist from UserInfo)
- ✅ **Company Name** (autocomplete)

### Lifestyle Preferences (Steps 7-14)
- ✅ **Pets** (Dropdown: No pets/Cat lover/Dog lover/Other)
- ✅ **Food Preference** (Dropdown: Vegetarian/Non-vegetarian/Vegan/etc)
- ✅ **Sleep Schedule** (Dropdown: Early bird/Night owl/Variable)
- ✅ **Drinking** (Dropdown: Never/Sometimes/Often/Daily)
- ✅ **Smoking** (Dropdown: Never/Sometimes/Often)
- ✅ **Date Bill** (Dropdown: Split/Man pays/Woman pays/Depends)
- ✅ **Kids Preference** (Dropdown: No/Yes/Unsure)
- ✅ **Religious Level** (Radio: Not religious/Moderately/Deeply)
- ✅ **Religion** (Dropdown: Christian/Muslim/Hindu/etc OR custom text)
- ✅ **Living Situation** (Dropdown with custom option)

### Relationship Values (Step 14)
- ✅ **Relationship Values** (multi-select tags: Honesty/Trust/etc)

### Additional Info (Step 12-derived)
- ✅ **Favorite Café/Restaurant** (text field for favorite hangout)

### Final: Face Photos (Step 15)
- ✅ **Face Photos Again** (upload 6 lifestyle/profile photos - same as ProfilePhotos stage)
  - Gives users another chance to upload complete lifestyle gallery

**Stored To:** `intent.profileQuestions` (JSON) + root level fields
```javascript
intent.profileQuestions = {
  education, educationDetail, languages, height, canCode,
  codingLanguages, jobTitle, companyName, sleepSchedule,
  dateBill, religion, customReligion, favoriteCafe,
  relationshipValues, livingSituation, livingSituationCustom
}

// Also stored at root level for faster access:
pets, drinking, smoking, religiousLevel, kidsPreference,
foodPreference, spokenLanguages, codingLanguages
```

---

## Stage 5: Social Verification (SocialPresence.jsx)
**Path:** `/social-presence`  
**Purpose:** Verify identity via LinkedIn or Driver's License  
**User State:** Requires at least ONE verification method  
**Fields Collected:**

### LinkedIn Verification
- ✅ **LinkedIn OAuth** (click → redirect → callback → verified)
  - Stores: `linkedin_id` (unique LinkedIn profile identifier)

### Driver's License Verification
- ✅ **License Front Photo** (image upload)
- ✅ **License Back Photo** (image upload)
  - Creates record in `driving_license_verifications` table
  - Status: `UNDER_REVIEW` (awaits admin verification)
  - Stores: `license_status = 'pending'`, `license_photos` (JSON)

**Stored To:**
```javascript
// LinkedIn: linkedin_id = <profile_id>
// Driver's License:
driving_license_verifications {
  user_id, front_photo_url, back_photo_url,
  verification_status = 'UNDER_REVIEW',
  submitted_at = NOW()
}
users.license_status = 'pending'
users.license_photos = ["front_url", "back_url"]
```

---

## Stage 6: User Intent & Preferences (UserIntent.jsx)
**Path:** `/user-intent`  
**Steps:** 14 multi-step form  
**User State:** `onboarding_current_step` = varies between steps  
**Fields Collected:**

### Relationship Intent (Steps 1-4)
- ✅ **Purpose** (Dropdown: Dating/Marriage/Friendship/etc)
- ✅ **Relationship Vibe** (Dropdown: Casual/Serious/Exploring/etc)
- ✅ **Interested Gender** (Dropdown: Male/Female/Both/Everyone)
- ✅ **Preferred Age Range** (Range slider: 30-85, 2-value input)
  - Stored as: `intent.preferredAgeRange = [min, max]`

### Self-Presentation (Steps 5-6)
- ✅ **Bio** (text area, max ~500 chars)
  - Can be entered via text OR voice (Speech-to-Text)
  - Audio recognition supported (WebSpeechAPI)
- ✅ **Interests** (multi-select tags: Music/Hiking/Gaming/etc)
  - Autocomplete from predefined interest list

### Entertainment Preferences (Steps 7-9)
- ✅ **TV Shows** (multi-select autocomplete from TMDB)
- ✅ **Movies** (multi-select autocomplete from TMDB)
- ✅ **Watch List** (manual text entries of shows/movies to watch)
- ✅ **Artists & Bands** (multi-select autocomplete from Spotify) 🎤
  - **NEW: Songs** (multi-select from Spotify, shows preview) 🎵
  - With 30-second audio preview playback + play/pause button
  - Stored as: `intent.artistsBands` (array with `type: 'artist'` or `'track'`)

### Fitness & Lifestyle (Step 10)
- ✅ **Fitness Level** (Dropdown: Sedentary/Light/Moderate/Very Active)
  - Stored at: `intent.fitnessLevel` + root `fitnessLevel`

### Photos (Steps 11-12)
- ✅ **Profile Photo** (1 main profile picture)
  - Can upload, capture camera, or select from existing
  - With crop/zoom editor
  - Stored as: `profilePicUrl`
- ✅ **Lifestyle Images** (5 slots for lifestyle/hobby photos)
  - Can upload, capture camera
  - Each with individual crop/zoom editors
  - Stored as: `intent.lifestyleImageUrls = ["url1", "url2", ...]`

**Stored To:** `intent` (JSON) + root level
```javascript
intent = {
  purpose, relationshipVibe, interestedGender, preferredAgeRange,
  bio, artistsBands, tvShows, movies, watchList, fitnessLevel,
  profileQuestions {..},
  lifestyleImageUrls
}

// Also at root level:
interests, fitnessLevel, profilePicUrl
```

---

## Stage 7: Post-Onboarding Status (WaitlistStatus.jsx or Home)
**Path:** `/waitlist-status` OR `/home`  
**Conditions:**
- If `approval = false` → Show WaitlistStatus page (waiting for admin review)
- If `approval = true` → Redirect to `/home`

**Markers:**
- ✅ `onboarding_complete = true` (set after UserIntent completion)
- ⏳ `approval = false` (default, requires admin approval)
- 🔒 User cannot see/appear in discover until → `approval = true` + `onboarding_complete = true`

---

## Database Storage Summary

### Root Level Fields (users table)
```
id, email, phone_number, first_name, last_name, gender, dob,
current_location, city, from_location, favourite_travel_destination (JSON),
last_holiday_places, profile_pic_url, face_photo_url, face_photos (JSON),
interests (JSON), pets, drinking, smoking, height, religious_level,
kids_preference, food_preference, relationship_status, fitness_level,
spoken_languages (JSON), coding_languages (JSON), favorite_places (JSON),
licence_photos (JSON), license_status, approval, onboarding_complete,
onboarding_current_step, instagram, linkedin_id, ...
```

### JSON Blob Fields (intent column)
```json
{
  "purpose": "Dating",
  "relationshipVibe": "Serious",
  "interestedGender": "Female",
  "preferredAgeRange": [28, 35],
  "bio": "Love hiking and...",
  "artistsBands": [
    { "id": "spotify_id", "name": "Artist", "type": "artist", "image": "url" },
    { "id": "spotify_id", "name": "Song Title", "type": "track", "previewUrl": "url" }
  ],
  "tvShows": [...],
  "movies": [...],
  "watchList": [...],
  "fitnessLevel": "Very Active",
  "lifestyleImageUrls": ["url1", "url2", ...],
  "profileQuestions": {
    "education": "Bachelor's",
    "educationDetail": "University Name",
    "languages": ["English", "Spanish"],
    "height": 180,
    "canCode": true,
    "codingLanguages": ["Python", "JavaScript"],
    "jobTitle": "Software Engineer",
    "companyName": "Tech Corp",
    "sleepSchedule": "Night owl",
    "dateBill": "Split",
    "religion": "Christian",
    "customReligion": null,
    "favoriteCafe": "Local Coffee Shop",
    "relationshipValues": ["Honesty", "Trust"],
    "livingSituation": "Apartment",
    "livingSituationCustom": null
  }
}
```

### Separate Tables
- **driving_license_verifications**: `{ user_id, front_photo_url, back_photo_url, verification_status, submitted_at, reviewed_at, reviewed_by }`

---

## Access Levels (Profile Visibility)

**Profile Data Never Shown:**
- Personal photos (facePhotos) - Only for matched/messaged users
- Phone number, email
- Social security numbers, ID details

**Profile Data Shown in Discover:**
- firstName, lastName, age (calculated from dob)
- gender
- currentLocation, city
- profilePicUrl (main profile photo)
- lifestyleImageUrls (lifestyle photos)
- interests, bio
- entertainment (movies, tvShows, artists)
- height, relationshipStatus
- Calculated compatibility score

**Profile Data Available to Matched Users:**
- Everything visible in discover
- Plus: facePhotos (6 personal photos)
- Plus: Email (for messaging purposes)

---

## Approval Flow

1. **User completes onboarding** → `approval = false`, `onboarding_complete = true`
2. **User attempts to view discover** → See `/matches/potential` endpoint
3. **Endpoint checks:** `WHERE approval = true AND onboarding_complete = true`
4. **Result:** No matches shown (user is invisible to everyone, can't see anyone)
5. **User sees:** WaitlistStatus page "Awaiting Admin Review"
6. **Admin reviews** (via `/admin/waitlist` endpoint)
7. **Admin approves** → `UPDATE users SET approval = true`
8. **User can now:** See discover matches, appear to others
9. **User sees:** Home/Discover tab becomes functional

---

## Quick Reference: Fields by Level

| Level | Component | Main Purpose | Key Fields |
|-------|-----------|--------------|-----------|
| 1 | Signup | Email auth | Email, OTP |
| 2 | Verification | Phone auth | Phone, OTP |
| 3 | UserInfo | Basic profile | Name, Gender, DOB, Locations, Job |
| 4 | ProfilePhotos | Profile images | Face photos (6 slots) |
| 5 | ProfileQuestions | Lifestyle details | Education, Skills, Preferences (15 questions) |
| 6 | SocialPresence | Identity verification | LinkedIn OR Driver's License |
| 7 | UserIntent | Dating preferences | Purpose, Interests, Entertainment, Photos |
| 8 | WaitlistStatus | Admin approval | Shows approval status |
