# Director's Activities Local Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local preview of the Director's Activities App so Brian and Amanda can review the redesigned Spring/Compass workflow before Supabase wiring or deployment.

**Architecture:** Create a new Vite React app in `directors-activities-app/`, separate from the legacy Compass code. Use local sample data and reducer-backed state now, with a `src/services/dataClient.js` boundary that can later be replaced by Supabase without rewriting screens.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, React Router 7, lucide-react, plain Node test runner for data/workflow tests.

---

## File Structure

Create these files:

- `directors-activities-app/package.json` - app scripts and dependencies.
- `directors-activities-app/index.html` - Vite app entry HTML.
- `directors-activities-app/vite.config.js` - Vite React and Tailwind setup.
- `directors-activities-app/eslint.config.js` - lint setup consistent with the website app.
- `directors-activities-app/src/main.jsx` - React bootstrap.
- `directors-activities-app/src/App.jsx` - top-level router and app state provider.
- `directors-activities-app/src/index.css` - warm purple visual system and global layout styles.
- `directors-activities-app/src/data/sampleData.js` - reviewable local sample users, activities, residents, events, templates, books, contacts, and app tiles.
- `directors-activities-app/src/state/appState.js` - reducer, selectors, and local workflow actions.
- `directors-activities-app/src/services/dataClient.js` - storage boundary, initially local only.
- `directors-activities-app/src/utils/accessRules.js` - Brian/Amanda portal visibility rules.
- `directors-activities-app/src/utils/activityDrafts.js` - draft creation and approval helpers.
- `directors-activities-app/src/utils/bingoPoints.js` - resident bingo transaction helpers.
- `directors-activities-app/src/utils/calendarPlanning.js` - schedule and calendar proposal helpers.
- `directors-activities-app/src/utils/canvaTemplates.js` - named placeholder helpers.
- `directors-activities-app/src/components/AppLayout.jsx` - unified app shell.
- `directors-activities-app/src/components/Portal.jsx` - login and app launcher.
- `directors-activities-app/src/components/Sidebar.jsx` - primary app navigation.
- `directors-activities-app/src/components/TopBar.jsx` - profile switcher and current section header.
- `directors-activities-app/src/components/StatusPill.jsx` - small reusable status badge.
- `directors-activities-app/src/components/MetricCard.jsx` - dashboard metric unit.
- `directors-activities-app/src/components/SectionHeader.jsx` - consistent page headers.
- `directors-activities-app/src/components/EmptyState.jsx` - friendly empty state.
- `directors-activities-app/src/pages/Dashboard.jsx` - daily command center.
- `directors-activities-app/src/pages/SpringAssistant.jsx` - local Spring assistant preview.
- `directors-activities-app/src/pages/Calendar.jsx` - day/week/month calendar workspace.
- `directors-activities-app/src/pages/CanvaExports.jsx` - daily/weekly/monthly template workflow.
- `directors-activities-app/src/pages/Activities.jsx` - activities list, drafts, approval, detail.
- `directors-activities-app/src/pages/Residents.jsx` - residents list and bingo profile workflow.
- `directors-activities-app/src/pages/Contacts.jsx` - contacts preview section.
- `directors-activities-app/src/pages/Books.jsx` - books preview section.
- `directors-activities-app/src/pages/Games.jsx` - games entry section inside the unified app.
- `directors-activities-app/src/pages/Settings.jsx` - defaults and Supabase readiness notes.
- `directors-activities-app/tests/accessRules.test.mjs` - role visibility tests.
- `directors-activities-app/tests/activityDrafts.test.mjs` - draft/approve behavior tests.
- `directors-activities-app/tests/bingoPoints.test.mjs` - point transaction tests.
- `directors-activities-app/tests/calendarPlanning.test.mjs` - activity scheduling tests.
- `directors-activities-app/tests/canvaTemplates.test.mjs` - placeholder mapping tests.

Modify these files:

- `.gitignore` - add `directors-activities-app/dist/` and `directors-activities-app/.env`.
- `README.md` - add the new local preview app to the project list.

