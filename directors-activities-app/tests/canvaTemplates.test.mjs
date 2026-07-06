import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanvaPlaceholderPayload } from '../src/utils/canvaTemplates.js';

test('maps calendar events to named Canva placeholders', () => {
  const payload = buildCanvaPlaceholderPayload({
    calendarTitle: 'Memory Care Daily Activities',
    view: 'daily',
    events: [
      {
        date: '2026-07-08',
        day: 'Wednesday',
        time: '10:00 AM',
        title: 'Watercolor Flowers',
        location: 'Activity Room',
        description: 'Paint simple flowers with watercolor.',
        wing: 'memory',
        supplies: ['Watercolor paper', 'Paint', 'Brushes'],
      },
    ],
  });

  assert.equal(payload.calendar_title, 'Memory Care Daily Activities');
  assert.equal(payload.events[0].activity_title, 'Watercolor Flowers');
  assert.equal(payload.events[0].supplies, 'Watercolor paper, Paint, Brushes');
});
