# Hermes Handoff: Spring / Compass Site Restore

Date: 2026-07-27
Owner context: Brian asked Codex to restore the newest Spring / Compass interface, remove the old visible interface, protect Amanda's data, and fix Spring chat usability.

## Current Live Site

Use this as the active Compass / Spring interface:

- https://compass-replaybricks-v2.netlify.app
- replaybrick.com/portal embeds/points users into the current Compass Portal flow.

Important: The old `compass-replaybricks-v2.netlify.app` project now serves the newest Director's Activities App interface directly. Do not resurrect the older Compass UI there.

## Repository / Branch

Repo:

- `C:\Users\bbaxt\OneDrive\Documents\New project`

Branch:

- `codex/directors-activities-app`

Main app folder:

- `directors-activities-app`

Recent restore commits:

- `d50a22d` - restored Spring directors app updates
- `9f9651a` - routed Spring through Ollama DeepSeek in website Spring function source
- `c9bec33` - corrected Spring prompt to say Ollama DeepSeek, not OpenRouter/old hosted DeepSeek
- `04da16d` - made legacy Compass URL share Director data instead of creating an empty data pocket
- `a89e3e3` - added OCR upload reading for Spring
- `9ce1168` - kept Spring chat bar visible in the viewport
- `a749aaa` - auto-scroll Spring chat to latest messages

## Netlify Projects

Active user-facing site:

- Name: `compass-replaybricks-v2`
- Site ID: `16943fdf-0416-447e-82be-93bf6a2b75e4`
- URL: https://compass-replaybricks-v2.netlify.app

Known-good Director app/data site:

- Name: `baxter-directors-activities`
- Site ID: `f2fe4cbd-23e7-450d-a3d7-d48e4ff2702b`
- URL: https://baxter-directors-activities.netlify.app

Spring backend target used by the Director app proxy:

- `https://replaybricksv2.netlify.app`
- Health currently reports `provider: ollama`.

## Data Safety

Amanda's shared Director app records are stored through `/api/director-data`.

The active `compass-replaybricks-v2` site may not have Supabase env vars directly. To prevent data loss or an empty dataset, its `director-data` function falls back to forwarding load/save requests to:

- `https://baxter-directors-activities.netlify.app/api/director-data`

Do not remove this fallback unless the exact same Supabase environment variables are configured on `compass-replaybricks-v2` and verified.

Before and after deploys, verify:

```powershell
Invoke-RestMethod -Uri 'https://compass-replaybricks-v2.netlify.app/api/director-data'
```

Expected:

- `ok: true`
- `status: 200`
- real Amanda records visible, such as books, residents, Bingo Bucks, audit log, and Spring history.

## Spring / Ollama

Spring is expected to identify itself as Ollama DeepSeek.

The Director app sends an extra Spring skills prompt from:

- `directors-activities-app/src/utils/springSkills.js`

That prompt explicitly says:

- Spring is connected through an Ollama-hosted DeepSeek model.
- If Amanda asks what powers Spring, say Ollama DeepSeek.
- Do not say OpenRouter, DeepSeek V4 Flash, or the old hosted DeepSeek setup.

Live sanity check:

```powershell
$body = @{
  message = "You are connected through an Ollama-hosted DeepSeek model. If Amanda asks what powers you, say Ollama DeepSeek.`n`nAmanda request:`nWhat powers you?"
  history = @()
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri 'https://compass-replaybricks-v2.netlify.app/api/spring-proxy/chat' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

Expected response should say Ollama DeepSeek.

## Upload / PDF / Image Reading

Spring upload improvements are in:

- `directors-activities-app/src/utils/uploadReader.js`
- `directors-activities-app/src/pages/SpringAssistant.jsx`

Behavior:

- Image uploads run through client-side OCR using `tesseract.js`.
- PDFs first go to the Spring backend `/api/read-file` for normal text extraction.
- If a PDF returns too little text, the app renders PDF pages in-browser with `pdfjs-dist` and runs OCR on the pages.
- Spring receives a clear text package explaining what was extracted and whether OCR was used.
- If nothing readable is found, Spring gives Amanda a clearer message asking for a clearer image, text-based PDF, Word, Excel, or CSV.

Related dependencies in `directors-activities-app/package.json`:

- `tesseract.js`
- `pdfjs-dist`

## Spring Chat Layout

Spring page:

- `directors-activities-app/src/pages/SpringAssistant.jsx`

Fixes:

- The chat panel no longer uses a hard `min-h-[560px]`.
- It now uses viewport-aware height: `h-[clamp(360px,calc(100dvh-18rem),560px)]`.
- Message history scrolls inside the panel.
- The reply/chat bar remains visible when the page opens.
- The message list auto-scrolls to the newest message on page open, send, reply, and upload state changes.

## Deploy Instructions

Run checks from:

```powershell
cd "C:\Users\bbaxt\OneDrive\Documents\New project\directors-activities-app"
npm test
npm run build
```

Current expected result:

- 90 tests passing
- Vite build succeeds

Deploy active Compass site:

```powershell
npx netlify deploy --prod --site 16943fdf-0416-447e-82be-93bf6a2b75e4
```

Recommended safer deploy pattern:

1. Commit changes first.
2. Create a clean archive from `HEAD`.
3. Deploy from the clean archive's `directors-activities-app` folder.

This avoids accidentally deploying unrelated local work from `hold`, `website/src/pages/InventoryPage.jsx`, backups, or mockups.

## Post-Deploy Checks

Page loads:

```powershell
Invoke-WebRequest -Uri 'https://compass-replaybricks-v2.netlify.app/'
```

Expected:

- HTTP `200`
- page content includes `Compass Portal`

Spring health:

```powershell
Invoke-RestMethod -Uri 'https://compass-replaybricks-v2.netlify.app/api/spring-proxy/health'
```

Expected:

- `status: ok`
- `provider: ollama`
- `blobs: true`
- `brain: true`

Director data:

```powershell
Invoke-RestMethod -Uri 'https://compass-replaybricks-v2.netlify.app/api/director-data'
```

Expected:

- `ok: true`
- Amanda's actual records load.

## Things Not To Do

- Do not deploy the old `compass` app over `compass-replaybricks-v2`.
- Do not remove `/api/director-data` fallback forwarding unless Supabase env vars are copied and verified.
- Do not wipe Netlify Blobs or Supabase tables.
- Do not assume local browser storage is Amanda's source of truth.
- Do not deploy from a dirty working tree unless the unrelated files have been reviewed.

## Current Known Workspace Noise

There are unrelated local changes outside this Spring restore, especially under:

- `hold/`
- `website/src/pages/InventoryPage.jsx`
- `backups/`
- `mockups/`

Leave those alone unless Brian specifically asks for that work.