Do not modify the legacy `compass/`, `website/`, `hold/`, or `compass-api/` code in this plan.

---

### Task 1: Scaffold The New Local App

**Files:**

- Create: `directors-activities-app/package.json`
- Create: `directors-activities-app/index.html`
- Create: `directors-activities-app/vite.config.js`
- Create: `directors-activities-app/eslint.config.js`
- Create: `directors-activities-app/src/main.jsx`
- Create: `directors-activities-app/src/App.jsx`
- Create: `directors-activities-app/src/index.css`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Create the app package**

Create `directors-activities-app/package.json` with:

```json
{
  "name": "directors-activities-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5176",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 4176",
    "test": "node --test tests/*.test.mjs",
    "lint": "eslint ."
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.14.2",
    "tailwindcss": "^4.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.2.1",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.5.0",
    "vite": "^8.0.10"
  }
}
```

- [ ] **Step 2: Create Vite config**

Create `directors-activities-app/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 3: Create lint config**

Create `directors-activities-app/eslint.config.js` using the same dependency style as `website/eslint.config.js`, with browser globals enabled and React hooks rules active.

- [ ] **Step 4: Create entry HTML**

Create `directors-activities-app/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#6d4cc2" />
    <title>Director's Activities App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create React bootstrap**

Create `directors-activities-app/src/main.jsx`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Create temporary App shell**

Create `directors-activities-app/src/App.jsx` with a simple visible page:

```jsx
export default function App() {
  return (
    <main className="min-h-screen bg-[#f7f1ff] p-8 text-[#25183f]">
      <h1 className="text-3xl font-bold">Director's Activities App</h1>
      <p className="mt-2 text-sm text-[#6b5c83]">Local preview foundation is ready.</p>
    </main>
  );
}
```

- [ ] **Step 7: Create initial CSS**

Create `directors-activities-app/src/index.css`:

```css
@import "tailwindcss";

:root {
  color: #25183f;
  background: #f7f1ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 8: Update repository metadata**

Add these lines to `.gitignore`:

```gitignore
directors-activities-app/dist/
directors-activities-app/.env
```

Add a project entry to `README.md`:

```md
### 4. Director's Activities App
New local preview of Amanda's unified Spring/Compass workspace. Located in `/directors-activities-app/`.
```

- [ ] **Step 9: Install dependencies**

Run:

```powershell
cd directors-activities-app
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 10: Verify scaffold builds**

Run:

```powershell
npm run build
```

Expected: Vite builds successfully and creates `directors-activities-app/dist/`.

- [ ] **Step 11: Commit scaffold**

```powershell
git add .gitignore README.md directors-activities-app
git commit -m "feat: scaffold directors activities app"
```

---

### Task 2: Add Workflow Utility Tests First

**Files:**

- Create: `directors-activities-app/src/utils/accessRules.js`
- Create: `directors-activities-app/src/utils/activityDrafts.js`
- Create: `directors-activities-app/src/utils/bingoPoints.js`
- Create: `directors-activities-app/src/utils/calendarPlanning.js`
- Create: `directors-activities-app/src/utils/canvaTemplates.js`
- Create: `directors-activities-app/tests/accessRules.test.mjs`
- Create: `directors-activities-app/tests/activityDrafts.test.mjs`
- Create: `directors-activities-app/tests/bingoPoints.test.mjs`
- Create: `directors-activities-app/tests/calendarPlanning.test.mjs`
- Create: `directors-activities-app/tests/canvaTemplates.test.mjs`

- [ ] **Step 1: Write role visibility tests**

Create `directors-activities-app/tests/accessRules.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisiblePortalApps } from '../src/utils/accessRules.js';

const apps = [
  { id: 'directors', allowedRoles: ['admin', 'activities'] },
  { id: 'clutch', allowedRoles: ['admin'] },
  { id: 'baxter', allowedRoles: ['admin', 'activities'] },
  { id: 'star-wars', allowedRoles: ['admin'] },
];

test('Brian sees every portal app', () => {
  assert.deepEqual(
    getVisiblePortalApps({ roles: ['admin'] }, apps).map((app) => app.id),
    ['directors', 'clutch', 'baxter', 'star-wars'],
  );
});

test('Amanda sees Director app and My Baxter only', () => {
  assert.deepEqual(
    getVisiblePortalApps({ roles: ['activities'] }, apps).map((app) => app.id),
    ['directors', 'baxter'],
  );
});
```

