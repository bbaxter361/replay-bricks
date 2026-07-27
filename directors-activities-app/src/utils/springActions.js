function parsePayload(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    try {
      const parsed = JSON.parse(`[${trimmed.replace(/,$/, '')}]`);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export function parseSpringActions(responseText) {
  let displayText = responseText || '';
  const actions = {
    events: [],
    books: [],
    contacts: [],
    activityDrafts: [],
    oneOnOneNotes: [],
    questions: [],
    gameLaunches: [],
    recordUpdates: [],
    attendancePatternNotes: [],
  };
  const blockPatterns = {
    events: /===EVENT===\n?([\s\S]*?)\n?===END===/g,
    books: /===BOOK===\n?([\s\S]*?)\n?===END===/g,
    contacts: /===CONTACT===\n?([\s\S]*?)\n?===END===/g,
    activityDrafts: /===ACTIVITY_DRAFT===\n?([\s\S]*?)\n?===END===/g,
    oneOnOneNotes: /===ONE_ON_ONE===\n?([\s\S]*?)\n?===END===/g,
    questions: /===QUESTION===\n?([\s\S]*?)\n?===END===/g,
    gameLaunches: /===LAUNCH_GAME===\n?([\s\S]*?)\n?===END===/g,
    recordUpdates: /===RECORD_UPDATE===\n?([\s\S]*?)\n?===END===/g,
    attendancePatternNotes: /===ATTENDANCE_PATTERN===\n?([\s\S]*?)\n?===END===/g,
  };

  Object.entries(blockPatterns).forEach(([key, pattern]) => {
    displayText = displayText.replace(pattern, (_, payload) => {
      actions[key].push(...parsePayload(payload));
      return '';
    });
  });

  return { ...actions, displayText: displayText.trim() };
}
