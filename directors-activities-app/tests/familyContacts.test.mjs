import test from 'node:test';
import assert from 'node:assert/strict';
import { addFamilyContact, deleteFamilyContact } from '../src/utils/familyContacts.js';

test('adds a family entry for a resident', () => {
  const contacts = addFamilyContact([], {
    residentId: 'resident-mary',
    name: 'Linda Thompson',
    relationship: 'daughter',
    phone: '(555) 010-1200',
    email: 'linda@example.com',
    createdBy: 'Amanda',
  });

  assert.equal(contacts[0].residentId, 'resident-mary');
  assert.equal(contacts[0].name, 'Linda Thompson');
  assert.equal(contacts[0].relationship, 'daughter');
  assert.equal(contacts[0].createdBy, 'Amanda');
});

test('deletes a family entry by id', () => {
  const contacts = [
    { id: 'family-1', residentId: 'resident-mary', name: 'Linda Thompson' },
    { id: 'family-2', residentId: 'resident-harold', name: 'Sam Jenkins' },
  ];

  assert.deepEqual(deleteFamilyContact(contacts, 'family-1'), [
    { id: 'family-2', residentId: 'resident-harold', name: 'Sam Jenkins' },
  ]);
});
