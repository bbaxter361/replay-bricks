import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const activitiesPage = readFileSync(new URL('../src/pages/Activities.jsx', import.meta.url), 'utf8');

test('activities page is titled Activities Library', () => {
  assert.match(activitiesPage, /title="Activities Library"/);
});

test('new draft opens a draft dialog instead of silently creating one', () => {
  assert.match(activitiesPage, /setIsDraftDialogOpen\(true\)/);
  assert.match(activitiesPage, /Create Activity Draft/);
});
