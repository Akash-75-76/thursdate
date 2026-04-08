import React from "react";
import { useNavigate } from "react-router-dom";

const NotificationPermission = () => {
    const navigate = useNavigate();

    const handleSkip = () => {
        // User chose to skip notifications — go to location permission
        navigate('/location-permission');
    };

    const handleAllow = async () => {
        if (typeof Notification !== 'undefined' && Notification.requestPermission) {
            try {
                const result = await Notification.requestPermission();
                // Optionally handle granted/denied
                console.log('Notification permission:', result);
            } catch (e) {
                console.warn('Notification permission request failed', e);
            }
        } else {
            console.warn('Notifications API not supported');
        }
        // After asking permission, continue to location permission
        navigate('/location-permission');
    };

    return (
        <div
            className="h-screen flex flex-col font-sans relative"
            style={{
                backgroundImage: `url('/bgs/faceverifybg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            <div className="relative z-40 p-6 pt-10 flex flex-col flex-grow text-white">
                {/* Back Button */}
                <button
                    className="absolute top-6 left-6 text-white text-3xl font-light hover:opacity-80 transition z-50"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                >
                    &lt;
                </button>

                <div className="flex items-center justify-center mb-6 mt-14">
                    <img src="/logo.png" alt="Sundate" className="h-8" />
                </div>

                <div className="flex flex-col items-center flex-grow text-center pt-6 px-4">
                    <h1 className="text-white text-2xl font-semibold mb-4">Stay in the loop with notifications</h1>
                    <p className="text-white/80 mb-6 max-w-lg text-base">
                        so you never miss when someone likes you, messages you, or when your profile gets approved
                    </p>

                    <div className="flex-1" />

                    {/* Buttons at bottom */}
                    <div className="w-full max-w-md mx-auto pb-6">
                        <button
                            onClick={handleSkip}
                            className="w-full py-4 rounded-full bg-white text-black font-medium mb-3 shadow-sm"
                        >
                            No, I’ll explore on my own
                        </button>

                        <button
                            onClick={handleAllow}
                            className="w-full py-4 rounded-full border border-white/50 text-white font-medium bg-transparent"
                        >
                            Yes, send me notifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPermission;
