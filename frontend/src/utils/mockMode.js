// frontend/src/utils/mockMode.js

import { getToken } from './tokenManager';

// --- MOCK CONSTANTS ---
export const DUMMY_EMAIL = "sanwari.nair@gmail.com";
export const DUMMY_PASSWORD = "frick123";

export const ADMIN_EMAIL = "admin@luyona.com";
export const ADMIN_PASSWORD = "adminpassword";

export const MOCK_TOKEN_PREFIX = "MOCK_SANWARI_";
export const MOCK_STORAGE_KEY = 'mockUserProfile';

// --- MOCK HELPERS ---
export const isMockMode = () => {
    const token = getToken();
    return token && token.startsWith(MOCK_TOKEN_PREFIX);
};

export const getMockProfile = () => {
    const json = localStorage.getItem(MOCK_STORAGE_KEY);
    return json ? JSON.parse(json) : {};
};

export const setMockProfile = (profile) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(profile));
};
