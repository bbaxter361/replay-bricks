import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLocalState } from '../src/services/dataClient.js';

function installLocalStorage(value) {
  global.localStorage = {
    getItem: () => value,
    setItem: () => {},
    removeItem: () => {},
  };
}

test('loadLocalState removes old demo preview records while preserving user additions', () => {
  installLocalStorage(JSON.stringify({
    residents: [
      { id: 'resident-mary', name: 'Mary Thompson' },
      { id: 'resident-real', name: 'Real Resident' },
    ],
    activities: [
      { id: 'activity-watercolor', title: 'Watercolor Flowers' },
      { id: 'activity-real', title: 'Real Activity' },
    ],
    calendarEvents: [
      { id: 'event-1', title: 'Watercolor Flowers' },
      { id: 'event-real', title: 'Real Event' },
    ],
    books: [
      { id: 'book-1', title: 'The 36-Hour Day' },
      { id: 'book-real', title: 'Real Book' },
    ],
  }));

  const loaded = loadLocalState({
    dataVersion: 'amanda-brain-2026-07-07',
    residents: [{ id: 'resident-katherine', name: 'Katherine' }],
    activities: [{ id: 'activity-bingo', title: 'Bingo' }],
    calendarEvents: [{ id: 'event-bingo-20260701', title: 'Bingo' }],
    books: [{ id: 'book-hexed', title: 'Hexed' }],
  });

  assert.deepEqual(loaded.residents.map((item) => item.id), ['resident-katherine', 'resident-real']);
  assert.deepEqual(loaded.activities.map((item) => item.id), ['activity-bingo', 'activity-real']);
  assert.deepEqual(loaded.calendarEvents.map((item) => item.id), ['event-bingo-20260701', 'event-real']);
  assert.deepEqual(loaded.books.map((item) => item.id), ['book-hexed', 'book-real']);

  delete global.localStorage;
});

test('loadLocalState removes stale zero-count legacy restore banners', () => {
  installLocalStorage(JSON.stringify({
    dataVersion: 'amanda-brain-2026-07-07',
    residents: [{ id: 'resident-katherine', name: 'Katherine' }],
    legacyRestore: {
      contacts: 0,
      calendarEvents: 0,
      books: 0,
      springMessages: 0,
    },
  }));

  const loaded = loadLocalState({
    dataVersion: 'amanda-brain-2026-07-07',
    residents: [{ id: 'resident-katherine', name: 'Katherine' }],
  });

  assert.equal(loaded.legacyRestore, undefined);

  delete global.localStorage;
});

test('loadLocalState keeps backed-up Amanda books when same-version browser data is missing them', () => {
  installLocalStorage(JSON.stringify({
    dataVersion: 'amanda-brain-2026-07-07',
    books: [{ id: 'book-local-note', title: 'Local Note Book' }],
  }));

  const loaded = loadLocalState({
    dataVersion: 'amanda-brain-2026-07-07',
    books: [
      { id: 'book-hexed', title: 'Hexed' },
      { id: 'book-alice-in-wonderland', title: 'Alice in Wonderland' },
    ],
  });

  assert.deepEqual(loaded.books.map((book) => book.id), [
    'book-hexed',
    'book-alice-in-wonderland',
    'book-local-note',
  ]);

  delete global.localStorage;
});
