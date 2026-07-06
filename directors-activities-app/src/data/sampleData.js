export const users = [
  { id: 'user-brian', name: 'Brian', email: 'brian@replaybrick.com', roles: ['admin'] },
  { id: 'user-amanda', name: 'Amanda', email: 'amanda@replaybrick.com', roles: ['activities'] },
];

export const portalApps = [
  {
    id: 'directors',
    name: "Director's Activities App",
    subtitle: 'Spring, calendars, residents, activities, and games',
    allowedRoles: ['admin', 'activities'],
    status: 'local-preview',
  },
  {
    id: 'clutch',
    name: 'Clutch',
    subtitle: 'Replay Bricks inventory and business tools',
    allowedRoles: ['admin'],
    status: 'later-phase',
  },
  {
    id: 'baxter',
    name: 'My Baxter Portal',
    subtitle: 'Family portal',
    allowedRoles: ['admin', 'activities'],
    status: 'leave-as-is',
  },
  {
    id: 'star-wars',
    name: 'Star Wars Figure Tracker',
    subtitle: 'Vintage figure collection tracker',
    allowedRoles: ['admin'],
    status: 'later-phase',
  },
];

export const canvaTemplates = [
  { id: 'canva-daily', name: 'Daily Activity Sheet', type: 'daily', isDefault: true },
  { id: 'canva-weekly', name: 'Weekly Nursing Home Calendar', type: 'weekly', isDefault: true },
  { id: 'canva-monthly', name: 'Monthly Memory Care Calendar', type: 'monthly', isDefault: true },
];

export const activities = [
  {
    id: 'activity-watercolor',
    status: 'approved',
    title: 'Watercolor Flowers',
    category: 'art',
    bestFor: 'both',
    difficulty: 'easy',
    durationMinutes: 45,
    groupSize: 'small group',
    supplies: ['Watercolor paper', 'Paint', 'Brushes', 'Water cups'],
    steps: ['Set out paper and paints.', 'Demonstrate simple flower shapes.', 'Let residents paint at their own pace.'],
    safetyNotes: 'Use spill-proof cups and keep walkways clear.',
    dementiaAdaptations: 'Offer pre-drawn outlines and one color at a time.',
    tags: ['spring', 'fine motor', 'calm'],
    lastUsed: '2026-07-01',
    residentNotes: 'Mary enjoyed the pink paint. Harold preferred watching.',
  },
  {
    id: 'activity-singalong',
    status: 'approved',
    title: 'Golden Oldies Singalong',
    category: 'music',
    bestFor: 'memory',
    difficulty: 'easy',
    durationMinutes: 30,
    groupSize: 'large group',
    supplies: ['Lyric sheets', 'Bluetooth speaker'],
    steps: ['Seat residents in a half circle.', 'Start with familiar songs.', 'Invite clapping or simple instruments.'],
    safetyNotes: 'Keep volume comfortable.',
    dementiaAdaptations: 'Use repeated choruses and call-and-response prompts.',
    tags: ['music', 'reminiscence'],
    lastUsed: '2026-07-03',
    residentNotes: 'Strong engagement after lunch.',
  },
];

export const activityDrafts = [
  {
    id: 'draft-garden',
    status: 'draft',
    title: 'Herb Garden Sensory Table',
    category: 'sensory',
    bestFor: 'memory',
    difficulty: 'easy',
    durationMinutes: 35,
    groupSize: 'small group',
    supplies: ['Mint', 'Rosemary', 'Small pots', 'Labels'],
    steps: ['Let residents smell each herb.', 'Talk about cooking memories.', 'Plant herbs in small pots.'],
    safetyNotes: 'Check allergies and supervise soil handling.',
    dementiaAdaptations: 'Use one herb at a time and simple yes/no prompts.',
    tags: ['garden', 'sensory'],
    source: { type: 'website', label: 'https://example.com/herb-garden-activity' },
    createdAt: '2026-07-06T09:00:00',
  },
];

export const residents = [
  {
    id: 'resident-mary',
    name: 'Mary Thompson',
    room: '104',
    careArea: 'memory',
    birthday: '1942-04-12',
    interests: ['flowers', 'church hymns', 'watercolor'],
    dislikes: ['loud rooms'],
    mobility: 'Walker; seat near exits with clear path.',
    cognition: 'Responds well to visual examples and short prompts.',
    notes: 'Family visits Sundays.',
    photo: '',
  },
  {
    id: 'resident-harold',
    name: 'Harold Jenkins',
    room: '212',
    careArea: 'assisted',
    birthday: '1938-09-30',
    interests: ['gardening', 'tools', 'baseball'],
    dislikes: ['craft glitter'],
    mobility: 'Independent, tires after 45 minutes.',
    cognition: 'Enjoys helping lead small tasks.',
    notes: 'Ask him to help set up garden activities.',
    photo: '',
  },
];

export const bingoTransactions = [
  { id: 'bingo-1', residentId: 'resident-mary', amount: 8, reason: 'Attended bingo', createdBy: 'Amanda', createdAt: '2026-07-01T15:00:00' },
  { id: 'bingo-2', residentId: 'resident-harold', amount: 5, reason: 'Attended bingo', createdBy: 'Amanda', createdAt: '2026-07-02T15:00:00' },
];

export const calendarEvents = [
  {
    id: 'event-1',
    activityId: 'activity-watercolor',
    title: 'Watercolor Flowers',
    start: '2026-07-08T10:00:00',
    end: '2026-07-08T10:45:00',
    wing: 'memory',
    location: 'Activity Room',
    description: 'Gentle painting activity with flower outlines.',
    supplies: ['Watercolor paper', 'Paint', 'Brushes'],
  },
  {
    id: 'event-2',
    activityId: 'activity-singalong',
    title: 'Golden Oldies Singalong',
    start: '2026-07-08T14:00:00',
    end: '2026-07-08T14:30:00',
    wing: 'both',
    location: 'Main Lounge',
    description: 'Familiar songs and clapping rhythm.',
    supplies: ['Lyric sheets', 'Bluetooth speaker'],
  },
];

export const contacts = [
  { id: 'contact-1', name: 'Linda Thompson', relationship: 'family', phone: '(555) 010-1200', email: 'linda@example.com', residentId: 'resident-mary' },
];

export const books = [
  { id: 'book-1', title: 'The 36-Hour Day', author: 'Nancy L. Mace and Peter V. Rabins', pages: 384, status: 'reference' },
];
