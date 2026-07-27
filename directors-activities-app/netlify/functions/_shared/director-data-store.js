export const DIRECTOR_APP_KEY = 'amanda-director-app';
export const DIRECTOR_STATE_TABLE = 'director_app_state';

export function envValue(env, key) {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) return env[key];
  if (globalThis.Netlify?.env?.get) return globalThis.Netlify.env.get(key);
  if (globalThis.process?.env?.[key]) return globalThis.process.env[key];
  return undefined;
}

export function buildDirectorStatePayload(data, appKey = DIRECTOR_APP_KEY) {
  return {
    app_key: appKey,
    data: data || {},
    version: Number(data?.dataVersion ? String(data.dataVersion).replace(/\D/g, '').slice(-6) : 1) || 1,
    updated_at: new Date().toISOString(),
  };
}

function supabaseConfig(env = {}) {
  const url = envValue(env, 'SUPABASE_URL');
  const key = envValue(env, 'SUPABASE_SERVICE_ROLE_KEY') || envValue(env, 'SUPABASE_ANON_KEY');
  const table = envValue(env, 'DIRECTOR_SUPABASE_TABLE') || DIRECTOR_STATE_TABLE;
  return { url: url?.replace(/\/$/, ''), key, table };
}

function headers(key, prefer = '') {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function loadDirectorStateFromSupabase(env = {}, fetchImpl = fetch) {
  const { url, key, table } = supabaseConfig(env);
  if (!url || !key) return { ok: false, status: 503, detail: 'Supabase director data is not configured.', data: null };

  const response = await fetchImpl(`${url}/rest/v1/${table}?app_key=eq.${encodeURIComponent(DIRECTOR_APP_KEY)}&select=data,version,updated_at&limit=1`, {
    method: 'GET',
    headers: headers(key),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, detail: `Supabase director load failed: ${response.status}`, data: null };
  }

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  return {
    ok: true,
    status: response.status,
    data: row?.data || null,
    version: row?.version || 0,
    updatedAt: row?.updated_at || '',
  };
}

export async function saveDirectorStateToSupabase(data, env = {}, fetchImpl = fetch) {
  const { url, key, table } = supabaseConfig(env);
  if (!url || !key) return { ok: false, status: 503, detail: 'Supabase director data is not configured.' };

  const response = await fetchImpl(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(key, 'resolution=merge-duplicates,return=representation'),
    body: JSON.stringify(buildDirectorStatePayload(data)),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, detail: `Supabase director save failed: ${response.status}` };
  }

  return { ok: true, status: response.status, detail: 'Director data saved to Supabase.' };
}
