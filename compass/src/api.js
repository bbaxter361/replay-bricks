// API configuration for Compass app
// Spring now lives on Netlify at replaybrick.com
// All requests include the API key for authentication

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

// API key comes from build-time env var (VITE_SPRING_API_KEY in Netlify dashboard)
// Never hard-coded — falls back to empty string, protected endpoints return 401
const API_KEY = import.meta.env.VITE_SPRING_API_KEY || '';

export { API_KEY };

export async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  let fetchOptions = { ...options };
  const timeout = options.timeout || 45000; // 45s default timeout

  // For FormData (file uploads): browser MUST auto-set Content-Type with multipart boundary.
  // Some browsers strip this when ANY headers object is passed, so send API key as query param backup.
  if (isFormData) {
    const { 'Content-Type': _, ...safeHeaders } = (options.headers || {});
    const separator = url.includes('?') ? '&' : '?';
    const apiKeyParam = API_KEY ? `${separator}api_key=${API_KEY}` : '';
    fetchOptions = {
      ...fetchOptions,
      headers: {
        ...safeHeaders,
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
    };
    url = `${url}${apiKeyParam}`;
  } else {
    fetchOptions.headers = {
      ...(options.headers || {}),
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    };
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  fetchOptions.signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000}s`);
    }
    throw err;
  }
}
