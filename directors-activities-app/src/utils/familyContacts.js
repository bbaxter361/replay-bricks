function makeId() {
  return `family-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addFamilyContact(contacts, contact) {
  return [
    ...contacts,
    {
      id: makeId(),
      residentId: contact.residentId,
      name: String(contact.name || '').trim(),
      relationship: String(contact.relationship || '').trim(),
      phone: String(contact.phone || '').trim(),
      email: String(contact.email || '').trim(),
      createdBy: contact.createdBy || 'System',
      createdAt: contact.createdAt || new Date().toISOString(),
    },
  ];
}

export function deleteFamilyContact(contacts, contactId) {
  return contacts.filter((contact) => contact.id !== contactId);
}
