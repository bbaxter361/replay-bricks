# Hermes Handoff: Spring Skills Update

Date: 2026-07-07

Brian asked for Spring to understand how to fill Director's Activities App records instead of giving up when Amanda asks for activities, calendar work, or resident `1 on 1` notes.

Completed changes:

- Added a Spring skill prompt that teaches Spring the Director app record formats.
- Spring now knows hidden action blocks for:
  - `ACTIVITY_DRAFT`
  - `ONE_ON_ONE`
  - `EVENT`
  - `QUESTION`
- Spring is instructed to ask Amanda one clear follow-up question when required details are missing.
- Spring is instructed not to invent residents or silently publish calendar items.
- Added local Spring skill handling so Amanda can ask from the app even if the live Spring backend is slow or unclear.
- Added a global `Ask Spring` box in the app header so Amanda can ask from Family, Residents, Activities, Calendar, or other tabs.
- Plain-English activity requests can create editable activity drafts.
- Plain-English `1 on 1` requests can save resident notes when the resident is clear.
- Incomplete `1 on 1` requests ask which resident and do not save until that is known.

Examples that now work:

- `Create an activity called Sunshine Balloon Volleyball for memory care`
- `Add a 1 on 1 for Flo: she stayed in her room today but accepted music.`
- `Add a 1 on 1 note that she stayed in her room.`
  - Spring asks which resident and does not save the record yet.

Verification before publish:

- `npm test -- --test-reporter=spec`
- Targeted ESLint on changed Spring files
- `npm run build`
- Browser check from Family tab:
  - Global Ask Spring box is visible.
  - Activity request creates a draft in Activities.
  - `1 on 1` request saves to Flo's resident profile.
  - Missing resident request asks Amanda which resident and does not save.
