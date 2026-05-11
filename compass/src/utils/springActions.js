const blockPatterns = {
  events: /===EVENT===\n?([\s\S]*?)\n?===END===/g,
  books: /===BOOK===\n?([\s\S]*?)\n?===END===/g,
  contacts: /===CONTACT===\n?([\s\S]*?)\n?===END===/g,
};

function parsePayload(raw) {
  try {
    const parsed = JSON.parse(raw.trim());
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    try {
      const parsed = JSON.parse(`[${raw.trim().replace(/,$/, '')}]`);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export function parseSpringActions(responseText) {
  let displayText = responseText || '';
  const actions = { events: [], books: [], contacts: [] };

  Object.entries(blockPatterns).forEach(([key, pattern]) => {
    displayText = displayText.replace(pattern, (_, payload) => {
      actions[key].push(...parsePayload(payload));
      return '';
    });
  });

  return {
    ...actions,
    displayText: displayText.trim(),
  };
}
