import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteActivityRecord } from '../src/utils/activityRecords.js';
import { deleteCalendarEventsForActivity } from '../src/utils/calendarEvents.js';
import { readFileSync } from 'node:fs';

test('activity records can be deleted and selection moves immediately', () => {
  const activities = [
    { id: 'activity-1', title: 'Keep' },
    { id: 'activity-2', title: 'Delete Me' },
  ];

  const next = deleteActivityRecord(activities, 'activity-2');

  assert.deepEqual(next.records.map((activity) => activity.id), ['activity-1']);
  assert.equal(next.nextSelectedId, 'activity-1');
});

test('Activities screen has a delete button with browser confirmation', () => {
  const source = readFileSync(new URL('../src/pages/Activities.jsx', import.meta.url), 'utf8');

  assert.match(source, /Delete/);
  assert.match(source, /confirm\(/);
  assert.match(source, /deleteActivityRecord/);
});

test('deleting an activity removes its scheduled calendar events too', () => {
  const events = [
    { id: 'event-1', activityId: 'activity-delete', title: 'Delete Me' },
    { id: 'event-2', activityId: 'activity-keep', title: 'Keep Me' },
  ];

  const remaining = deleteCalendarEventsForActivity(events, 'activity-delete');

  assert.deepEqual(remaining.map((event) => event.id), ['event-2']);
});
