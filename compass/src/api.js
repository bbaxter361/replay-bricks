// API configuration for Compass app
// Spring now lives on Netlify as replaybricksv2
// All requests include the API key for authentication

// Force direct connection to Netlify backend to avoid any proxy issues
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
// Falls back to empty string if not set — protected endpoints will return 401
const API_KEY = import.meta.env.VITE_SPRING_API_KEY || '';

export { API_KEY };

export async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  // Add explicit debugging for file uploads
  if (url.includes('read-file')) {
    console.log('🔍 FILE UPLOAD DEBUG:', {
      url,
      method: options.method,
      isFormData,
      hasFile: isFormData && options.body.has('file')
    });
  }

  // Build the fetch options
  let fetchOptions = { ...options };
  const timeout = options.timeout || 45000; // 45s default timeout

  // For FormData (file uploads): the browser MUST auto-set Content-Type
  // with the multipart boundary. Some browsers strip this when you pass
  // ANY headers object, so send the API key as a query param too as backup.
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
    // For regular (JSON/text) requests, merge headers normally
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
