import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendSpringChat } from '../services/springApi.js';
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

export default function SpringQuickAsk() {
  const { state, dispatch } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const send = async (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userMessage = makeMessage('user', trimmed);
    dispatch({ type: 'appendSpringMessage', message: userMessage });
    setMessage('');
    setIsSending(true);

    try {
      const localPlanned = planLocalSpringResponse({ message: trimmed, state, currentPath: location.pathname });
      const hasLocalAction = hasSpringActions(localPlanned.actions);

      if (hasLocalAction || localPlanned.displayText) {
        applySpringActionsToDispatch(localPlanned.actions, dispatch, { onLaunchGame: () => navigate('/app/games') });
        dispatch({ type: 'appendSpringMessage', message: makeMessage('assistant', localPlanned.displayText) });
        return;
      }

      const rawResponse = await sendSpringChat({
        message: trimmed,
        history: [...state.springMessages, userMessage],
        skillPrompt: buildSpringSkillPrompt({ state, currentPath: location.pathname }),
      });
      const parsed = parseSpringActions(rawResponse);
      const actionSource = hasSpringActions(parsed)
        ? parsed
        : { ...localPlanned.actions, displayText: localPlanned.displayText || parsed.displayText };

      applySpringActionsToDispatch(actionSource, dispatch, { onLaunchGame: () => navigate('/app/games') });
      dispatch({ type: 'appendSpringMessage', message: makeMessage('assistant', actionSource.displayText || 'I heard you. I need one more detail before I save anything.') });
    } catch {
      const localPlanned = planLocalSpringResponse({ message: trimmed, state, currentPath: location.pathname });
      applySpringActionsToDispatch(localPlanned.actions, dispatch, { onLaunchGame: () => navigate('/app/games') });
      dispatch({
        type: 'appendSpringMessage',
        message: makeMessage('assistant', localPlanned.displayText || "I could not reach Spring, but I can still help from here. Please tell me whether this is an activity, a 1 on 1 note, or a calendar item."),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-lg border border-[#ded0f2] bg-white p-2" onSubmit={send}>
      <div className="flex items-center gap-2 px-2 text-sm font-black text-[#4d3195]">
        <Sparkles size={16} />
        Ask Spring
      </div>
      <input
        className="min-w-[220px] flex-1 bg-transparent px-2 py-2 text-sm text-[#25183f] outline-none"
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask Spring to create an activity, add a 1 on 1, or help with the calendar..."
        value={message}
      />
      <button className="app-button app-button-primary px-3" disabled={isSending || !message.trim()} type="submit">
        <Send size={16} />
      </button>
    </form>
  );
}
