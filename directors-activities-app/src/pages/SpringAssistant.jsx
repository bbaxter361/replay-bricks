import { CalendarPlus, FilePlus2, Send, UsersRound } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { sendSpringChat } from '../services/springApi.js';
import { useAppState } from '../state/appState';
import { parseSpringActions } from '../utils/springActions.js';

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
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const applySpringActions = (actions) => {
    actions.events.forEach((event) => {
      if (!event?.title || !event?.start) return;
      const start = new Date(event.start);
      const end = new Date(event.end || start.getTime() + 45 * 60 * 1000);
      dispatch({
        type: 'addCalendarEvent',
        event: {
          id: `event-spring-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          activityId: event.activityId || '',
          title: event.title,
          start: Number.isNaN(start.getTime()) ? event.start : start.toISOString(),
          end: Number.isNaN(end.getTime()) ? event.end || event.start : end.toISOString(),
          wing: event.wing || 'both',
          location: event.location || '',
          description: event.description || '',
          supplies: event.supplies || [],
        },
      });
    });

    actions.books.forEach((book) => {
      if (!book?.title) return;
      dispatch({
        type: 'addBook',
        book: {
          title: book.title,
          author: book.author || '',
          pages: book.pages || 0,
          dateCompleted: new Date().toISOString().slice(0, 10),
          rating: 0,
          status: 'bookshelf',
        },
      });
    });

    actions.contacts.forEach((contact) => {
      if (!contact?.name) return;
      dispatch({
        type: 'addFamilyContact',
        contact: {
          residentId: contact.residentId || '',
          name: contact.name,
          relationship: contact.relationship || 'family',
          phone: contact.phone || '',
          email: contact.email || '',
        },
      });
    });
  };

  const send = async (text = message) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    const userMessage = makeMessage('user', trimmed);
    dispatch({ type: 'appendSpringMessage', message: userMessage });
    setMessage('');
    setIsSending(true);

    try {
      const rawResponse = await sendSpringChat({
        message: trimmed,
        history: [...state.springMessages, userMessage],
      });
      const parsed = parseSpringActions(rawResponse);
      applySpringActions(parsed);
      dispatch({
        type: 'appendSpringMessage',
        message: makeMessage('assistant', parsed.displayText || 'Done. I handled that for you.'),
      });
    } catch {
      dispatch({
        type: 'appendSpringMessage',
        message: makeMessage('assistant', "I'm having trouble connecting to Spring right now. The existing Spring backend may need a moment, then we can try again."),
      });
    } finally {
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
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input className="app-input" onChange={(event) => setMessage(event.target.value)} placeholder="Ask Spring to plan, draft, or summarize..." value={message} />
            <button className="app-button app-button-primary" disabled={isSending} type="submit"><Send size={17} /></button>
          </form>
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
