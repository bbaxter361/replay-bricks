import { CalendarPlus, FilePlus2, Paperclip, Send, UsersRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { loadSpringBrainMemories, sendSpringChat, uploadSpringFile } from '../services/springApi.js';
import { useAppState } from '../state/appState';
import { applySpringActionsToDispatch, hasSpringActions } from '../utils/applySpringActions.js';
import { parseSpringActions } from '../utils/springActions.js';
import { buildSpringSkillPrompt, planLocalSpringResponse } from '../utils/springSkills.js';
import {
  buildUploadedDocText,
  extractImageText,
  extractScannedPdfText,
  isImageFile,
  isPdfFile,
} from '../utils/uploadReader.js';

function makeMessage(role, content) {
  return {
    id: `spring-${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export default function SpringAssistant() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [state.springMessages.length, isSending, isReadingFile]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Please choose a file under 10 MB.');
      event.target.value = '';
      return;
    }
    setFileError('');
    setSelectedFile(file);
    event.target.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const send = async (text = message) => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || isSending || isReadingFile) return;
    const attachedFile = selectedFile;
    const visibleMessage = attachedFile
      ? `${trimmed || 'Please review this upload.'}\n\nAttached file: ${attachedFile.name}`
      : trimmed;
    const userMessage = makeMessage('user', visibleMessage);
    dispatch({ type: 'appendSpringMessage', message: userMessage });
    setMessage('');
    setIsSending(true);
    let uploadedFile = null;

    try {
      if (attachedFile) {
        setIsReadingFile(true);
        if (isImageFile(attachedFile)) {
          const ocrText = await extractImageText(attachedFile);
          uploadedFile = {
            fileName: attachedFile.name,
            text: buildUploadedDocText({
              fileName: attachedFile.name,
              extractedText: ocrText,
              source: 'ocr',
              warning: ocrText.trim() ? '' : 'Image OCR did not find readable text.',
            }),
          };
        } else {
          uploadedFile = await uploadSpringFile(attachedFile);
          if (isPdfFile(attachedFile) && String(uploadedFile?.text || '').trim().length < 80) {
            const ocrText = await extractScannedPdfText(attachedFile);
            if (ocrText.trim()) {
              uploadedFile = {
                fileName: uploadedFile?.fileName || attachedFile.name,
                text: buildUploadedDocText({
                  fileName: attachedFile.name,
                  extractedText: ocrText,
                  source: 'ocr',
                  warning: 'The PDF looked scanned or image-based, so Spring used page OCR instead of normal PDF text.',
                }),
              };
            }
          }
        }
        setIsReadingFile(false);
        removeFile();
      }

      // If a file was uploaded, inject its extracted text into a context message
      // that persists in chat history so Spring can refer back on follow-up turns.
      let historyForApi = [...state.springMessages, userMessage];
      let messageForApi = trimmed || 'Please review this upload and help me turn it into something useful for activities.';
      if (uploadedFile?.text) {
        const fileText = uploadedFile.text.substring(0, 50000);
        const fence = '```';
        // Add a context message with the full file text so it persists in history
        const contextText = '[File context — ' + uploadedFile.fileName + ']\n\nFull extracted contents:\n' + fence + '\n' + fileText + '\n' + fence + '\n\nSpring can refer back to this content when Amanda asks follow-up questions about this file.';
        const fileContextMessage = { ...makeMessage('assistant', contextText), hidden: true };
        dispatch({ type: 'appendSpringMessage', message: fileContextMessage });
        historyForApi = [...state.springMessages, userMessage, fileContextMessage];
        messageForApi = (trimmed || 'Please review this upload and help me turn it into something useful for activities.') + '\n\n[File: ' + uploadedFile.fileName + ']\n\nContents:\n' + fence + '\n' + fileText + '\n' + fence;
      }

      const brainMemories = await loadSpringBrainMemories({ limit: 30 }).catch(() => []);
      const rawResponse = await sendSpringChat({
        message: messageForApi,
        history: historyForApi,
        docText: uploadedFile?.text,
        fileName: uploadedFile?.fileName || attachedFile?.name,
        skillPrompt: buildSpringSkillPrompt({ state, memories: brainMemories, currentPath: window.location.pathname }),
      });
      const parsed = parseSpringActions(rawResponse);
      const localPlanned = planLocalSpringResponse({
        message: trimmed,
        docText: uploadedFile?.text || '',
        state,
        currentPath: window.location.pathname,
      });
      const actionSource = hasSpringActions(parsed)
        ? parsed
        : { ...localPlanned.actions, displayText: localPlanned.displayText };
      applySpringActionsToDispatch(actionSource, dispatch, { onLaunchGame: () => navigate('/app/games') });
      dispatch({
        type: 'appendSpringMessage',
        message: makeMessage('assistant', actionSource.displayText || parsed.displayText || localPlanned.displayText || 'Done. I handled that for you.'),
      });
    } catch {
      const localPlanned = planLocalSpringResponse({
        message: trimmed,
        docText: uploadedFile?.text || '',
        state,
        currentPath: window.location.pathname,
      });
      if (hasSpringActions(localPlanned.actions)) {
        applySpringActionsToDispatch(localPlanned.actions, dispatch, { onLaunchGame: () => navigate('/app/games') });
        dispatch({
          type: 'appendSpringMessage',
          message: makeMessage('assistant', `${localPlanned.displayText} I used the local save path because the live Spring connection had trouble.`),
        });
      } else {
        dispatch({
          type: 'appendSpringMessage',
          message: makeMessage('assistant', "I'm having trouble reading that file or connecting to Spring right now. Please try a clearer image, a text-based PDF, or a Word/Excel/CSV version."),
        });
      }
    } finally {
      setIsReadingFile(false);
      setIsSending(false);
    }
  };

  return (
    <>
      <SectionHeader eyebrow="Spring" title="Your Personal Activities Assistant" />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="app-card flex h-[clamp(360px,calc(100dvh-18rem),560px)] min-h-0 flex-col p-4">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {state.springMessages.filter((item) => !item.hidden).map((item) => (
              <div className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`} key={item.id}>
                <div className={`max-w-[78%] rounded-lg p-3 text-sm leading-6 ${item.role === 'user' ? 'bg-[#6d4cc2] text-white' : 'bg-white text-[#25183f] border border-[#ded0f2]'}`}>
                  {item.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {(selectedFile || fileError) && (
            <div className="mt-4 rounded-lg border border-[#ded0f2] bg-[#fbf8ff] p-3 text-sm">
              {selectedFile && (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-[#25183f]">Ready to send</p>
                    <p className="truncate text-[#74638d]">{selectedFile.name}</p>
                  </div>
                  <button aria-label="Remove attached file" className="app-button app-button-secondary px-3" onClick={removeFile} type="button">
                    <X size={16} />
                  </button>
                </div>
              )}
              {fileError && <p className="text-[#9f1d35]">{fileError}</p>}
            </div>
          )}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <button aria-label="Attach file" className="app-button app-button-secondary px-3" disabled={isSending || isReadingFile} onClick={() => fileInputRef.current?.click()} title="Attach file" type="button">
              <Paperclip size={17} />
            </button>
            <input
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.md"
              className="hidden"
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />
            <input className="app-input" onChange={(event) => setMessage(event.target.value)} placeholder="Ask Spring to plan, draft, or summarize..." value={message} />
            <button className="app-button app-button-primary" disabled={isSending || isReadingFile || (!message.trim() && !selectedFile)} type="submit"><Send size={17} /></button>
          </form>
          <p className="mt-2 text-xs text-[#74638d]">Attach images, PDFs, Word docs, Excel files, CSVs, or notes for Spring to read.</p>
        </section>

        <aside className="space-y-3">
          <button className="app-card w-full p-4 text-left" onClick={() => send('Turn this website into an activity draft.')} type="button">
            <FilePlus2 className="mb-3 text-[#6d4cc2]" />
            <p className="font-black">Create Activity Draft</p>
            <p className="mt-1 text-sm text-[#74638d]">Draft first, then Amanda approves.</p>
          </button>
          <button className="app-card w-full p-4 text-left" onClick={() => send('Fill this month from approved activities.')} type="button">
            <CalendarPlus className="mb-3 text-[#6d4cc2]" />
            <p className="font-black">Fill Month</p>
            <p className="mt-1 text-sm text-[#74638d]">Creates a review proposal.</p>
          </button>
          <button className="app-card w-full p-4 text-left" onClick={() => send('Summarize residents and Bingo Bucks.')} type="button">
            <UsersRound className="mb-3 text-[#6d4cc2]" />
            <p className="font-black">Review Residents</p>
            <p className="mt-1 text-sm text-[#74638d]">Preferences, Bingo Bucks, and attention.</p>
          </button>
        </aside>
      </div>
    </>
  );
}
