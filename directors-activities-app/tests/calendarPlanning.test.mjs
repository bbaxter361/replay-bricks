import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarEventFromActivity, createMonthProposal } from '../src/utils/calendarPlanning.js';

test('schedules one activity as a calendar event', () => {
  const event = createCalendarEventFromActivity({
    activity: { id: 'activity-art', title: 'Watercolor Flowers', durationMinutes: 45, bestFor: 'both' },
    start: '2026-07-08T10:00:00',
    wing: 'memory',
  });

  assert.equal(event.title, 'Watercolor Flowers');
  assert.equal(event.start, '2026-07-08T10:00:00');
  assert.equal(event.end, '2026-07-08T10:45:00');
  assert.equal(event.wing, 'memory');
});

test('creates a reviewable month proposal before saving', () => {
  const proposal = createMonthProposal({
    month: '2026-07',
    activities: [
      { id: 'activity-art', title: 'Watercolor Flowers', durationMinutes: 45, bestFor: 'both' },
      { id: 'activity-music', title: 'Golden Oldies Singalong', durationMinutes: 30, bestFor: 'memory' },
    ],
  });

  assert.equal(proposal.status, 'draft');
  assert.equal(proposal.events.length, 2);
});
