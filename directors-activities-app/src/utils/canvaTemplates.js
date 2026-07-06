export function buildCanvaPlaceholderPayload({ calendarTitle, view, events }) {
  return {
    calendar_title: calendarTitle,
    export_view: view,
    events: events.map((event) => ({
      date: event.date,
      day: event.day,
      time: event.time,
      activity_title: event.title,
      location: event.location || '',
      description: event.description || '',
      wing: event.wing || 'both',
      supplies: Array.isArray(event.supplies) ? event.supplies.join(', ') : event.supplies || '',
      resident_notes: event.residentNotes || '',
    })),
  };
}
