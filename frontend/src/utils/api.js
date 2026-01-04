// frontend/src/utils/api.js
// 
// This file now serves as a backwards compatibility layer.
// All functionality has been moved to separate modules:
// - api/auth.js - Authentication API
// - api/user.js - User Profile & Matching API
// - api/admin.js - Admin API
// - api/upload.js - Image Upload API
// - api/chat.js - Chat API
//
// Supporting utilities:
// - config.js - API configuration
// - tokenManager.js - Token storage management
// - mockMode.js - Mock mode helpers
// - apiClient.js - HTTP request client
//
// Re-export everything for backwards compatibility

export { authAPI } from './api/auth';
export { userAPI } from './api/user';
export { adminAPI } from './api/admin';
export { uploadAPI } from './api/upload';
export { chatAPI } from './api/chat';
