function requestedBy(actions) {
  return actions.requestedBy || 'Amanda';
}

export function hasSpringActions(actions = {}) {
  return Boolean(
    (actions.events || []).length
    || (actions.books || []).length
    || (actions.contacts || []).length
    || (actions.activityDrafts || []).length
    || (actions.oneOnOneNotes || []).length
    || (actions.questions || []).length
    || (actions.gameLaunches || []).length
    || (actions.recordUpdates || []).length
    || (actions.attendancePatternNotes || []).length,
  );
}

export function applySpringActionsToDispatch(actions, dispatch, options = {}) {
  const askUser = requestedBy(actions);

  (actions.gameLaunches || []).forEach((game) => {
    if (!game?.gameId) return;
    dispatch({ type: 'launchGame', gameId: game.gameId });
    options.onLaunchGame?.(game.gameId);
  });

  (actions.recordUpdates || []).forEach((update) => {
    if (!update?.recordType || !update?.recordId) return;
    dispatch({
      type: 'springUpdateRecord',
      recordType: update.recordType,
      recordId: update.recordId,
      updates: update.updates || {},
      requestedBy: update.requestedBy || askUser,
    });
  });

  (actions.attendancePatternNotes || []).forEach((pattern) => {
    if (!pattern?.residentId || !pattern?.summary) return;
    dispatch({
      type: 'addOneOnOneNote',
      note: {
        residentId: pattern.residentId,
        notes: pattern.summary,
        createdAt: pattern.createdAt || new Date().toISOString(),
      },
      audit: {
        requestedBy: askUser,
        recordType: 'oneOnOne',
        recordId: pattern.residentId,
        action: 'document attendance pattern',
        changes: { notes: pattern.summary },
      },
    });
  });

  (actions.events || []).forEach((event) => {
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
      audit: {
        requestedBy: askUser,
        recordType: 'calendar',
        recordId: event.id || 'new',
        action: 'create',
        changes: event,
      },
    });
  });

  (actions.activityDrafts || []).forEach((draft) => {
    if (!draft?.title) return;
    dispatch({
      type: 'createActivityDraft',
      title: draft.title,
      category: draft.category || 'custom',
      bestFor: draft.bestFor || 'both',
      difficulty: draft.difficulty || 'easy',
      durationMinutes: draft.durationMinutes || 45,
      groupSize: draft.groupSize || 'small group',
      supplies: draft.supplies || [],
      steps: draft.steps || ['Review Spring draft.', 'Add missing details.', 'Approve when ready.'],
      safetyNotes: draft.safetyNotes || '',
      dementiaAdaptations: draft.dementiaAdaptations || '',
      tags: draft.tags || ['spring-draft'],
      residentNotes: draft.residentNotes || '',
      source: draft.source || { type: 'spring', label: 'Spring chat' },
      audit: {
        requestedBy: askUser,
        recordType: 'activityDraft',
        recordId: draft.id || 'new',
        action: 'create',
        changes: draft,
      },
    });
  });

  (actions.oneOnOneNotes || []).forEach((note) => {
    if (!note?.residentId || !note?.notes) return;
    dispatch({
      type: 'addOneOnOneNote',
      note: {
        residentId: note.residentId,
        notes: note.notes,
        createdAt: note.createdAt || new Date().toISOString(),
      },
      audit: {
        requestedBy: askUser,
        recordType: 'oneOnOne',
        recordId: note.residentId,
        action: 'create',
        changes: { notes: note.notes },
      },
    });
  });

  (actions.books || []).forEach((book) => {
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
      audit: {
        requestedBy: askUser,
        recordType: 'book',
        recordId: book.id || 'new',
        action: 'create',
        changes: book,
      },
    });
  });

  (actions.contacts || []).forEach((contact) => {
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
}
