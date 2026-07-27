import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Spring watchdog is scheduled every five minutes and has a manual API path', async () => {
  const source = await readFile(new URL('../netlify/functions/spring-watchdog.js', import.meta.url), 'utf8');
  const manualSource = await readFile(new URL('../netlify/functions/spring-watchdog-manual.js', import.meta.url), 'utf8');

  assert.match(source, /schedule:\s*'\*\/5 \* \* \* \*'/);
  assert.doesNotMatch(source, /path:\s*'\/api\/spring-watchdog'/);
  assert.match(manualSource, /path:\s*'\/api\/spring-watchdog'/);
  assert.match(manualSource, /springWatchdogHandler/);
  assert.match(source, /isWithinWatchWindow/);
  assert.match(source, /planIncidentState/);
  assert.match(source, /sendWatchdogAlert/);
});

test('Netlify config keeps functions directory enabled for scheduled watchdog', async () => {
  const source = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');

  assert.match(source, /\[functions\]/);
  assert.match(source, /directory = "netlify\/functions"/);
});
