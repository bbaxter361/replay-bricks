import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('watchdog Obsidian sync helper writes incidents into the vault inbox', async () => {
  const source = await readFile(new URL('../scripts/sync-watchdog-obsidian.mjs', import.meta.url), 'utf8');

  assert.match(source, /WATCHDOG_OBSIDIAN_VAULT/);
  assert.match(source, /Brain\/inbox/);
  assert.match(source, /spring_watchdog_incidents/);
  assert.match(source, /buildObsidianIncidentMarkdown/);
});
