function pad(value) {
  return String(value).padStart(2, '0');
}

function addMinutes(localIso, minutes) {
  const date = new Date(localIso);
  date.setMinutes(date.getMinutes() + minutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function createCalendarEventFromActivity({ activity, start, wing }) {
  const duration = Number(activity.durationMinutes || 45);
  return {
    id: `event-${activity.id}-${start}`,
    activityId: activity.id,
    title: activity.title,
    start,
    end: addMinutes(start, duration),
    wing: wing || activity.bestFor || 'both',
    location: 'Activity Room',
    description: activity.summary || activity.description || '',
    supplies: activity.supplies || [],
    status: 'scheduled',
  };
}

export function createMonthProposal({ month, activities }) {
  const events = activities.map((activity, index) => {
    const day = pad(index + 1);
    return createCalendarEventFromActivity({
      activity,
      start: `${month}-${day}T10:00:00`,
      wing: activity.bestFor || 'both',
    });
  });

  return {
    id: `proposal-${month}-${Date.now()}`,
    status: 'draft',
    month,
    events,
    createdAt: new Date().toISOString(),
  };
}