- [ ] **Step 2: Write activity draft tests**

Create `directors-activities-app/tests/activityDrafts.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { approveActivityDraft, createActivityDraftFromSource } from '../src/utils/activityDrafts.js';

test('creates a review draft from a website source', () => {
  const draft = createActivityDraftFromSource({
    sourceType: 'website',
    sourceLabel: 'https://example.com/watercolor-flowers',
    title: 'Watercolor Flowers',
    category: 'art',
  });

  assert.equal(draft.status, 'draft');
  assert.equal(draft.source.type, 'website');
  assert.equal(draft.title, 'Watercolor Flowers');
});

test('approving a draft creates an official activity', () => {
  const draft = createActivityDraftFromSource({
    sourceType: 'file',
    sourceLabel: 'activity.pdf',
    title: 'Chair Yoga',
    category: 'exercise',
  });
  const activity = approveActivityDraft(draft, { approvedBy: 'Amanda' });

  assert.equal(activity.status, 'approved');
  assert.equal(activity.title, 'Chair Yoga');
  assert.equal(activity.approvedBy, 'Amanda');
});
```

- [ ] **Step 3: Write bingo point tests**

Create `directors-activities-app/tests/bingoPoints.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { addBingoTransaction, getBingoBalance } from '../src/utils/bingoPoints.js';

test('adds and subtracts resident bingo points without automatic reset', () => {
  const transactions = [];
  const earned = addBingoTransaction(transactions, {
    residentId: 'resident-harold',
    amount: 5,
    reason: 'Attended bingo',
    createdBy: 'Amanda',
  });
  const redeemed = addBingoTransaction(earned, {
    residentId: 'resident-harold',
    amount: -2,
    reason: 'Redeemed prize',
    createdBy: 'Amanda',
  });

  assert.equal(getBingoBalance('resident-harold', redeemed), 3);
});
```

- [ ] **Step 4: Write calendar planning tests**

Create `directors-activities-app/tests/calendarPlanning.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarEventFromActivity, createMonthProposal } from '../src/utils/calendarPlanning.js';

test('schedules one activity as a calendar event', () => {
  const event = createCalendarEventFromActivity({
    activity: { id: 'activity-art', title: 'Watercolor Flowers', durationMinutes: 45, bestFor: 'both' },
    start: '2026-07-08T10:00:00',
    wing: 'memory',
  });

  assert.equal(event.title, 'Watercolor Flowers');
  assert.equal(event.start, '2026-07-08T10:00:00');
  assert.equal(event.end, '2026-07-08T10:45:00');
  assert.equal(event.wing, 'memory');
});

test('creates a reviewable month proposal before saving', () => {
  const proposal = createMonthProposal({
    month: '2026-07',
    activities: [
      { id: 'activity-art', title: 'Watercolor Flowers', durationMinutes: 45, bestFor: 'both' },
      { id: 'activity-music', title: 'Golden Oldies Singalong', durationMinutes: 30, bestFor: 'memory' },
    ],
  });

  assert.equal(proposal.status, 'draft');
  assert.equal(proposal.events.length, 2);
});
```

- [ ] **Step 5: Write Canva placeholder tests**

