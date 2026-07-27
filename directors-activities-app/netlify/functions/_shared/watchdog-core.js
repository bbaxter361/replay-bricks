const CENTRAL_TIME_ZONE = 'America/Chicago';
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 18;
const DEFAULT_FAILURE_THRESHOLD = 3;

export function getCentralHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: CENTRAL_TIME_ZONE,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  return hour === 24 ? 0 : hour;
}

export function isWithinWatchWindow(date = new Date(), options = {}) {
  const startHour = options.startHour ?? DEFAULT_START_HOUR;
  const endHour = options.endHour ?? DEFAULT_END_HOUR;
  const hour = getCentralHour(date);
  return hour >= startHour && hour < endHour;
}

export function summarizeChecks(checks = []) {
  const failed = checks.filter((check) => !check.ok);
  return {
    ok: failed.length === 0,
    total: checks.length,
    failedCount: failed.length,
    failedNames: failed.map((check) => check.name),
  };
}

export function planIncidentState({ previousState, checks, failureThreshold = DEFAULT_FAILURE_THRESHOLD }) {
  const summary = summarizeChecks(checks);
  const previous = previousState || { status: 'ok', consecutiveFailures: 0, lastAlertedStatus: 'ok' };

  if (summary.ok) {
    return {
      summary,
      shouldAlertDown: false,
      shouldAlertRecovery: previous.status === 'down' || previous.lastAlertedStatus === 'down',
      nextState: {
        status: 'ok',
        consecutiveFailures: 0,
        lastAlertedStatus: previous.status === 'down' || previous.lastAlertedStatus === 'down' ? 'recovered' : previous.lastAlertedStatus || 'ok',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const consecutiveFailures = Number(previous.consecutiveFailures || 0) + 1;
  const isDown = consecutiveFailures >= failureThreshold;
  const shouldAlertDown = isDown && previous.lastAlertedStatus !== 'down';

  return {
    summary,
    shouldAlertDown,
    shouldAlertRecovery: false,
    nextState: {
      status: isDown ? 'down' : 'failing',
      consecutiveFailures,
      lastAlertedStatus: shouldAlertDown ? 'down' : previous.lastAlertedStatus || 'ok',
      updatedAt: new Date().toISOString(),
    },
  };
}

export function createJournalEntry({ kind, status, checks, timestamp, alert }) {
  const summary = summarizeChecks(checks);
  return {
    id: `spring-watchdog-${timestamp.replace(/[^0-9]/g, '')}`,
    kind,
    status,
    timestamp,
    summary,
    checks,
    failedChecks: checks.filter((check) => !check.ok),
    alert: alert || { attempted: false, delivered: false, detail: 'No alert attempted' },
  };
}

export function createCheckResult({ name, ok, status, detail, durationMs }) {
  return {
    name,
    ok: Boolean(ok),
    status: status || 0,
    detail: String(detail || ''),
    durationMs: Number(durationMs || 0),
  };
}
