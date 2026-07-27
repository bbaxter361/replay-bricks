import test from 'node:test';
import assert from 'node:assert/strict';
import { updateActivityRecord } from '../src/utils/activityRecords.js';
import { updateCalendarEvent } from '../src/utils/calendarEvents.js';
import { readFileSync } from 'node:fs';

test('updates every editable activity field without changing the selected record id', () => {
  const records = [{
    id: 'activity-1',
    title: 'Old',
    supplies: ['paper'],
    steps: ['start'],
  }];

  const updated = updateActivityRecord(records, 'activity-1', {
    title: 'New',
    category: 'music',
    bestFor: 'memory',
    difficulty: 'easy',
    durationMinutes: '30',
    groupSize: 'large group',
    supplies: 'song sheets, speaker',
    steps: 'Pass out sheets\nSing together',
    safetyNotes: 'Watch volume.',
    dementiaAdaptations: 'Use familiar songs.',
    tags: 'music, memory',
    residentNotes: 'Flo enjoys this.',
  });

  assert.equal(updated[0].id, 'activity-1');
  assert.equal(updated[0].title, 'New');
  assert.equal(updated[0].durationMinutes, 30);
  assert.deepEqual(updated[0].supplies, ['song sheets', 'speaker']);
  assert.deepEqual(updated[0].steps, ['Pass out sheets', 'Sing together']);
  assert.deepEqual(updated[0].tags, ['music', 'memory']);
});

test('updates calendar event date and time fields into saved timestamps', () => {
  const events = [{
    id: 'event-1',
    title: 'Bingo',
    start: '2026-07-01T14:00:00',
    end: '2026-07-01T15:00:00',
  }];

  const updated = updateCalendarEvent(events, 'event-1', {
    title: 'Music Bingo',
    date: '2026-07-09',
    startTime: '10:30',
    endTime: '11:15',
    location: 'Main room',
    category: 'games',
    assignedStaff: 'Amanda',
    supplies: 'cards, speaker',
  });

  assert.equal(updated[0].title, 'Music Bingo');
  assert.equal(updated[0].start, '2026-07-09T10:30:00');
  assert.equal(updated[0].end, '2026-07-09T11:15:00');
  assert.deepEqual(updated[0].supplies, ['cards', 'speaker']);
});

test('Calendar activities open a click-to-edit calendar editor', () => {
  const source = readFileSync(new URL('../src/pages/Calendar.jsx', import.meta.url), 'utf8');
  const dashboard = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('../src/components/CalendarEventEditor.jsx', import.meta.url), 'utf8');
  const appState = readFileSync(new URL('../src/state/appState.js', import.meta.url), 'utf8');

  assert.match(source, /Plan The Day, Week, Or Month/);
  assert.match(source, /\['day', 'week', 'month'\]/);
  assert.match(source, /MonthCalendarView/);
  assert.match(source, /grid grid-cols-7/);
  assert.match(source, /onClick=\{\(\) => onEdit\(event\)\}/);
  assert.match(dashboard, /onClick=\{\(\) => setEditingEvent\(event\)\}/);
  assert.match(editor, /Save Changes/);
  assert.match(editor, /Delete/);
  assert.match(appState, /calendarView: 'month'/);
  assert.doesNotMatch(source, /Yearly/);
});

test('Books screen opens editable book detail records', () => {
  const source = readFileSync(new URL('../src/pages/Books.jsx', import.meta.url), 'utf8');

  assert.match(source, /Edit Book Details/);
  assert.match(source, /selectBook/);
  assert.match(source, /updateBook/);
});