Create `directors-activities-app/tests/canvaTemplates.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanvaPlaceholderPayload } from '../src/utils/canvaTemplates.js';

test('maps calendar events to named Canva placeholders', () => {
  const payload = buildCanvaPlaceholderPayload({
    calendarTitle: 'Memory Care Daily Activities',
    view: 'daily',
    events: [
      {
        date: '2026-07-08',
        day: 'Wednesday',
        time: '10:00 AM',
        title: 'Watercolor Flowers',
        location: 'Activity Room',
        description: 'Paint simple flowers with watercolor.',
        wing: 'memory',
        supplies: ['Watercolor paper', 'Paint', 'Brushes'],
      },
    ],
  });

  assert.equal(payload.calendar_title, 'Memory Care Daily Activities');
  assert.equal(payload.events[0].activity_title, 'Watercolor Flowers');
  assert.equal(payload.events[0].supplies, 'Watercolor paper, Paint, Brushes');
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run:

```powershell
npm test
```

Expected: FAIL because utility modules do not exist yet.

- [ ] **Step 7: Commit failing tests**

```powershell
git add directors-activities-app/tests
git commit -m "test: define directors app workflow rules"
```

---

### Task 3: Implement Workflow Utilities

**Files:**

- Modify: `directors-activities-app/src/utils/accessRules.js`
- Modify: `directors-activities-app/src/utils/activityDrafts.js`
- Modify: `directors-activities-app/src/utils/bingoPoints.js`
- Modify: `directors-activities-app/src/utils/calendarPlanning.js`
- Modify: `directors-activities-app/src/utils/canvaTemplates.js`

- [ ] **Step 1: Implement access rules**

Create `directors-activities-app/src/utils/accessRules.js`:

```js
export function getVisiblePortalApps(user, apps) {
  const roles = new Set(user?.roles || []);
  return apps.filter((app) => (app.allowedRoles || []).some((role) => roles.has(role)));
}
```

- [ ] **Step 2: Implement activity draft helpers**

Create `directors-activities-app/src/utils/activityDrafts.js`:

```js
function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createActivityDraftFromSource({ sourceType, sourceLabel, title, category }) {
  return {
    id: makeId('draft'),
    status: 'draft',
    title: title || 'Untitled activity draft',
    category: category || 'custom',
    bestFor: 'both',
    difficulty: 'easy',
    durationMinutes: 45,
    groupSize: 'small group',
    supplies: [],
    steps: [],
    safetyNotes: '',
    dementiaAdaptations: '',
    tags: [],
    residentNotes: '',
    source: {
      type: sourceType,
      label: sourceLabel,
    },
    createdAt: new Date().toISOString(),
  };
}

