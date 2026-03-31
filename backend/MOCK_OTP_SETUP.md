# Mock OTP System - Development Setup

## Overview

A temporary mock OTP system has been implemented for mobile number verification during development. This allows testing the phone authentication flow without needing a real SMS provider.

**Status:** ✅ Mock OTP enabled  
**Current Mode:** `OTP_MODE=mock`  
**Mock OTP Value:** `123456`

---

## Quick Start

### Using Mock OTP (Current)

1. **Enter phone number** in the app
   ```
   Example: (555) 123-4567
   ```

2. **Check server console** for mock OTP message:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔐 MOCK OTP ENABLED
   📱 Mock OTP for 5551234567 is: 123456
   ⏱️  Expires in 15 minutes
   💡 Enter "123456" to verify the phone number
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. **Enter OTP in app:**
   ```
   Enter: 123456
   ```

4. **User verified!** ✅
   - Phone number marked as verified
   - JWT token generated
   - User redirected to onboarding

---

## Architecture

### System Components

```
Frontend (Phone Auth Form)
    ↓
    POST /api/phone-auth/send-otp
        ↓
        OTPService.generateAndStoreOTP()
            ├─ Mode: MOCK → Generate '123456'
            ├─ Mode: REAL → Generate random 6-digit OTP
            └─ Log to console in mock mode
        ↓
        OTPService.sendOTPViaSMS()
            ├─ Mode: MOCK → Log to console (no SMS)
            └─ Mode: REAL → Send via SMS provider
    ↓
    Return success (same response for both modes)

User enters OTP
    ↓
    POST /api/phone-auth/verify-otp
        ↓
        OTPService.verifyOTP()
            ├─ Mode: MOCK → Accept '123456' for any phone
            ├─ Mode: REAL → Verify against database
            └─ Mark phone as verified
    ↓
    Return JWT token
```

---

## Implementation Details

### 1. OTP Service (backend/services/otpService.js)

**Configuration:**
```javascript
static CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 15,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60,
  MODE: process.env.OTP_MODE || 'mock'  // ← Set from .env
};

static MOCK_OTP = '123456';  // ← Fixed mock OTP value
```

**Key Methods:**

#### `generateOTP()`
- **Mock mode:** Returns `'123456'`
- **Real mode:** Generates random 6-digit OTP

#### `generateAndStoreOTP(phoneNumber, otpType)`
- Stores OTP in `otp_codes` table (same for both modes)
- **Mock mode:** Logs formatted message to console
- **Real mode:** Standard behavior

#### `verifyOTP(phoneNumber, enteredOTP)`
- **Mock mode:** Accepts `'123456'` for any phone number
- **Real mode:** Verifies against database
- In both modes: marks phone as verified and deletes OTP record

#### `sendOTPViaSMS(phoneNumber, otp)`
- **Mock mode:**
  ```javascript
  console.log(`📱 SMS to ${phoneNumber}: Your code is ${otp}`);
  // No SMS actually sent
  ```
- **Real mode:** Placeholder ready for SMS provider integration

**Utility Methods:**
```javascript
getMode()           // Returns: "mock" or "real"
isMockMode()        // Returns: true/false
getMockOTPValue()   // Returns: "123456"
```

### 2. Environment Configuration (backend/.env)

```env
# ✅ OTP MODE - Determines SMS OTP behavior
# OTP_MODE=mock - Uses fixed OTP '123456' for all phone numbers (Development/Testing)
# OTP_MODE=real - Uses actual SMS provider (Production - requires SMS provider setup)
# Default: mock
OTP_MODE=mock
```

### 3. Phone Auth Routes (No changes needed)

Routes automatically use OTPService methods:
```
POST /api/phone-auth/send-otp      → generateAndStoreOTP() + sendOTPViaSMS()
POST /api/phone-auth/verify-otp    → verifyOTP()
POST /api/phone-auth/resend-otp    → generateAndStoreOTP() + sendOTPViaSMS()
```

---

## Switching to Real OTP

When you have a real SMS provider ready, follow these steps:

### Step 1: Update .env
```env
OTP_MODE=real
```

### Step 2: Implement SMS Provider

In `backend/services/otpService.js`, update `sendOTPViaSMS()`:

