// Utility for persisting onboarding state to localStorage
// Allows users to resume onboarding if they leave mid-flow

const STORAGE_KEYS = {
  USER_INFO: 'onboarding_user_info',
  USER_INTENT: 'onboarding_user_intent',
  PROFILE_QUESTIONS: 'onboarding_profile_questions',
};

const STORAGE_SCOPE_SEPARATOR = '__scope__';

const sanitizeScopeValue = (value) => {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
};

const decodeTokenPayload = (token) => {
  try {
    const payload = token?.split('.')?.[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const getStorageScope = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return 'guest';
  }

  const payload = decodeTokenPayload(token);
  const userIdentifier = payload?.userId ?? payload?.id ?? payload?.sub ?? payload?.email;
  if (userIdentifier !== undefined && userIdentifier !== null && userIdentifier !== '') {
    return `user_${sanitizeScopeValue(userIdentifier)}`;
  }

  const tokenSuffix = sanitizeScopeValue(token).slice(-48);
  return `token_${tokenSuffix || 'unknown'}`;
};

const getScopedStorageKey = (key) => {
  return `${key}${STORAGE_SCOPE_SEPARATOR}${getStorageScope()}`;
};

/**
 * Save onboarding state to localStorage
 * @param {string} key - One of STORAGE_KEYS
 * @param {object} data - State data to persist
 */
export function saveOnboardingState(key, data) {
  try {
    const scopedKey = getScopedStorageKey(key);
    const stateWithTimestamp = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(scopedKey, JSON.stringify(stateWithTimestamp));
    // Cleanup any old unscoped key to avoid cross-account leakage.
    localStorage.removeItem(key);
    console.log(`[Persistence] Saved ${scopedKey}:`, {
      step: data.step, 
      dataSize: JSON.stringify(stateWithTimestamp).length 
    });
  } catch (err) {
    console.error('[Persistence] Failed to save onboarding state:', err);
  }
}

/**
 * Load onboarding state from localStorage
 * @param {string} key - One of STORAGE_KEYS
 * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
 * @returns {object|null} - Saved state or null if not found/expired
 */
export function loadOnboardingState(key, maxAge = 30 * 24 * 60 * 60 * 1000) {
  try {
    const scopedKey = getScopedStorageKey(key);
    const saved = localStorage.getItem(scopedKey);
    if (!saved) {
      if (localStorage.getItem(key)) {
        // Ignore legacy global key because it can belong to a different account.
        localStorage.removeItem(key);
      }
      console.log(`[Persistence] No saved state for ${scopedKey}`);
      return null;
    }

    const parsed = JSON.parse(saved);
    const age = Date.now() - (parsed.timestamp || 0);

    // BUG FIX #5: Extended maxAge from 7 days to 30 days
    // Clear expired data
    if (age > maxAge) {
      console.log(`[Persistence] Expired state for ${scopedKey} (${Math.round(age / 1000 / 60 / 60 / 24)} days old)`);
      localStorage.removeItem(scopedKey);
      return null;
    }

    console.log(`[Persistence] Loaded ${scopedKey}:`, {
      step: parsed.step, 
      ageHours: Math.round(age / 1000 / 60 / 60) 
    });
    return parsed;
  } catch (err) {
    console.error('[Persistence] Failed to load onboarding state:', err);
    return null;
  }
}

/**
 * Clear saved onboarding state
 * @param {string} key - One of STORAGE_KEYS
 */
export function clearOnboardingState(key) {
  try {
    const scopedKey = getScopedStorageKey(key);
    localStorage.removeItem(scopedKey);
    // Also clear old legacy key if present.
    localStorage.removeItem(key);
    console.log(`[Persistence] Cleared ${scopedKey}`);
  } catch (err) {
    console.error('[Persistence] Failed to clear onboarding state:', err);
  }
}

/**
 * Clear all onboarding states
 */
export function clearAllOnboardingStates() {
  Object.values(STORAGE_KEYS).forEach(clearOnboardingState);
}

export { STORAGE_KEYS };
