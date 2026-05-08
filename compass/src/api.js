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

const API_KEY = 'spring-vicki-2026';

export async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  // For FormData (file uploads): the browser MUST auto-set Content-Type
  // with the multipart boundary. Some browsers strip this when you pass
  // ANY headers object, so send the API key as a query param too as backup.
  if (isFormData) {
    const { 'Content-Type': _, ...safeHeaders } = (options.headers || {});
    const separator = url.includes('?') ? '&' : '?';
    return fetch(`${url}${separator}api_key=${API_KEY}`, {
      ...options,
      headers: {
        ...safeHeaders,
        'x-api-key': API_KEY,
      },
    });
  }

  // For regular (JSON/text) requests, merge headers normally
  const headers = {
    ...(options.headers || {}),
    'x-api-key': API_KEY,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
