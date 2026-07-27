import { getStore } from '@netlify/blobs';
import {
  createCheckResult,
  createJournalEntry,
  isWithinWatchWindow,
  planIncidentState,
} from './_shared/watchdog-core.js';
import {
  buildObsidianIncidentMarkdown,
  saveIncidentToSupabase,
  sendWatchdogAlert,
} from './_shared/watchdog-journal.js';

function envValue(key, fallback = '') {
  if (globalThis.Netlify?.env?.get) return globalThis.Netlify.env.get(key) || fallback;
  return fallback;
}

function headers() {
  const apiKey = envValue('SPRING_API_KEY', 'spring-vicki-2026');
  return apiKey ? { 'x-api-key': apiKey } : {};
}

async function timedCheck(name, run) {
  const started = Date.now();
  try {
    const result = await run();
    return createCheckResult({
      name,
      ok: result.ok,
      status: result.status,
      detail: result.detail,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    return createCheckResult({
      name,
      ok: false,
      status: 0,
      detail: error.message || 'Check failed',
      durationMs: Date.now() - started,
    });
  }
}

async function checkJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    detail: response.ok ? 'ok' : text.slice(0, 160),
    text,
  };
}

async function runChecks() {
  const springBase = envValue('SPRING_API_BASE', 'https://replaybricksv2.netlify.app').replace(/\/$/, '');
  const directorBase = envValue('DIRECTOR_APP_BASE', 'https://baxter-directors-activities.netlify.app').replace(/\/$/, '');

  const checks = [];
  checks.push(await timedCheck('spring-health', async () => checkJson(`${springBase}/api/health`, { headers: headers() })));
  checks.push(await timedCheck('spring-chat', async () => {
    const result = await checkJson(`${springBase}/api/chat`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Spring watchdog health check. Reply with a short status.',
        history: [],
      }),
    });
    if (!result.ok) return result;
    try {
      const parsed = JSON.parse(result.text);
      const hasResponse = Boolean(String(parsed.response || '').trim());
      return {
        ok: hasResponse,
        status: result.status,
        detail: hasResponse ? 'chat response ok' : 'chat response empty',
      };
    } catch {
      return { ok: false, status: result.status, detail: 'chat response was not JSON' };
    }
  }));
  checks.push(await timedCheck('spring-file-read', async () => {
    const form = new FormData();
    form.append('file', new Blob(['watchdog file check'], { type: 'text/plain' }), 'watchdog.txt');
    const result = await checkJson(`${springBase}/api/read-file`, {
      method: 'POST',
      headers: headers(),
      body: form,
    });
    return {
      ok: result.ok,
      status: result.status,
      detail: result.ok ? 'file-read ok' : result.detail,
    };
  }));
  checks.push(await timedCheck('director-spring-proxy', async () => (
    checkJson(`${directorBase}/api/spring-proxy/health`)
  )));

  return checks;
}

async function getState(store) {
  return await store.get('state', { type: 'json' }) || { status: 'ok', consecutiveFailures: 0, lastAlertedStatus: 'ok' };
}

async function saveObsidianMarkdown(store, entry) {
  const markdown = buildObsidianIncidentMarkdown(entry);
  await store.set(`obsidian/${entry.id}.md`, markdown, {
    metadata: { contentType: 'text/markdown', createdAt: entry.timestamp },
  });
}

function alertMessage(kind, entry) {
  const failed = entry.failedChecks.map((check) => `${check.name}: ${check.detail}`).join('\n') || 'No failed checks listed.';
  return `Spring watchdog ${kind}

Time: ${entry.timestamp}
Status: ${entry.status}
Failed checks:
${failed}

Director app: https://baxter-directors-activities.netlify.app/app/spring`;
}

export async function springWatchdogHandler(req) {
  const now = new Date();
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';
  const manual = req.method === 'GET' || req.method === 'POST';

  if (!force && !isWithinWatchWindow(now)) {
    return Response.json({ ok: true, skipped: true, reason: 'Outside 6 AM-6 PM Central watchdog window.' });
  }

  const store = getStore({ name: 'spring-watchdog', consistency: 'strong' });
  const previousState = await getState(store);
  const checks = await runChecks();
  const planned = planIncidentState({ previousState, checks });
  await store.setJSON('state', planned.nextState);

  let journal = null;
  let supabase = { ok: false, detail: 'No journal entry needed.' };
  if (!planned.summary.ok || planned.shouldAlertRecovery) {
    const timestamp = now.toISOString();
    const kind = planned.shouldAlertRecovery ? 'recovery' : 'failure';
    const status = planned.shouldAlertRecovery ? 'recovered' : planned.nextState.status;
    const initialEntry = createJournalEntry({
      kind,
      status,
      checks,
      timestamp,
      alert: { attempted: false, delivered: false, detail: 'No alert needed yet.' },
    });

    const shouldSend = planned.shouldAlertDown || planned.shouldAlertRecovery;
    const alert = shouldSend
      ? await sendWatchdogAlert({
        subject: planned.shouldAlertRecovery ? 'Spring recovered' : 'Spring watchdog alert',
        message: alertMessage(kind, initialEntry),
      })
      : { attempted: false, delivered: false, detail: 'Below alert threshold.' };

    journal = { ...initialEntry, alert };
    supabase = await saveIncidentToSupabase(journal);
    await saveObsidianMarkdown(store, journal);
  }

  return Response.json({
    ok: planned.summary.ok,
    manual,
    force,
    status: planned.nextState.status,
    consecutiveFailures: planned.nextState.consecutiveFailures,
    checks,
    journal,
    supabase,
  });
}

export default springWatchdogHandler;

export const config = {
  schedule: '*/5 * * * *',
};
