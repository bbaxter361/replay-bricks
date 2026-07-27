import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildObsidianIncidentMarkdown,
  buildSupabaseIncidentPayload,
  getAlertConfigStatus,
} from '../netlify/functions/_shared/watchdog-journal.js';

const entry = {
  id: 'spring-watchdog-20260707150000000',
  kind: 'failure',
  status: 'down',
  timestamp: '2026-07-07T15:00:00.000Z',
  summary: { ok: false, total: 4, failedCount: 1, failedNames: ['spring-chat'] },
  failedChecks: [{ name: 'spring-chat', status: 504, detail: 'timeout' }],
  alert: { attempted: true, delivered: false, detail: 'SMTP not configured' },
};

test('builds Supabase incident payload for watchdog journal table', () => {
  const payload = buildSupabaseIncidentPayload(entry);

  assert.equal(payload.id, entry.id);
  assert.equal(payload.kind, 'failure');
  assert.equal(payload.status, 'down');
  assert.equal(payload.failed_count, 1);
  assert.equal(payload.alert_delivered, false);
  assert.deepEqual(payload.failed_checks, entry.failedChecks);
});

test('builds Obsidian-readable incident markdown', () => {
  const markdown = buildObsidianIncidentMarkdown(entry);

  assert.match(markdown, /source: spring-watchdog/);
  assert.match(markdown, /# Spring Watchdog Incident/);
  assert.match(markdown, /spring-chat/);
  assert.match(markdown, /SMTP not configured/);
});

test('reports missing SMTP alert configuration without throwing', () => {
  const status = getAlertConfigStatus({});

  assert.equal(status.configured, false);
  assert.match(status.detail, /SMTP/);
});
