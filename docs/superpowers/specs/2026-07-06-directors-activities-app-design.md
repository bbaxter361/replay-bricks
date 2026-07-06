# Director's Activities App Design

## Goal

Build a new local-first preview of the Director's Activities App for Amanda, then deploy it only after Brian and Amanda approve the look, workflow, and reliability. The app replaces the tangled current Compass/Spring experience with one unified professional, warm, purple-themed application for Amanda's daily work.

## Product Boundary

The first rebuild focuses on Amanda's Director's Activities App only.

Included in this project:

- Portal access model for Brian and Amanda.
- Director's Activities App as one unified app.
- Spring assistant, calendar, Canva export, activities, residents, contacts, books, games entry point, and settings.
- Supabase-ready auth, database, and file storage design.
- Migration-safe handling for existing Netlify Blobs, local Compass data, Canva settings, and Obsidian brain archive.

Deferred until after Amanda's app is stable:

- Clutch rebuild.
- Star Wars Figure Tracker rebuild.
- My Baxter Portal changes.
- Full production deployment switch-over.

## Users And Access

Brian has access to everything.

Amanda has access to:

- Director's Activities App.
- Games inside Director's Activities App.
- My Baxter Portal.
- Clutch only as an optional switch-over view when needed, not as her everyday landing path.

The working app must be publicly reachable on the internet after deployment, but not publicly usable without login.

## App Name

The user-facing app name is:

**Director's Activities App**

Spring is the assistant inside the app. Compass is treated as the legacy/internal project name, not the primary user-facing name.

## Design Direction

The interface should be redesigned, not copied from the current Compass app.

Visual direction:

- Keep Amanda's purple theme.
- Make it professional enough for daily work.
- Keep it warm and inviting, like a caring nursing-home workspace.
- Prioritize fast daily workflows over decorative marketing layouts.
- Use clear navigation, calm surfaces, readable type, and obvious action buttons.

The home screen should prioritize Amanda's top daily jobs:

1. Export/print calendars through Canva.
2. Ask Spring for help.
3. Build today's and this month's activity calendar.

## Architecture

Create a new app beside the old code rather than rewriting inside the current Compass folder.

Recommended local app folder:

`directors-activities-app/`

The current Compass/Spring implementation remains untouched as a backup while the new app is built and reviewed locally.

The app should be structured around feature areas:

- Dashboard
- Spring assistant
- Calendar
- Activities
- Residents
- Contacts
- Books
- Games
- Canva exports
- Settings

Use a Supabase-ready data access layer, but allow local/mock data during early UI work so the app can run before production credentials are finalized.

## Live Data Strategy

Supabase is the live app database and file store.

Obsidian is the readable archive and backup brain.

Existing Obsidian vault:

`C:\Users\bbaxt\obsidian-vault`

WSL path:

`/mnt/c/Users/bbaxt/obsidian-vault`

Existing brain sync writes memory files into:

`Brain/inbox/sig-*.md`

The rebuilt app must not delete or overwrite Amanda's existing data. Migration should be additive and reviewable.

## Migration Sources

Migrate or preserve everything available from:

- Current Compass browser/localStorage data.
- Spring Netlify Blobs data.
- Obsidian vault memory files.
- Canva template/settings data.
- Existing uploaded files where discoverable.
- Existing current-app seed data that Amanda relies on.

The first migration implementation should create backups before importing and produce an import report showing what was found, imported, skipped, or needs review.

## Core Sections

### Dashboard

The dashboard is Amanda's daily command center.

It should show:

- Today's calendar.
- Quick Spring prompt box.
- Primary Canva export actions: daily, weekly, monthly.
- Draft activities awaiting review.
- Resident attention summary, including bingo points.

### Spring Assistant

Spring is Amanda's activities-director assistant.

Spring should use:

- Saved app data from Supabase.
- Approved activities.
- Calendar events.
- Residents and preferences.
- Contacts.
- Books and notes where relevant.
- Searchable Obsidian archive after a safe indexing step is added.

Spring must be able to help create drafts, but important changes should be reviewed before saving when they affect durable records.

### Calendar

Calendar needs daily, weekly, and monthly workflows.

It must support:

- Memory Care calendar.
- Assisted Living calendar.
- Combined views.
- Scheduling one activity.
- Filling a day, week, or month from the Activities database.
- Review-before-save for bulk calendar generation.
- Export to Canva for daily, weekly, and monthly calendars.

### Canva Export

Canva export is mission-critical for the first rebuild.

The app should:

- Let Amanda choose from multiple Canva templates.
- Remember default templates for daily, weekly, and monthly exports.
- Support new templates Amanda creates over time.
- Use named placeholders first, not a visual mapper.

Initial placeholder approach:

- `{{calendar_title}}`
- `{{date}}`
- `{{day}}`
- `{{time}}`
- `{{activity_title}}`
- `{{location}}`
- `{{description}}`
- `{{wing}}`
- `{{supplies}}`
- `{{resident_notes}}`

### Activities

Activities is a new core section.

An Activity record contains:

