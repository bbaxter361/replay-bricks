function isoDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function legacyBookId(book, title, author) {
  if (book.id) return book.id;
  return `legacy-book-${slug(title)}${author ? `-${slug(author)}` : ''}`;
}

export function mapLegacyEvents(events = []) {
  return events
    .filter((event) => event && event.id && event.title && event.start && event.end)
    .map((event) => ({
      id: event.id,
      activityId: event.activityId || event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      wing: event.wing || 'both',
      location: event.location || '',
      description: event.description || '',
      type: event.type || 'custom',
      residents: event.residents || [],
      supplies: event.supplies || [],
    }));
}

export function mapLegacyContacts(contacts = []) {
  return contacts
    .filter((contact) => contact && contact.id && contact.name)
    .map((contact) => ({
      id: contact.id,
      residentId: contact.residentId || contact.resident || '',
      name: contact.name,
      relationship: contact.relationship || 'family',
      phone: contact.phone || '',
      email: contact.email || '',
      company: contact.company || '',
      title: contact.title || '',
      notes: contact.notes || '',
      tags: contact.tags || [],
      createdAt: contact.createdAt || '',
    }));
}

export function mapLegacyBooks(books = []) {
  return books
    .map((book) => {
      const title = book?.title || book?.bookTitle || book?.name || '';
      const author = book?.author || book?.writer || '';
      if (!book || !title) return null;

      return {
        id: legacyBookId(book, title, author),
        title,
        author,
        pages: Number(book.pages || book.pageCount || 0),
        dateStarted: book.dateStarted || book.startedAt || '',
        dateCompleted: book.dateCompleted || isoDateOnly(book.dateRead || book.completedAt || book.finishedAt),
        rating: Number(book.rating || 0),
        status: book.status || 'bookshelf',
        addedBy: book.addedBy || '',
        createdAt: book.createdAt || book.dateRead || book.completedAt || '',
      };
    })
    .filter(Boolean);
}

export function mapLegacyChatHistory(chatHistory = []) {
  return chatHistory
    .filter((message) => message && message.id && message.role && message.message)
    .slice(-100)
    .map((message) => ({
      id: message.id,
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.message,
      createdAt: message.timestamp || message.createdAt || new Date().toISOString(),
    }));
}

export function mergeLegacyCompassData(state, legacyData) {
  const contacts = mapLegacyContacts(legacyData.contacts);
  const calendarEvents = mapLegacyEvents(legacyData.events);
  const books = mapLegacyBooks(legacyData.books);
  const springMessages = mapLegacyChatHistory(legacyData.chatHistory);
  const restoredCount = contacts.length + calendarEvents.length + books.length + springMessages.length;

  if (restoredCount === 0) return state;

  return {
    ...state,
    contacts: contacts.length > 0 ? contacts : state.contacts,
    calendarEvents: calendarEvents.length > 0 ? calendarEvents : state.calendarEvents,
    books: books.length > 0 ? books : state.books,
    springMessages: springMessages.length > 0 ? springMessages : state.springMessages,
    legacyRestore: {
      restoredAt: new Date().toISOString(),
      contacts: contacts.length,
      calendarEvents: calendarEvents.length,
      books: books.length,
      springMessages: springMessages.length,
    },
  };
}
