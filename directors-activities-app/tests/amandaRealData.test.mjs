import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activities,
  bingoTransactions,
  calendarEvents,
  contacts,
  residents,
} from '../src/data/sampleData.js';
import { getBingoBalance } from '../src/utils/bingoPoints.js';

test('fallback data uses Amanda brain archive residents instead of demo residents', () => {
  const names = residents.map((resident) => resident.name);

  assert.ok(names.includes('Katherine'));
  assert.ok(names.includes('Flo'));
  assert.ok(names.includes('Sharon'));
  assert.ok(!names.includes('Mary Thompson'));
  assert.ok(!names.includes('Harold Jenkins'));
});

test('fallback data preserves known Bingo Bucks totals from Amanda brain archive', () => {
  const byName = new Map(residents.map((resident) => [resident.name, resident.id]));

  assert.equal(getBingoBalance(byName.get('Katherine'), bingoTransactions), 21);
  assert.equal(getBingoBalance(byName.get('Patsy'), bingoTransactions), 21);
  assert.equal(getBingoBalance(byName.get('Flo'), bingoTransactions), 22);
  assert.equal(getBingoBalance(byName.get('Sharon'), bingoTransactions), 20);
  assert.equal(getBingoBalance(byName.get('Shaun'), bingoTransactions), 20);
});

test('fallback data includes real calendar and activity memories from Amanda brain archive', () => {
  assert.ok(calendarEvents.some((event) => event.title === 'Stars & Stripes Celebration'));
  assert.ok(calendarEvents.some((event) => event.title === 'Bible Study and Prayer Box'));
  assert.ok(calendarEvents.some((event) => event.title === 'Choir Practice'));
  assert.ok(activities.some((activity) => activity.title === 'Stars & Stripes Celebration'));
  assert.ok(contacts.some((contact) => contact.name === 'Liat' && contact.relationship === 'guest'));
});
