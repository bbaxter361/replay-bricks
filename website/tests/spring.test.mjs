import assert from 'node:assert/strict';
import test from 'node:test';

process.env.AWS_LAMBDA_FUNCTION_NAME = 'spring-test';

const {
  buildCalendarImportPrompt,
  buildDeepSeekMessages,
  buildSpringSystemPrompt,
  buildUrlContext,
  getSpringDateContext,
  parseCalendarImportResponse
} = await import('../netlify/functions/spring.js');

test('image uploads are represented as text-only DeepSeek messages', () => {
  const messages = buildDeepSeekMessages({
    systemPrompt: 'system',
    userMessage: 'Please review this upload.',
    imageBase64: 'data:image/png;base64,abc123',
    history: [],
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[1].role, 'user');
  assert.equal(typeof messages[1].content, 'string');
  assert.match(messages[1].content, /uploaded an image/i);
  assert.doesNotMatch(JSON.stringify(messages), /image_url/);
});

test('calendar importer parses fenced JSON into normalized draft events', () => {
  const result = parseCalendarImportResponse(`Here you go:
\`\`\`json
{
  "summary": "Two April activities",
  "events": [
    {
      "title": "Chair Yoga",
      "start": "2026-04-01T10:00:00",
      "end": "2026-04-01T10:30:00",
      "type": "exercise",
      "wing": "assisted",
      "description": "Gentle seated yoga"
    },
    {
      "title": "Bingo",
      "start": "2026-04-01T14:00:00"
    }
  ],
  "warnings": ["Confirm exact room"]
}
\`\`\``);

  assert.equal(result.summary, 'Two April activities');
  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].title, 'Chair Yoga');
  assert.equal(result.events[0].wing, 'assisted');
  assert.equal(
    new Date(result.events[1].end).getTime() - new Date(result.events[1].start).getTime(),
    60 * 60 * 1000
  );
  assert.deepEqual(result.warnings, ['Confirm exact room']);
});

test('calendar importer prompt supports notes and old calendars for a target month', () => {
  const prompt = buildCalendarImportPrompt({
    fileName: 'old-calendar.pdf',
    text: 'Old notes: bingo Mondays, music Fridays',
    targetMonth: '2026-06',
    importMode: 'target-month'
  });

  assert.match(prompt, /nursing home/i);
  assert.match(prompt, /notes/i);
  assert.match(prompt, /old calendars/i);
  assert.match(prompt, /2026-06/);
  assert.match(prompt, /map.*target month/i);
});

test('URL context is appended to chat messages for Spring', () => {
  const text = buildUrlContext([
    { url: 'https://example.com/menu', title: 'Activity Menu', text: 'Bingo Monday at 2 PM' }
  ]);

  assert.match(text, /Web link/);
  assert.match(text, /Activity Menu/);
  assert.match(text, /Bingo Monday/);
});

test('Spring system prompt includes current date context for calendar requests', () => {
  const context = getSpringDateContext(new Date('2026-05-09T15:30:00-05:00'));
  const prompt = buildSpringSystemPrompt(new Date('2026-05-09T15:30:00-05:00'));

  assert.match(context, /Saturday/);
  assert.match(context, /May 9, 2026/);
  assert.match(context, /America\/Chicago/);
  assert.match(prompt, /relative dates/i);
});
