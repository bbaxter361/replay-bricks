import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpringSkillPrompt, planLocalSpringResponse } from '../src/utils/springSkills.js';
import { parseSpringActions } from '../src/utils/springActions.js';

const state = {
  residents: [
    { id: 'resident-flo', name: 'Flo', careArea: 'memory', interests: ['bingo'], notes: 'Memory Care leader.' },
    { id: 'resident-katherine', name: 'Katherine', careArea: 'assisted', interests: ['music'] },
  ],
  activities: [
    { id: 'activity-bingo', title: 'Bingo' },
  ],
  bingoTransactions: [
    { id: 'bingo-flo', residentId: 'resident-flo', amount: 22 },
    { id: 'bingo-katherine', residentId: 'resident-katherine', amount: 21 },
  ],
  calendarEvents: [
    { id: 'event-today', title: 'Bingo', start: '2026-07-27T10:00:00', end: '2026-07-27T11:00:00', wing: 'both', location: 'Activity room' },
  ],
  books: [
    { id: 'book-hexed', title: 'Hexed', author: 'Kevin Hearne', status: 'currently-reading' },
  ],
  springMessages: [
    { id: 'spring-user', role: 'user', content: 'Add bingo points for Flo.' },
  ],
};

test('Spring skill prompt teaches activity draft and 1 on 1 action blocks', () => {
  const prompt = buildSpringSkillPrompt({
    state,
    currentPath: '/app/residents/resident-flo',
    memories: [{ topic: 'point-leaders', principle: 'Flo leads Memory Care with 22 points.' }],
    now: new Date('2026-07-27T09:00:00'),
  });

  assert.match(prompt, /===ACTIVITY_DRAFT===/);
  assert.match(prompt, /===ONE_ON_ONE===/);
  assert.match(prompt, /ask Amanda one clear follow-up question/i);
  assert.match(prompt, /Ollama-hosted DeepSeek/);
  assert.match(prompt, /Do not say OpenRouter/);
  assert.match(prompt, /Flo/);
  assert.match(prompt, /COMPASS LIVE DATA/);
  assert.match(prompt, /Flo \(memory\): 22 Bingo Bucks/);
  assert.match(prompt, /Katherine \(assisted\): 21 Bingo Bucks/);
  assert.match(prompt, /Bingo \(both, Activity room\)/);
  assert.match(prompt, /Hexed by Kevin Hearne/);
  assert.match(prompt, /point-leaders/);
});

test('Spring asks Amanda for the resident when a 1 on 1 request is incomplete', () => {
  const planned = planLocalSpringResponse({
    message: 'Add a 1 on 1 note that she stayed in her room today.',
    state,
    currentPath: '/app/family',
  });

  assert.equal(planned.actions.oneOnOneNotes.length, 0);
  assert.match(planned.displayText, /which resident/i);
  assert.match(planned.displayText, /will not save/i);
});

test('Spring can prepare a 1 on 1 note when Amanda names the resident', () => {
  const planned = planLocalSpringResponse({
    message: 'Add a 1 on 1 for Flo: she stayed in her room today but accepted a music visit.',
    state,
    currentPath: '/app/family',
  });

  assert.equal(planned.actions.oneOnOneNotes[0].residentId, 'resident-flo');
  assert.match(planned.actions.oneOnOneNotes[0].notes, /accepted a music visit/);
  assert.match(planned.displayText, /saved a 1 on 1 note/i);
});

test('Spring can create an activity draft from Amanda plain English', () => {
  const planned = planLocalSpringResponse({
    message: 'Create an activity called Patriotic Cookie Decorating for memory care.',
    state,
    currentPath: '/app/calendar',
  });

  assert.equal(planned.actions.activityDrafts[0].title, 'Patriotic Cookie Decorating');
  assert.equal(planned.actions.activityDrafts[0].bestFor, 'memory');
  assert.match(planned.displayText, /draft/i);
});

test('Spring can turn a numbered activity list into multiple saved drafts', () => {
  const activityList = `1. Chair Yoga Stretch + Count Breaths
Type: Muscle & Mind
Suitability: Both
Summary: Stretch while counting breaths.
Materials: Chair, blanket
Steps: Sit -> Lift arms up -> Lower slowly.

2. Memory Bingo + Recall Colors
Type: Memory Boost
Suitability: Both
Summary: Match colors, then name all red squares.
Materials: Bingo cards, markers
Steps: Call "Red" -> Find red square -> Mark it.`;

  const planned = planLocalSpringResponse({
    message: 'Please input these activities.',
    docText: activityList,
    state,
    currentPath: '/app/spring',
  });

  assert.equal(planned.actions.activityDrafts.length, 2);
  assert.equal(planned.actions.activityDrafts[0].title, 'Chair Yoga Stretch + Count Breaths');
  assert.deepEqual(planned.actions.activityDrafts[0].supplies, ['Chair', 'blanket']);
  assert.match(planned.actions.activityDrafts[1].steps[0], /Call "Red"/);
  assert.match(planned.displayText, /created 2 activity drafts/i);
});

test('Spring answers calendar lookup questions from saved events instead of asking to schedule', () => {
  const planned = planLocalSpringResponse({
    message: 'What events are on the calendar this week?',
    state,
    currentPath: '/app/spring',
  });

  assert.equal(planned.actions.questions.length, 0);
  assert.match(planned.displayText, /calendar for the next 7 days/i);
  assert.match(planned.displayText, /Bingo/);
  assert.doesNotMatch(planned.displayText, /What date and time should I use/i);
});

test('Spring still asks for date and time when Amanda wants to add an event', () => {
  const planned = planLocalSpringResponse({
    message: 'Add this to the calendar',
    state,
    currentPath: '/app/spring',
  });

  assert.equal(planned.actions.questions[0].recordType, 'calendar');
  assert.match(planned.displayText, /date and time/i);
});

test('Spring action parser understands new activity, one on one, and question blocks', () => {
  const parsed = parseSpringActions(`
I can do that.
===ACTIVITY_DRAFT===
{"title":"Chair Yoga","category":"exercise","bestFor":"assisted"}
===END===
===ONE_ON_ONE===
{"residentId":"resident-flo","notes":"Offered bingo. Flo preferred music."}
===END===
===QUESTION===
{"question":"What time should I put this on the calendar?"}
===END===
`);

  assert.equal(parsed.activityDrafts[0].title, 'Chair Yoga');
  assert.equal(parsed.oneOnOneNotes[0].residentId, 'resident-flo');
  assert.equal(parsed.questions[0].question, 'What time should I put this on the calendar?');
  assert.equal(parsed.displayText, 'I can do that.');
});
