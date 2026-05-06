// Application data store using Zustand
// Persists data to localStorage for MVP

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'compass-app-data';

// Load data from localStorage or return empty state
function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all sections exist
      return {
        contacts: parsed.contacts || [],
        events: parsed.events || [],
        chatHistory: parsed.chatHistory || [],
        conversations: parsed.conversations || [],
        books: parsed.books || [],
        _initialized: true
      };
    }
  } catch (e) {
    console.warn('Failed to load stored data, using empty data:', e);
  }

  // First run - return empty state
  return {
    contacts: [],
    events: [],
    chatHistory: [],
    conversations: [],
    books: [],
    _initialized: true
  };
}

function saveData(state) {
  try {
    const toStore = {
      contacts: state.contacts,
      events: state.events,
      chatHistory: state.chatHistory,
      conversations: state.conversations,
      books: state.books
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

const initialData = loadData();

// Helper: get start of week (Sunday) for a given date
function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Helper: get start of month for a given date
function getStartOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

// Helper: get start of year for a given date
function getStartOfYear(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setMonth(0, 1);
  return d;
}

export const useStore = create((set, get) => ({
  // State
  contacts: initialData.contacts,
  events: initialData.events,
  chatHistory: initialData.chatHistory,
  conversations: initialData.conversations,
  books: initialData.books,
  activeConversationId: null,

  // --- Contact Actions ---
  addContact: (contact) => {
    const newContact = {
      ...contact,
      id: uuidv4(),
      tags: contact.tags || [],
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const contacts = [...state.contacts, newContact];
      saveData({ ...state, contacts });
      return { contacts };
    });
    return newContact;
  },

  updateContact: (id, updates) => {
    set((state) => {
      const contacts = state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      saveData({ ...state, contacts });
      return { contacts };
    });
  },

  deleteContact: (id) => {
    set((state) => {
      const contacts = state.contacts.filter((c) => c.id !== id);
      saveData({ ...state, contacts });
      return { contacts };
    });
  },

  getContact: (id) => {
    return get().contacts.find((c) => c.id === id);
  },

  // --- Event Actions ---
  addEvent: (event) => {
    const newEvent = {
      ...event,
      id: uuidv4(),
      residents: event.residents || [],
      wing: event.wing || 'both',
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const events = [...state.events, newEvent];
      saveData({ ...state, events });
      return { events };
    });
    return newEvent;
  },

  updateEvent: (id, updates) => {
    set((state) => {
      const events = state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      saveData({ ...state, events });
      return { events };
    });
  },

  deleteEvent: (id) => {
    set((state) => {
      const events = state.events.filter((e) => e.id !== id);
      saveData({ ...state, events });
      return { events };
    });
  },

  // --- Chat Actions ---
  addChatMessage: (message) => {
    const newMsg = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    set((state) => {
      const chatHistory = [...state.chatHistory, newMsg];
      saveData({ ...state, chatHistory });
      return { chatHistory };
    });
    return newMsg;
  },

  clearChatHistory: () => {
    set((state) => {
      saveData({ ...state, chatHistory: [] });
      return { chatHistory: [] };
    });
  },

  // --- Conversation Actions (for persistent threads) ---
  createConversation: (title) => {
    const conv = {
      id: uuidv4(),
      title: title || `Conversation ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => {
      const conversations = [...state.conversations, conv];
      saveData({ ...state, conversations });
      return { conversations, activeConversationId: conv.id };
    });
    return conv;
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  // --- Book Actions ---
  addBook: (book) => {
    const newBook = {
      ...book,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    set((state) => {
      const books = [...state.books, newBook];
      saveData({ ...state, books });
      return { books };
    });
    return newBook;
  },

  removeBook: (id) => {
    set((state) => {
      const books = state.books.filter((b) => b.id !== id);
      saveData({ ...state, books });
      return { books };
    });
  },

  getBooksTally: () => {
    const { books } = get();
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);
    const startOfYear = getStartOfYear(now);

    let thisWeek = 0;
    let thisMonth = 0;
    let thisYear = 0;

    books.forEach(book => {
      const readDate = new Date(book.dateRead);
      const pages = book.pages || 0;
      if (readDate >= startOfYear) thisYear += pages;
      if (readDate >= startOfMonth) thisMonth += pages;
      if (readDate >= startOfWeek) thisWeek += pages;
    });

    return {
      thisWeek,
      thisMonth,
      thisYear,
      totalBooks: books.length
    };
  },

  // Reset all data — clears everything
  resetAllData: () => {
    const data = {
      contacts: [],
      events: [],
      chatHistory: [],
      conversations: [],
      books: [],
      _initialized: true
    };
    set({
      ...data,
      activeConversationId: null
    });
    saveData(data);
  }
}));
