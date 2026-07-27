import { detectAttendancePatterns, recommendActivitiesForResident } from './springAdmin.js';

function residentOptions(state) {
  return (state.residents || [])
    .map((resident) => `${resident.name} (${resident.id})`)
    .join(', ');
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/[.?!]+$/g, '')
    .trim();
}

function getLabeledValue(body, labels) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = String(body || '').match(new RegExp(`^\\s*(?:${escaped})\\s*:\\s*(.+)$`, 'im'));
  return cleanTitle(match?.[1] || '');
}

function splitCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => cleanTitle(item))
    .filter(Boolean);
}

function splitActivitySteps(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  const parts = text.includes('→') || text.includes('->')
    ? text.split(/→|->/g)
    : [text];
  return parts.map((item) => cleanTitle(item)).filter(Boolean);
}

function bestForFromSuitability(value) {
  const lower = normalize(value);
  if (lower.includes('memory')) return 'memory';
  if (lower.includes('assisted')) return 'assisted';
  return 'both';
}

function parseNumberedActivityList(text) {
  const sourceText = String(text || '');
  const entries = [];
  const pattern = /(?:^|\n)\s*\d+\.\s+([^\n]+)\n([\s\S]*?)(?=\n\s*\d+\.\s+|\s*$)/g;
  let match = pattern.exec(sourceText);

  while (match) {
    const title = cleanTitle(match[1]);
    const body = match[2] || '';
    const type = getLabeledValue(body, ['Type']);
    const summary = getLabeledValue(body, ['Summary']);
    const materials = getLabeledValue(body, ['Materials']);
    const steps = getLabeledValue(body, ['Steps for a 5th grader', 'Steps']);
    const suitability = getLabeledValue(body, ['Suitability']);

    if (title && (type || summary || materials || steps)) {
      entries.push({
        title,
        category: type || 'custom',
        bestFor: bestForFromSuitability(suitability),
        difficulty: 'easy',
        durationMinutes: 45,
        groupSize: 'small group',
        supplies: splitCommaList(materials),
        steps: splitActivitySteps(steps),
        safetyNotes: '',
        dementiaAdaptations: summary,
        tags: [type, 'spring-import'].filter(Boolean),
        residentNotes: summary,
        source: { type: 'spring', label: 'Spring batch import' },
      });
    }

    match = pattern.exec(sourceText);
  }

  return entries;
}

