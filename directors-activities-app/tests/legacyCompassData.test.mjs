import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapLegacyBooks,
  mapLegacyChatHistory,
  mapLegacyContacts,
  mapLegacyEvents,
  mergeLegacyCompassData,
} from '../src/utils/legacyCompassData.js';

test('maps legacy Compass calendar events into Director calendar events', () => {
  const events = mapLegacyEvents([
    {
      id: 'event-legacy',
      title: 'Morning Bingo',
      start: '2026-07-06T10:00:00.000Z',
      end: '2026-07-06T10:45:00.000Z',
      wing: 'memory',
      description: 'Bingo with prizes',
      type: 'games',
    },
  ]);

  assert.equal(events[0].id, 'event-legacy');
  assert.equal(events[0].title, 'Morning Bingo');
  assert.equal(events[0].wing, 'memory');
  assert.deepEqual(events[0].supplies, []);
});

test('maps legacy Compass books into Amanda bookshelf entries', () => {
  const books = mapLegacyBooks([
    {
      id: 'book-legacy',
      title: 'Creative Care',
      author: 'Amanda Blake',
      pages: 240,
      dateRead: '2026-07-06T12:00:00.000Z',
      addedBy: 'Spring',
    },
  ]);

  assert.equal(books[0].dateCompleted, '2026-07-06');
  assert.equal(books[0].status, 'bookshelf');
});

test('recovers orphaned legacy books that used old read-book field names', () => {
  const books = mapLegacyBooks([
    {
      bookTitle: 'Still Alice',
      writer: 'Lisa Genova',
      pageCount: '320',
      completedAt: '2026-06-15T12:00:00.000Z',
      rating: '5',
    },
  ]);

  assert.equal(books[0].id, 'legacy-book-still-alice-lisa-genova');
  assert.equal(books[0].title, 'Still Alice');
  assert.equal(books[0].author, 'Lisa Genova');
  assert.equal(books[0].pages, 320);
  assert.equal(books[0].dateCompleted, '2026-06-15');
  assert.equal(books[0].rating, 5);
});

test('maps legacy chat history into Spring messages', () => {
  const messages = mapLegacyChatHistory([
    { id: 'chat-1', role: 'user', message: 'Plan bingo', timestamp: '2026-07-06T15:00:00.000Z' },
  ]);

  assert.deepEqual(messages[0], {
    id: 'chat-1',
    role: 'user',
    content: 'Plan bingo',
    createdAt: '2026-07-06T15:00:00.000Z',
  });
});

test('maps family contacts and only replaces local samples when remote has data', () => {
  const merged = mergeLegacyCompassData(
    {
      contacts: [{ id: 'local-contact', name: 'Local' }],
      calendarEvents: [{ id: 'local-event', title: 'Local Event' }],
      books: [],
      springMessages: [],
    },
    {
      contacts: [{ id: 'remote-contact', name: 'Linda', relationship: 'family' }],
      events: [],
      books: [{ id: 'remote-book', title: 'Remote Book' }],
      chatHistory: [],
    },
  );

  assert.equal(merged.contacts[0].id, 'remote-contact');
  assert.equal(merged.calendarEvents[0].id, 'local-event');
  assert.equal(merged.books[0].id, 'remote-book');
});

test('empty legacy Compass response leaves Amanda bootstrap data and does not show a zero restore', () => {
  const state = {
    contacts: [{ id: 'local-contact', name: 'Local' }],
    calendarEvents: [{ id: 'local-event', title: 'Local Event' }],
    books: [{ id: 'local-book', title: 'Local Book' }],
    springMessages: [{ id: 'local-message', content: 'Local Spring memory' }],
  };

  const merged = mergeLegacyCompassData(state, {
    contacts: [],
    events: [],
    books: [],
    chatHistory: [],
  });

  assert.equal(merged, state);
});
