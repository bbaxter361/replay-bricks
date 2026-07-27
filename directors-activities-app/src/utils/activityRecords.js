import { splitLines, splitList, toNumber } from './fieldParsers.js';

export function normalizeActivityUpdates(updates = {}) {
  const normalized = { ...updates };
  delete normalized.sourceLabel;

  if ('durationMinutes' in normalized) {
    normalized.durationMinutes = toNumber(normalized.durationMinutes, 45);
  }
  if ('supplies' in normalized) normalized.supplies = splitList(normalized.supplies);
  if ('steps' in normalized) normalized.steps = splitLines(normalized.steps);
  if ('tags' in normalized) normalized.tags = splitList(normalized.tags);

  return normalized;
}

export function updateActivityRecord(records = [], recordId, updates = {}) {
  const normalized = normalizeActivityUpdates(updates);
  return records.map((record) => (
    record.id === recordId
      ? { ...record, ...normalized, updatedAt: updates.updatedAt || new Date().toISOString() }
      : record
  ));
}

export function deleteActivityRecord(records = [], recordId) {
  const nextRecords = records.filter((record) => record.id !== recordId);
  return {
    records: nextRecords,
    nextSelectedId: nextRecords[0]?.id || null,
  };
}
