# Chat Level System - Complete Field Mapping

## Overview
The Sundate chat system has **3 progressive levels** that unlock based on messaging activity. Each level reveals additional profile information to encourage genuine connection.

---

## Level 1 - Initial Match View (Default)
**Trigger:** Automatic on match  
**Requirements:** None  
**Message Requirement:** N/A  
**Consent Required:** No  

### Fields Visible at Level 1:
✅ **Basic Profile**
- `firstName`, `lastName` (name)
- `gender`
- `dob` (date of birth) → age calculated
- `currentLocation` (where they live)
- `location` / `fromLocation` (hometown)
- `profilePicUrl` (main profile picture)
- `relationshipStatus`

✅ **Preferences & Interests**
- `interests` (array of interest tags)
- `intent` (relationship purpose, vibe, bio, entertainment)
- `fitnessLevel`

❌ Hidden: Personal details, photos, contact info

---

## Level 2 - Lifestyle & Preferences Revealed
**Trigger:** **Both** users send ≥5 messages each + Both accept Level 2 consent  
**Requirements:** 
- User 1 message count ≥ 5 ✅
- User 2 message count ≥ 5 ✅
- `level2_user1_consent` = true ✅
- `level2_user2_consent` = true ✅
- `level2_questions_completed` = true (for both users) ✅

**Action Flow:**
1. After 5 messages from each user → Backend detects threshold
2. Socket event: `level_threshold_reached` → Frontend shows popup
3. "Level 2 Unlocked! Do you want to share your Level 2 profile?" 
4. User clicks "Yes" → Sets `level2_user1_consent = true`
5. **Both users must consent** for fields to become visible

### Base Level 1 Fields + New Level 2 Fields:
```
LEVEL_2_ADDITIONAL = [
  'height',           // Physical attribute (cm)
  'pets',             // Pet preference (No pets/Cat lover/Dog lover/Other)
  'drinking',         // Drinking habit (Never/Sometimes/Often/Daily)
  'smoking',          // Smoking habit (Never/Sometimes/Often)
  'foodPreference'    // Dietary preference (Vegetarian/Non-veg/Vegan/etc)
]
```

### User Experience:
- "Share your Level 2 info with {Name} to unlock theirs"
- Until consent given → Persistent yellow banner at top of chat
- Reminder text: "Share your Level 2 profile with them"
- Button: "Share now"

---

## Level 3 - Complete Profile & Personal Info
**Trigger:** **Both** users send ≥5 more messages (10 total) + Both accept Level 3 consent + Both completed Level 3 questions  
**Requirements:**
- User 1 message count ≥ 5 ✅
- User 2 message count ≥ 5 ✅
- BOTH have completed Level 2 (consent + questions) ✅
- `level3_user1_consent` = true ✅
- `level3_user2_consent` = true ✅
- `level3_questions_completed` = true (for both users) ✅

**Action Flow:**
1. After Level 2 completed + 5 more messages from each → Backend detects threshold
2. Socket event: `level_threshold_reached` → Frontend shows popup
3. "Level 3 Unlocked! Are you ready to show your complete profile?"
4. User clicks "Yes" → Sets `level3_user1_consent = true`
5. **Personal Tab becomes UNLOCKED** (can view face photos)
6. All Level 3 fields become visible

### Base Levels 1 + 2 Fields + New Level 3 Fields:
```
LEVEL_3_ADDITIONAL = [
  'kidsPreference',           // Want kids (No/Yes/Unsure)
  'facePhotos',               // 6 personal face photos (PERSONAL TAB ONLY)
  'favouriteTravelDestination',  // Array of travel destinations
  'lastHolidayPlaces',        // Where they've vacationed
  'favouritePlacesToGo',      // Places they want to visit
  'instagram',                // Instagram handle
  'linkedin',                 // LinkedIn URL
  'religiousLevel',           // Religious commitment (Not/Moderately/Deeply)
  'religion',                 // Religion type (Christian/Muslim/Hindu/etc)
  'relationshipValues'        // Array of values (Honesty/Trust/etc)
]
```

### User Experience:
- Similar popup: "Level 3 Unlocked! Are you ready to show your complete profile? 🥳"
- Full personal profile now visible
- Face photo gallery accessible
- Can see all personal information

---

## Message Count Tracking

