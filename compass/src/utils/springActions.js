// springActions.js — Multi-block action parser
// Extracts ===EVENT===, ===CONTACT===, ===BOOK=== blocks from Spring's response.
// Handles multiple blocks, comma-separated arrays, and DeepSeek quirks (type: "game").
//
// CRITICAL: This replaces the old single-block parseEmbeddedContent() in ChatPage.jsx.
// The old regex used match() which only captured ONE block per type.
// This uses replace() with global regex to capture ALL blocks.

/**
 * Parse Spring's response for hidden action blocks.
 * Returns cleaned display text + arrays of parsed actions.
 *
 * @param {string} responseText - Raw response from Spring
 * @returns {{ displayText: string, events: array, books: array, contacts: array }}
 */
export function parseSpringActions(responseText) {
  let displayText = responseText || '';
  const actions = { events: [], books: [], contacts: [], deletes: [] };

  // Block patterns — global flag so replace() fires for every match
  const blockPatterns = {
    events: /===EVENT===\n?([\s\S]*?)\n?===END===/g,
    books: /===BOOK===\n?([\s\S]*?)\n?===END===/g,
    contacts: /===CONTACT===\n?([\s\S]*?)\n?===END===/g,
    deletes: /===DELETE_EVENT===\n?([\s\S]*?)\n?===END===/g,
  };

  Object.entries(blockPatterns).forEach(([key, pattern]) => {
    displayText = displayText.replace(pattern, (_, payload) => {
      const parsed = parsePayload(payload);
      actions[key].push(...parsed);
      return '';
    });
  });

  return {
    ...actions,
    displayText: displayText.trim(),
  };
}

/**
 * Parse a raw payload string into an array of objects.
 * Handles three cases DeepSeek produces:
 *   1. Single JSON object:   {"title":"Chair Yoga",...}
 *   2. JSON array:           [{"title":"A"},{"title":"B"}]
 *   3. Comma-separated objects: {"title":"A"},{"title":"B"}
 *
 * @param {string} raw - Raw text between block delimiters
 * @returns {object[]} Array of parsed action objects
 */
export function parsePayload(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try straight JSON parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return normalizeActions(parsed);
    return normalizeActions([parsed]);
  } catch {
    // Fallback: wrap comma-separated objects in array brackets
    try {
      const wrapped = `[${trimmed.replace(/,$/, '')}]`;
      const parsed = JSON.parse(wrapped);
      if (Array.isArray(parsed)) return normalizeActions(parsed);
      return [];
    } catch {
      console.warn('springActions: Failed to parse payload:', trimmed.substring(0, 200));
      return [];
    }
  }
}

/**
 * Normalize action objects — fix DeepSeek quirks.
 * - type: "game" → "games" (Compass expects "games")
 */
function normalizeActions(items) {
  return items.map(item => {
    if (item.type === 'game') {
      return { ...item, type: 'games' };
    }
    return item;
  });
}
