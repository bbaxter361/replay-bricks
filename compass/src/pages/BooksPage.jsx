// Books page — Amanda's reading list tracker
// Shows books read, stats banner, and AI-driven additions from Spring

import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  User,
  Hash,
  Sparkles,
  X
} from 'lucide-react';
import { useStore } from '../stores/useStore';

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BooksPage() {
  const { books, addBook, removeBook, getBooksTally } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', pages: '', dateRead: new Date().toISOString().split('T')[0] });

  const tally = getBooksTally();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) return;

    addBook({
      title: formData.title.trim(),
      author: formData.author.trim(),
      pages: parseInt(formData.pages, 10) || 0,
      dateRead: formData.dateRead ? new Date(formData.dateRead + 'T12:00:00').toISOString() : new Date().toISOString(),
      addedBy: 'Amanda'
    });

    setFormData({ title: '', author: '', pages: '', dateRead: new Date().toISOString().split('T')[0] });
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
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Total Books</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{tally.totalBooks}</p>
          <p className="text-xs text-violet-400">finished</p>
        </div>
      </div>

      {/* Add Book Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-violet-700 text-lg">
          {books.length > 0 ? `${books.length} book${books.length !== 1 ? 's' : ''} tracked` : 'No books yet'}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300 transition-all text-violet-700 font-medium text-sm"
        >
          <Plus size={18} />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Add Book Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-violet-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-violet-500" />
                <h3 className="font-semibold text-violet-700 text-lg">Add New Book</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Read</label>
                <input
                  type="date"
                  value={formData.dateRead}
                  onChange={(e) => setFormData({ ...formData, dateRead: e.target.value })}
                  className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-violet-50 text-gray-900"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-violet-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-violet-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600 transition-colors shadow-md"
                >
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book List */}
      {books.length === 0 ? (
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
          <div className="p-8 text-center text-gray-500">
            <BookOpen size={32} className="mx-auto mb-2 opacity-20 text-gray-400" />
            <p className="text-sm text-gray-600">No books on your list yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add one manually or ask Spring: "Spring, add 'Book Title' by Author to my book list, N pages"
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-violet-600 text-sm font-medium hover:text-violet-500"
            >
              Add your first book →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-violet-50 rounded-xl border border-violet-200 shadow-md overflow-hidden">
          <div className="divide-y divide-violet-200">
            {books.map((book) => (
              <div
                key={book.id}
                className="px-5 py-4 hover:bg-violet-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Book icon */}
                  <div className="w-10 h-10 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(book.dateRead)}
                      </span>
                    </div>
                    {/* Added by badge */}
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
                  {/* Delete button */}
                  <button
                    onClick={() => removeBook(book.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove book"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
