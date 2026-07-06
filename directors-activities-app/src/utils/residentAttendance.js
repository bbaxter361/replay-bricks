function makeId() {
  return `attendance-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addResidentActivityAttendance(records, attendance) {
  return [
    ...records,
    {
      id: makeId(),
      residentId: attendance.residentId,
      activityName: String(attendance.activityName || '').trim(),
      createdBy: attendance.createdBy || 'System',
      createdAt: attendance.createdAt || new Date().toISOString(),
    },
  ];
}
