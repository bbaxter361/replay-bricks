import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOK_STATUS_LABELS,
  addBook,
  deleteBook,
  springFillBookForm,
  updateBook,
  updateBookStatus,
} from '../src/utils/bookShelf.js';

test('adds a bookshelf entry with reading dates and rating', () => {
  const books = addBook([], {
    title: 'Creative Care',
    author: 'Amanda Blake',
    pages: '240',
    dateStarted: '2026-07-01',
    dateCompleted: '2026-07-06',
    rating: 5,
  });

  assert.equal(books[0].title, 'Creative Care');
  assert.equal(books[0].author, 'Amanda Blake');
  assert.equal(books[0].pages, 240);
  assert.equal(books[0].dateStarted, '2026-07-01');
  assert.equal(books[0].dateCompleted, '2026-07-06');
  assert.equal(books[0].rating, 5);
});

test('deletes a bookshelf entry by id', () => {
  const books = [
    { id: 'book-1', title: 'Creative Care' },
    { id: 'book-2', title: 'Activity Planning' },
  ];

  assert.deepEqual(deleteBook(books, 'book-1'), [{ id: 'book-2', title: 'Activity Planning' }]);
});

test('Spring can fill missing bookshelf fields from Amanda input', () => {
  const today = new Date().toISOString().slice(0, 10);

  assert.deepEqual(
    springFillBookForm({
      title: 'The 36-Hour Day',
      author: '',
      pages: '',
      status: 'tbr',
      dateStarted: '',
      dateCompleted: '',
      rating: 0,
    }),
    {
      title: 'The 36-Hour Day',
      author: 'Nancy L. Mace and Peter V. Rabins',
      pages: '384',
      status: 'tbr',
      dateStarted: today,
      dateCompleted: '',
      rating: 0,
    },
  );
});

test('books can be reassigned between TBR, currently reading, and finished', () => {
  const books = [
    { id: 'book-1', title: 'Wrong Shelf', status: 'finished', dateCompleted: '2026-07-01' },
  ];

  const movedToTbr = updateBookStatus(books, 'book-1', 'tbr');
  const movedToReading = updateBookStatus(movedToTbr, 'book-1', 'reading');
  const movedToFinished = updateBookStatus(movedToReading, 'book-1', 'finished');

  assert.equal(BOOK_STATUS_LABELS.tbr, 'TBR');
  assert.equal(movedToTbr[0].status, 'tbr');
  assert.equal(movedToTbr[0].dateCompleted, '');
  assert.equal(movedToReading[0].status, 'reading');
  assert.equal(movedToFinished[0].status, 'finished');
});

test('books can be reopened and edited without losing their record id', () => {
  const updated = updateBook([
    { id: 'book-hexed', title: 'Hexed', status: 'reading', rating: 0 },
  ], 'book-hexed', {
    title: 'Hexed',
    author: 'Kevin Hearne',
    pages: '320',
    status: 'finished',
    dateStarted: '2026-06-25',
    dateCompleted: '2026-07-01',
    rating: 4,
  });

  assert.equal(updated[0].id, 'book-hexed');
  assert.equal(updated[0].author, 'Kevin Hearne');
  assert.equal(updated[0].pages, 320);
  assert.equal(updated[0].status, 'finished');
  assert.equal(updated[0].rating, 4);
});
