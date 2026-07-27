import { Sparkles, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';
import { BOOK_STATUS_LABELS, normalizeBookStatus, springFillBookForm } from '../utils/bookShelf.js';

const blankBookForm = {
  title: '',
  author: '',
  pages: '',
  status: 'tbr',
  dateStarted: '',
  dateCompleted: '',
  rating: 0,
};

const bookStatuses = Object.entries(BOOK_STATUS_LABELS);

const statusSections = [
  { status: 'tbr', title: 'TBR', empty: 'No books are waiting here yet.' },
  { status: 'reading', title: 'Currently Reading', empty: 'No books are currently being read.' },
  { status: 'finished', title: 'Finished', empty: 'No finished books are logged yet.' },
];

function bookToForm(book = {}) {
  return {
    title: book.title || '',
    author: book.author || '',
    pages: book.pages || '',
    status: normalizeBookStatus(book.status),
    dateStarted: book.dateStarted || '',
    dateCompleted: book.dateCompleted || '',
    rating: Number(book.rating || 0),
  };
}

export default function Books() {
  const { state, dispatch } = useAppState();
  const [bookForm, setBookForm] = useState(blankBookForm);
  const [selectedBookId, setSelectedBookId] = useState(state.books[0]?.id || null);
  const selectedBook = state.books.find((book) => book.id === selectedBookId) || state.books[0];
  const [bookDetail, setBookDetail] = useState({ bookId: null, values: {} });
  const bookDetailForm = selectedBook && bookDetail.bookId === selectedBook.id ? bookDetail.values : bookToForm(selectedBook);

  const updateBookForm = (field, value) => {
    setBookForm((current) => ({ ...current, [field]: value }));
  };

  const selectBook = (book) => {
    setSelectedBookId(book.id);
    setBookDetail({ bookId: book.id, values: bookToForm(book) });
  };

  const updateBookDetail = (field, value) => {
    setBookDetail((current) => ({
      bookId: selectedBook?.id || null,
      values: {
        ...(current.bookId === selectedBook?.id ? current.values : bookToForm(selectedBook)),
        [field]: value,
      },
    }));
  };

  const submitBook = (event) => {
    event.preventDefault();
    if (!bookForm.title.trim()) return;

    dispatch({ type: 'addBook', book: bookForm });
    setBookForm(blankBookForm);
  };

  const updateStatus = (book, status) => {
    dispatch({
      type: 'updateBookStatus',
      bookId: book.id,
      status,
      audit: {
        requestedBy: state.currentUser?.name || 'Amanda',
        recordType: 'book',
        recordId: book.id,
        action: 'update status',
        changes: { title: book.title, status },
      },
    });
  };

  const saveBook = (event) => {
    event.preventDefault();
    if (!selectedBook) return;
    dispatch({
      type: 'updateBook',
      bookId: selectedBook.id,
      updates: bookDetailForm,
      audit: {
        requestedBy: state.currentUser?.name || 'Amanda',
        recordType: 'book',
        recordId: selectedBook.id,
        action: 'update',
        changes: bookDetailForm,
      },
    });
  };

  const booksByStatus = statusSections.map((section) => ({
    ...section,
    books: state.books.filter((book) => normalizeBookStatus(book.status) === section.status),
  }));

  return (
    <>
      <SectionHeader eyebrow="Books" title="Amanda's Book Shelf">
        Books remain part of the workspace because Spring may use them as care and activity references.
      </SectionHeader>

      <section className="app-card mb-4 p-5">
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={submitBook}>
          <input
            className="app-input"
            onChange={(event) => updateBookForm('title', event.target.value)}
            placeholder="Title"
            type="text"
            value={bookForm.title}
          />
          <input
            className="app-input"
            onChange={(event) => updateBookForm('author', event.target.value)}
            placeholder="Author"
            type="text"
            value={bookForm.author}
          />
          <input
            className="app-input"
            min="0"
            onChange={(event) => updateBookForm('pages', event.target.value)}
            placeholder="Pages"
            type="number"
            value={bookForm.pages}
          />
          <label className="text-sm font-bold text-[#5a4873]">
            Status
            <select className="app-input mt-1" onChange={(event) => updateBookForm('status', event.target.value)} value={bookForm.status}>
              {bookStatuses.map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-[#5a4873]">
              Date started
              <input
                className="app-input mt-1"
                onChange={(event) => updateBookForm('dateStarted', event.target.value)}
                type="date"
                value={bookForm.dateStarted}
              />
            </label>
            <label className="text-sm font-bold text-[#5a4873]">
              Date completed
              <input
                className="app-input mt-1"
                onChange={(event) => updateBookForm('dateCompleted', event.target.value)}
                type="date"
                value={bookForm.dateCompleted}
              />
            </label>
          </div>
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-bold text-[#5a4873]">Rating</p>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  aria-label={`Rate ${rating} star${rating === 1 ? '' : 's'}`}
                  className="rounded-lg border border-[#ded0f2] bg-white p-2 text-[#6d4cc2] hover:border-[#6d4cc2]"
                  key={rating}
                  onClick={() => updateBookForm('rating', rating)}
                  type="button"
                >
                  <Star fill={bookForm.rating >= rating ? 'currentColor' : 'none'} size={20} />
                </button>
              ))}
              <button className="app-button app-button-secondary ml-auto" onClick={() => setBookForm(springFillBookForm(bookForm))} type="button">
                <Sparkles size={16} /> Fill with Spring
              </button>
              <button className="app-button app-button-primary" type="submit">
                Add Book
              </button>
            </div>
          </div>
        </form>
      </section>

      {selectedBook && (
        <section className="app-card mb-5 p-5">
          <form onSubmit={saveBook}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusPill>{BOOK_STATUS_LABELS[normalizeBookStatus(selectedBook.status)]}</StatusPill>
                <h2 className="mt-3 text-2xl font-black text-[#25183f]">Edit Book Details</h2>
                <p className="mt-1 text-sm text-[#74638d]">{selectedBook.title}</p>
              </div>
              <button className="app-button app-button-primary" type="submit">Save Book</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-bold text-[#5a4873]">
                Title
                <input className="app-input mt-1" onChange={(event) => updateBookDetail('title', event.target.value)} value={bookDetailForm.title} />
              </label>
              <label className="text-sm font-bold text-[#5a4873]">
                Author
                <input className="app-input mt-1" onChange={(event) => updateBookDetail('author', event.target.value)} value={bookDetailForm.author} />
              </label>
              <label className="text-sm font-bold text-[#5a4873]">
                Pages
                <input className="app-input mt-1" min="0" onChange={(event) => updateBookDetail('pages', event.target.value)} type="number" value={bookDetailForm.pages} />
              </label>
              <label className="text-sm font-bold text-[#5a4873]">
                Status
                <select className="app-input mt-1" onChange={(event) => updateBookDetail('status', event.target.value)} value={bookDetailForm.status}>
                  {bookStatuses.map(([status, label]) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-[#5a4873]">
                Date started
                <input className="app-input mt-1" onChange={(event) => updateBookDetail('dateStarted', event.target.value)} type="date" value={bookDetailForm.dateStarted} />
              </label>
              <label className="text-sm font-bold text-[#5a4873]">
                Date completed
                <input className="app-input mt-1" onChange={(event) => updateBookDetail('dateCompleted', event.target.value)} type="date" value={bookDetailForm.dateCompleted} />
              </label>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-[#5a4873]">Rating</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    aria-label={`Set book rating to ${rating}`}
                    className="rounded-lg border border-[#ded0f2] bg-white p-2 text-[#6d4cc2] hover:border-[#6d4cc2]"
                    key={rating}
                    onClick={() => updateBookDetail('rating', rating)}
                    type="button"
                  >
                    <Star fill={bookDetailForm.rating >= rating ? 'currentColor' : 'none'} size={20} />
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-5">
        {booksByStatus.map((section) => (
          <section className="app-card p-5" key={section.status}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-[#25183f]">{section.title}</h2>
                <p className="text-sm text-[#74638d]">{section.books.length} book{section.books.length === 1 ? '' : 's'}</p>
              </div>
              <StatusPill>{BOOK_STATUS_LABELS[section.status]}</StatusPill>
            </div>
            {section.books.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#ded0f2] bg-white p-4 text-sm font-bold text-[#74638d]">{section.empty}</p>
            ) : (
              <div className="page-grid">
                {section.books.map((book) => {
                  const status = normalizeBookStatus(book.status);
                  return (
                    <article className="rounded-lg border border-[#ded0f2] bg-white p-5" key={book.id}>
                      <div className="flex items-start justify-between gap-3">
                        <StatusPill>{BOOK_STATUS_LABELS[status]}</StatusPill>
                        <button
                          aria-label={`Delete ${book.title}`}
                          className="app-button app-button-secondary min-w-10 px-2"
                          onClick={() => dispatch({ type: 'deleteBook', bookId: book.id })}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <button className="mt-3 w-full text-left" onClick={() => selectBook(book)} type="button">
                        <h3 className="text-lg font-black">{book.title}</h3>
                        <p className="mt-1 text-sm text-[#74638d]">{book.author || 'Author not set'}</p>
                        <p className="mt-4 text-sm font-bold text-[#6d4cc2]">{book.pages || 0} pages</p>
                      </button>
                      <label className="mt-4 block text-sm font-bold text-[#5a4873]">
                        Move to
                        <select className="app-input mt-1" onChange={(event) => updateStatus(book, event.target.value)} value={status}>
                          {bookStatuses.map(([nextStatus, label]) => (
                            <option key={nextStatus} value={nextStatus}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <div className="mt-3 grid gap-1 text-xs text-[#74638d]">
                        <span>Started: {book.dateStarted || 'Not set'}</span>
                        <span>Completed: {book.dateCompleted || 'Not set'}</span>
                      </div>
                      <div className="mt-4 flex gap-1 text-[#6d4cc2]" aria-label={`${book.rating || 0} star rating`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star fill={(book.rating || 0) >= rating ? 'currentColor' : 'none'} key={rating} size={18} />
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
