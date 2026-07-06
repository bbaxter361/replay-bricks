import { CalendarPlus } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

function timeRange(event) {
  const start = new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const end = new Date(event.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${start} - ${end}`;
}

export default function Calendar() {
  const { state, dispatch } = useAppState();
  const filteredEvents = state.wingFilter === 'combined'
    ? state.calendarEvents
    : state.calendarEvents.filter((event) => event.wing === state.wingFilter || event.wing === 'both');

  return (
    <>
      <SectionHeader
        eyebrow="Calendar"
        title="Plan The Day, Week, Or Month"
        actions={<button className="app-button app-button-primary" onClick={() => dispatch({ type: 'createMonthProposal', month: '2026-07' })} type="button"><CalendarPlus size={16} /> Fill month</button>}
      >
        Calendar work stays reviewable. Spring can propose a full month, but Amanda approves before saving.
      </SectionHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {['day', 'week', 'month'].map((view) => (
          <button className={`app-button ${state.calendarView === view ? 'app-button-primary' : 'app-button-secondary'}`} key={view} onClick={() => dispatch({ type: 'setCalendarView', view })} type="button">
            {view}
          </button>
        ))}
        {['combined', 'memory', 'assisted'].map((filter) => (
          <button className={`app-button ${state.wingFilter === filter ? 'app-button-primary' : 'app-button-secondary'}`} key={filter} onClick={() => dispatch({ type: 'setWingFilter', filter })} type="button">
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="app-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">{state.calendarView} view</h2>
            <StatusPill>{state.wingFilter}</StatusPill>
          </div>
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div className="rounded-lg border border-[#ded0f2] bg-white p-4" key={event.id}>
                <p className="font-black">{event.title}</p>
                <p className="mt-1 text-sm text-[#74638d]">{timeRange(event)} · {event.location}</p>
                <p className="mt-2 text-sm leading-6 text-[#74638d]">{event.description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="app-card p-5">
            <h2 className="text-lg font-black">Schedule An Activity</h2>
            <div className="mt-3 space-y-2">
              {state.activities.slice(0, 3).map((activity) => (
                <button className="w-full rounded-lg border border-[#ded0f2] bg-white p-3 text-left hover:border-[#6d4cc2]" key={activity.id} onClick={() => dispatch({ type: 'scheduleActivity', activityId: activity.id })} type="button">
                  <p className="font-bold">{activity.title}</p>
                  <p className="text-sm text-[#74638d]">{activity.durationMinutes} min · {activity.bestFor}</p>
                </button>
              ))}
            </div>
          </section>
          {state.monthProposal && (
            <section className="app-card p-5">
              <StatusPill tone="gold">draft proposal</StatusPill>
              <h2 className="mt-3 text-lg font-black">July plan proposal</h2>
              <p className="mt-1 text-sm text-[#74638d]">{state.monthProposal.events.length} events ready for Amanda review.</p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
