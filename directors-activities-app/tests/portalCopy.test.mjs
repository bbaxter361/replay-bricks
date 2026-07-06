import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { portalApps } from '../src/data/sampleData.js';

test('portal hero is Compass Portal while Director app remains a portal tile', async () => {
  const portalSource = await readFile(new URL('../src/components/Portal.jsx', import.meta.url), 'utf8');
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const directorApp = portalApps.find((app) => app.id === 'directors');

  assert.match(indexHtml, /<title>Compass Portal<\/title>/);
  assert.match(portalSource, /<h1[^>]*>Compass Portal<\/h1>/);
  assert.equal(directorApp?.name, "Director's Activities App");
});

test('portal can select Brian or Amanda from replaybrick login query', async () => {
  const portalSource = await readFile(new URL('../src/components/Portal.jsx', import.meta.url), 'utf8');

  assert.match(portalSource, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(portalSource, /amanda: 'user-amanda'/);
  assert.match(portalSource, /brian: 'user-brian'/);
});
