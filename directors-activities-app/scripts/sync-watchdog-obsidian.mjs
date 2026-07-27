import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildObsidianIncidentMarkdown } from '../netlify/functions/_shared/watchdog-journal.js';

const vaultRoot = process.env.WATCHDOG_OBSIDIAN_VAULT || 'C:/Users/bbaxt/obsidian-vault';
const inboxDir = path.join(vaultRoot, 'Brain/inbox');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const table = process.env.WATCHDOG_SUPABASE_TABLE || 'spring_watchdog_incidents';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.');
  process.exit(1);
}

const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=*&order=occurred_at.desc&limit=100`, {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  },
});

if (!response.ok) {
  console.error(`Could not read spring_watchdog_incidents from Supabase: ${response.status}`);
  process.exit(1);
}

const rows = await response.json();
await mkdir(inboxDir, { recursive: true });

for (const row of rows) {
  const entry = row.raw || {
    id: row.id,
    kind: row.kind,
    status: row.status,
    timestamp: row.occurred_at,
    summary: {
      total: row.total_checks,
      failedCount: row.failed_count,
      failedNames: row.failed_names || [],
    },
    failedChecks: row.failed_checks || [],
    alert: {
      attempted: row.alert_attempted,
      delivered: row.alert_delivered,
      detail: row.alert_detail,
    },
  };
  const markdown = buildObsidianIncidentMarkdown(entry);
  await writeFile(path.join(inboxDir, `${entry.id}.md`), markdown, 'utf8');
}

console.log(`Synced ${rows.length} Spring watchdog incident notes to ${inboxDir}`);