**Backend Table: `match_levels`**
```sql
CREATE TABLE match_levels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT,
  user_id_1 INT,
  user_id_2 INT,
  current_level INT DEFAULT 1,
  user1_message_count INT DEFAULT 0,   -- Individual count for User 1
  user2_message_count INT DEFAULT 0,   -- Individual count for User 2
  level2_user1_consent BOOLEAN DEFAULT FALSE,
  level2_user2_consent BOOLEAN DEFAULT FALSE,
  level3_user1_consent BOOLEAN DEFAULT FALSE,
  level3_user2_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Message Counting Logic:**
- Each message increments only the sender's count
- Prevents one user from "cheating" and sending 5 messages alone
- Both users must actively participate to unlock levels

---

## Consent & Profile Completion Flags

**Backend Table: `users`**
```sql
level2_questions_completed BOOLEAN DEFAULT FALSE  -- User filled out Level 2 profile questions
level3_questions_completed BOOLEAN DEFAULT FALSE  -- User filled out Level 3 profile questions
```

**Why both needed?**
1. **Completion Flag**: User must have filled survey/profile
2. **Consent Flag**: User must have explicitly agreed to share

Example:
- User A: Completed Level 2 questions ✅, But consent = false ❌ → Level 2 not visible
- User A: Completed Level 2 questions ✅, Consent = true ✅, User B consent = false ❌ → Still Level 1 visible (need BOTH)

---

## Complete Visibility Decision Tree

```
User A viewing User B's profile:
│
├─ Message count threshold met?
│  │ ├─ NO → Stay at Level 1
│  │ └─ YES → Check consent
│  │
│  ├─ Level 2 threshold reached (both 5+ msgs)?
│  │ ├─ NO → Stay at Level 1
│  │ └─ YES → Check consent
│  │    │
│  │    ├─ Both A& B consented Level 2?
│  │    │ ├─ NO → Stay at Level 1, show banner
│  │    │ └─ YES → Show Level 2 fields
│  │    │    │
│  │    │    └─ Level 3 threshold reached (both 5+ msgs)?
│  │    │       ├─ NO → Stay at Level 2
│  │    │       └─ YES → Check Level 3 consent
│  │    │          │
│  │    │          ├─ Both A & B consented Level 3?
│  │    │          │ ├─ NO → Stay at Level 2
│  │    │          │ └─ YES → Show Level 3 + unlock Personal tab
```

---

## Socket Events

**Backend → Frontend Events:**

### `level_threshold_reached`
```javascript
{
  type: 'LEVEL_2' | 'LEVEL_3',
  action: 'FILL_INFORMATION' | 'ASK_CONSENT',
  otherUserId: number,
  otherUserName: string,
  conversationId: number,
  threshold: string,
  messageCount: number
}
```

**Example Sequence:**
1. Both users send messages
2. Message count hits threshold
3. Backend emits `level_threshold_reached`
4. Frontend shows `LevelUpPopup` component
5. User can "Yes" (consent) or "No" (defer)

---

## UI Components

### LevelUpPopup.jsx
- Shows when level unlocked
- Two action types:
  - `FILL_INFORMATION` - User hasn't completed profile questions yet
  - `ASK_CONSENT` - User completed questions, asking for consent

### ConsentReminderBanner.jsx
- Shows persistent yellow banner
- "Share your Level 2 info with {Name} to unlock theirs"
- Appears when consent is PENDING
- Disappears when user consents or dismisses

---

## Comparison: Onboarding Levels vs Chat Levels

| System | Purpose | Progression | Visibility |
|--------|---------|-------------|-----------|
| **Onboarding** | Collect user info on signup | 8 sequential stages | All visible once created |
| **Chat Levels** | Progressive profile reveal | 3 levels based on engagement | Gatekept by messaging activity |
| **Approval** | Admin vetting | Binary (false→true) | All-or-nothing access to discover |

---

## Key Implementation Details

**When level unlocks:**
1. ✅ Message count threshold met (both users)
2. ✅ Profile completion checkbox set
3. ✅ Socket emission to both users
4. ✅ User consent via popup

**Edge Cases:**
- One user never sends 5 messages → Stays at Level 1 forever
- User consents but other user doesn't → Still Level 1 (requires BOTH)
- User blocks other user → All levels reset to 1
- Conversation deleted → Message counts reset

---

## Database Queries

**Check visibility level between User A and User B:**
```sql
SELECT 
  c.current_level,
  ml.user1_message_count,
  ml.user2_message_count,
  c.level2_user1_consent,
  c.level2_user2_consent,
  c.level3_user1_consent,
  c.level3_user2_consent,
  u1.level2_questions_completed,
  u2.level2_questions_completed
FROM conversations c
JOIN match_levels ml ON ml.conversation_id = c.id
JOIN users u1 ON u1.id = ?  -- User A
JOIN users u2 ON u2.id = ?  -- User B
WHERE c.id = ?
```

**Increment User A's message count:**
```sql
UPDATE match_levels 
SET user1_message_count = user1_message_count + 1
WHERE conversation_id = ? AND user_id_1 = ?
```

---

## Summary: Chat Levels at a Glance

| Level | Threshold | Consent | Fields Shown | Tab Access |
|-------|-----------|---------|--------------|------------|
| **1** | Immediate | No | Basic info, interests, entertainment | Discover |
| **2** | 5 msgs each | Both yes | Level 1 + lifestyle (height, pets, food, drinking, smoking) | Discover |
| **3** | 10 msgs total + Level 2 complete | Both yes | Level 2 + personal (kids, travel, religion, values, LinkedIn) | **Personal Tab Unlocked** + face photos |
