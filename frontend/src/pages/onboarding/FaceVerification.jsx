import React from 'react';

const FaceVerification = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-4">Face Verification</h1>
            <p className="mb-6 text-gray-600">Please verify your face to continue.</p>
            {/* TODO: Add face verification UI and logic here */}
            <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                {/* Placeholder for camera or image upload */}
                <span className="text-gray-400">Camera/Image</span>
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Verify</button>
        </div>
    );
};

export default FaceVerification;
