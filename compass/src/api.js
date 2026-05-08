// API configuration for Compass app
// Spring now lives on Netlify as replaybricksv2
// All requests include the API key for authentication

const API_BASE = 'https://replaybricksv2.netlify.app';

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

/**
 * apiFetch - wrapper around fetch that automatically includes the API key header.
 * Usage: apiFetch(url, options) — same as fetch() but x-api-key is always set.
 */
const API_KEY = 'spring-vicki-2026';

export async function apiFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    'x-api-key': API_KEY,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
