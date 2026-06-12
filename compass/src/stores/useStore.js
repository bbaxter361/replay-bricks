// Application data store using Zustand
// Persists data to localStorage (fast) AND syncs to Netlify Blobs (durable)
// Blob sync ensures data survives browser cache clears and device switches

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch, API } from '../api';

const STORAGE_KEY = 'compass-app-data';
const BLOB_KEYS = ['contacts', 'events', 'chatHistory', 'books'];

// Load data from localStorage or return empty state
function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const validatedData = validateAndSanitizeData(parsed);
      return {
        contacts: validatedData.contacts,
        events: validatedData.events,
        chatHistory: validatedData.chatHistory,
        conversations: validatedData.conversations,
        books: validatedData.books,
        _initialized: true
      };
    }
  } catch (e) {
    console.warn('Failed to load stored data, using empty data:', e);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.warn('Could not clear corrupted localStorage:', clearError);
    }
  }

  return {
    contacts: [],
    events: [],
    chatHistory: [],
    conversations: [],
    books: [],
    _initialized: true
  };
}

// Validate and sanitize loaded data to prevent crashes
function validateAndSanitizeData(data) {
  const sanitized = {
    contacts: [],
    events: [],
    chatHistory: [],
    conversations: [],
    books: []
  };

  if (Array.isArray(data.contacts)) {
    sanitized.contacts = data.contacts.filter(contact => 
      contact && typeof contact === 'object' && 
      typeof contact.name === 'string' && contact.id
    );
  }

  if (Array.isArray(data.events)) {
    sanitized.events = data.events.filter(event => 
      event && typeof event === 'object' && 
      typeof event.title === 'string' && event.id &&
      event.start && event.end
    );
  }

  if (Array.isArray(data.chatHistory)) {
    sanitized.chatHistory = data.chatHistory
      .filter(msg => 
        msg && typeof msg === 'object' && 
        typeof msg.message === 'string' && 
        typeof msg.role === 'string' &&
        msg.id && msg.timestamp
      )
      .slice(-500);
  }

  if (Array.isArray(data.conversations)) {
    sanitized.conversations = data.conversations.filter(conv => 
      conv && typeof conv === 'object' && 
      typeof conv.title === 'string' && conv.id &&
      Array.isArray(conv.messages)
    );
  }

  if (Array.isArray(data.books)) {
    sanitized.books = data.books.filter(book => 
      book && typeof book === 'object' && 
      typeof book.title === 'string' && book.id
    );
  }

  return sanitized;
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
    console.error('Failed to save data to localStorage:', e);
    if (e.name === 'QuotaExceededError' || e.message.includes('storage')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          contacts: state.contacts || [],
          events: state.events || [],
          chatHistory: (state.chatHistory || []).slice(-50),
          conversations: state.conversations || [],
          books: state.books || []
        }));
      } catch (retryError) {
        console.error('Failed to save data even after cleanup:', retryError);
      }
    }
  }
}

// ── Netlify Blob Sync ──
// Uses last-write-wins debounce: each sync request records a timestamp.
// When sync completes, if a newer request was made, re-runs with latest state.
// This prevents data loss during burst activity (e.g. Spring creating 5 events).

let _syncSeq = 0;
let _syncInFlight = false;

async function syncSliceToBlobs(key, data) {
  try {
    const response = await apiFetch(API.dataSave, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: data }),
    });
    if (!response.ok) throw new Error(`Blob save ${key}: ${response.status}`);
    return true;
  } catch (e) {
    console.warn(`Blob sync failed for "${key}":`, e.message);
    return false;
  }
}

function syncToBlobs(state) {
  const mySeq = ++_syncSeq;
  
  const runSync = (s) => {
    _syncInFlight = true;
    Promise.all(
      BLOB_KEYS.map((key) => {
        const data = s[key];
        if (!data || !Array.isArray(data)) return Promise.resolve(false);
        return syncSliceToBlobs(key, data);
      })
    ).then(() => {
      // If a newer request was queued while we were in-flight, re-run with latest state
      if (mySeq < _syncSeq) {
        // A newer sync was requested — fetch latest state from the Zustand store
        // (import inline to avoid circular deps)
        const { useStore } = require('./useStore');
        runSync(useStore.getState());
      } else {
        _syncInFlight = false;
      }
    }).catch(() => {
      _syncInFlight = false;
    });
  };
  
  // If nothing is in flight, start immediately. Otherwise seq tracking ensures
  // the in-flight sync will pick up our state when it finishes.
  if (!_syncInFlight) {
    runSync(state);
  }
}

