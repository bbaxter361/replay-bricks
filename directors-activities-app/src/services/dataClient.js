const STORAGE_KEY = 'directors-activities-local-preview';

export function loadLocalState(fallbackState) {
  if (typeof localStorage === 'undefined') return fallbackState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...fallbackState, ...JSON.parse(stored) } : fallbackState;
  } catch {
    return fallbackState;
  }
}

export function saveLocalState(state) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearLocalState() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