**Example with Twilio:**
```javascript
async sendOTPViaSMS(phoneNumber, otp) {
  try {
    if (this.CONFIG.MODE === 'mock') {
      // ... mock mode code (leave as is)
    }

    // 🔴 REAL MODE: Integrate Twilio
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: `Your Sundate verification code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: message.sid,
      phoneNumber,
      mode: 'real'
    };
  } catch (error) {
    console.error('Error sending OTP via SMS:', error);
    throw error;
  }
}
```

**Add to .env:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Update Supported SMS Providers

Other supported providers:
- **SendGrid**: SMS service for transactional email
- **AWS SNS**: Amazon Simple Notification Service
- **2Factor.in**: Indian SMS provider
- **Firebase Cloud Messaging**: For push notifications

Choose based on your region and requirements.

### Step 4: Test Real SMS

1. Change `OTP_MODE=real`
2. Implement SMS provider code
3. Request OTP
4. Check user's phone for SMS
5. Enter OTP to verify

---

## Testing Checklist

### Mock Mode Testing ✅

- [ ] Start backend server
- [ ] Open browser console to see "MOCK OTP" message
- [ ] Verify OTP value is `123456`
- [ ] Enter `123456` in app
- [ ] User successfully verified
- [ ] JWT token generated
- [ ] Redirected to onboarding

### Mock Mode Edge Cases

- [ ] **Wrong OTP:** Enter non-123456 value → Should show "Incorrect OTP"
- [ ] **Resend OTP:** Check 60-second cooldown works
- [ ] **Max attempts:** Try entering wrong OTP 5 times → Should block
- [ ] **OTP expiry:** Wait 15+ minutes → Should show "OTP expired" (if testing)
- [ ] **Multiple phones:** Verify each phone gets its own record

### Real Mode Testing (When Implemented)

- [ ] Actual SMS received on phone
- [ ] SMS contains correct OTP value
- [ ] OTP valid for 15 minutes
- [ ] OTP expires after 15 minutes
- [ ] Can resend after 60 seconds
- [ ] Max 5 attempts per OTP
- [ ] Phone marked as verified after success

---

## File Changes Summary

### Modified Files

1. **backend/services/otpService.js**
   - Added `OTP_MODE` configuration
   - Added `MOCK_OTP` constant
   - Updated `generateOTP()` for mock mode
   - Updated `generateAndStoreOTP()` with console logging
   - Updated `verifyOTP()` to accept mock OTP
   - Updated `sendOTPViaSMS()` with mock logging
   - Added utility methods: `getMode()`, `isMockMode()`, `getMockOTPValue()`

2. **backend/.env**
   - Added `OTP_MODE=mock` configuration

3. **backend/.env.example**
   - Added `OTP_MODE` documentation

### Routes (No Changes)

Backend routes in `backend/routes/phone-auth.js` automatically work with both modes:
- `POST /api/phone-auth/send-otp`
- `POST /api/phone-auth/verify-otp`
- `POST /api/phone-auth/resend-otp`

---

## Database Schema

No schema changes needed. Existing `otp_codes` table is used:

```sql
CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts_remaining INT DEFAULT 5,
  otp_type ENUM('signup', 'login', 'verification') DEFAULT 'login',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (phone_number),
  INDEX idx_phone (phone_number),
  INDEX idx_expires (expires_at)
);
```

---

## Troubleshooting

### Mock OTP not appearing in console

1. Check `OTP_MODE` in `.env`:
   ```env
   OTP_MODE=mock
   ```

2. Restart backend server

3. Check server output for:
   ```
   🔐 MOCK OTP ENABLED
   📱 Mock OTP for <phone> is: 123456
   ```

### OTP verification failing

1. Ensure you're entering exactly `123456`
2. Check "Attempts remaining" - max 5 wrong attempts
3. OTP expires after 15 minutes - request new one
4. Wait 60 seconds between resend requests

### Switching from mock to real mode issues

1. Ensure `OTP_MODE=real` in `.env`
2. Implement SMS provider code in `sendOTPViaSMS()`
3. Add SMS provider credentials to `.env`
4. Restart backend server
5. Test SMS delivery to real phone

---

## Supporting Code Examples

### Check Current OTP Mode (Programmatically)

```javascript
const OTPService = require('../services/otpService');

console.log('Current OTP Mode:', OTPService.getMode());
console.log('Is Mock Mode:', OTPService.isMockMode());
if (OTPService.isMockMode()) {
  console.log('Mock OTP:', OTPService.getMockOTPValue());
}
```

### Manual OTP Cleanup (If Needed)

```javascript
const OTPService = require('../services/otpService');

// Clean up expired OTPs
const deletedCount = await OTPService.cleanupExpiredOTPs();
console.log(`Deleted ${deletedCount} expired OTPs`);

// Delete specific phone OTP
await OTPService.deleteOTP('5551234567');
```

---

## Notes

- ✅ Mock mode is production-ready for development/testing
- ✅ Can be enabled/disabled via simple environment variable change
- ✅ Database operations identical for both modes
- ✅ Routes require zero code changes
- ✅ Easy to switch to real SMS provider when needed
- ✅ Mock OTP value always `123456` for consistency
- ⚠️ Always use `OTP_MODE=real` in production with SMS provider
- ⚠️ Remember to implement SMS provider before production deployment

---

## References

- **Phone Auth Routes:** `backend/routes/phone-auth.js`
- **OTP Service:** `backend/services/otpService.js`
- **Phone Auth Service:** `backend/services/phoneAuthService.js`
- **Configuration:** `backend/.env`

---

**Last Updated:** March 31, 2026  
**Status:** ✅ Mock OTP System Active
