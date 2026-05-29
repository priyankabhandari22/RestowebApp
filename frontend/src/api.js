const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://restowebapp-2.onrender.com";

export const apiUrl = (path) => `${apiBaseUrl}${path}`;