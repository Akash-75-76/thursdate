# City-Based Location Matching - Implementation Guide

## Overview

Implemented city-based location matching to show users potential matches from their city or nearby areas based on their preferences.

## What Was Implemented

### 1. Database Changes

- **New Columns**:
  - `city` (VARCHAR 100): Extracted city name from `current_location`
  - `location_preference` (VARCHAR 50): User's matching radius preference
    - `same_city`: Only show matches from the same city (default)
    - `nearby_cities`: Show matches from city and nearby areas
    - `anywhere`: Show matches from any location

- **Migration Files**:
  - `backend/migrations/add-location-matching.sql`
  - `backend/migrations/run-location-matching-migration.js`

### 2. Backend Updates

#### Helper Function

- `extractCity()`: Extracts city name from location strings
  - Example: "Mumbai, India" → "Mumbai"

#### Matching Endpoint (`/matches/potential`)

- Now filters candidates by city based on user's `location_preference`
- Queries include city in response data
- Debug logging for location filtering

#### Profile Endpoints

- **GET `/profile`**: Returns `city` and `locationPreference`
- **POST `/profile`**: Extracts and saves city when location is provided
- **PUT `/profile`**: Updates city and location preference

### 3. Frontend Updates

#### New Settings Page

- `LocationPreferencePage.jsx`: Allows users to set their location matching radius
  - Same city only
  - Nearby cities
  - Anywhere

#### Updated Components

- **App.jsx**: Added route for location preference page
- **SettingsTab.jsx**: Added "Location preference" menu item under Preferences
- **UserInfo.jsx**: Already has location autocomplete (using OpenStreetMap API)

## How to Use

### 1. Run the Migration

```bash
cd backend
node migrations/run-location-matching-migration.js
```

### 2. User Flow

1. Users enter their location during onboarding (Step 4 in UserInfo)
2. City is automatically extracted and saved (e.g., "Mumbai, India" → city: "Mumbai")
3. Default preference is "Same city"
4. Users can change preference in Settings → Location preference
5. Matching algorithm filters candidates based on preference

### 3. Matching Logic

- **Same city**: `WHERE city = userCity`
- **Nearby cities**: Currently same as "Same city" (can be enhanced with city mapping)
- **Anywhere**: No location filter applied

## Future Enhancements

### Nearby Cities Implementation

Option 1: Add a cities mapping table

```sql
CREATE TABLE nearby_cities (
  city_name VARCHAR(100),
  nearby_city VARCHAR(100),
  distance_km INT
);
```

Option 2: Upgrade to coordinate-based matching

- Add `latitude` and `longitude` columns
- Use Haversine formula for distance calculation
- Show "X km away" on profile cards

### Additional Features

- User-configurable distance radius (10km, 25km, 50km, etc.)
- "No local matches" fallback to show distant users
- Distance sorting (closest first)
- Migration script to geocode existing users

## Testing

### Test the Implementation

1. Create test users with different cities
2. Set location preference to "Same city"
3. Verify only matches from same city appear
4. Change to "Anywhere" and verify all matches appear
5. Check Settings page shows current preference correctly

### Debug Logging

Backend console will show:

```
[DEBUG] Filtering by same city: Mumbai
[DEBUG] No location filtering (showing anywhere)
```

## Files Modified/Created

### Backend

- `backend/migrations/add-location-matching.sql` (NEW)
- `backend/migrations/run-location-matching-migration.js` (NEW)
- `backend/routes/user.js` (MODIFIED)

### Frontend

- `frontend/src/pages/settings/LocationPreferencePage.jsx` (NEW)
- `frontend/src/App.jsx` (MODIFIED)
- `frontend/src/pages/tabs/SettingsTab.jsx` (MODIFIED)

## Notes

- City extraction is simple string parsing (takes first part before comma)
- "Nearby cities" currently works same as "Same city" - needs enhancement
- Location autocomplete already implemented using OpenStreetMap API
- Default preference is "Same city" for privacy-focused matching
