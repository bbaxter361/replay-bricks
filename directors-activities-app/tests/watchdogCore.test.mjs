import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createJournalEntry,
  getCentralHour,
  isWithinWatchWindow,
  planIncidentState,
  summarizeChecks,
} from '../netlify/functions/_shared/watchdog-core.js';

test('watchdog only runs between 6 AM and 6 PM Central time', () => {
  assert.equal(isWithinWatchWindow(new Date('2026-07-07T11:00:00.000Z')), true);
  assert.equal(getCentralHour(new Date('2026-07-07T11:00:00.000Z')), 6);
  assert.equal(isWithinWatchWindow(new Date('2026-07-07T23:30:00.000Z')), false);
});

test('watchdog alerts after three consecutive failures', () => {
  const failedChecks = [{ name: 'spring-health', ok: false, status: 500, detail: 'HTTP 500' }];
  const one = planIncidentState({ previousState: null, checks: failedChecks });
  const two = planIncidentState({ previousState: one.nextState, checks: failedChecks });
  const three = planIncidentState({ previousState: two.nextState, checks: failedChecks });

  assert.equal(one.shouldAlertDown, false);
  assert.equal(two.shouldAlertDown, false);
  assert.equal(three.shouldAlertDown, true);
  assert.equal(three.nextState.status, 'down');
});

test('watchdog sends recovery after a down state returns to healthy', () => {
  const previousState = { status: 'down', consecutiveFailures: 3, lastAlertedStatus: 'down' };
  const planned = planIncidentState({
    previousState,
    checks: [{ name: 'spring-health', ok: true, status: 200, detail: 'ok' }],
  });

  assert.equal(planned.shouldAlertRecovery, true);
  assert.equal(planned.nextState.status, 'ok');
  assert.equal(planned.nextState.consecutiveFailures, 0);
});

test('journal entries include failed checks and alert delivery status', () => {
  const checks = [
    { name: 'spring-health', ok: true, status: 200, detail: 'ok' },
    { name: 'spring-chat', ok: false, status: 504, detail: 'timeout' },
  ];
  const entry = createJournalEntry({
    kind: 'failure',
    status: 'down',
    checks,
    timestamp: '2026-07-07T15:00:00.000Z',
    alert: { attempted: true, delivered: false, detail: 'SMTP not configured' },
  });

  assert.equal(entry.kind, 'failure');
  assert.equal(entry.failedChecks.length, 1);
  assert.equal(entry.failedChecks[0].name, 'spring-chat');
  assert.equal(entry.alert.delivered, false);
  assert.deepEqual(summarizeChecks(checks).failedNames, ['spring-chat']);
});
