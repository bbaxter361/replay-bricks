function lower(value) {
  return String(value || '').toLowerCase();
}

function hasInterestMatch(resident, activity) {
  const interests = resident.interests || [];
  const searchable = [
    activity.title,
    activity.category,
    ...(activity.tags || []),
  ].map(lower).join(' ');

  return interests.some((interest) => searchable.includes(lower(interest)));
}

export function recommendActivitiesForResident(state, residentId) {
  const resident = (state.residents || []).find((item) => item.id === residentId);
  if (!resident) return [];

  return (state.activities || [])
    .map((activity) => ({
      ...activity,
      score: (hasInterestMatch(resident, activity) ? 2 : 0)
        + (activity.bestFor === resident.careArea || activity.bestFor === 'both' ? 1 : 0)
        + (resident.careArea === 'memory' && activity.dementiaAdaptations ? 1 : 0),
      memoryCareNote: resident.careArea === 'memory' ? activity.dementiaAdaptations || 'Use shorter prompts and familiar choices.' : '',
    }))
    .filter((activity) => activity.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function detectAttendancePatterns(state, residentId, now = new Date()) {
  const resident = (state.residents || []).find((item) => item.id === residentId);
  if (!resident) return [];

  const attendance = (state.residentActivityAttendance || [])
    .filter((item) => item.residentId === residentId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (attendance.length === 0) {
    return [{
      residentId,
      summary: `${resident.name} has no attendance records yet. Check in and document preferences or barriers.`,
      severity: 'attention',
    }];
  }

  const lastDate = new Date(attendance[0].createdAt);
  const daysSince = Number.isNaN(lastDate.getTime())
    ? 999
    : Math.floor((now.getTime() - lastDate.getTime()) / 86400000);

  if (daysSince >= 14) {
    return [{
      residentId,
      summary: `${resident.name} has not attended a recorded activity in ${daysSince} days.`,
      severity: 'attention',
    }];
  }

  return [];
}

export function buildAuditEntry({ requestedBy, recordType, recordId, action, changes }) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    requestedBy: requestedBy || 'Amanda',
    source: 'Spring',
    recordType,
    recordId,
    action,
    changes: changes || {},
    createdAt: new Date().toISOString(),
  };
}
