import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../utils/api';

const RadioOption = ({ label, description, checked, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center justify-between px-5 py-4 mb-4 rounded-2xl transition-all ${checked
            ? 'bg-white/15 border-2 border-white/40'
            : 'bg-white/5 border-2 border-white/20'
            }`}
    >
        <div className="flex-1 text-left pr-4">
            <div className="font-medium text-base text-white">{label}</div>
            {description && <div className="text-sm text-white/70 mt-1">{description}</div>}
        </div>
        <span
            className={`ml-4 w-5 h-5 flex items-center justify-center rounded-full border-2 ${checked ? 'border-white' : 'border-white/40'
                }`}
            style={{ minWidth: '20px' }}
        >
            {checked && <span className="block w-2.5 h-2.5 bg-white rounded-full"></span>}
        </span>
    </button>
);

export default function LocationPreferencePage() {
    const navigate = useNavigate();
    const [locationPreference, setLocationPreference] = useState('anywhere');
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCurrentPreference = async () => {
            try {
                const userData = await userAPI.getProfile();
                if (userData.locationPreference) {
                    setLocationPreference(userData.locationPreference);
                }
            } catch (err) {
                setError("Failed to load your preference.");
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        };
        loadCurrentPreference();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await userAPI.updateProfile({
                locationPreference: locationPreference,
            });
            navigate('/settings');
        } catch (err) {
            setError("Failed to save your changes. Please try again.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (initialLoading) {
        return (
            <div
                className="h-screen flex justify-center items-center relative"
                style={{
                    backgroundImage: "url('/bgs/faceverifybg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <p className="relative z-10 text-white">Loading...</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col relative"
            style={{
                backgroundImage: "url('/bgs/faceverifybg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Header */}
            <div className="relative z-10 p-6 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <img src="/logo.png" alt="Sundate" className="h-8" />
                    <div style={{ width: 40 }}></div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-0.5 bg-white/20 rounded-full mb-8">
                    <div className="w-full h-full bg-white rounded-full"></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 px-6 pb-6 flex flex-col">
                <h1 className="text-[28px] font-normal text-white mb-3 leading-tight">
                    Location preference
                </h1>
                <p className="text-sm text-white/70 mb-8">
                    Show me potential matches from:
                </p>

                {/* Options */}
                <div className="mb-auto">
                    <RadioOption
                        label="Same city"
                        description="Only show people from your current city"
                        checked={locationPreference === 'same_city'}
                        onClick={() => setLocationPreference('same_city')}
                    />
                    <RadioOption
                        label="Nearby cities"
                        description="Show people from your city and nearby areas"
                        checked={locationPreference === 'nearby_cities'}
                        onClick={() => setLocationPreference('nearby_cities')}
                    />
                    <RadioOption
                        label="Anywhere"
                        description="Show matches from any location"
                        checked={locationPreference === 'anywhere'}
                        onClick={() => setLocationPreference('anywhere')}
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-4 rounded-full bg-white text-black font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
