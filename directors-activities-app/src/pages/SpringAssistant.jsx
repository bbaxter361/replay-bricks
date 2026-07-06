import { CalendarPlus, FilePlus2, Send, UsersRound } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { useAppState } from '../state/appState';

export default function SpringAssistant() {
  const { state, dispatch } = useAppState();
  const [message, setMessage] = useState('');

  const send = (text = message) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: 'sendSpringMessage', message: trimmed });
    setMessage('');
  };

  return (
    <>
      <SectionHeader eyebrow="Spring" title="Activities Director Assistant">
        Spring is shown here in local preview mode. Real AI, Supabase memory, Canva, and Obsidian search come in later wiring phases.
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
            <button className="app-button app-button-primary" type="submit"><Send size={17} /></button>
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
          <button className="app-card w-full p-4 text-left" onClick={() => send('Summarize residents and bingo points.')} type="button">
            <UsersRound className="mb-3 text-[#6d4cc2]" />
            <p className="font-black">Review Residents</p>
            <p className="mt-1 text-sm text-[#74638d]">Preferences, points, and attention.</p>
          </button>
        </aside>
      </div>
    </>
  );
}
