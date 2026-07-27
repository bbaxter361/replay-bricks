import { mergeLegacyCompassData } from '../utils/legacyCompassData.js';

const viteEnv = import.meta.env || {};

export const SPRING_API_BASE = viteEnv.VITE_SPRING_API_BASE || '/api/spring-proxy';
export const SPRING_API_KEY = viteEnv.VITE_SPRING_API_KEY || '';

const legacyKeys = ['contacts', 'events', 'chatHistory', 'conversations', 'books'];

export async function springApiFetch(path, options = {}) {
  const proxyPath = SPRING_API_BASE.includes('/api/spring-proxy') ? path.replace(/^\/api/, '') : path;
  const url = `${SPRING_API_BASE}${proxyPath}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };
  if (SPRING_API_KEY) headers['x-api-key'] = SPRING_API_KEY;

  if (isFormData) delete headers['Content-Type'];

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function sendSpringChat({ message, history, docText, fileName, skillPrompt }) {
  const response = await springApiFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: skillPrompt ? `${skillPrompt}\n\nAmanda request:\n${message}` : message,
      docText,
      fileName,
      history: (history || []).slice(-20).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    }),
  });

  if (!response.ok) throw new Error(`Spring chat failed: ${response.status}`);
  const data = await response.json();
  return data.response || '';
}

export async function uploadSpringFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await springApiFetch('/api/read-file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`Spring file upload failed: ${response.status}`);
  return response.json();
}

export async function loadSpringBrainMemories({ limit = 30 } = {}) {
  const response = await springApiFetch('/api/brain/memories');
  if (!response.ok) throw new Error(`Spring brain load failed: ${response.status}`);
  const data = await response.json();
  const memories = Array.isArray(data.memories) ? data.memories : [];
  return memories
    .filter((memory) => memory?.principle || memory?.topic)
    .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0))
    .slice(0, limit);
}

export async function loadLegacyCompassData() {
  const results = await Promise.allSettled(
    legacyKeys.map(async (key) => {
      const response = await springApiFetch(`/api/data/${key}`);
      if (!response.ok) throw new Error(`Legacy data ${key} failed: ${response.status}`);
      const json = await response.json();
      return [key, Array.isArray(json.data) ? json.data : []];
    }),
  );

  return Object.fromEntries(
    results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value),
  );
}

export async function restoreLegacyCompassData(state) {
  const legacyData = await loadLegacyCompassData();
  return mergeLegacyCompassData(state, legacyData);
}
