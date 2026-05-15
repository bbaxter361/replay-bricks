import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('portal embeds the current Compass v2 frontend', async () => {
  const source = await readFile(new URL('../src/pages/CompassPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /https:\/\/compass-replaybricks-v2-550\.netlify\.app\/chat\?auto=true/);
  assert.doesNotMatch(source, /https:\/\/compass-replaybricks\.netlify\.app/);
});

test('portal launches Compass as the standalone v2 app', async () => {
  const source = await readFile(new URL('../src/pages/PortalPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /https:\/\/compass-replaybricks-v2-550\.netlify\.app\/chat\?auto=true/);
  assert.match(source, /window\.location\.href = app\.route/);
});
