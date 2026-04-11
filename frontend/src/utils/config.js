// frontend/src/utils/config.js

const DEFAULT_PRODUCTION_API_URL = "https://sundate-backend.onrender.com/api";
const rawApiBaseUrl =
	import.meta.env.VITE_BACKEND_API_URL ||
	import.meta.env.VITE_API_URL ||
	DEFAULT_PRODUCTION_API_URL;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

if (!import.meta.env.VITE_BACKEND_API_URL && !import.meta.env.VITE_API_URL) {
	console.warn("VITE_BACKEND_API_URL not set; using production API default.", API_BASE_URL);
}