- Title
- Category
- Best for Memory Care, Assisted Living, or both
- Difficulty level
- Duration
- Group size
- Supplies needed
- Step-by-step instructions
- Safety notes
- Adaptations for dementia
- Source link or uploaded file
- Tags
- Photos/files
- Last used date
- Resident reactions/notes

Amanda can create an activity manually, upload/scan a file, or send Spring a website. Spring creates a draft Activity file first. Amanda reviews and approves before it becomes an official saved Activity.

Supported source inputs on day one:

- Photos from phone
- PDFs
- Word docs
- Excel sheets
- Screenshots
- Web links
- Handwritten notes/photos
- Canva designs or exported images

The original uploaded file should be saved even if text extraction is imperfect.

### Residents

Residents is a new core section.

A Resident profile contains:

- Name
- Room number
- Care area
- Birthday
- Family/contact links
- Likes/interests
- Dislikes/triggers
- Mobility/accessibility notes
- Cognitive/communication notes
- Activity attendance history
- Bingo points
- Notes/history
- Photo

Spring should use resident preferences and constraints to suggest better activities and calendar plans.

### Bingo Points

Bingo points live on resident profile pages.

Rules:

- Amanda can add and subtract points manually.
- Points can be earned when a resident attends bingo.
- Points never reset automatically.
- Points can be redeemed for prizes.
- Spring can summarize who has points and who may need attention.

### Games

Games stay inside Director's Activities App. They should not be separated into a different public app for Amanda's daily workflow.

### Contacts And Books

Contacts and Books remain part of the unified app because Spring may need that context when helping Amanda.

## Data Model Draft

Initial Supabase tables:

- `profiles`
- `app_roles`
- `residents`
- `resident_notes`
- `resident_bingo_transactions`
- `contacts`
- `activities`
- `activity_drafts`
- `activity_files`
- `calendar_events`
- `calendar_generation_drafts`
- `canva_templates`
- `canva_export_jobs`
- `spring_conversations`
- `spring_messages`
- `books`
- `migration_imports`
- `migration_import_items`

Storage buckets:

- `activity-files`
- `resident-photos`
- `calendar-exports`
- `migration-backups`

Security model:

- Brian can access all records.
- Amanda can access Director's Activities App records.
- Public anonymous users cannot access app data.
- Later staff accounts can be added with narrower permissions.

## First Local Build Scope

The first local build should provide a polished clickable application shell with working local state for review:

- Login/role shell for Brian and Amanda.
- Portal visibility rules.
- Warm purple dashboard.
- Navigation for all Director's Activities App sections.
- Calendar daily/weekly/monthly views with sample events.
- Canva export flow screens and template selector.
- Activities list, draft review, and activity detail screen.
- Residents list, resident profile, and bingo point controls.
- Spring assistant screen with local mock responses and visible draft creation actions for Activities and Calendar proposals.
- Supabase configuration boundary ready for real connection.

The first local build does not need to perform full AI extraction, real Canva API calls, or production migration. It should make the user experience and data model concrete enough to review before wiring those systems.

## Implementation Phases

### Phase 1: Local Preview Foundation

Create the new app, navigation, role shell, and warm purple visual system. Build the dashboard, Calendar, Activities, Residents, Spring, and Canva export screens with local sample data.

### Phase 2: Supabase Foundation

Add real Supabase auth, database schema, storage buckets, and row-level security policies. Replace local sample persistence with Supabase-backed data access.

### Phase 3: Activities And Residents Workflows

Implement durable Activities, Activity drafts, file upload metadata, Residents, bingo points, resident notes, and scheduling links from Activities to Calendar.

### Phase 4: Spring Integration

Connect Spring to the app data. Add draft generation from website/file input, review/approve flows, and calendar generation proposals.

### Phase 5: Canva Export

Connect Canva templates and export jobs for daily, weekly, and monthly calendars using named placeholders.

### Phase 6: Migration And Obsidian Bridge

Back up existing data sources, import current Compass/Spring data into Supabase, and keep Obsidian as the readable archive/backup brain.

### Phase 7: Deployment

Deploy after Brian and Amanda approve the local version. Keep the old app available until migration and production smoke tests pass.

## Non-Goals For This First Project

- Rebuilding Clutch.
- Rebuilding Star Wars Figure Tracker.
- Redesigning My Baxter Portal.
- Replacing Obsidian as a brain archive.
- Making Spring publicly usable without login.
- Removing the old Compass app before the new app is verified.

## Open Risks

- Current live deployment is serving a stale bundle, so deployment configuration needs cleanup before launch.
- Current code has hardcoded URLs and frontend credentials that must not be copied into the new system.
- Existing data is spread across localStorage, Netlify Blobs, Obsidian files, and possibly files Amanda uploaded.
- Canva API behavior and template field matching need real-template testing.
- File extraction for photos, handwriting, PDFs, Word, and Excel will need a robust ingestion pipeline.

## Approval

Brian approved the design direction on July 6, 2026:

- Build the new version locally first.
- Deploy later only after the look and workflow are approved.
- Focus on Director's Activities App first.
- Leave Clutch, Star Wars Figure Tracker, and My Baxter Portal for later phases.
