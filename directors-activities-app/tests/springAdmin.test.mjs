import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuditEntry,
  detectAttendancePatterns,
  recommendActivitiesForResident,
} from '../src/utils/springAdmin.js';
import { parseSpringActions } from '../src/utils/springActions.js';
import { planLocalSpringResponse } from '../src/utils/springSkills.js';

const state = {
  residents: [
    { id: 'resident-flo', name: 'Flo', careArea: 'memory', interests: ['music', 'bingo'] },
  ],
  activities: [
    { id: 'activity-bingo', title: 'Bingo', category: 'games', tags: ['bingo'], dementiaAdaptations: 'Use large cards.' },
    { id: 'activity-choir', title: 'Choir Practice', category: 'music', tags: ['music'], dementiaAdaptations: 'Repeat familiar choruses.' },
  ],
  residentActivityAttendance: [],
};

test('Spring action parser understands game launches and record updates', () => {
  const parsed = parseSpringActions(`
Done.
===LAUNCH_GAME===
{"gameId":"bingo-caller"}
===END===
===RECORD_UPDATE===
{"recordType":"resident","recordId":"resident-flo","updates":{"room":"12"}}
===END===
`);

  assert.equal(parsed.gameLaunches[0].gameId, 'bingo-caller');
  assert.equal(parsed.recordUpdates[0].recordType, 'resident');
  assert.equal(parsed.displayText, 'Done.');
});

test('local Spring planner can launch games from plain language', () => {
  const planned = planLocalSpringResponse({
    message: 'Launch the Bingo Caller',
    state,
    currentPath: '/app/spring',
  });

  assert.equal(planned.actions.gameLaunches[0].gameId, 'bingo-caller');
  assert.match(planned.displayText, /Bingo Caller/i);
});

test('Spring recommendations account for preferences and memory care support', () => {
  const recommendations = recommendActivitiesForResident(state, 'resident-flo');

  assert.equal(recommendations[0].title, 'Bingo');
  assert.ok(recommendations.every((item) => item.memoryCareNote));
});

test('Spring detects attendance concerns and can audit changes', () => {
  const patterns = detectAttendancePatterns(state, 'resident-flo');
  const audit = buildAuditEntry({
    requestedBy: 'Amanda',
    recordType: 'resident',
    recordId: 'resident-flo',
    action: 'update',
    changes: { room: '12' },
  });

  assert.match(patterns[0].summary, /no attendance/i);
  assert.equal(audit.requestedBy, 'Amanda');
  assert.equal(audit.recordType, 'resident');
});
