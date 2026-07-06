import test from 'node:test';
import assert from 'node:assert/strict';
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
