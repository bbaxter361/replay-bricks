function makeId() {
  return `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const knownBooks = {
  'the 36-hour day': {
    author: 'Nancy L. Mace and Peter V. Rabins',
    pages: '384',
  },
};

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
      status: book.status || 'bookshelf',
      createdAt: book.createdAt || new Date().toISOString(),
    },
  ];
}

export function deleteBook(books, bookId) {
  return books.filter((book) => book.id !== bookId);
}

export function springFillBookForm(form) {
  const known = knownBooks[String(form.title || '').trim().toLowerCase()] || {};
  return {
    title: form.title || '',
    author: form.author || known.author || '',
    pages: form.pages || known.pages || '',
    dateStarted: form.dateStarted || new Date().toISOString().slice(0, 10),
    dateCompleted: form.dateCompleted || '',
    rating: Number(form.rating || 0),
  };
}
