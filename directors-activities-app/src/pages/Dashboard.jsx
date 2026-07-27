import { CalendarDays, FileCheck2, MessageCircle, Trophy, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { selectBingoBalance, useAppState } from '../state/appState';

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Dashboard() {
  const { state, dispatch } = useAppState();
  const totalBingoBucks = state.residents.reduce((sum, resident) => sum + selectBingoBalance(state, resident.id), 0);

  return (
    <>
      <SectionHeader
        eyebrow="Today"
        title={`Welcome back, ${state.currentUser?.name}`}
        actions={
          <>
            <Link className="app-button app-button-primary" to="/app/canva">Export calendar</Link>
            <Link className="app-button app-button-secondary" to="/app/spring">Ask Spring</Link>
          </>
        }
      >
        The first screen keeps Amanda's daily priorities close: print calendars, ask Spring, and plan the day.
      </SectionHeader>

      {state.legacyRestore && (
        <div className="mb-4 rounded-lg border border-[#ded0f2] bg-white p-3 text-sm text-[#5a4873]">
          {state.legacyRestore.error
            ? `Amanda data restore needs attention: ${state.legacyRestore.error}`
            : `Amanda data restored: ${state.legacyRestore.calendarEvents} calendar events, ${state.legacyRestore.books} books, ${state.legacyRestore.springMessages} Spring messages.`}
        </div>
      )}

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Today events" value={state.calendarEvents.length} detail="Ready for Canva export" to="/app/calendar" />
        <MetricCard icon={FileCheck2} label="Draft activities" value={state.activityDrafts.length} detail="Review before saving" to="/app/activities?view=drafts" />
        <MetricCard icon={UsersRound} label="Residents" value={state.residents.length} detail="Profiles and preferences" to="/app/residents" />
        <MetricCard icon={Trophy} label="Bingo Bucks" value={totalBingoBucks} detail="Never reset automatically" to="/app/residents" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="app-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Today’s Schedule</h2>
            <StatusPill tone="green">Combined view</StatusPill>
          </div>
          <div className="space-y-3">
            {state.calendarEvents.map((event) => (
              <div className="rounded-lg border border-[#ded0f2] bg-white p-4" key={event.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#25183f]">{event.title}</p>
                    <p className="mt-1 text-sm text-[#74638d]">{formatTime(event.start)} - {formatTime(event.end)} · {event.location}</p>
                  </div>
                  <StatusPill>{event.wing}</StatusPill>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#74638d]">{event.description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="app-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle className="text-[#6d4cc2]" size={20} />
              <h2 className="text-lg font-black">Ask Spring</h2>
            </div>
            <p className="text-sm leading-6 text-[#74638d]">Use Spring to draft activity ideas, plan a calendar, or summarize residents.</p>
            <button
              className="app-button app-button-primary mt-4 w-full"
              onClick={() => dispatch({ type: 'sendSpringMessage', message: 'Help me plan today from approved activities.' })}
              type="button"
            >
              Plan today
            </button>
          </section>

          <section className="app-card p-5">
            <h2 className="mb-3 text-lg font-black">Drafts To Review</h2>
            <div className="space-y-3">
              {state.activityDrafts.map((draft) => (
                <div className="rounded-lg bg-[#efe4ff] p-3" key={draft.id}>
                  <p className="font-bold">{draft.title}</p>
                  <p className="text-sm text-[#74638d]">{draft.source?.label}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
