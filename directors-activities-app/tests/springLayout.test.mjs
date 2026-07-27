import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Spring chat keeps the reply bar visible in the opening viewport', async () => {
  const source = await readFile(new URL('../src/pages/SpringAssistant.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /min-h-\[560px\]/);
  assert.match(source, /calc\(100dvh-18rem\)/);
  assert.match(source, /min-h-0 flex-1 space-y-3 overflow-y-auto/);
});

test('Spring chat scrolls to the newest message', async () => {
  const source = await readFile(new URL('../src/pages/SpringAssistant.jsx', import.meta.url), 'utf8');

  assert.match(source, /messagesEndRef/);
  assert.match(source, /scrollIntoView/);
  assert.match(source, /state\.springMessages\.length/);
});
