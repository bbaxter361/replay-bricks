import test from 'node:test';
import assert from 'node:assert/strict';
import { addBook, deleteBook, springFillBookForm } from '../src/utils/bookShelf.js';

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
  assert.deepEqual(
    springFillBookForm({
      title: 'The 36-Hour Day',
      author: '',
      pages: '',
      dateStarted: '',
      dateCompleted: '',
      rating: 0,
    }),
    {
      title: 'The 36-Hour Day',
      author: 'Nancy L. Mace and Peter V. Rabins',
      pages: '384',
      dateStarted: '2026-07-06',
      dateCompleted: '',
      rating: 0,
    },
  );
});
