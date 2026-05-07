// API configuration for Compass app
// Uses replaybrick.com's API proxy so it works from any network
const API_BASE = 'https://replaybrick.com';

export const API = {
  chat: `${API_BASE}/api/chat`,
  canvaAutofill: `${API_BASE}/api/canva/autofill`,
  contact: `${API_BASE}/api/contact`,
  canvaAuthUrl: `${API_BASE}/api/canva/auth-url`,
  health: `${API_BASE}/api/health`,
  readFile: `${API_BASE}/api/read-file`,
};

export { API_BASE };
