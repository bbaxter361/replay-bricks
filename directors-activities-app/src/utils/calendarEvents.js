import { splitList } from './fieldParsers.js';

function datePart(value) {
  return String(value || '').slice(0, 10);
}

function timePart(value) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(value || '09:00').slice(11, 16) || '09:00';
}

function combineDateTime(date, time) {
  return `${date}T${time || '09:00'}:00`;
}

export function calendarEventToForm(event = {}) {
  return {
    title: event.title || '',
    date: datePart(event.start),
    startTime: timePart(event.start),
    endTime: timePart(event.end),
    description: event.description || '',
    location: event.location || '',
    category: event.category || event.type || '',
    assignedStaff: event.assignedStaff || '',
    wing: event.wing || 'both',
    supplies: (event.supplies || []).join(', '),
  };
}

export function updateCalendarEvent(events = [], eventId, updates = {}) {
  return events.map((event) => {
    if (event.id !== eventId) return event;

    const current = calendarEventToForm(event);
    const next = { ...current, ...updates };
    return {
      ...event,
      title: next.title || event.title,
      start: combineDateTime(next.date || current.date, next.startTime || current.startTime),
      end: combineDateTime(next.date || current.date, next.endTime || current.endTime),
      description: next.description || '',
      location: next.location || '',
      category: next.category || '',
      assignedStaff: next.assignedStaff || '',
      wing: next.wing || 'both',
      supplies: splitList(next.supplies),
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };
  });
}

export function deleteCalendarEvent(events = [], eventId) {
  return events.filter((event) => event.id !== eventId);
}

export function deleteCalendarEventsForActivity(events = [], activityId) {
  return events.filter((event) => event.activityId !== activityId);
}
