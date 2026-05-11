import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSpringActions } from './springActions.js';

test('parses multiple event and contact blocks from one Spring response', () => {
  const parsed = parseSpringActions(`
I added these.
===EVENT===
{"title":"Bingo","start":"2026-06-01T14:00:00","end":"2026-06-01T15:00:00","type":"games","wing":"both"}
===END===
===EVENT===
[{"title":"Music","start":"2026-06-05T10:00:00","end":"2026-06-05T11:00:00","type":"music","wing":"memory"}]
===END===
===CONTACT===
{"name":"Jane Smith","phone":"555-1212","relationship":"family"}
===END===
`);

  assert.equal(parsed.events.length, 2);
  assert.equal(parsed.contacts.length, 1);
  assert.equal(parsed.displayText, 'I added these.');
});

test('parses comma-separated objects inside one Spring action block', () => {
  const parsed = parseSpringActions(`
===EVENT===
{"title":"Chair Yoga","start":"2026-06-10T10:00:00","end":"2026-06-10T10:30:00"},
{"title":"Bingo","start":"2026-06-12T14:00:00","end":"2026-06-12T15:00:00"}
===END===
`);

  assert.equal(parsed.events.length, 2);
  assert.equal(parsed.events[1].title, 'Bingo');
});