export function approveActivityDraft(draft, { approvedBy }) {
  return {
    ...draft,
    id: draft.id.replace(/^draft/, 'activity'),
    status: 'approved',
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 3: Implement bingo helpers**

Create `directors-activities-app/src/utils/bingoPoints.js`:

```js
function makeId() {
  return `bingo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addBingoTransaction(transactions, transaction) {
  return [
    ...transactions,
    {
      id: makeId(),
      residentId: transaction.residentId,
      amount: Number(transaction.amount || 0),
      reason: transaction.reason || 'Manual adjustment',
      createdBy: transaction.createdBy || 'System',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getBingoBalance(residentId, transactions) {
  return transactions
    .filter((transaction) => transaction.residentId === residentId)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
}
```

- [ ] **Step 4: Implement calendar helpers**

Create `directors-activities-app/src/utils/calendarPlanning.js`:

```js
function pad(value) {
  return String(value).padStart(2, '0');
}

function addMinutes(localIso, minutes) {
  const date = new Date(localIso);
  date.setMinutes(date.getMinutes() + minutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function createCalendarEventFromActivity({ activity, start, wing }) {
  const duration = Number(activity.durationMinutes || 45);
  return {
    id: `event-${activity.id}-${start}`,
    activityId: activity.id,
    title: activity.title,
    start,
    end: addMinutes(start, duration),
    wing: wing || activity.bestFor || 'both',
    location: 'Activity Room',
    description: activity.summary || activity.description || '',
    supplies: activity.supplies || [],
    status: 'scheduled',
  };
}

export function createMonthProposal({ month, activities }) {
  const events = activities.map((activity, index) => {
    const day = pad(index + 1);
    return createCalendarEventFromActivity({
      activity,
      start: `${month}-${day}T10:00:00`,
      wing: activity.bestFor || 'both',
    });
  });

  return {
    id: `proposal-${month}-${Date.now()}`,
    status: 'draft',
    month,
    events,
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 5: Implement Canva helpers**

Create `directors-activities-app/src/utils/canvaTemplates.js`:

```js
export function buildCanvaPlaceholderPayload({ calendarTitle, view, events }) {
  return {
    calendar_title: calendarTitle,
    export_view: view,
    events: events.map((event) => ({
      date: event.date,
      day: event.day,
      time: event.time,
      activity_title: event.title,
      location: event.location || '',
      description: event.description || '',
      wing: event.wing || 'both',
      supplies: Array.isArray(event.supplies) ? event.supplies.join(', ') : event.supplies || '',
      resident_notes: event.residentNotes || '',
    })),
  };
}
```

- [ ] **Step 6: Run tests to verify utilities pass**

Run:

```powershell
npm test
```

Expected: PASS all utility tests.

- [ ] **Step 7: Commit workflow utilities**

```powershell
git add directors-activities-app/src/utils directors-activities-app/tests
git commit -m "feat: add directors app workflow utilities"
```

---

### Task 4: Add Sample Data And Local State

**Files:**

- Create: `directors-activities-app/src/data/sampleData.js`
- Create: `directors-activities-app/src/state/appState.js`
- Create: `directors-activities-app/src/services/dataClient.js`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Create sample data**

Create `directors-activities-app/src/data/sampleData.js` with:

```js
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
```

- [ ] **Step 2: Create local data client**

Create `directors-activities-app/src/services/dataClient.js`:

```js
const STORAGE_KEY = 'directors-activities-local-preview';

export function loadLocalState(fallbackState) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : fallbackState;
  } catch {
    return fallbackState;
  }
}

export function saveLocalState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- [ ] **Step 3: Create reducer and provider**

Create `directors-activities-app/src/state/appState.js` with reducer actions for:

- `setUser`
- `logout`
- `approveActivityDraft`
- `addBingoTransaction`
- `scheduleActivity`
- `setCalendarView`
- `selectResident`
- `selectActivity`

The initial state must combine all exports from `sampleData.js`.

- [ ] **Step 4: Wire provider into App**

Update `src/App.jsx` so it wraps routes in `AppStateProvider`, loads local state, and persists state after changes.

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit sample data and state**

```powershell
git add directors-activities-app/src/data directors-activities-app/src/state directors-activities-app/src/services directors-activities-app/src/App.jsx
git commit -m "feat: add directors app local state"
```

---

### Task 5: Build Portal And App Layout

**Files:**

- Create: `directors-activities-app/src/components/Portal.jsx`
- Create: `directors-activities-app/src/components/AppLayout.jsx`
- Create: `directors-activities-app/src/components/Sidebar.jsx`
- Create: `directors-activities-app/src/components/TopBar.jsx`
- Create: `directors-activities-app/src/components/StatusPill.jsx`
- Create: `directors-activities-app/src/components/SectionHeader.jsx`
- Modify: `directors-activities-app/src/App.jsx`
- Modify: `directors-activities-app/src/index.css`

- [ ] **Step 1: Expand the visual system**

Update `src/index.css` with warm purple app tokens:

```css
:root {
  --app-bg: #f7f1ff;
  --app-surface: #fffafe;
  --app-surface-2: #efe4ff;
  --app-text: #25183f;
  --app-muted: #74638d;
  --app-primary: #6d4cc2;
  --app-primary-strong: #4d3195;
  --app-accent: #d27bd5;
  --app-care: #6aaea7;
  --app-warm: #f4b86a;
  --app-border: #ded0f2;
}
```

Add stable button, card, and focus styles using these variables. Keep cards at `8px` border radius unless a repeated item needs a softer small radius.

- [ ] **Step 2: Implement Portal**

Create `Portal.jsx` with:

- Brian/Amanda profile chooser buttons.
- Visible app tiles filtered by `getVisiblePortalApps`.
- Brian sees Director's Activities App, Clutch, My Baxter Portal, and Star Wars Figure Tracker.
- Amanda sees Director's Activities App and My Baxter Portal.
- Clicking Director's Activities App sets the active app route.
- Other apps show a calm "later phase" or "left as-is" message, not broken links.

- [ ] **Step 3: Implement layout**

Create `AppLayout.jsx`, `Sidebar.jsx`, and `TopBar.jsx` with:

- Desktop sidebar.
- Mobile top navigation.
- Profile switcher.
- Purple active state.
- Clear section names.
- No nested cards.

Navigation items:

- Dashboard
- Spring
- Calendar
- Canva
- Activities
- Residents
- Contacts
- Books
- Games
- Settings

- [ ] **Step 4: Add reusable display components**

Create `StatusPill.jsx` and `SectionHeader.jsx` for consistent section headers and compact statuses.

- [ ] **Step 5: Wire routes**

Update `App.jsx` with routes:

- `/`
- `/app`
- `/app/spring`
- `/app/calendar`
- `/app/canva`
- `/app/activities`
- `/app/residents`
- `/app/contacts`
- `/app/books`
- `/app/games`
- `/app/settings`

Unauthenticated local users see the profile chooser.

- [ ] **Step 6: Verify routing**

Run:

```powershell
npm run build
```

Expected: build succeeds and all routes compile.

- [ ] **Step 7: Commit layout**

```powershell
git add directors-activities-app/src
git commit -m "feat: add directors app portal and layout"
```

---

### Task 6: Build Dashboard

**Files:**

- Create: `directors-activities-app/src/components/MetricCard.jsx`
- Create: `directors-activities-app/src/components/EmptyState.jsx`
- Create: `directors-activities-app/src/pages/Dashboard.jsx`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Create dashboard units**

Create `MetricCard.jsx` for compact stats such as Today's Events, Draft Activities, Residents, and Bingo Points.

Create `EmptyState.jsx` for sections that have no records.

- [ ] **Step 2: Implement dashboard page**

Create `Dashboard.jsx` with:

- Today schedule column.
- Quick Spring question panel.
- Canva export actions for daily, weekly, monthly.
- Draft activities needing review.
- Resident attention panel with bingo balances.

- [ ] **Step 3: Wire dashboard route**

Update `App.jsx` so `/app` renders `Dashboard`.

- [ ] **Step 4: Build verification**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit dashboard**

```powershell
git add directors-activities-app/src
git commit -m "feat: build directors dashboard"
```

---

### Task 7: Build Spring Assistant Preview

**Files:**

- Create: `directors-activities-app/src/pages/SpringAssistant.jsx`
- Modify: `directors-activities-app/src/state/appState.js`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Add conversation state**

Add `springMessages` to local state with a warm initial Spring greeting.

Add reducer action `sendSpringMessage` that appends:

- Amanda/Brian message.
- Mock Spring response.
- Optional draft action when the message includes "website", "scan", "activity", or "calendar".

- [ ] **Step 2: Implement assistant page**

Create `SpringAssistant.jsx` with:

- Chat history.
- Prompt input.
- Quick action buttons: Create Activity Draft, Plan Today, Fill Month, Review Residents.
- Visible "Spring can create drafts for review" area.
- Local mock responses that explain this is the local preview.

- [ ] **Step 3: Wire route**

Update `/app/spring` route.

- [ ] **Step 4: Build verification**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit Spring preview**

```powershell
git add directors-activities-app/src
git commit -m "feat: add spring assistant preview"
```

---

### Task 8: Build Calendar And Canva Export Flow

**Files:**

- Create: `directors-activities-app/src/pages/Calendar.jsx`
- Create: `directors-activities-app/src/pages/CanvaExports.jsx`
- Modify: `directors-activities-app/src/state/appState.js`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Implement Calendar page**

Create `Calendar.jsx` with:

- Segmented day/week/month view control.
- Memory Care, Assisted Living, and Combined filter.
- Event list using sample events.
- Schedule Activity panel that uses existing activities.
- Month proposal panel that stays in draft status.

- [ ] **Step 2: Add scheduling action**

Use `createCalendarEventFromActivity` from `calendarPlanning.js` in reducer action `scheduleActivity`.

- [ ] **Step 3: Implement Canva export page**

Create `CanvaExports.jsx` with:

- Daily, weekly, monthly export cards.
- Template selector for each export type.
- Default template marker.
- Placeholder preview showing named fields.
- "Prepare Canva Export" button that creates a local export preview, not a real API call.

- [ ] **Step 4: Wire routes**

Update `/app/calendar` and `/app/canva` routes.

- [ ] **Step 5: Test and build**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit calendar and Canva flow**

```powershell
git add directors-activities-app/src
git commit -m "feat: add calendar and canva export preview"
```

---

### Task 9: Build Activities Workflow

**Files:**

- Create: `directors-activities-app/src/pages/Activities.jsx`
- Modify: `directors-activities-app/src/state/appState.js`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Implement Activities page**

Create `Activities.jsx` with:

- Approved activities tab.
- Drafts needing review tab.
- Activity detail panel.
- Draft source information.
- Approve & Save button for drafts.
- Manual "New Activity Draft" button.
- Source intake panel listing supported inputs: photos, PDFs, Word, Excel, screenshots, web links, handwritten photos, Canva exports.

- [ ] **Step 2: Add approve action**

Use `approveActivityDraft` in reducer action `approveActivityDraft`. The action moves the draft into approved activities and removes it from drafts.

- [ ] **Step 3: Add schedule from Activity**

On approved activity detail, add "Schedule" action that creates a calendar event draft or scheduled local event.

- [ ] **Step 4: Wire route**

Update `/app/activities` route.

- [ ] **Step 5: Test and build**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit Activities workflow**

```powershell
git add directors-activities-app/src
git commit -m "feat: add activities draft workflow"
```

---

### Task 10: Build Residents And Bingo Points

**Files:**

- Create: `directors-activities-app/src/pages/Residents.jsx`
- Modify: `directors-activities-app/src/state/appState.js`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Implement Residents page**

Create `Residents.jsx` with:

- Resident list.
- Resident profile detail.
- Room, care area, birthday, interests, dislikes, mobility, cognition, notes.
- Activity attendance preview.
- Bingo point balance.
- Bingo transaction history.

- [ ] **Step 2: Add point controls**

Add controls for:

- Add points.
- Subtract points.
- Redeem prize.
- Attended bingo.

Use `addBingoTransaction` and `getBingoBalance` from `bingoPoints.js`.

- [ ] **Step 3: Add Spring summary panel**

Add a compact "Spring attention summary" that lists:

- Highest bingo balance.
- Residents with zero or low points.
- Residents with activity preferences that match upcoming events.

- [ ] **Step 4: Wire route**

Update `/app/residents` route.

- [ ] **Step 5: Test and build**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit Residents workflow**

```powershell
git add directors-activities-app/src
git commit -m "feat: add residents and bingo points"
```

---

### Task 11: Add Supporting Sections

**Files:**

- Create: `directors-activities-app/src/pages/Contacts.jsx`
- Create: `directors-activities-app/src/pages/Books.jsx`
- Create: `directors-activities-app/src/pages/Games.jsx`
- Create: `directors-activities-app/src/pages/Settings.jsx`
- Modify: `directors-activities-app/src/App.jsx`

- [ ] **Step 1: Create Contacts page**

Create `Contacts.jsx` with contact list and resident-linked contact details.

- [ ] **Step 2: Create Books page**

Create `Books.jsx` with Amanda's reading/reference list preview.

- [ ] **Step 3: Create Games page**

Create `Games.jsx` with in-app game entry cards. Note that games stay inside Director's Activities App.

- [ ] **Step 4: Create Settings page**

Create `Settings.jsx` with:

- Current local preview mode indicator.
- Supabase readiness checklist.
- Canva defaults display.
- Obsidian archive path display.
- Data safety reminder that the local preview does not delete existing data.

- [ ] **Step 5: Wire routes**

Update route table for `/app/contacts`, `/app/books`, `/app/games`, and `/app/settings`.

- [ ] **Step 6: Build verification**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit supporting sections**

```powershell
git add directors-activities-app/src
git commit -m "feat: add directors app supporting sections"
```

---

### Task 12: Polish Responsive Review Experience

**Files:**

- Modify: `directors-activities-app/src/index.css`
- Modify: `directors-activities-app/src/components/AppLayout.jsx`
- Modify: `directors-activities-app/src/components/Sidebar.jsx`
- Modify: `directors-activities-app/src/components/TopBar.jsx`
- Modify: page files as needed for layout fixes.

- [ ] **Step 1: Check desktop layout**

Run the dev server:

```powershell
npm run dev
```

Open:

`http://localhost:5176`

Review at desktop width:

- No overlapping text.
- Sidebar remains usable.
- Dashboard shows top daily tasks without scrolling too much.
- Calendar, Activities, and Residents are readable.

- [ ] **Step 2: Check mobile layout**

Use browser responsive mode or narrow the browser to phone width.

Review:

- Navigation remains accessible.
- Buttons do not overflow.
- Tables become stacked lists.
- Forms and cards fit without horizontal scrolling.

- [ ] **Step 3: Fix layout issues**

Apply focused CSS/class changes until desktop and mobile are both usable.

- [ ] **Step 4: Final verification**

Run:

```powershell
npm test
npm run build
npm run lint
```

Expected:

- Tests pass.
- Build succeeds.
- Lint has no errors. If lint reports warnings only, record them in the final handoff.

- [ ] **Step 5: Commit polish**

```powershell
git add directors-activities-app
git commit -m "polish: refine directors app local preview"
```

---

### Task 13: Start Local Preview Server

**Files:**

- No file changes expected.

- [ ] **Step 1: Start the app**

Run:

```powershell
npm run dev
```

Expected:

The app is available at:

`http://localhost:5176`

- [ ] **Step 2: Smoke test review paths**

In the browser, verify:

- Brian profile sees Director's Activities App, Clutch, My Baxter Portal, and Star Wars Figure Tracker.
- Amanda profile sees Director's Activities App and My Baxter Portal.
- Dashboard loads.
- Spring chat accepts a local message.
- Calendar view switches between day, week, month.
- Canva export page shows daily, weekly, monthly template choices.
- Activity draft can be approved.
- Resident bingo points can be added and subtracted.

- [ ] **Step 3: Handoff**

Give Brian the local URL and a short review checklist:

- Does the purple/warm professional style feel right for Amanda?
- Does the dashboard put the right three tasks first?
- Does Activities draft review match the desired workflow?
- Does resident bingo point handling match Amanda's real workflow?
- Does Canva export flow match how Amanda thinks about daily, weekly, and monthly printing?

---

## Plan Self-Review

Spec coverage:

- Local-first build is covered by Tasks 1-13.
- Portal role rules are covered by Tasks 2 and 5.
- Director's Activities App unified navigation is covered by Tasks 5-11.
- Dashboard priorities are covered by Task 6.
- Spring assistant preview is covered by Task 7.
- Calendar and Canva export are covered by Task 8.
- Activities database and draft approval are covered by Task 9.
- Residents and bingo points are covered by Task 10.
- Contacts, Books, Games, and Settings are covered by Task 11.
- Responsive/local review is covered by Tasks 12 and 13.

Deferred spec items:

- Supabase auth, database, storage, and RLS require a separate Phase 2 implementation plan.
- Real Spring AI integration requires a separate Phase 4 implementation plan.
- Real Canva API calls require a separate Phase 5 implementation plan.
- Migration and Obsidian bridge require a separate Phase 6 implementation plan.
- Production deployment requires a separate Phase 7 implementation plan.

Placeholder scan:

- The plan does not rely on unnamed future work for the local preview.
- The only non-production behavior is explicitly local preview behavior: local sample data, mock Spring responses, and local Canva export preview.

Type consistency:

- Role names are `admin` and `activities`.
- App ids are `directors`, `clutch`, `baxter`, and `star-wars`.
- Activity draft status values are `draft` and `approved`.
- Calendar proposal status is `draft`.
- Bingo transaction shape is consistent across tests, utilities, and sample data.
