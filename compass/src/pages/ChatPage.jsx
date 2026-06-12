// AI Chat interface - The primary feature
// Natural conversation with Spring (DeepSeek AI)
// Supports image upload for processing

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  User,
  Trash2,
  Sparkles,
  CornerDownLeft,
  Loader2,
  ImagePlus,
  X
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import { API, API_BASE, apiFetch } from '../api';
import { buildImageDocText } from '../utils/imageUploadText';
import { parseSpringActions } from '../utils/springActions';

// Color lookup for event types
const typeColors = {
  music: '#D4A855',
  art: '#9B8EC4',
  exercise: '#8CB08C',
  games: '#E88D67',
  outings: '#4A90A2',
  therapy: '#C47EB4',
  custom: '#8B9DC4',
};
function getTypeColor(type) {
  return typeColors[type] || '#8B9DC4';
}
function normalizeEventType(type) {
  if (type === 'game') return 'games';
  return typeColors[type] ? type : 'custom';
}

// Safe markdown-to-HTML: only allows <strong>, <em>, <br>, • via regex
// Escapes everything else to prevent XSS via dangerouslySetInnerHTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMessage(text) {
  // First escape all HTML to prevent XSS
  let formatted = escapeHtml(text);
  // Then apply safe markdown transformations on the escaped text
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/^- (.*)/gm, '<br/>• $1');
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

// Suggested prompts for Amanda
const suggestedPrompts = [
  "What activities work well for late-stage Alzheimer's residents?",
  "Plan a 30-minute music therapy session for 6 residents",
  "Give me a Montessori-based fine motor activity for 4 residents",
  "Suggest ideas for a men's activity group this afternoon",
];

const AI_API_ENDPOINT = API.chat;

