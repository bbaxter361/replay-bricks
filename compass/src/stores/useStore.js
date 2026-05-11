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
      
      // Validate data structure to prevent corruption issues
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
    
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.warn('Could not clear corrupted localStorage:', clearError);
    }
  }

  // First run or corrupted data - return empty state
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

  // Validate contacts
  if (Array.isArray(data.contacts)) {
    sanitized.contacts = data.contacts.filter(contact => 
      contact && typeof contact === 'object' && 
      typeof contact.name === 'string' && contact.id
    );
  }

  // Validate events
  if (Array.isArray(data.events)) {
    sanitized.events = data.events.filter(event => 
      event && typeof event === 'object' && 
      typeof event.title === 'string' && event.id &&
      event.start && event.end
    );
  }

  // Validate chat history - most critical for our issue
  if (Array.isArray(data.chatHistory)) {
    sanitized.chatHistory = data.chatHistory
      .filter(msg => 
        msg && typeof msg === 'object' && 
        typeof msg.message === 'string' && 
        typeof msg.role === 'string' &&
        msg.id && msg.timestamp
      )
      .slice(-200); // Keep only last 200 messages to prevent performance issues
  }

  // Validate conversations
  if (Array.isArray(data.conversations)) {
    sanitized.conversations = data.conversations.filter(conv => 
      conv && typeof conv === 'object' && 
      typeof conv.title === 'string' && conv.id &&
      Array.isArray(conv.messages)
    );
  }

  // Validate books
  if (Array.isArray(data.books)) {
    sanitized.books = data.books.filter(book => 
      book && typeof book === 'object' && 
      typeof book.title === 'string' && book.id
    );
  }

  return sanitized;
}

function saveData(state) {
  console.log('💾 [DEBUG SAVE] saveData called with state keys:', Object.keys(state));
  console.log('💾 [DEBUG SAVE] chatHistory length in state:', state.chatHistory?.length || 'undefined');
  
  try {
    const toStore = {
      contacts: state.contacts,
      events: state.events,
      chatHistory: state.chatHistory,
      conversations: state.conversations,
      books: state.books
    };
    
    console.log('💾 [DEBUG SAVE] Data to store:', {
      contacts: toStore.contacts?.length || 'undefined',
      events: toStore.events?.length || 'undefined', 
      chatHistory: toStore.chatHistory?.length || 'undefined',
      conversations: toStore.conversations?.length || 'undefined',
      books: toStore.books?.length || 'undefined'
    });
    
    const stringified = JSON.stringify(toStore);
    console.log('💾 [DEBUG SAVE] Stringified data length:', stringified.length);
    
    localStorage.setItem(STORAGE_KEY, stringified);
    console.log('💾 [DEBUG SAVE] Data written to localStorage');
    
    // Verify the save was successful
    const verification = localStorage.getItem(STORAGE_KEY);
    if (!verification) {
      throw new Error('LocalStorage save verification failed');
    }
    console.log('💾 [DEBUG SAVE] Save verification successful, retrieved length:', verification.length);
    
    // Parse and verify the content
    const parsed = JSON.parse(verification);
    console.log('💾 [DEBUG SAVE] Verified parsed chatHistory length:', parsed.chatHistory?.length || 'undefined');
    
  } catch (e) {
    console.error('💾 [DEBUG SAVE] Failed to save data to localStorage:', e);
    
    // Attempt to clear corrupted data and retry once
    if (e.name === 'QuotaExceededError' || e.message.includes('storage')) {
      console.warn('💾 [DEBUG SAVE] Storage quota exceeded, attempting to clear old data...');
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          contacts: state.contacts || [],
          events: state.events || [],
          chatHistory: (state.chatHistory || []).slice(-50), // Keep only last 50 messages
          conversations: state.conversations || [],
          books: state.books || []
        }));
        console.log('💾 [DEBUG SAVE] Retry save successful after cleanup');
      } catch (retryError) {
        console.error('💾 [DEBUG SAVE] Failed to save data even after cleanup:', retryError);
      }
    }
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
    console.log('🏪 [DEBUG STORE] addChatMessage called with:', message);
    
    try {
      const newMsg = {
        ...message,
        id: uuidv4(),
        timestamp: new Date().toISOString()
      };
      
      console.log('🏪 [DEBUG STORE] Created new message object:', newMsg);
      
      set((state) => {
        console.log('🏪 [DEBUG STORE] Current state chatHistory length:', state.chatHistory?.length || 'undefined');
        console.log('🏪 [DEBUG STORE] Last few messages before add:', state.chatHistory?.slice(-2) || 'undefined');
        
        const chatHistory = [...state.chatHistory, newMsg];
        console.log('🏪 [DEBUG STORE] New chatHistory length:', chatHistory.length);
        
        // Prevent infinite growth - keep last 500 messages
        const trimmedHistory = chatHistory.length > 500 
          ? chatHistory.slice(-500) 
          : chatHistory;
          
        console.log('🏪 [DEBUG STORE] Trimmed history length:', trimmedHistory.length);
        console.log('🏪 [DEBUG STORE] Last few messages after add:', trimmedHistory.slice(-3));
          
        const newState = { ...state, chatHistory: trimmedHistory };
        
        console.log('🏪 [DEBUG STORE] About to save data to localStorage');
        saveData(newState);
        console.log('🏪 [DEBUG STORE] Data saved to localStorage');
        
        return { chatHistory: trimmedHistory };
      });
      
      console.log('🏪 [DEBUG STORE] Returning new message:', newMsg);
      return newMsg;
    } catch (error) {
      console.error('🏪 [DEBUG STORE] Failed to add chat message:', error);
      // Return a minimal message to prevent UI crashes
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
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
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
