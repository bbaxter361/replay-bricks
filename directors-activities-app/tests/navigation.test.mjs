import test from 'node:test';
import assert from 'node:assert/strict';
import { navItems } from '../src/navigation.js';

test('primary navigation starts with Amanda daily workflow order', () => {
  assert.deepEqual(
    navItems.slice(0, 5).map((item) => item.label),
    ['Home', 'Calendar', 'Spring', 'Activities', 'Canva'],
  );
});
