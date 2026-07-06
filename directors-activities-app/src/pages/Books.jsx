import { Sparkles, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';
import { springFillBookForm } from '../utils/bookShelf.js';

const blankBookForm = {
  title: '',
  author: '',
  pages: '',
  dateStarted: '',
  dateCompleted: '',
  rating: 0,
};

export default function Books() {
  const { state, dispatch } = useAppState();
  const [bookForm, setBookForm] = useState(blankBookForm);

  const updateBookForm = (field, value) => {
    setBookForm((current) => ({ ...current, [field]: value }));
  };

  const submitBook = (event) => {
    event.preventDefault();
    if (!bookForm.title.trim()) return;

    dispatch({ type: 'addBook', book: bookForm });
    setBookForm(blankBookForm);
  };

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

      <div className="page-grid">
        {state.books.map((book) => (
          <section className="app-card p-5" key={book.id}>
            <div className="flex items-start justify-between gap-3">
              <StatusPill>{book.status || 'bookshelf'}</StatusPill>
              <button
                aria-label={`Delete ${book.title}`}
                className="app-button app-button-secondary min-w-10 px-2"
                onClick={() => dispatch({ type: 'deleteBook', bookId: book.id })}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <h2 className="mt-3 text-lg font-black">{book.title}</h2>
            <p className="mt-1 text-sm text-[#74638d]">{book.author}</p>
            <p className="mt-4 text-sm font-bold text-[#6d4cc2]">{book.pages} pages</p>
            <div className="mt-3 grid gap-1 text-xs text-[#74638d]">
              <span>Started: {book.dateStarted || 'Not set'}</span>
              <span>Completed: {book.dateCompleted || 'Not set'}</span>
            </div>
            <div className="mt-4 flex gap-1 text-[#6d4cc2]" aria-label={`${book.rating || 0} star rating`}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star fill={(book.rating || 0) >= rating ? 'currentColor' : 'none'} key={rating} size={18} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
