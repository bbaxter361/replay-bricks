// Books page — Amanda's reading list tracker
// Shows books read, want-to-read, stats banner, manual add/edit, and AI-driven additions from Spring

import { useState } from 'react';
import {
  BookOpen, Bookmark, Plus, Trash2, Clock, User, Hash,
  Sparkles, X, Edit3, Check, Calendar
} from 'lucide-react';
import { useStore } from '../stores/useStore';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateInput(isoStr) {
  if (!isoStr) return '';
  return isoStr.split('T')[0];
}

export default function BooksPage() {
  const { books, addBook, updateBook, removeBook, getBooksTally } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', author: '', pages: '',
    status: 'read',
    dateStart: '', dateEnd: new Date().toISOString().split('T')[0]
  });

  const tally = getBooksTally();
  const readBooks = books.filter(b => b.status !== 'want-to-read');
  const wantToRead = books.filter(b => b.status === 'want-to-read');

  const resetForm = () => {
    setFormData({
      title: '', author: '', pages: '',
      status: 'read',
      dateStart: '', dateEnd: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
  };

  const openAddForm = (status = 'read') => {
    resetForm();
    setFormData(prev => ({ ...prev, status }));
    setShowForm(true);
  };

  const openEditForm = (book) => {
    setFormData({
      title: book.title || '',
      author: book.author || '',
      pages: book.pages || '',
      status: book.status || 'read',
      dateStart: toDateInput(book.dateStart),
      dateEnd: toDateInput(book.dateEnd || book.dateRead)
    });
    setEditingId(book.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) return;

    const bookData = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      pages: parseInt(formData.pages, 10) || 0,
      status: formData.status,
      dateStart: formData.dateStart ? new Date(formData.dateStart + 'T12:00:00').toISOString() : null,
      dateEnd: formData.dateEnd ? new Date(formData.dateEnd + 'T12:00:00').toISOString() : null,
      addedBy: 'Amanda'
    };

    if (editingId) {
      updateBook(editingId, bookData);
    } else {
      addBook(bookData);
    }

    resetForm();
    setShowForm(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1e1e3a] border-2 border-violet-300/30 flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden">
          <BookOpen size={28} className="text-violet-300" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-violet-300">
            Amanda's Book List
          </h1>
          <p className="text-violet-400 mt-1">
            Track your reading journey
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md p-4 text-center">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tally.thisWeek}</p>
          <p className="text-xs text-violet-400">pages read</p>
        </div>
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md p-4 text-center">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tally.thisMonth}</p>
          <p className="text-xs text-violet-400">pages read</p>
        </div>
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md p-4 text-center">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">This Year</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tally.thisYear}</p>
          <p className="text-xs text-violet-400">pages read</p>
        </div>
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md p-4 text-center">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Books Read</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tally.totalBooks}</p>
          <p className="text-xs text-violet-400">finished</p>
        </div>
      </div>

      {/* Add Book Buttons */}
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="flex gap-2">
          <h2 className="font-semibold text-violet-700 text-lg self-center">
            {readBooks.length > 0 ? `${readBooks.length} read` : 'No books yet'}
          </h2>
          {wantToRead.length > 0 && (
            <span className="text-sm text-violet-500 self-center">
              · {wantToRead.length} want to read
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openAddForm('want-to-read')}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200 shadow-md hover:shadow-lg hover:border-amber-300 transition-all text-amber-700 font-medium text-sm"
          >
            <Bookmark size={18} />
            <span>Want to Read</span>
          </button>
          <button
            onClick={() => openAddForm('read')}
            className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all text-violet-700 font-medium text-sm"
          >
            <Plus size={18} />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Book Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-violet-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {formData.status === 'want-to-read' ? (
                  <Bookmark size={20} className="text-amber-500" />
                ) : (
                  <BookOpen size={20} className="text-violet-500" />
                )}
                <h3 className="font-semibold text-violet-700 text-lg">
                  {editingId ? 'Edit Book' : (formData.status === 'want-to-read' ? 'Add to Want to Read' : 'Add New Book')}
                </h3>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="The Name of the Wind"
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900 placeholder:text-gray-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Patrick Rothfuss"
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                <input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="722"
                  min="1"
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.status === 'want-to-read' ? 'Start Date' : 'Date Started'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateStart}
                    onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Finished</label>
                  <input
                    type="date"
                    value={formData.dateEnd}
                    onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-violet-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-violet-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600 transition-colors shadow-md"
                >
                  {editingId ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Want to Read Section */}
      {wantToRead.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark size={18} className="text-amber-500" />
            <h2 className="font-semibold text-amber-700 text-lg">Want to Read</h2>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-md overflow-hidden">
            <div className="divide-y divide-amber-200">
              {wantToRead.map((book) => (
                <BookRow key={book.id} book={book} onEdit={openEditForm} onRemove={removeBook} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Read Books Section */}
      {readBooks.length === 0 ? (
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <BookOpen size={32} className="mx-auto mb-2 opacity-20 text-gray-400" />
            <p className="text-sm text-gray-600">No finished books yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add one manually or ask Spring: "Spring, add 'Book Title' by Author to my book list"
            </p>
            <button
              onClick={() => openAddForm('read')}
              className="mt-3 text-violet-600 text-sm font-medium hover:text-violet-500"
            >
              Add your first book →
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-violet-500" />
            <h2 className="font-semibold text-violet-700 text-lg">Books Read</h2>
          </div>
          <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
            <div className="divide-y divide-violet-200">
              {readBooks.map((book) => (
                <BookRow key={book.id} book={book} onEdit={openEditForm} onRemove={removeBook} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookRow({ book, onEdit, onRemove }) {
  const isWantToRead = book.status === 'want-to-read';
  const borderColor = isWantToRead ? 'border-amber-200' : 'border-violet-200';
  const bgHover = isWantToRead ? 'hover:bg-amber-100' : 'hover:bg-violet-100';
  const iconColor = isWantToRead ? 'text-amber-500' : 'text-violet-500';
  const iconBg = isWantToRead ? 'bg-amber-100 border-amber-200' : 'bg-violet-100 border-violet-200';

  return (
    <div className={`px-5 py-4 ${bgHover} transition-colors`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg border ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {isWantToRead ? <Bookmark size={20} className={iconColor} /> : <BookOpen size={20} className={iconColor} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">
            {book.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={12} />
              {book.author}
            </span>
            {book.pages > 0 && (
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {book.pages} pages
              </span>
            )}
            {book.dateStart && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(book.dateStart)}
                {book.dateEnd && ` — ${formatDate(book.dateEnd)}`}
              </span>
            )}
            {!book.dateStart && book.dateEnd && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDate(book.dateEnd)}
              </span>
            )}
            {!book.dateStart && !book.dateEnd && isWantToRead && (
              <span className="flex items-center gap-1 text-amber-600">
                <Bookmark size={12} />
                Not started yet
              </span>
            )}
          </div>
          <div className="mt-1.5">
            {book.addedBy === 'Spring' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-200 text-violet-700">
                <Sparkles size={10} />
                Added by Spring
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                Added by Amanda
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(book)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
            title="Edit book"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onRemove(book.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove book"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