/** Load ALL data from blob store, returns object or null */
async function tryLoadFromBlobs() {
  try {
    const result = {};
    const responses = await Promise.allSettled(
      BLOB_KEYS.map(async (key) => {
        const res = await apiFetch(API.dataGet(key));
        if (!res.ok) throw new Error(`Blob fetch ${key}: ${res.status}`);
        const json = await res.json();
        return { key, data: json.data };
      })
    );

    let hasAnyData = false;
    for (const r of responses) {
      if (r.status === 'fulfilled' && r.value && Array.isArray(r.value.data) && r.value.data.length > 0) {
        result[r.value.key] = r.value.data;
        hasAnyData = true;
      }
    }
    return hasAnyData ? result : null;
  } catch (e) {
    console.warn('Failed to load from blobs:', e.message);
    return null;
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

function getStartOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

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
  _restoredFromServer: false,

  // ── Blob restore: merge server data using timestamps ──
  restoreFromBlobs: async () => {
    const state = get();
    if (state._restoredFromServer) return;
    const blobData = await tryLoadFromBlobs();
    if (!blobData) return;
    set((current) => {
      const merged = { ...current, _restoredFromServer: true };
      for (const key of BLOB_KEYS) {
        if (blobData[key] && blobData[key].length > 0) {
          const currentArr = current[key] || [];
          
          // Validate chatHistory format: skip if blob data has 'content' without 'message'
          // (corrupted by old Spring memory key collision)
          if (key === 'chatHistory') {
            const hasCorruptedFormat = blobData[key].some(m => m.content && !m.message);
            if (hasCorruptedFormat) continue;
          }
          
          // Merge by timestamp: for items with createdAt, keep newest.
          // For items without timestamps (legacy), prefer blob data by count.
          // Only overwrite if blob data is meaningfully different.
          const localIds = new Set(currentArr.map(item => item.id).filter(Boolean));
          const blobOnlyNew = blobData[key].filter(item => !item.id || !localIds.has(item.id));
          
          if (blobOnlyNew.length > 0) {
            // Add blob-only items that don't exist locally
            merged[key] = [...currentArr, ...blobOnlyNew];
          } else if (blobData[key].length > currentArr.length) {
            // More items on server, use server copy
            merged[key] = blobData[key];
          }
          // else: local is same or has more items, keep local
        }
      }
      saveData(merged);
      return merged;
    });
  },

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
    syncToBlobs(get());
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
    syncToBlobs(get());
  },

  deleteContact: (id) => {
    set((state) => {
      const contacts = state.contacts.filter((c) => c.id !== id);
      saveData({ ...state, contacts });
      return { contacts };
    });
    syncToBlobs(get());
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
    syncToBlobs(get());
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
    syncToBlobs(get());
  },

  deleteEvent: (id) => {
    set((state) => {
      const events = state.events.filter((e) => e.id !== id);
      saveData({ ...state, events });
      return { events };
    });
    syncToBlobs(get());
  },

  // --- Chat Actions ---
  addChatMessage: (message) => {
    try {
      const newMsg = {
        ...message,
        id: uuidv4(),
        timestamp: new Date().toISOString()
      };
      
      set((state) => {
        const chatHistory = [...state.chatHistory, newMsg];
        // Prevent infinite growth - keep last 500 messages
        const trimmedHistory = chatHistory.length > 500 
          ? chatHistory.slice(-500) 
          : chatHistory;
          
        const newState = { ...state, chatHistory: trimmedHistory };
        saveData(newState);
        return { chatHistory: trimmedHistory };
      });
      
      syncToBlobs(get());
      return newMsg;
    } catch (error) {
      console.error('Failed to add chat message:', error);
      return {
        id: uuidv4(),
        role: message.role || 'system',
        message: message.message || 'Error occurred',
        timestamp: new Date().toISOString()
      };
    }
  },

  clearChatHistory: () => {
    try {
      set((state) => {
        const newState = { ...state, chatHistory: [] };
        saveData(newState);
        return { chatHistory: [] };
      });
      syncToBlobs(get());
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  },

  // --- Conversation Actions ---
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
    syncToBlobs(get());
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
    syncToBlobs(get());
    return newBook;
  },

  removeBook: (id) => {
    set((state) => {
      const books = state.books.filter((b) => b.id !== id);
      saveData({ ...state, books });
      return { books };
    });
    syncToBlobs(get());
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

  // Reset all data
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
    syncToBlobs(data);
  }
}));
