import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('portal embeds the current Compass v2 frontend', async () => {
  const source = await readFile(new URL('../src/pages/CompassPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /https:\/\/compass-replaybricks-v2-550\.netlify\.app\/chat\?auto=true/);
  assert.doesNotMatch(source, /https:\/\/compass-replaybricks\.netlify\.app/);
});

test('portal embeds the Compass Portal app on replaybrick.com/portal', async () => {
  const source = await readFile(new URL('../src/pages/PortalPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /https:\/\/baxter-directors-activities\.netlify\.app\//);
  assert.match(source, /<iframe/);
  assert.match(source, /Compass Portal/);
});

test('successful login sends users to the portal', async () => {
  const source = await readFile(new URL('../src/pages/LoginPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /navigate\('\/portal'\)/);
  assert.doesNotMatch(source, /navigate\('\/inventory'\)/);
});
