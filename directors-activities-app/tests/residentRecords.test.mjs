import test from 'node:test';
import assert from 'node:assert/strict';
import { addOneOnOneNote, buildOneOnOneDoc, updateResidentProfile } from '../src/utils/residentRecords.js';

test('updates editable resident information fields without dropping existing data', () => {
  const residents = [
    {
      id: 'resident-katherine',
      name: 'Katherine',
      room: '',
      careArea: 'assisted',
      birthday: '',
      interests: ['bingo'],
      dislikes: [],
      mobility: '',
      cognition: '',
      notes: 'Original note',
    },
  ];

  const updated = updateResidentProfile(residents, 'resident-katherine', {
    room: '102',
    birthday: 'July 9',
    interests: 'bingo, music, crafts',
    notes: 'Likes afternoon visits.',
  });

  assert.equal(updated[0].room, '102');
  assert.equal(updated[0].birthday, 'July 9');
  assert.deepEqual(updated[0].interests, ['bingo', 'music', 'crafts']);
  assert.deepEqual(updated[0].dislikes, []);
  assert.equal(updated[0].notes, 'Likes afternoon visits.');
});

test('records 1 on 1 notes with resident, author, date, and time', () => {
  const enteredAt = '2026-07-07T14:15:00.000Z';
  const records = addOneOnOneNote([], {
    residentId: 'resident-katherine',
    notes: 'Stayed in room today. Amanda offered music and bingo.',
    createdBy: 'Amanda',
    createdAt: enteredAt,
  });

  assert.equal(records[0].residentId, 'resident-katherine');
  assert.equal(records[0].notes, 'Stayed in room today. Amanda offered music and bingo.');
  assert.equal(records[0].createdBy, 'Amanda');
  assert.equal(records[0].createdAt, enteredAt);
  assert.match(records[0].id, /^one-on-one-/);
});

test('builds a Word-readable DOC export for state paperwork', () => {
  const doc = buildOneOnOneDoc(
    { name: 'Katherine', room: '102', careArea: 'assisted' },
    [
      {
        id: 'one-on-one-1',
        notes: 'Discussed preferred activities and encouraged group bingo.',
        createdBy: 'Amanda',
        createdAt: '2026-07-07T14:15:00.000Z',
      },
    ],
  );

  assert.match(doc.fileName, /katherine-1-on-1-notes\.doc$/);
  assert.match(doc.content, /Resident 1 on 1 Notes/);
  assert.match(doc.content, /Katherine/);
  assert.match(doc.content, /Discussed preferred activities/);
  assert.match(doc.content, /Amanda/);
  assert.equal(doc.mimeType, 'application/msword');
});
