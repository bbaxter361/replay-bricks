// API configuration for Compass app
// Change this to your deployed API server URL
const API_BASE = import.meta.env.VITE_API_URL || '';

export const API = {
  chat: `${API_BASE}/api/chat`,
  canvaAutofill: `${API_BASE}/api/canva/autofill`,
  contact: `${API_BASE}/api/contact`,
  canvaAuthUrl: `${API_BASE}/api/canva/auth-url`,
  health: `${API_BASE}/api/health`,
};
