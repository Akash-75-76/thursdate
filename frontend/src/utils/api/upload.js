// frontend/src/utils/api/upload.js

import { API_BASE_URL } from '../config';
import { getToken } from '../tokenManager';
import { isMockMode } from '../mockMode';

// ⚡ Compress image before upload - reduces file size by 70-80%
const compressImage = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
    };
  });
};

// Image Upload API
export const uploadAPI = {
    // Upload profile picture (MOCK or LIVE)
    uploadProfilePicture: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating profile picture upload.");
            // Generate a temporary mock URL to allow the frontend to display the image.
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: tempUrl };
        }

        // LIVE MODE: Compress and upload
        const compressed = await compressImage(file, 600, 600, 0.8);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        console.log(`[Upload] Profile: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },

    // Upload lifestyle image (MOCK or LIVE)
    uploadLifestyleImage: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating lifestyle image upload.");
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: tempUrl };
        }

        // LIVE MODE: Compress and upload
        const compressed = await compressImage(file, 1200, 800, 0.8);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        console.log(`[Upload] Lifestyle: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch(`${API_BASE_URL}/upload/lifestyle-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },

    // Upload face photo (MOCK or LIVE)
    uploadFacePhoto: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating face photo upload.");
            // ✅ FIX: Use placeholder images instead of blob URLs
            // Blob URLs don't work when viewed by other users or after refresh
            const placeholders = [
                'https://randomuser.me/api/portraits/men/1.jpg',
                'https://randomuser.me/api/portraits/men/2.jpg',
                'https://randomuser.me/api/portraits/men/3.jpg',
                'https://randomuser.me/api/portraits/women/1.jpg',
                'https://randomuser.me/api/portraits/women/2.jpg',
                'https://randomuser.me/api/portraits/women/3.jpg',
            ];
            const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            return { url: randomPlaceholder };
        }

        // LIVE MODE: Compress and upload
        const compressed = await compressImage(file, 800, 800, 0.85);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        console.log(`[Upload] Face: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch(`${API_BASE_URL}/upload/face-photo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },

    // Verify and upload profile photo (compares with reference face photo)
    uploadProfilePhotoVerify: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating profile photo verification.");
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            return { url: tempUrl, faceVerification: true, similarity: 95.5 };
        }

        // LIVE MODE: Proceed with actual backend call
        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/profile-photo-verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Verification failed');
        }

        return response.json();
    },

    // Upload driver's license image for admin review (MOCK or LIVE)
    uploadLicenseImage: async (file) => {
        if (isMockMode()) {
            console.log("MOCK UPLOAD: Simulating license image upload.");
            const tempUrl = URL.createObjectURL(file);
            await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay
            return { url: tempUrl };
        }

        const token = getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/license-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    },
};
