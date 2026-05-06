// AI Chat interface - The primary feature
// Natural conversation with Spring (DeepSeek AI)
// Supports image upload for processing

import { useState, useRef, useEffect } from 'react';
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
import { API } from '../api';

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

// Suggested prompts for Amanda
const suggestedPrompts = [
  "What activities work well for late-stage Alzheimer's residents?",
  "Plan a 30-minute music therapy session for 6 residents",
  "Give me a Montessori-based fine motor activity for 4 residents",
  "Suggest ideas for a men's activity group this afternoon",
];

const AI_API_ENDPOINT = API.chat;

export default function ChatPage() {
  const { chatHistory, addChatMessage, clearChatHistory, addEvent, addBook } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 10MB.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setSelectedImage(file);
    };
    reader.readAsDataURL(file);

    // Reset file input so user can re-select the same file
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Convert File to base64 for sending to API
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Strip the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Send message handler — calls DeepSeek via backend proxy
  const handleSend = async () => {
    const message = input.trim();
    if ((!message && !selectedImage) || loading) return;

    setInput('');
    setShowSuggestions(false);

    // Build user message content
    let userMessageText = message;
    if (!message && selectedImage) {
      userMessageText = "I've shared an image — can you help me with this?";
    }

    // Add user message to chat
    addChatMessage({ role: 'user', message: userMessageText });

    setLoading(true);

    try {
      // Send to backend API
      const body = {
        message: userMessageText,
        history: chatHistory.slice(-20).map(m => ({
          role: m.role,
          content: m.message
        }))
      };

      // Add image if selected
      if (selectedImage) {
        const base64Image = await fileToBase64(selectedImage);
        body.image = base64Image;
        removeImage();
      }

      const res = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let responseText = '';
      let parsedEvent = null;
      let parsedBook = null;

      if (res.ok) {
        const data = await res.json();
        responseText = data.response || '';
      } else {
        throw new Error('API not available');
      }

      // Check for embedded calendar events
      const eventMatch = responseText.match(/===EVENT===\n?([\s\S]*?)\n?===END===/);
      if (eventMatch) {
        try {
          parsedEvent = JSON.parse(eventMatch[1]);
        } catch (e) {
          console.warn('Failed to parse event block:', e);
        }
        // Remove the event block from the display message
        responseText = responseText.replace(/===EVENT===\n?[\s\S]*?\n?===END===/, '').trim();
      }

      // Check for embedded book additions
      const bookMatch = responseText.match(/===BOOK===\n?([\s\S]*?)\n?===END===/);
      if (bookMatch) {
        try {
          parsedBook = JSON.parse(bookMatch[1]);
        } catch (e) {
          console.warn('Failed to parse book block:', e);
        }
        // Remove the book block from the display message
        responseText = responseText.replace(/===BOOK===\n?[\s\S]*?\n?===END===/, '').trim();
      }

      addChatMessage({ role: 'assistant', message: responseText });

      // If Spring created a calendar event, add it
      if (parsedEvent) {
        const eventToAdd = {
          title: parsedEvent.title || 'Activity',
          start: new Date(parsedEvent.start).toISOString(),
          end: new Date(parsedEvent.end).toISOString(),
          type: parsedEvent.type || 'custom',
          description: parsedEvent.description || '',
          wing: parsedEvent.wing || 'both',
          residents: parsedEvent.residents || [],
          color: getTypeColor(parsedEvent.type),
        };
        addEvent(eventToAdd);
        // Add a system message confirming the event was added
        const wingLabel = eventToAdd.wing === 'memory' ? 'Memory Care' : eventToAdd.wing === 'assisted' ? 'Assisted Living' : 'Both Calendars';
        addChatMessage({
          role: 'assistant',
          message: `✅ **Added to calendar!** "${eventToAdd.title}" has been scheduled for ${new Date(parsedEvent.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(parsedEvent.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} on the **${wingLabel}** calendar. Check your calendar to see it! 📅`
        });
      }

      // If Spring added a book, add it
      if (parsedBook) {
        addBook({
          title: parsedBook.title || 'Untitled',
          author: parsedBook.author || 'Unknown',
          pages: parsedBook.pages || 0,
          dateRead: new Date().toISOString(),
          addedBy: 'Spring'
        });
        // Add a system message confirming the book was added
        addChatMessage({
          role: 'assistant',
          message: `✅ **Added to your book list!** "${parsedBook.title}"${parsedBook.author ? ` by ${parsedBook.author}` : ''}${parsedBook.pages ? ` (${parsedBook.pages} pages)` : ''}. Check your Books page to see your reading stats! 📚`
        });
      }
    } catch (err) {
      // Fallback if API is down
      addChatMessage({
        role: 'assistant',
        message: "I'm having trouble connecting to my brain right now. Please make sure the Compass API server is running (`node server.js` in the compass directory). 🙏"
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
    setInput(prompt);
    setShowSuggestions(false);
    // Small delay then send
    setTimeout(() => {
      setInput('');
      addChatMessage({ role: 'user', message: prompt });
      setLoading(true);

      // Send to backend
      fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: chatHistory.slice(-20).map(m => ({
            role: m.role,
            content: m.message
          }))
        })
      })
        .then(res => res.json())
        .then(data => {
          addChatMessage({ role: 'assistant', message: data.response || "I'm here to help!" });
        })
        .catch(() => {
          addChatMessage({
            role: 'assistant',
            message: "Hi Amanda! I'm Spring, your activities planning assistant. I'd love to help you plan something wonderful today!"
          });
        })
        .finally(() => setLoading(false));
    }, 100);
  };

  // Clear conversation
  const handleClear = () => {
    if (chatHistory.length > 1 && !window.confirm('Clear the conversation history?')) return;
    clearChatHistory();
    setShowSuggestions(true);
  };

  // Format message text (simple markdown-like)
  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/^- (.*)/gm, '<br/>• $1');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

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
                {/* Axolotl face - cute smile */}
                <circle cx="50" cy="50" r="45" fill="url(#axolotl-grad)" />
                <defs>
                  <radialGradient id="axolotl-grad" cx="50%" cy="40%" r="55%">
                    <stop offset="0%" stopColor="#f5c6d0" />
                    <stop offset="100%" stopColor="#e8a0b8" />
                  </radialGradient>
                </defs>
                {/* Eyes */}
                <circle cx="35" cy="42" r="5" fill="#1a1a2e" />
                <circle cx="65" cy="42" r="5" fill="#1a1a2e" />
                <circle cx="36" cy="40" r="2" fill="white" />
                <circle cx="66" cy="40" r="2" fill="white" />
                {/* Happy smile */}
                <path d="M35 58 Q50 70 65 58" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Cheek blush */}
                <circle cx="25" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
                <circle cx="75" cy="52" r="6" fill="#ff9eb5" opacity="0.4" />
                {/* Gill tufts (axolotl signature) */}
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
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
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

                {/* Message bubble - very light purple */}
                <div
                  className={`message-bubble px-5 py-3.5 rounded-2xl shadow-md ${
                    msg.role === 'user'
                      ? 'bg-violet-50 text-gray-800 rounded-tr-md'
                      : 'bg-violet-50/50 text-gray-800 rounded-tl-md'
                  }`}
                >
                  <p
                    className="text-base leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
                  />

                  {/* Timestamp */}
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
            ))}

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

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <div className="relative rounded-xl overflow-hidden border border-purple-300/30 shadow-md">
            <img src={imagePreview} alt="Preview" className="max-h-32 w-auto object-contain" />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[10px] text-dark-muted mt-1">Image attached — will be sent with your message</p>
        </div>
      )}

      {/* Input area */}
      <div className="bg-dark-card rounded-xl border border-dark-border shadow-md p-2">
        <div className="flex items-end gap-2">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-dark-muted hover:text-purple-400 hover:bg-dark-hover rounded-lg transition-colors flex-shrink-0"
            title="Attach image"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
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
            disabled={(!input.trim() && !selectedImage) || loading}
            className="p-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
            title="Send message"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Hint */}
        <div className="px-3 pb-1">
          <p className="text-[10px] text-dark-muted flex items-center gap-1">
            <CornerDownLeft size={10} />
            Enter to send · Shift+Enter for new line · 📷 Attach images for Spring to analyze
          </p>
        </div>
      </div>
    </div>
  );
}
