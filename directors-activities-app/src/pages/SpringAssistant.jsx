import { CalendarPlus, FilePlus2, Paperclip, Send, UsersRound, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { sendSpringChat, uploadSpringFile } from '../services/springApi.js';
import { useAppState } from '../state/appState';
import { applySpringActionsToDispatch, hasSpringActions } from '../utils/applySpringActions.js';
import { parseSpringActions } from '../utils/springActions.js';
import { buildSpringSkillPrompt, planLocalSpringResponse } from '../utils/springSkills.js';

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
        uploadedFile = await uploadSpringFile(attachedFile);
        setIsReadingFile(false);
        removeFile();
      }

      const rawResponse = await sendSpringChat({
        message: trimmed || 'Please review this upload and help me turn it into something useful for activities.',
        history: [...state.springMessages, userMessage],
        docText: uploadedFile?.text,
        fileName: uploadedFile?.fileName || attachedFile?.name,
        skillPrompt: buildSpringSkillPrompt({ state, currentPath: window.location.pathname }),
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
          message: makeMessage('assistant', "I'm having trouble reading that file or connecting to Spring right now. Please try the upload again or use a different file format."),
        });
      }
    } finally {
      setIsReadingFile(false);
      setIsSending(false);
    }
  };

  return (
    <>
      <SectionHeader eyebrow="Spring" title="Activities Director Assistant">
        Spring is connected to the existing live Spring backend and restored Compass data.
      </SectionHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="app-card flex min-h-[560px] flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {state.springMessages.map((item) => (
              <div className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`} key={item.id}>
                <div className={`max-w-[78%] rounded-lg p-3 text-sm leading-6 ${item.role === 'user' ? 'bg-[#6d4cc2] text-white' : 'bg-white text-[#25183f] border border-[#ded0f2]'}`}>
                  {item.content}
                </div>
              </div>
            ))}
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