function findResident(message, state, currentPath) {
  const pathResident = String(currentPath || '').match(/\/app\/residents\/([^/?#]+)/)?.[1];
  if (pathResident) {
    const found = (state.residents || []).find((resident) => resident.id === pathResident);
    if (found) return found;
  }

  const lowerMessage = normalize(message);
  return (state.residents || []).find((resident) => lowerMessage.includes(normalize(resident.name)));
}

function extractOneOnOneNotes(message, resident) {
  const escapedName = resident?.name?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`1\\s*on\\s*1\\s+(?:for|with)\\s+${escapedName}\\s*:?\\s*([\\s\\S]+)$`, 'i'),
    /1\s*on\s*1\s*(?:note|record|entry)?\s*(?:that|:)?\s*([\s\S]+)$/i,
  ];

  const match = patterns.map((pattern) => String(message || '').match(pattern)).find(Boolean);
  return cleanTitle(match?.[1] || String(message || '').replace(/.*?:/, ''));
}

function extractActivityTitle(message) {
  const text = String(message || '');
  const patterns = [
    /activity\s+(?:called|named|titled)\s+([\s\S]+?)(?:\s+for\s+(?:memory care|assisted living|both)|$)/i,
    /create\s+(?:an?\s+)?activity\s+(?:draft\s+)?(?:called|named|titled)?\s*([\s\S]+?)(?:\s+for\s+(?:memory care|assisted living|both)|$)/i,
    /turn\s+([\s\S]+?)\s+into\s+(?:an?\s+)?activity/i,
  ];
  const match = patterns.map((pattern) => text.match(pattern)).find(Boolean);
  return cleanTitle(match?.[1] || '');
}

function inferBestFor(message) {
  const lower = normalize(message);
  if (lower.includes('memory')) return 'memory';
  if (lower.includes('assisted')) return 'assisted';
  return 'both';
}

function gameIdFromMessage(message) {
  const lowerMessage = normalize(message);
  if (lowerMessage.includes('bingo caller')) return 'bingo-caller';
  if (lowerMessage.includes('family feud')) return 'family-feud';
  if (lowerMessage.includes('music trivia') || lowerMessage.includes('music bingo')) return 'music-trivia-bingo';
  if (lowerMessage.includes('jeopardy')) return 'jeopardy-trivia';
  if (lowerMessage.includes('memory match') || lowerMessage.includes('matching game')) return 'memory-match';
  return '';
}

export function buildSpringSkillPrompt({ state, currentPath }) {
  return `Spring Director Skills

You are Spring, Amanda's Activities Director assistant. You help create reviewable records inside the Director's Activities App. Do not give up when details are missing. Ask Amanda one clear follow-up question and explain what you still need.

Current app location: ${currentPath || '/app/spring'}
Known residents: ${residentOptions(state)}
Known data areas: activities, calendar events, games, resident profiles, family records, books, Bingo Bucks, attendance records, and 1 on 1 files.
Available games: Bingo Caller, Family Feud, Music Trivia Bingo, Jeopardy Trivia, Memory Match.

Rules:
- Use Amanda's nursing-home language.
- Draft first unless Amanda clearly asks to save a resident note.
- Never invent a resident. If a resident is missing or unclear, ask which resident.
- Never publish a calendar event without title, date, time, and activity/location context. Ask one clear follow-up question.
- Consider resident preferences and whether the resident is in memory care before recommending an activity.
- If Amanda asks you to edit a record, include a RECORD_UPDATE action and explain exactly what changed.
- If you detect declining participation or repeated absences, create a 1 on 1 note so Amanda has state paperwork backup.
- When you can complete records, include the needed hidden action block or blocks after your friendly response.
- When Amanda gives you a numbered list of activities, create one ACTIVITY_DRAFT block for each activity and then say how many drafts were created.

Hidden action blocks:

===ACTIVITY_DRAFT===
{"title":"","category":"custom","bestFor":"both","difficulty":"easy","durationMinutes":45,"groupSize":"small group","supplies":[],"steps":[],"safetyNotes":"","dementiaAdaptations":"","tags":[],"source":{"type":"spring","label":"Spring chat"}}
===END===

===ONE_ON_ONE===
{"residentId":"","notes":""}
===END===

===EVENT===
{"title":"","activityId":"","start":"","end":"","wing":"both","location":"","description":"","supplies":[]}
===END===

===QUESTION===
{"question":"","missingFields":[],"recordType":"activity|oneOnOne|calendar"}
===END===

===LAUNCH_GAME===
{"gameId":"bingo-caller|family-feud|music-trivia-bingo|jeopardy-trivia|memory-match"}
===END===

===RECORD_UPDATE===
{"recordType":"activity|activityDraft|calendar|resident","recordId":"","updates":{},"requestedBy":"Amanda"}
===END===

===ATTENDANCE_PATTERN===
{"residentId":"","summary":""}
===END===`;
}

export function planLocalSpringResponse({ message, docText = '', state, currentPath }) {
  const lower = normalize(message);
  const combinedText = [message, docText].filter(Boolean).join('\n\n');
  const actions = {
    activityDrafts: [],
    oneOnOneNotes: [],
    events: [],
    books: [],
    contacts: [],
    questions: [],
    gameLaunches: [],
    recordUpdates: [],
    attendancePatternNotes: [],
  };

  const gameId = gameIdFromMessage(message);
  if (gameId && (lower.includes('launch') || lower.includes('open') || lower.includes('start') || lower.includes('play'))) {
    actions.gameLaunches.push({ gameId });
    return {
      actions,
      displayText: `I opened ${gameId.replaceAll('-', ' ')} in Games. The host controls are ready for the TV.`,
    };
  }

  const batchActivityDrafts = parseNumberedActivityList(combinedText);
  if (batchActivityDrafts.length > 0 && (lower.includes('activit') || docText)) {
    actions.activityDrafts.push(...batchActivityDrafts);
    return {
      actions,
      displayText: `I created ${batchActivityDrafts.length} activity drafts from Amanda's list. They are saved as drafts so Amanda can review and approve them.`,
    };
  }

  if (lower.includes('recommend') && lower.includes('activit')) {
    const resident = findResident(message, state, currentPath);
    if (!resident) {
      return {
        actions,
        displayText: 'I can recommend activities, but which resident should I look at?',
      };
    }

    const recommendations = recommendActivitiesForResident(state, resident.id);
    const list = recommendations.map((activity) => `- ${activity.title}${activity.memoryCareNote ? ` (${activity.memoryCareNote})` : ''}`).join('\n');
    return {
      actions,
      displayText: recommendations.length
        ? `For ${resident.name}, I would try:\n${list}`
        : `I do not have enough preference data for ${resident.name} yet. Add interests or a 1 on 1 note and I can narrow it down.`,
    };
  }

  if (lower.includes('attendance') || lower.includes('pattern') || lower.includes('absent') || lower.includes('declin')) {
    const resident = findResident(message, state, currentPath);
    if (!resident) {
      return {
        actions,
        displayText: 'I can check attendance patterns, but which resident should I review?',
      };
    }

    const patterns = detectAttendancePatterns(state, resident.id);
    if (patterns.length === 0) {
      return {
        actions,
        displayText: `${resident.name} does not show an attendance concern from the records I can see.`,
      };
    }

    actions.attendancePatternNotes.push({
      residentId: resident.id,
      summary: patterns[0].summary,
    });
    return {
      actions,
      displayText: `${patterns[0].summary} I documented this in ${resident.name}'s 1 on 1 file for Amanda to review.`,
    };
  }

  if (lower.includes('1 on 1') || lower.includes('one on one')) {
    const resident = findResident(message, state, currentPath);
    if (!resident) {
      return {
        actions,
        displayText: "I can make that 1 on 1 note, but which resident is it for? I will not save the record until I know the resident.",
      };
    }

    const notes = extractOneOnOneNotes(message, resident);
    if (!notes || notes.length < 8) {
      return {
        actions,
        displayText: `I can save a 1 on 1 note for ${resident.name}. What should the note say?`,
      };
    }

    actions.oneOnOneNotes.push({
      residentId: resident.id,
      notes,
    });
    return {
      actions,
      displayText: `I saved a 1 on 1 note for ${resident.name}. Amanda can review and export it from the resident profile.`,
    };
  }

  if (lower.includes('activity') || lower.includes('draft')) {
    const title = extractActivityTitle(message);
    if (!title) {
      return {
        actions,
        displayText: 'I can create that activity draft. What should the activity be called?',
      };
    }

    actions.activityDrafts.push({
      title,
      category: lower.includes('bingo') || lower.includes('game') ? 'games' : 'custom',
      bestFor: inferBestFor(message),
      difficulty: 'easy',
      durationMinutes: 45,
      groupSize: 'small group',
      supplies: [],
      steps: ['Review Amanda request.', 'Fill in supplies and instructions.', 'Approve when ready.'],
      safetyNotes: '',
      dementiaAdaptations: '',
      tags: ['spring-draft'],
      source: { type: 'spring', label: 'Spring chat' },
    });

    return {
      actions,
      displayText: `I created an activity draft for ${title}. Amanda can edit it before approving it to the Activities Library.`,
    };
  }

  if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('publish')) {
    actions.questions.push({
      question: 'What date and time should I put this on the calendar?',
      missingFields: ['date', 'time'],
      recordType: 'calendar',
    });
    return {
      actions,
      displayText: 'I can help put that on the calendar. What date and time should I use?',
    };
  }

  return {
    actions,
    displayText: '',
  };
}