export default function ChatPage() {
  const chatHistory = useStore(state => state.chatHistory);
  const events = useStore(state => state.events);
  const addChatMessage = useStore(state => state.addChatMessage);
  const clearChatHistory = useStore(state => state.clearChatHistory);
  const addEvent = useStore(state => state.addEvent);
  const addBook = useStore(state => state.addBook);
  const addContact = useStore(state => state.addContact);
  const deleteEvent = useStore(state => state.deleteEvent);
  const updateEvent = useStore(state => state.updateEvent);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewName, setFilePreviewName] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatHistoryRef = useRef(chatHistory);

  // Keep chatHistoryRef in sync
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [chatHistory]);

  // Focus input on mount
  useEffect(() => {
    let mounted = true;
    const focusInput = () => {
      if (mounted && inputRef.current) {
        inputRef.current.focus();
      }
    };
    const timeoutId = setTimeout(focusInput, 100);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle file selection - images AND documents
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please choose a file under 10MB.');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setSelectedImage(file);
        setSelectedFile(null);
        setFilePreviewName(null);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(file);
      setFilePreviewName(file.name);
      setSelectedImage(null);
      setImagePreview(null);
    }

    e.target.value = '';
  };

  const removeFile = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedFile(null);
    setFilePreviewName(null);
  };

  const extractImageText = async (file) => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    try {
      const { data } = await worker.recognize(file);
      return data.text || '';
    } finally {
      await worker.terminate();
    }
  };

  // Shared Spring response processor — handles all block types
  const processSpringResponse = useCallback((responseText, currentEvents) => {
    const parsedActions = parseSpringActions(responseText);
    const displayText = parsedActions.displayText || "Done. I handled that for you.";

    // Add the main response text to chat
    addChatMessage({ role: 'assistant', message: displayText });

    // Process events
    parsedActions.events.forEach((parsedEvent) => {
      const eventType = normalizeEventType(parsedEvent.type);
      const eventToAdd = {
        title: parsedEvent.title || 'Activity',
        start: new Date(parsedEvent.start).toISOString(),
        end: new Date(parsedEvent.end).toISOString(),
        type: eventType,
        description: parsedEvent.description || '',
        wing: parsedEvent.wing || 'both',
        residents: parsedEvent.residents || [],
        color: getTypeColor(eventType),
      };
      
      addEvent(eventToAdd);
      const wingLabel = eventToAdd.wing === 'memory' ? 'Memory Care' : eventToAdd.wing === 'assisted' ? 'Assisted Living' : 'Both Calendars';
      addChatMessage({
        role: 'assistant',
        message: `✅ **Added to calendar!** "${eventToAdd.title}" has been scheduled for ${new Date(parsedEvent.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(parsedEvent.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} on the **${wingLabel}** calendar. Check your calendar to see it! 📅`
      });
    });

    // Process books
    parsedActions.books.forEach((parsedBook) => {
      const bookToAdd = {
        title: parsedBook.title || 'Untitled',
        author: parsedBook.author || 'Unknown',
        pages: parsedBook.pages || 0,
        dateRead: new Date().toISOString(),
        addedBy: 'Spring'
      };
      addBook(bookToAdd);
      addChatMessage({
        role: 'assistant',
        message: `✅ **Added to your book list!** "${parsedBook.title}"${parsedBook.author ? ` by ${parsedBook.author}` : ''}${parsedBook.pages ? ` (${parsedBook.pages} pages)` : ''}. Check your Books page to see your reading stats! 📚`
      });
    });

    // Process contacts
    parsedActions.contacts.filter(contact => contact && contact.name).forEach((parsedContact) => {
      const contactToAdd = {
        name: parsedContact.name,
        phone: parsedContact.phone || '',
        email: parsedContact.email || '',
        relationship: parsedContact.relationship || 'other',
        company: parsedContact.company || '',
        title: parsedContact.title || '',
        notes: parsedContact.notes || '',
        tags: parsedContact.tags || [],
      };
      addContact(contactToAdd);
      addChatMessage({
        role: 'assistant',
        message: `✅ **Saved contact!** "${parsedContact.name}"${parsedContact.company ? ` from ${parsedContact.company}` : ''} has been added to your Contacts. Check your Contacts page! 📇`
      });
    });

    // Process deletes — use live events from store, not render-time snapshot
    parsedActions.deletes.forEach((del) => {
      const delTitle = (del.title || '').trim().toLowerCase();
      const delStart = del.start ? new Date(del.start).getTime() : null;
      const delWing = (del.wing || '').trim().toLowerCase();

      // Use currentEvents (latest) for matching, not a stale closure
      const matched = currentEvents.filter(e => {
        const titleMatch = (e.title || '').trim().toLowerCase() === delTitle;
        if (!titleMatch || !delStart) return false;
        const eventStart = new Date(e.start).getTime();
        const withinTime = Math.abs(eventStart - delStart) < 300000; // 5 min tolerance
        if (!withinTime) return false;
        if (!delWing) return true;
        const eventWing = (e.wing || '').toLowerCase();
        return eventWing === delWing || eventWing === 'both';
      });

      matched.forEach(e => {
        const eventWing = (e.wing || '').toLowerCase();
        if (eventWing === 'both' && delWing) {
          const newWing = delWing === 'memory' ? 'assisted' : 'memory';
          updateEvent(e.id, { wing: newWing });
          const newLabel = newWing === 'memory' ? 'Memory Care' : 'Assisted Living';
          const removedLabel = delWing === 'memory' ? 'Memory Care' : 'Assisted Living';
          addChatMessage({
            role: 'assistant',
            message: `🔄 **Updated!** "${e.title}" on ${new Date(e.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} moved from **${removedLabel}** to **${newLabel}** only.`
          });
        } else {
          deleteEvent(e.id);
          const wingLabel = eventWing === 'memory' ? 'Memory Care' : eventWing === 'assisted' ? 'Assisted Living' : 'Both Calendars';
          addChatMessage({
            role: 'assistant',
            message: `🗑️ **Deleted!** "${e.title}" on ${new Date(e.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} has been removed from the **${wingLabel}** calendar.`
          });
        }
      });

      if (matched.length === 0 && delTitle) {
        addChatMessage({
          role: 'assistant',
          message: `⚠️ I tried to delete "${del.title}" but couldn't find a matching event on the calendar. It may already be removed — check your calendar to confirm.`
        });
      }
    });
  }, [addChatMessage, addEvent, addBook, addContact, deleteEvent, updateEvent]);

  // Send message handler
  const handleSend = async () => {
    const message = input.trim();
    if ((!message && !selectedImage && !selectedFile) || loading || fileUploading) return;

    const currentSelectedImage = selectedImage;
    const currentSelectedFile = selectedFile;

    setInput('');
    setShowSuggestions(false);

    let userMessageText = message;
    if (!message && currentSelectedImage) {
      userMessageText = "I've shared an image — can you help me with this?";
    } else if (!message && currentSelectedFile) {
      userMessageText = `I've shared a file: ${currentSelectedFile.name} — can you help me with this?`;
    }

    const userMessage = { role: 'user', message: userMessageText };
    addChatMessage(userMessage);
    setLoading(true);

    try {
      let docText = null;
      let fileName = null;

      if (currentSelectedFile) {
        setFileUploading(true);
        const formData = new FormData();
        formData.append('file', currentSelectedFile);

        try {
          const uploadRes = await apiFetch(`${API_BASE}/api/read-file`, {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) {
            throw new Error(`File upload failed: ${uploadRes.status}`);
          }

          const fileData = await uploadRes.json();
          docText = fileData.text;
          fileName = fileData.fileName;
        } catch (fileError) {
          console.error('File upload error:', fileError);
          addChatMessage({
            role: 'assistant',
            message: "I had trouble reading that file. Please try uploading it again or try a different format."
          });
          throw fileError;
        } finally {
          setFileUploading(false);
          removeFile();
        }
      }

      if (currentSelectedImage) {
        setFileUploading(true);
        const ocrText = await extractImageText(currentSelectedImage);
        docText = buildImageDocText(currentSelectedImage.name, ocrText);
        fileName = currentSelectedImage.name;
        setFileUploading(false);
        removeFile();
      }

      const body = {
        message: userMessageText,
        history: chatHistoryRef.current.slice(-20).map(m => ({
          role: m.role,
          content: m.message
        }))
      };

      if (docText) {
        body.docText = docText;
        body.fileName = fileName;
      }

      const res = await apiFetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API Error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const responseText = data.response || '';

      // Get latest events from store for accurate delete matching
      const latestEvents = useStore.getState().events;
      processSpringResponse(responseText, latestEvents);
    } catch (err) {
      console.error('Spring API error:', err);
      const isTimeout = err.message && err.message.includes('timed out');
      addChatMessage({
        role: 'assistant',
        message: isTimeout
          ? "Spring is taking longer than usual — it's working on your request but the connection timed out. Your request is still being processed. Try sending a shorter message or try again in a moment."
          : "I'm having trouble connecting right now. This is usually temporary — please try again in a few seconds. If it keeps happening, check your internet connection."
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggestion click
  const handleSuggestion = (prompt) => {
    if (loading) return;
    
    setInput('');
    setShowSuggestions(false);
    
    const addedMsg = addChatMessage({ role: 'user', message: prompt });
    setLoading(true);

    apiFetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        history: chatHistoryRef.current.slice(-20).map(m => ({
          role: m.role,
          content: m.message
        }))
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return await res.json();
      })
      .then(data => {
        const responseText = data.response || "I'm here to help!";
        const latestEvents = useStore.getState().events;
        processSpringResponse(responseText, latestEvents);
      })
      .catch((err) => {
        console.warn('Suggestion API error:', err);
        addChatMessage({
          role: 'assistant',
          message: "I'm having trouble connecting right now. Give me a moment and try again! 🌸"
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Clear conversation
  const handleClear = () => {
    if (chatHistory.length === 0) return;
    if (!window.confirm('Clear the conversation history?')) return;
    clearChatHistory();
    setShowSuggestions(true);
  };

  // Memoize chat messages to avoid re-rendering entire history
  const chatMessages = useMemo(() => chatHistory.map((msg, i) => (
    <div
      key={msg.id}
      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          msg.role === 'assistant'
            ? 'bg-purple-500/20 text-purple-300'
            : 'bg-teal-500/20 text-teal-300'
        }`}
      >
        {msg.role === 'assistant' ? (
          <Sparkles size={16} />
        ) : (
          <User size={16} />
        )}
      </div>

      <div
        className={`message-bubble px-5 py-3.5 rounded-2xl shadow-md ${
          msg.role === 'user'
            ? 'bg-violet-50 text-gray-800 rounded-tr-md'
            : 'bg-violet-50/50 text-gray-800 rounded-tl-md'
        }`}
      >
        <p
          className="text-base leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: formatMessage(msg.message || msg.content || '') }}
        />

        <p
          className={`text-xs mt-1.5 ${
            msg.role === 'user' ? 'text-purple-600/70' : 'text-purple-700/50'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  )), [chatHistory]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-3xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-purple-300">Spring</h1>
            <p className="text-xs text-purple-400/70">Your activities planning assistant</p>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {chatHistory.length === 0 ? (
          /* Welcome state with suggestions */
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 rounded-full bg-[#1e1e3a] border-2 border-purple-300/30 flex items-center justify-center shadow-md mb-4 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
                <circle cx="50" cy="50" r="45" fill="url(#axolotl-grad-chat)" />
                <defs>
                  <radialGradient id="axolotl-grad-chat" cx="50%" cy="40%" r="55%">
                    <stop offset="0%" stopColor="#f5c6d0" />
                    <stop offset="100%" stopColor="#e8a0b8" />
                  </radialGradient>
                </defs>
                <circle cx="35" cy="42" r="5" fill="#1a1a2e" />
                <circle cx="65" cy="42" r="5" fill="#1a1a2e" />
                <circle cx="36" cy="40" r="2" fill="white" />
                <circle cx="66" cy="40" r="2" fill="white" />
                <path d="M35 58 Q50 70 65 58" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="25" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
                <circle cx="75" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
                <path d="M12 30 Q5 22 10 15" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M10 35 Q3 30 8 22" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M88 30 Q95 22 90 15" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M90 35 Q97 30 92 22" stroke="#e8a0b8" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-dark-text mb-2">
              Hi Amanda! I'm Spring 🌸
            </h2>
            <p className="text-sm text-dark-muted mb-6 max-w-md">
              I'm your activities planning assistant. Ask me about Montessori-based activities, 
              exercise programs, art projects, cognitive games, or anything for memory care and assisted living.
            </p>

            <div className="space-y-2 w-full max-w-lg">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(prompt)}
                  className="w-full text-left px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-sm text-dark-muted hover:bg-dark-hover hover:border-purple-600/30 hover:text-purple-300 transition-all shadow-md hover:shadow-lg"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <>
            {chatMessages}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-purple-300" />
                </div>
                <div className="message-bubble px-5 py-3.5 rounded-2xl rounded-tl-md bg-violet-50/50 shadow-md">
                  <div className="flex gap-1.5 items-center">
                    <Loader2 size={16} className="text-purple-500 animate-spin" />
                    <span className="text-sm text-purple-800">Spring is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <div className="relative rounded-xl overflow-hidden border border-purple-300/30 shadow-md">
            <img src={imagePreview} alt="Preview" className="max-h-32 w-auto object-contain" />
            <button
              onClick={removeFile}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[10px] text-dark-muted mt-1">Image attached</p>
        </div>
      )}
      {filePreviewName && (
        <div className="mb-2 relative inline-block">
          <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-amber-900/20 shadow-md px-4 py-3">
            <div className="flex items-center gap-3 pr-6">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm text-amber-200 font-medium truncate max-w-[200px]">{filePreviewName}</p>
                <p className="text-[10px] text-amber-400/70">{fileUploading ? 'Reading file...' : 'Ready to send'}</p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-dark-card rounded-xl border border-dark-border shadow-md p-2">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-dark-muted hover:text-purple-400 hover:bg-dark-hover rounded-lg transition-colors flex-shrink-0"
            title="Attach image or document"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.md"
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about activities, residents, or planning..."
            rows={1}
            className="flex-1 px-3 py-2.5 text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-transparent max-h-32 placeholder:text-dark-muted text-dark-text"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage && !selectedFile) || loading || fileUploading}
            className="p-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
            title="Send message"
          >
            {loading || fileUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        <div className="px-3 pb-1">
          <p className="text-[10px] text-dark-muted flex items-center gap-1">
            <CornerDownLeft size={10} />
            Enter to send · Shift+Enter for new line · 📎 Attach images, PDFs, Word docs, or Excel files
          </p>
        </div>
      </div>
    </div>
  );
}
