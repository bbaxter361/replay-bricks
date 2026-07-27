import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractPersistableState,
  fetchRemoteState,
  mergeRemoteState,
  saveRemoteState,
} from '../src/services/dataClient.js';
import {
  buildDirectorStatePayload,
  loadDirectorStateFromSupabase,
  saveDirectorStateToSupabase,
} from '../netlify/functions/_shared/director-data-store.js';

test('extractPersistableState keeps Amanda work data but not transient UI state', () => {
  const state = {
    dataVersion: 'amanda-brain-2026-07-07',
    activities: [{ id: 'activity-real', title: 'Real Activity' }],
    activityDrafts: [{ id: 'draft-spring', title: 'Spring Draft' }],
    selectedActivityId: 'draft-spring',
    selectedAppNotice: { title: 'temporary' },
  };

  const persisted = extractPersistableState(state);

  assert.deepEqual(persisted.activities.map((item) => item.id), ['activity-real']);
  assert.deepEqual(persisted.activityDrafts.map((item) => item.id), ['draft-spring']);
  assert.equal(persisted.selectedActivityId, undefined);
  assert.equal(persisted.selectedAppNotice, undefined);
});

test('mergeRemoteState preserves local records while adding Supabase records', () => {
  const localState = {
    dataVersion: 'amanda-brain-2026-07-07',
    activities: [
      { id: 'activity-local', title: 'Local Activity' },
      { id: 'activity-shared', title: 'Old Browser Activity' },
    ],
    activityDrafts: [{ id: 'draft-local', title: 'Local Draft' }],
    residents: [],
  };
  const remoteState = {
    data: {
      dataVersion: 'amanda-brain-2026-07-07',
      activities: [
        { id: 'activity-remote', title: 'Remote Activity' },
        { id: 'activity-shared', title: 'Supabase Activity' },
      ],
      activityDrafts: [{ id: 'draft-remote', title: 'Remote Draft' }],
      residents: [{ id: 'resident-remote', name: 'Remote Resident' }],
    },
  };

  const merged = mergeRemoteState(localState, remoteState);

  assert.deepEqual(merged.activities.map((item) => item.id), ['activity-local', 'activity-shared', 'activity-remote']);
  assert.equal(merged.activities.find((item) => item.id === 'activity-shared').title, 'Supabase Activity');
  assert.deepEqual(merged.activityDrafts.map((item) => item.id), ['draft-local', 'draft-remote']);
  assert.deepEqual(merged.residents.map((item) => item.id), ['resident-remote']);
});

test('remote data client loads and saves through the director data API', async () => {
  const calls = [];
  const fakeFetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (!options.method || options.method === 'GET') {
      return Response.json({ data: { activities: [{ id: 'activity-remote' }] } });
    }
    return Response.json({ ok: true, data: JSON.parse(options.body).data });
  };

  const loaded = await fetchRemoteState(fakeFetch);
  const saved = await saveRemoteState({ activities: [{ id: 'activity-save' }] }, fakeFetch);

  assert.equal(calls[0].url, '/api/director-data');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(loaded.activities[0].id, 'activity-remote');
  assert.equal(saved.ok, true);
});

test('director Supabase helper builds and upserts a single app state row', async () => {
  const payload = buildDirectorStatePayload({
    activities: [{ id: 'activity-save' }],
    activityDrafts: [{ id: 'draft-save' }],
  });
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('[{"data":{"activities":[{"id":"activity-save"}]}}]', { status: 200 });
  };

  const saved = await saveDirectorStateToSupabase(payload.data, {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  }, fakeFetch);
  const loaded = await loadDirectorStateFromSupabase({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  }, fakeFetch);

  assert.equal(payload.app_key, 'amanda-director-app');
  assert.match(calls[0].url, /director_app_state/);
  assert.equal(calls[0].options.method, 'POST');
  assert.match(calls[0].options.headers.Prefer, /resolution=merge-duplicates/);
  assert.equal(saved.ok, true);
  assert.equal(loaded.data.activities[0].id, 'activity-save');
});
