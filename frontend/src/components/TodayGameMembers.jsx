import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/config";

const API_URL = API_BASE_URL;

export default function TodayGameMembers() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        gameId,
        userChoice,
        question,
        selectedOptionText,
        selectedOptionImage,
    } = location.state || {};

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!gameId) {
            setError("Game information is missing.");
            setLoading(false);
            return;
        }

        const fetchMembers = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_URL}/daily-game/matches/${gameId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to load members");
                    setMembers([]);
                    return;
                }

                setMembers(data.sameChoice || []);
                setError("");
            } catch (err) {
                console.error("Error fetching game members:", err);
                setError("Failed to load members");
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [gameId]);

    const handleBack = () => {
        navigate(-1);
    };

    const headerTitle = selectedOptionText
        ? `Members who also like ${selectedOptionText}`
        : "Members who chose the same";

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Top bar */}
            <div className="bg-white shadow-sm px-4 pt-10 pb-3 flex items-center gap-3">
                <button
                    onClick={handleBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                    <svg
                        className="w-5 h-5 text-gray-800"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Today&apos;s Game
                    </div>
                    {question && (
                        <div className="text-sm font-semibold text-gray-900 truncate">
                            {question}
                        </div>
                    )}
                </div>
            </div>

            {/* Header text */}
            <div className="px-4 pt-4 pb-2">
                <p className="text-sm font-medium text-gray-800">{headerTitle}</p>
                {members.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        {members.length} member{members.length !== 1 ? "s" : ""} found
                    </p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                {loading && (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-gray-500 text-sm">Loading members...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-gray-500 text-sm">{error}</p>
                    </div>
                )}

                {!loading && !error && members.length === 0 && (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-gray-500 text-sm">
                            No members have chosen this option yet.
                        </p>
                    </div>
                )}

                {!loading && !error && members.length > 0 && (
                    <div className="space-y-4">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100"
                            >
                                {selectedOptionImage && (
                                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                                        <img
                                            src={selectedOptionImage}
                                            alt={selectedOptionText || "Game option"}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Right-side overlay buttons (visual only) */}
                                        <div className="absolute inset-y-3 right-3 flex flex-col gap-2 items-center">
                                            <button className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                                <svg
                                                    className="w-5 h-5 text-emerald-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </button>
                                            <button className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                                <svg
                                                    className="w-5 h-5 text-gray-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.5 12.75l6 6 9-13.5"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {member.firstName}
                                                {member.lastName
                                                    ? ` ${member.lastName.charAt(0)}.`
                                                    : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex -space-x-2">
                                        <img
                                            src={member.profilePicUrl}
                                            alt={member.firstName}
                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
