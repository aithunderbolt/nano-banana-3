// Centralized client config for API endpoints
// Set VITE_API_BASE_URL in your .env files (e.g., .env.development, .env.production)
// Falls back to http://localhost:5000 when not provided.

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:5000';

export const ENDPOINTS = {
  GENERATE_IMAGE: `${API_BASE_URL}/api/generate-image`,
  EDIT_IMAGE: `${API_BASE_URL}/api/edit-image`,
  UNDERSTAND_IMAGE: `${API_BASE_URL}/api/understand-image`,
};

export { API_BASE_URL };
