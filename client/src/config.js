// Centralized client config for API endpoints
// Set VITE_API_BASE_URL in your .env files (e.g., .env.development, .env.production)
// Falls back to http://localhost:5000 when not provided.

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://srv-hq-ai01:5200';

// Optional: full URL to the n8n webhook endpoint for image generation
// Example: http://localhost:5678/webhook-test/gen-image
const N8N_IMAGE_WEBHOOK = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_N8N_IMAGE_WEBHOOK)
  ? import.meta.env.VITE_N8N_IMAGE_WEBHOOK
  : 'http://localhost:5678/webhook-test/gen-image3';

export const ENDPOINTS = {
  GENERATE_IMAGE: `${API_BASE_URL}/api/generate-image`,
  EDIT_IMAGE: `${API_BASE_URL}/api/edit-image`,
  UNDERSTAND_IMAGE: `${API_BASE_URL}/api/understand-image`,
  ME: `${API_BASE_URL}/api/me`,
  COMBINE_IMAGES: `${API_BASE_URL}/api/combine-images`,
  // n8n webhook endpoint for text-to-image via n8n
  N8N_GENERATE_IMAGE: N8N_IMAGE_WEBHOOK,
};

export { API_BASE_URL, N8N_IMAGE_WEBHOOK };
