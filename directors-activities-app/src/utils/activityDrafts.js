function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createActivityDraftFromSource({ sourceType, sourceLabel, title, category }) {
  return {
    id: makeId('draft'),
    status: 'draft',
    title: title || 'Untitled activity draft',
    category: category || 'custom',
    bestFor: 'both',
    difficulty: 'easy',
    durationMinutes: 45,
    groupSize: 'small group',
    supplies: [],
    steps: [],
    safetyNotes: '',
    dementiaAdaptations: '',
    tags: [],
    residentNotes: '',
    source: {
      type: sourceType,
      label: sourceLabel,
    },
    createdAt: new Date().toISOString(),
  };
}

export function approveActivityDraft(draft, { approvedBy }) {
  return {
    ...draft,
    id: draft.id.replace(/^draft/, 'activity'),
    status: 'approved',
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}
