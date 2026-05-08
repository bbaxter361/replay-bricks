// API configuration for Compass app
// Spring now lives on Netlify alongside the website at replaybrick.com
// No more Fly.io dependency — one deploy, one place
const API_BASE = 'https://replaybrick.com';

export const API = {
  chat: `${API_BASE}/api/chat`,
  canvaAutofill: `${API_BASE}/api/canva/autofill`,
  contact: `${API_BASE}/api/contact`,
  canvaAuthUrl: `${API_BASE}/api/canva/auth-url`,
  health: `${API_BASE}/api/health`,
  readFile: `${API_BASE}/api/read-file`,
  data: `${API_BASE}/api/data`,
  dataGet: (key) => `${API_BASE}/api/data/${key}`,
  dataSave: `${API_BASE}/api/data/save`,
};

export { API_BASE };
