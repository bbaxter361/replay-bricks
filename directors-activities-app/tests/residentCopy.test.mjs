import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const residentsPage = readFileSync(new URL('../src/pages/Residents.jsx', import.meta.url), 'utf8');
const appCopyFiles = [
  '../src/pages/Residents.jsx',
  '../src/pages/Dashboard.jsx',
  '../src/pages/Games.jsx',
  '../src/pages/SpringAssistant.jsx',
  '../src/state/appState.js',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('residents section uses Resident Information as the page title', () => {
  assert.match(residentsPage, /title="Resident Information"/);
});

test('app-facing copy calls bingo rewards Bingo Bucks instead of points', () => {
  const combinedCopy = appCopyFiles.join('\n');

  assert.doesNotMatch(combinedCopy, /Bingo points/i);
  assert.doesNotMatch(combinedCopy, /bingo points/i);
  assert.match(combinedCopy, /Bingo Bucks/);
});
