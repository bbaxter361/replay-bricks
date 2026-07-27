# Hermes Handoff: Director's Activities Resident Update

Date: 2026-07-07

Brian asked for the Director's Activities App resident workflow to be updated and published.

Completed changes:

- Home metric cards now open the matching sections:
  - Today events -> Calendar
  - Draft activities -> Activities drafts
  - Residents -> Resident Information
  - Bingo Bucks -> Resident Information
- Resident names now open profile URLs like `/app/residents/resident-katherine`.
- Resident profiles are editable from the profile page:
  - Name
  - Room
  - Care area
  - Birthday
  - Likes
  - Avoid
  - Mobility
  - Cognition
  - Notes
  - Photo
- Mobile profile behavior was changed so tapping a resident opens that person's profile directly with a Residents back button.
- Added a `1 on 1` button beside Attended bingo and Attended Activity.
- `1 on 1` opens a note box, saves the note with resident ID, Amanda/current user, date, and time.
- Resident profiles now show saved `1 on 1` notes.
- Added Export DOC for resident `1 on 1` notes so Amanda can download Word-readable state paperwork.

Verification before publish:

- `npm test -- --test-reporter=spec`
- Targeted ESLint for changed files
- `npm run build`
- Browser check on local app for:
  - Dashboard links
  - Resident name profile routing
  - Editable profile fields
  - `1 on 1` note dialog and saved record
  - Mobile resident profile layout

Important data note:

The app still preserves Amanda's loaded resident data. The new records are stored with the same local app state system as the rest of the Director's Activities App preview data.
