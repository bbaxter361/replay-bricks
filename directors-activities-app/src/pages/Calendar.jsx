import { CalendarPlus } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeRange(event) {
  const start = new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const end = new Date(event.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${start} - ${end}`;
}

function monthCells(referenceDate) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      key: dateKey(date),
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === referenceDate.getMonth(),
    };
  });
}

function CalendarEventCard({ event }) {
  return (
    <div className="rounded-lg border border-[#ded0f2] bg-white p-4">
      <p className="font-black">{event.title}</p>
      <p className="mt-1 text-sm text-[#74638d]">{timeRange(event)} · {event.location}</p>
      <p className="mt-2 text-sm leading-6 text-[#74638d]">{event.description}</p>
    </div>
  );
}

function MonthCalendarView({ events }) {
  const sortedEvents = [...events].sort((left, right) => new Date(left.start) - new Date(right.start));
  const referenceDate = sortedEvents[0] ? new Date(sortedEvents[0].start) : new Date();
  const eventMap = sortedEvents.reduce((map, event) => {
    const key = dateKey(new Date(event.start));
    map.set(key, [...(map.get(key) || []), event]);
    return map;
  }, new Map());
  const label = referenceDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-[#25183f]">{label}</h2>
        <p className="text-sm font-bold text-[#74638d]">{sortedEvents.length} scheduled activities</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-7 border-b border-[#ded0f2] text-center text-xs font-black uppercase tracking-wide text-[#74638d]">
            {WEEKDAYS.map((weekday) => (
              <div className="px-2 pb-2" key={weekday}>{weekday}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 rounded-b-lg border-l border-t border-[#ded0f2] bg-white">
            {monthCells(referenceDate).map((cell) => {
              const dayEvents = eventMap.get(cell.key) || [];
              return (
                <div className={`min-h-32 border-b border-r border-[#ded0f2] p-2 ${cell.isCurrentMonth ? 'bg-white' : 'bg-[#fbf8ff]'}`} key={cell.key}>
                  <div className={`mb-2 flex size-7 items-center justify-center rounded-full text-sm font-black ${cell.isCurrentMonth ? 'bg-[#efe4ff] text-[#4d3195]' : 'text-[#aa9abb]'}`}>
                    {cell.dayNumber}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => (
                      <div className="rounded-md border border-[#ded0f2] bg-[#f7f1ff] px-2 py-1 text-xs leading-4 text-[#25183f]" key={event.id}>
                        <p className="font-black">{new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                        <p className="font-bold">{event.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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
          {state.calendarView === 'month' ? (
            <MonthCalendarView events={filteredEvents} />
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => <CalendarEventCard event={event} key={event.id} />)}
            </div>
          )}
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
