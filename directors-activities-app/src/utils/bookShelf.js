function makeId() {
  return `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const knownBooks = {
  'the 36-hour day': {
    author: 'Nancy L. Mace and Peter V. Rabins',
    pages: '384',
  },
};

export const BOOK_STATUS_LABELS = {
  tbr: 'TBR',
  reading: 'Currently Reading',
  finished: 'Finished',
};

export function normalizeBookStatus(status) {
  if (status === 'to-read' || status === 'bookshelf' || status === 'book-club') return 'tbr';
  if (status === 'read' || status === 'complete' || status === 'completed') return 'finished';
  if (status === 'currently-reading') return 'reading';
  return BOOK_STATUS_LABELS[status] ? status : 'tbr';
}

export function addBook(books, book) {
  return [
    ...books,
    {
      id: makeId(),
      title: String(book.title || '').trim(),
      author: String(book.author || '').trim(),
      pages: Number(book.pages || 0),
      dateStarted: book.dateStarted || '',
      dateCompleted: book.dateCompleted || '',
      rating: Number(book.rating || 0),
      status: normalizeBookStatus(book.status),
      createdAt: book.createdAt || new Date().toISOString(),
    },
  ];
}

export function deleteBook(books, bookId) {
  return books.filter((book) => book.id !== bookId);
}

export function updateBook(books, bookId, updates = {}) {
  return books.map((book) => {
    if (book.id !== bookId) return book;
    return {
      ...book,
      title: String(updates.title || '').trim(),
      author: String(updates.author || '').trim(),
      pages: Number(updates.pages || 0),
      status: normalizeBookStatus(updates.status),
      dateStarted: updates.dateStarted || '',
      dateCompleted: updates.dateCompleted || '',
      rating: Number(updates.rating || 0),
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };
  });
}

export function updateBookStatus(books, bookId, status) {
  const normalizedStatus = normalizeBookStatus(status);
  const today = new Date().toISOString().slice(0, 10);
  return books.map((book) => {
    if (book.id !== bookId) return book;
    return {
      ...book,
      status: normalizedStatus,
      dateStarted: normalizedStatus === 'reading' && !book.dateStarted ? today : book.dateStarted || '',
      dateCompleted: normalizedStatus === 'finished' ? book.dateCompleted || today : '',
      updatedAt: new Date().toISOString(),
    };
  });
}

export function springFillBookForm(form) {
  const known = knownBooks[String(form.title || '').trim().toLowerCase()] || {};
  return {
    title: form.title || '',
    author: form.author || known.author || '',
    pages: form.pages || known.pages || '',
    status: normalizeBookStatus(form.status),
    dateStarted: form.dateStarted || new Date().toISOString().slice(0, 10),
    dateCompleted: form.dateCompleted || '',
    rating: Number(form.rating || 0),
  };
}
