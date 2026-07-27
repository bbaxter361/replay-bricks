# Hermes Handoff: Spring Watchdog Update

Date: 2026-07-07

Brian approved a no-extra-server Spring watchdog for the Director's Activities App.

Completed:

- Added Netlify scheduled function `spring-watchdog`.
- Schedule is every 5 minutes.
- Function skips outside 6:00 AM to 6:00 PM Central unless manually forced.
- Manual endpoint:
  - `https://baxter-directors-activities.netlify.app/api/spring-watchdog?force=1`
- Checks performed:
  - Spring health endpoint
  - Spring chat endpoint with usable response validation
  - Spring file-read endpoint using a tiny test text file
  - Director app Spring proxy health endpoint
- Alerts are planned after 3 consecutive failed checks.
- Recovery alert is planned when Spring comes back after a down state.
- Watchdog state is stored in Netlify Blobs.
- Incident markdown is stored in Netlify Blobs for local Obsidian backup.
- Supabase journal payload/table support was added.
- Local Obsidian sync helper was added:
  - `npm run sync:watchdog-obsidian`
- Supabase table schema was added:
  - `directors-activities-app/supabase/spring_watchdog_incidents.sql`

Alert recipients configured in Netlify:

- `brian@mybaxterfamily.com`
- `4693539737@tmomail.net`

Still needed for full alert/journal delivery:

- SMTP environment variables:
  - `WATCHDOG_SMTP_HOST`
  - `WATCHDOG_SMTP_PORT`
  - `WATCHDOG_SMTP_USER`
  - `WATCHDOG_SMTP_PASS`
  - `WATCHDOG_SMTP_SECURE`
  - `WATCHDOG_ALERT_FROM`
- Supabase environment variables and table creation:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
  - Run `supabase/spring_watchdog_incidents.sql`

Production verification:

- Manual forced watchdog check returned 200.
- Spring health: OK.
- Spring chat: OK.
- Spring file-read: OK.
- Director Spring proxy: OK.
