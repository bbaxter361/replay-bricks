import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisiblePortalApps } from '../src/utils/accessRules.js';

const apps = [
  { id: 'directors', allowedRoles: ['admin', 'activities'] },
  { id: 'clutch', allowedRoles: ['admin'] },
  { id: 'baxter', allowedRoles: ['admin', 'activities'] },
  { id: 'star-wars', allowedRoles: ['admin'] },
];

test('Brian sees every portal app', () => {
  assert.deepEqual(
    getVisiblePortalApps({ roles: ['admin'] }, apps).map((app) => app.id),
    ['directors', 'clutch', 'baxter', 'star-wars'],
  );
});

test('Amanda sees Director app and My Baxter only', () => {
  assert.deepEqual(
    getVisiblePortalApps({ roles: ['activities'] }, apps).map((app) => app.id),
    ['directors', 'baxter'],
  );
});
