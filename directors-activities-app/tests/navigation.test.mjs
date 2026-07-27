import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { navItems } from '../src/navigation.js';

test('primary navigation starts with Amanda daily workflow order', () => {
  assert.deepEqual(
    navItems.slice(0, 5).map((item) => item.label),
    ['Home', 'Calendar', 'Spring', 'Activities', 'Canva'],
  );
});

test('family records are labeled Family of Residents in navigation', () => {
  assert.equal(navItems.find((item) => item.to === '/app/family')?.label, 'Family of Residents');
});

test('settings is not shown as an application section', () => {
  assert.equal(navItems.some((item) => item.label === 'Settings'), false);
});

test('app shell uses Compass branding without preview labels', async () => {
  const sidebar = await readFile(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8');
  const topBar = await readFile(new URL('../src/components/TopBar.jsx', import.meta.url), 'utf8');
  const spring = await readFile(new URL('../src/pages/SpringAssistant.jsx', import.meta.url), 'utf8');

  assert.match(sidebar, /compass-logo\.png/);
  assert.match(sidebar, /Compass App/);
  assert.match(sidebar, /Director's Activities/);
  assert.match(topBar, /Amanda Daily Workspace/);
  assert.doesNotMatch(topBar, /Local preview/i);
  assert.match(spring, /Your Personal Activities Assistant/);
  assert.doesNotMatch(spring, /Spring is connected to the existing live Spring backend/);
});
