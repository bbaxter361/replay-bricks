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
import { API, API_BASE, API_KEY, apiFetch } from '../api';
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

// Suggested prompts for Amanda
const suggestedPrompts = [
  "What activities work well for late-stage Alzheimer's residents?",
  "Plan a 30-minute music therapy session for 6 residents",
  "Give me a Montessori-based fine motor activity for 4 residents",
  "Suggest ideas for a men's activity group this afternoon",
];

const AI_API_ENDPOINT = API.chat;

export default function ChatPage() {
  const { chatHistory, addChatMessage, clearChatHistory, addEvent, addBook, addContact, deleteEvent, events } = useStore();  const [input, setInput] = useState('');
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

  // Auto-scroll to bottom with cleanup
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    // Small delay to ensure messages are rendered
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [chatHistory]);

  // Focus input on mount with cleanup
  useEffect(() => {
    let mounted = true;
    
    const focusInput = () => {
      if (mounted && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Small delay to ensure component is fully mounted
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

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please choose a file under 10MB.');
      return;
    }

    // Check if it's an image
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
      // It's a document - show filename
      setSelectedFile(file);
      setFilePreviewName(file.name);
      setSelectedImage(null);
      setImagePreview(null);
    }

    // Reset file input so user can re-select the same file
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

  // Send message handler — calls DeepSeek via backend proxy
  const handleSend = async () => {
    console.log('🚀 [DEBUG] handleSend called');
    
    const message = input.trim();
    if ((!message && !selectedImage && !selectedFile) || loading || fileUploading) {
      console.log('❌ [DEBUG] handleSend aborted - empty message or already loading');
      return;
    }

    // Store references to avoid stale closures
    const currentChatHistory = chatHistory;
    const currentSelectedImage = selectedImage;
    const currentSelectedFile = selectedFile;

    console.log('📝 [DEBUG] Current chat history length:', currentChatHistory.length);
    console.log('📝 [DEBUG] User message:', message);

    setInput('');
    setShowSuggestions(false);

    // Build user message text
    let userMessageText = message;
    if (!message && currentSelectedImage) {
      userMessageText = "I've shared an image — can you help me with this?";
    } else if (!message && currentSelectedFile) {
      userMessageText = `I've shared a file: ${currentSelectedFile.name} — can you help me with this?`;
    }

    // Add user message to chat first
    const userMessage = { role: 'user', message: userMessageText };
    console.log('➕ [DEBUG] Adding user message to store:', userMessage);
    
    const addedUserMsg = addChatMessage(userMessage);
    console.log('✅ [DEBUG] User message added, returned:', addedUserMsg);
    console.log('📊 [DEBUG] Chat history length after user message:', chatHistory?.length || 'undefined');

    setLoading(true);

    try {
      let docText = null;
      let fileName = null;

      // If it's a document, upload to /api/read-file first
      if (currentSelectedFile) {
        setFileUploading(true);
        const formData = new FormData();
        formData.append('file', currentSelectedFile);

        try {
          // Add explicit debugging and error handling for file uploads
          const uploadUrl = `${API_BASE}/api/read-file`;
          console.log('🔍 FILE UPLOAD ATTEMPT:', {
            url: uploadUrl,
            apiBase: API_BASE,
            fileSize: currentSelectedFile.size,
            fileName: currentSelectedFile.name
          });

          const uploadRes = await apiFetch(uploadUrl, {
            method: 'POST',
            body: formData
          });

          console.log('📡 FILE UPLOAD RESPONSE:', {
            status: uploadRes.status,
            statusText: uploadRes.statusText,
            url: uploadRes.url,
            ok: uploadRes.ok
          });

          if (!uploadRes.ok) {
            // Get the actual error response
            const errorText = await uploadRes.text();
            console.error('❌ FILE UPLOAD ERROR RESPONSE:', errorText);
            
            // If we get the "computer offline" message, show helpful error
            if (errorText.includes('computer is turned off') || errorText.includes('offline')) {
              throw new Error('File upload routing error: Request intercepted by old proxy. Contact support to fix DNS/CDN routing.');
            }
            
            throw new Error(`File upload failed: ${uploadRes.status} - ${errorText}`);
          }

          const fileData = await uploadRes.json();
          console.log('✅ FILE UPLOAD SUCCESS:', {
            textLength: fileData.text?.length || 0,
            fileName: fileData.fileName
          });
          
          docText = fileData.text;
          fileName = fileData.fileName;
        } catch (fileError) {
          console.error('File upload error:', fileError);
          
          // If we got the routing error, try direct Netlify API call as backup
          if (fileError.message.includes('routing error') || fileError.message.includes('offline')) {
            console.log('🔄 TRYING BACKUP DIRECT NETLIFY CALL...');
            try {
              // Direct call to Netlify backend bypassing any potential proxy
              const backupRes = await fetch('https://replaybrick.com/api/read-file', {
                method: 'POST',
                headers: {
                  ...(API_KEY ? { 'x-api-key': API_KEY } : {})
                },
                body: formData
              });
              
              if (backupRes.ok) {
                const fileData = await backupRes.json();
                console.log('✅ BACKUP CALL SUCCESS!');
                docText = fileData.text;
                fileName = fileData.fileName;
              } else {
                throw fileError; // Use original error
              }
            } catch (backupError) {
              console.error('❌ BACKUP CALL ALSO FAILED:', backupError);
              throw fileError; // Use original error
            }
          } else {
            addChatMessage({
              role: 'assistant',
              message: "I had trouble reading that file. Please try uploading it again or try a different format."
            });
            throw fileError;
          }
        } finally {
          setFileUploading(false);
          removeFile();
        }
      }

      // Images are OCR'd in-browser and sent as text because DeepSeek's
      // production chat API accepts text messages, not image_url parts.
      if (selectedImage) {
        setFileUploading(true);
        const ocrText = await extractImageText(selectedImage);
        docText = buildImageDocText(selectedImage.name, ocrText);
        fileName = selectedImage.name;
        setFileUploading(false);
        removeFile();
      }

      // Send to backend API
      const body = {
        message: userMessageText,
        history: chatHistoryRef.current.slice(-20).map(m => ({
          role: m.role,
          content: m.message
        }))
      };

      console.log('🌐 [DEBUG] API request body prepared:', {
        message: body.message,
        historyLength: body.history.length
      });

      // Add document text if present
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

      let responseText = data.response || '';
        console.log('📋 [DEBUG] Raw API response data:', data);
        
        console.log('📋 [DEBUG] Extracted response text:', responseText);
        console.log('📋 [DEBUG] Response text length:', responseText.length);
        console.log('📋 [DEBUG] Response text trimmed length:', responseText.trim().length);

      const parsedActions = parseSpringActions(responseText);
      responseText = parsedActions.displayText || "Done. I handled that for you.";

      // Add the main response text to the chat
      addChatMessage({
        role: 'assistant',
        message: responseText
      });

      // If Spring created calendar events, add them
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

      // If Spring added books, add them
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

      // If Spring extracted contacts, add them
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

      // If Spring wants to delete events, match and remove them
      parsedActions.deletes.forEach((del) => {
        const delTitle = (del.title || '').trim().toLowerCase();
        const delStart = del.start ? new Date(del.start).getTime() : null;
        const delWing = (del.wing || '').trim().toLowerCase();

        // Match against current events by title + start time (within 2-minute tolerance)
        const matched = events.filter(e => {
          const titleMatch = (e.title || '').trim().toLowerCase() === delTitle;
          if (!titleMatch || !delStart) return false;
          const eventStart = new Date(e.start).getTime();
          const withinTime = Math.abs(eventStart - delStart) < 120000; // 2 min
          if (delWing) {
            return withinTime && (e.wing || '').toLowerCase() === delWing;
          }
          return withinTime;
        });

        matched.forEach(e => {
          deleteEvent(e.id);
          const wingLabel = e.wing === 'memory' ? 'Memory Care' : e.wing === 'assisted' ? 'Assisted Living' : 'Both Calendars';
          addChatMessage({
            role: 'assistant',
            message: `🗑️ **Deleted!** "${e.title}" on ${new Date(e.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} has been removed from the **${wingLabel}** calendar.`
          });
        });

        if (matched.length === 0 && delTitle) {
          addChatMessage({
            role: 'assistant',
            message: `⚠️ I tried to delete "${del.title}" but couldn't find a matching event on the calendar. It may already be removed — check your calendar to confirm.`
          });
        }
      });
    } catch (err) {
      console.error('Spring API error:', err);
      addChatMessage({
        role: 'assistant',
        message: "I'm having trouble connecting right now. Let me try again — give me a moment! 🌸"
      });
    } finally {
      setLoading(false);    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle suggestion click - fixed race condition
  const handleSuggestion = (prompt) => {
    console.log('🎯 [DEBUG] handleSuggestion called with:', prompt);
    
    if (loading) {
      console.log('❌ [DEBUG] handleSuggestion aborted - already loading');
      return; // Prevent multiple simultaneous requests
    }
    
    setInput(''); // Clear input immediately 
    setShowSuggestions(false);
    
    // Add user message immediately
    console.log('➕ [DEBUG] Adding suggestion user message to store');
    const addedMsg = addChatMessage({ role: 'user', message: prompt });
    console.log('✅ [DEBUG] Suggestion user message added:', addedMsg);
    
    setLoading(true);

    // Send to backend with proper error handling
    console.log('📡 [DEBUG] Sending suggestion request to API');
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
        console.log('📡 [DEBUG] Suggestion API response status:', res.status);
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        return await res.json();
      })
      .then(data => {
        console.log('📋 [DEBUG] Suggestion API response data:', data);
        const responseText = data.response || "I'm here to help!";
        console.log('📋 [DEBUG] Suggestion response text:', responseText);
        
        console.log('➕ [DEBUG] Adding suggestion AI response to store');
        const addedAiMsg = addChatMessage({ role: 'assistant', message: responseText });
        console.log('✅ [DEBUG] Suggestion AI response added:', addedAiMsg);
      })
      .catch((err) => {
        console.warn('❌ [DEBUG] Suggestion API error:', err);
        addChatMessage({
          role: 'assistant',
          message: "I'm having trouble connecting right now. Give me a moment and try again! 🌸"
        });
      })
      .finally(() => {
        setLoading(false);
        console.log('🏁 [DEBUG] handleSuggestion completed');
      });
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
        {(() => {
          console.log('🖥️ [DEBUG UI] Rendering messages area');
          console.log('🖥️ [DEBUG UI] chatHistory:', chatHistory);
          console.log('🖥️ [DEBUG UI] chatHistory.length:', chatHistory.length);
          console.log('🖥️ [DEBUG UI] chatHistory type:', typeof chatHistory);
          console.log('🖥️ [DEBUG UI] chatHistory is array:', Array.isArray(chatHistory));
          
          if (chatHistory.length > 0) {
            console.log('🖥️ [DEBUG UI] Last few messages:', chatHistory.slice(-3));
          }
          
          return null; // This is just for debugging, doesn't render anything
        })()}
        
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
            {(() => {
              console.log('🖥️ [DEBUG UI] Rendering chat messages');
              console.log('🖥️ [DEBUG UI] About to map over chatHistory with length:', chatHistory.length);
              return null;
            })()}
            
            {chatHistory.map((msg, index) => {
              console.log('🖥️ [DEBUG UI] Rendering message', index, ':', msg);
              return (
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
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.message || msg.content || '') }}
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
              );
            })}

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

      {/* File preview - image or document */}
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
          {/* File upload button - images + docs */}
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

        {/* Hint */}
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
