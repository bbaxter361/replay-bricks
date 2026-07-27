const STORAGE_KEY = 'directors-activities-local-preview';
export const DATA_SLICES = [
  'activities',
  'activityDrafts',
  'residents',
  'residentActivityAttendance',
  'oneOnOneNotes',
  'bingoTransactions',
  'calendarEvents',
  'contacts',
  'books',
  'springMessages',
  'auditLog',
];

const DEMO_IDS = new Set([
  'activity-watercolor',
  'activity-singalong',
  'draft-garden',
  'resident-mary',
  'resident-harold',
  'bingo-1',
  'bingo-2',
  'attendance-1',
  'attendance-2',
  'event-1',
  'event-2',
  'contact-1',
  'book-1',
  'spring-welcome',
]);

function isDemoRecord(record) {
  return DEMO_IDS.has(record?.id) || DEMO_IDS.has(record?.residentId) || DEMO_IDS.has(record?.activityId);
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function repairStoredRecord(record, key) {
  if (!record || record.id || key !== 'books') return record;
  const title = record.title || record.bookTitle || record.name;
  if (!title) return record;
  const author = record.author || record.writer || '';
  return {
    ...record,
    id: `legacy-book-${slug(title)}${author ? `-${slug(author)}` : ''}`,
    title,
    author,
  };
}

function mergeRecords(fallbackRecords = [], storedRecords = [], key = '') {
  const recordsById = new Map();
  fallbackRecords.forEach((record) => recordsById.set(record.id, record));
  storedRecords
    .map((record) => repairStoredRecord(record, key))
    .filter((record) => record && record.id && !isDemoRecord(record))
    .forEach((record) => recordsById.set(record.id, record));
  return [...recordsById.values()];
}

export function extractPersistableState(state = {}) {
  const persisted = {
    dataVersion: state.dataVersion,
  };

  DATA_SLICES.forEach((key) => {
    persisted[key] = Array.isArray(state[key]) ? state[key] : [];
  });

  return persisted;
}

function unwrapRemoteState(remoteState = {}) {
  return remoteState.data && typeof remoteState.data === 'object' ? remoteState.data : remoteState;
}

export function mergeRemoteState(localState = {}, remoteState = {}) {
  const remoteData = unwrapRemoteState(remoteState);
  if (!remoteData || Object.keys(remoteData).length === 0) return localState;

  const merged = {
    ...localState,
    ...remoteData,
    currentUser: localState.currentUser,
    calendarView: localState.calendarView,
    wingFilter: localState.wingFilter,
    selectedResidentId: localState.selectedResidentId,
    selectedActivityId: localState.selectedActivityId,
    selectedAppNotice: localState.selectedAppNotice,
    canvaExportPreview: localState.canvaExportPreview,
    monthProposal: localState.monthProposal,
    activeGameId: localState.activeGameId,
  };

  DATA_SLICES.forEach((key) => {
    merged[key] = mergeRecords(localState[key] || [], remoteData[key] || [], key);
  });

  return removeEmptyLegacyRestore(merged);
}

function migrateStoredState(fallbackState, storedState) {
  const migrated = {
    ...fallbackState,
    currentUser: storedState.currentUser || fallbackState.currentUser,
    calendarView: storedState.calendarView || fallbackState.calendarView,
    wingFilter: storedState.wingFilter || fallbackState.wingFilter,
    selectedResidentId: storedState.selectedResidentId && !DEMO_IDS.has(storedState.selectedResidentId)
      ? storedState.selectedResidentId
      : fallbackState.selectedResidentId,
    selectedActivityId: storedState.selectedActivityId && !DEMO_IDS.has(storedState.selectedActivityId)
      ? storedState.selectedActivityId
      : fallbackState.selectedActivityId,
  };

  DATA_SLICES.forEach((key) => {
    migrated[key] = mergeRecords(fallbackState[key] || [], storedState[key] || [], key);
  });

  return migrated;
}

function removeEmptyLegacyRestore(state) {
  const restore = state.legacyRestore;
  if (!restore || restore.error) return state;
  const restoredCount = Number(restore.contacts || 0)
    + Number(restore.calendarEvents || 0)
    + Number(restore.books || 0)
    + Number(restore.springMessages || 0);

  if (restoredCount > 0) return state;
  const cleanState = { ...state };
  delete cleanState.legacyRestore;
  return cleanState;
}

export function loadLocalState(fallbackState) {
  if (typeof localStorage === 'undefined') return fallbackState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallbackState;

    const parsed = JSON.parse(stored);
    return removeEmptyLegacyRestore(migrateStoredState(fallbackState, parsed));
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

export async function fetchRemoteState(fetchImpl = fetch) {
  const response = await fetchImpl('/api/director-data', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Director data load failed: ${response.status}`);
  const payload = await response.json();
  return payload.data || null;
}

export async function saveRemoteState(state, fetchImpl = fetch) {
  const response = await fetchImpl('/api/director-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: extractPersistableState(state) }),
  });
  if (!response.ok) throw new Error(`Director data save failed: ${response.status}`);
  return response.json();
}
