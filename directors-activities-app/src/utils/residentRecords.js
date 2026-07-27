function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slug(value) {
  return String(value || 'resident')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function updateResidentProfile(residents, residentId, updates) {
  return residents.map((resident) => {
    if (resident.id !== residentId) return resident;

    return {
      ...resident,
      name: updates.name ?? resident.name,
      room: updates.room ?? resident.room,
      careArea: updates.careArea ?? resident.careArea,
      birthday: updates.birthday ?? resident.birthday,
      interests: updates.interests === undefined ? resident.interests : splitList(updates.interests),
      dislikes: updates.dislikes === undefined ? resident.dislikes : splitList(updates.dislikes),
      mobility: updates.mobility ?? resident.mobility,
      cognition: updates.cognition ?? resident.cognition,
      notes: updates.notes ?? resident.notes,
      photo: updates.photo ?? resident.photo,
      updatedAt: updates.updatedAt || new Date().toISOString(),
      updatedBy: updates.updatedBy || resident.updatedBy,
    };
  });
}

export function addOneOnOneNote(records, note) {
  return [
    ...records,
    {
      id: makeId('one-on-one'),
      residentId: note.residentId,
      notes: String(note.notes || '').trim(),
      createdBy: note.createdBy || 'System',
      createdAt: note.createdAt || new Date().toISOString(),
    },
  ];
}

export function buildOneOnOneDoc(resident, notes) {
  const title = 'Resident 1 on 1 Notes';
  const rows = notes.length
    ? notes.map((note) => `
        <h2>${escapeHtml(new Date(note.createdAt).toLocaleString())}</h2>
        <p><strong>Entered by:</strong> ${escapeHtml(note.createdBy)}</p>
        <p>${escapeHtml(note.notes).replaceAll('\n', '<br>')}</p>
      `).join('')
    : '<p>No 1 on 1 notes have been entered yet.</p>';

  return {
    fileName: `${slug(resident?.name)}-1-on-1-notes.doc`,
    mimeType: 'application/msword',
    content: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #25183f; line-height: 1.45; }
      h1 { font-size: 24px; }
      h2 { font-size: 16px; margin-top: 24px; }
      .meta { color: #5a4873; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p class="meta"><strong>Resident:</strong> ${escapeHtml(resident?.name)}</p>
    <p class="meta"><strong>Room:</strong> ${escapeHtml(resident?.room)}</p>
    <p class="meta"><strong>Care area:</strong> ${escapeHtml(resident?.careArea)}</p>
    ${rows}
  </body>
</html>`,
  };
}
