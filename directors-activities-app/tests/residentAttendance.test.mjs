import test from 'node:test';
import assert from 'node:assert/strict';
import { addResidentActivityAttendance } from '../src/utils/residentAttendance.js';

test('records resident activity attendance with the date and time it was entered', () => {
  const enteredAt = '2026-07-06T16:30:00.000Z';
  const records = addResidentActivityAttendance([], {
    residentId: 'resident-mary',
    activityName: 'Watercolor Flowers',
    createdBy: 'Amanda',
    createdAt: enteredAt,
  });

  assert.equal(records[0].residentId, 'resident-mary');
  assert.equal(records[0].activityName, 'Watercolor Flowers');
  assert.equal(records[0].createdBy, 'Amanda');
  assert.equal(records[0].createdAt, enteredAt);
});
