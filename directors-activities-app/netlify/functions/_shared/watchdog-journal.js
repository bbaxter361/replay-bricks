function envValue(env, key) {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) return env[key];
  if (globalThis.Netlify?.env?.get) return globalThis.Netlify.env.get(key);
  return undefined;
}

function escapeYaml(value) {
  return String(value || '').replaceAll('"', '\\"');
}

export function buildSupabaseIncidentPayload(entry) {
  return {
    id: entry.id,
    kind: entry.kind,
    status: entry.status,
    occurred_at: entry.timestamp,
    total_checks: entry.summary?.total || 0,
    failed_count: entry.summary?.failedCount || 0,
    failed_names: entry.summary?.failedNames || [],
    failed_checks: entry.failedChecks || [],
    checks: entry.checks || [],
    alert_attempted: Boolean(entry.alert?.attempted),
    alert_delivered: Boolean(entry.alert?.delivered),
    alert_detail: entry.alert?.detail || '',
    raw: entry,
  };
}

export function buildObsidianIncidentMarkdown(entry) {
  const failedLines = (entry.failedChecks || [])
    .map((check) => `- ${check.name}: ${check.status || 'n/a'} ${check.detail || ''}`.trim())
    .join('\n') || '- None';

  return `---
id: ${entry.id}
source: spring-watchdog
type: watchdog-incident
status: ${entry.status}
kind: ${entry.kind}
created: ${entry.timestamp}
tags: [spring, watchdog, outage]
---

# Spring Watchdog Incident

- Time: ${entry.timestamp}
- Kind: ${entry.kind}
- Status: ${entry.status}
- Alert attempted: ${entry.alert?.attempted ? 'yes' : 'no'}
- Alert delivered: ${entry.alert?.delivered ? 'yes' : 'no'}
- Alert detail: "${escapeYaml(entry.alert?.detail)}"

## Failed Checks

${failedLines}
`;
}

export function getAlertConfigStatus(env = {}) {
  const required = ['WATCHDOG_SMTP_HOST', 'WATCHDOG_SMTP_PORT', 'WATCHDOG_SMTP_USER', 'WATCHDOG_SMTP_PASS', 'WATCHDOG_ALERT_FROM'];
  const missing = required.filter((key) => !envValue(env, key));
  const recipients = (envValue(env, 'WATCHDOG_ALERT_RECIPIENTS') || '').split(',').map((item) => item.trim()).filter(Boolean);

  if (missing.length || recipients.length === 0) {
    return {
      configured: false,
      detail: `SMTP alert delivery is not configured. Missing: ${[...missing, recipients.length ? '' : 'WATCHDOG_ALERT_RECIPIENTS'].filter(Boolean).join(', ')}`,
    };
  }

  return { configured: true, detail: 'SMTP alert delivery configured.' };
}

export async function saveIncidentToSupabase(entry, env = {}) {
  const url = envValue(env, 'SUPABASE_URL');
  const key = envValue(env, 'SUPABASE_SERVICE_ROLE_KEY') || envValue(env, 'SUPABASE_ANON_KEY');
  const table = envValue(env, 'WATCHDOG_SUPABASE_TABLE') || 'spring_watchdog_incidents';

  if (!url || !key) {
    return { ok: false, detail: 'Supabase journal is not configured.' };
  }

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(buildSupabaseIncidentPayload(entry)),
  });

  if (!response.ok) {
    return { ok: false, detail: `Supabase journal failed: ${response.status}` };
  }

  return { ok: true, detail: 'Supabase journal saved.' };
}

export async function sendWatchdogAlert({ subject, message }, env = {}) {
  const status = getAlertConfigStatus(env);
  if (!status.configured) return { attempted: true, delivered: false, detail: status.detail };

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: envValue(env, 'WATCHDOG_SMTP_HOST'),
      port: Number(envValue(env, 'WATCHDOG_SMTP_PORT')),
      secure: String(envValue(env, 'WATCHDOG_SMTP_SECURE') || '').toLowerCase() === 'true',
      auth: {
        user: envValue(env, 'WATCHDOG_SMTP_USER'),
        pass: envValue(env, 'WATCHDOG_SMTP_PASS'),
      },
    });
    await transporter.sendMail({
      from: envValue(env, 'WATCHDOG_ALERT_FROM'),
      to: envValue(env, 'WATCHDOG_ALERT_RECIPIENTS'),
      subject,
      text: message,
    });
    return { attempted: true, delivered: true, detail: 'Alert email sent.' };
  } catch (error) {
    return { attempted: true, delivered: false, detail: `Alert email failed: ${error.message}` };
  }
}
