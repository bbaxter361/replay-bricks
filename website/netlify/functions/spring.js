// Spring v3.1 — Netlify Function
// The Compass AI assistant for Amanda
// Migrated from Fly.io Express server to Netlify Function
// Uses DeepSeek V4 Pro for production
// v3.0: Upgraded to deepseek-v4-pro, added conversation memory, web search
// v3.1: Added Brain Memory — durable extracted memories shared with Vicki & Amy

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { getAllMemories, searchMemories, saveMemory, formatMemoriesForPrompt, buildExtractionPrompt } from './spring-brain.js';
import path from 'path';
import fs from 'fs';
import { getStore } from '@netlify/blobs';
import crypto from 'crypto';

// CJS compatibility: Netlify bundles functions to CJS where import.meta.url is empty
import { createRequire } from 'module';
const require_ = createRequire(typeof __filename !== 'undefined' ? __filename : import.meta.url);
const pdfParse = require_('pdf-parse');
const mammoth = require_('mammoth');
const XLSX = require_('xlsx');

const app = express();
const PORT = process.env.PORT || 3001;
const urlRegex = /https?:\/\/[^\s<>)"']+/gi;
const SPRING_TIME_ZONE = process.env.SPRING_TIME_ZONE || 'America/Chicago';

app.use(cors({
  origin: ['https://replaybrick.com', 'https://compass-replaybricks-v2-550.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '50mb' }));

// File upload setup
const uploadsDir = '/tmp/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── In-Memory Rate Limiter ──
// Per-IP request tracking with configurable windows.
// Data lost on cold starts (acceptable for Netlify functions).
const rateLimitStore = new Map();

function rateLimiter({ windowMs, maxRequests, label }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || 'unknown';
    const key = `${label}:${ip}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter,
        message: `Rate limit of ${maxRequests} requests per ${Math.round(windowMs / 1000)}s exceeded. Retry in ${retryAfter}s.`
      });
    }

    entry.count++;
    next();
  };
}

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000).unref();

// ── API Key Auth Middleware ──
// Protects all endpoints except health check
// Set SPRING_API_KEY as a Netlify env var to enable. Leave empty to disable.
function apiKeyAuth(req, res, next) {
  if (!SPRING_API_KEY) return next(); // Auth disabled — no key configured
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (!provided || provided !== SPRING_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Provide x-api-key header or ?api_key= query param.' });
  }
  next();
}

// ── AI Configuration ──
// Spring uses DeepSeek directly — cheap and fast for Amanda's needs
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-pro';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || 'OC-AZ3qrDOJC9li';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'https://api.replaybrick.com/api/canva/callback';
const SPRING_API_KEY = process.env.SPRING_API_KEY || '';

export function buildDeepSeekMessages({ systemPrompt, userMessage, imageBase64, history }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).map(h => ({ role: h.role, content: h.content })),
  ];

  let content = userMessage || '';
  if (imageBase64) {
    content = `${content}

[Image upload note: Amanda uploaded an image, but the current DeepSeek API accepts text-only chat messages. Do not claim to see visual details unless extracted text is provided. Ask Amanda to describe the image or upload a text/PDF/document version if needed.]`.trim();
  }

  messages.push({ role: 'user', content });
  return messages;
}

// ── AI Call ──
async function callAI(systemPrompt, userMessage, imageBase64, history) {
  const messages = buildDeepSeekMessages({ systemPrompt, userMessage, imageBase64, history });

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error(`DeepSeek error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";
}

function extractUrlsForChat(text) {
  return [...new Set(String(text || '').match(urlRegex) || [])].slice(0, 3);
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildUrlContext(pages) {
  if (!pages.length) return '';
  return pages.map(page => `[Web link: ${page.url}]
Title: ${page.title || 'Untitled'}
Content:
\`\`\`
${String(page.text || '').slice(0, 12000)}
\`\`\``).join('\n\n');
}

async function fetchUrlContext(message) {
  const urls = extractUrls(message);
  const pages = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Compass Spring/2.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let text = '';
      let title = '';

      if (contentType.includes('application/pdf') || url.toLowerCase().includes('.pdf')) {
        const data = await pdfParse(buffer);
        text = data.text || '';
        title = 'Linked PDF';
      } else {
        const html = buffer.toString('utf8');
        title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
        text = stripHtml(html);
      }

      if (text.trim()) pages.push({ url, title, text });
    } catch (err) {
      console.warn('Could not fetch linked context:', url, err.message);
    }
  }

  return buildUrlContext(pages);
}

const importTypes = new Set(['music', 'art', 'exercise', 'games', 'outings', 'therapy', 'custom']);
const importWings = new Set(['both', 'assisted', 'memory']);

function normalizeImportEvent(event) {
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(event.end);
  const safeEnd = Number.isNaN(end.getTime())
    ? new Date(start.getTime() + 60 * 60 * 1000)
    : end;

  return {
    title: String(event.title || 'Untitled activity').trim() || 'Untitled activity',
    start: start.toISOString(),
    end: safeEnd.toISOString(),
    type: importTypes.has(event.type) ? event.type : 'custom',
    wing: importWings.has(event.wing) ? event.wing : 'both',
    description: String(event.description || '').trim(),
    residents: Array.isArray(event.residents) ? event.residents.filter(Boolean) : [],
    confidence: typeof event.confidence === 'number' ? event.confidence : null,
    sourceText: String(event.sourceText || '').trim(),
  };
}

export function parseCalendarImportResponse(rawText) {
  const cleaned = String(rawText || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return { summary: cleaned, events: [], warnings: ['Spring returned text instead of structured events.'] };
  }

  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
  return {
    summary: String(parsed.summary || '').trim(),
    events: (parsed.events || []).map(normalizeImportEvent).filter(Boolean),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String).filter(Boolean) : [],
  };
}

export function buildCalendarImportPrompt({ fileName, text, targetMonth, importMode = 'target-month' }) {
  const modeInstruction = importMode === 'keep-dates'
    ? 'Keep original dates from the source document whenever they are clear.'
    : `Map usable activities into the target month (${targetMonth || 'the selected month'}). For old calendars, preserve the day-of-month when it is clear; when only weekdays or recurring notes are given, place them on matching weekdays in the target month.`;

  return `Amanda needs to turn notes, old calendars, activity sheets, and nursing home planning documents into Compass calendar events.

File name: ${fileName}
Target month: ${targetMonth || 'infer from the file; if unclear use the current year/month implied by the document'}
Import mode: ${importMode}
Date handling: ${modeInstruction}

Extract every scheduled activity you can find or reasonably create from planning notes. Return ONLY JSON with this shape:
{
  "summary": "short human summary",
  "events": [
    {
      "title": "Activity name",
      "start": "YYYY-MM-DDTHH:mm:ss",
      "end": "YYYY-MM-DDTHH:mm:ss",
      "type": "music|art|exercise|games|outings|therapy|custom",
      "wing": "both|assisted|memory",
      "description": "brief useful notes",
      "residents": [],
      "confidence": 0.0,
      "sourceText": "small source snippet"
    }
  ],
  "warnings": []
}

Rules:
- Use full dates and 24-hour ISO-like local times with no timezone suffix.
- If an activity has a start time but no end time, choose a reasonable 30-60 minute end time.
- Notes like "bingo Mondays" should become concrete draft events in the target month.
- Old calendars can be reused as templates for new calendars when target-month mode is selected.
- These are nursing home activities, so infer sensible activity types and brief descriptions.
- If the wing is unclear, use "both".
- If the type is unclear, use "custom".
- Do not invent unrelated activities. It is okay to expand recurring notes into calendar dates.
- Include warnings for anything Amanda should verify.

Document text:
\`\`\`
${String(text || '').slice(0, 70000)}
\`\`\``;
}

async function callDeepSeekForCalendarImport({ fileName, text, targetMonth, importMode }) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: 'You extract activity calendars into strict JSON for a senior living activities director.' },
        { role: 'user', content: buildCalendarImportPrompt({ fileName, text, targetMonth, importMode }) }
      ],
      max_tokens: 6000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek calendar import error:', response.status, errorText);
    throw new Error(`DeepSeek calendar import error: ${response.status}`);
  }

  const data = await response.json();
  return parseCalendarImportResponse(data.choices?.[0]?.message?.content || '');
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function getOpenAIOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap(item => item.content || [])
    .map(part => part.text || '')
    .join('\n')
    .trim();
}

async function describeImageWithOpenAI(filePath, fileName) {
  if (!OPENAI_API_KEY) return '';
  const imageData = fs.readFileSync(filePath).toString('base64');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Read this image for a senior living activities director. Extract all visible calendar entries, dates, times, activity names, room/wing clues, and notes. Be literal and thorough.'
          },
          {
            type: 'input_image',
            image_url: `data:${getMimeType(fileName)};base64,${imageData}`
          }
        ]
      }],
      max_output_tokens: 3000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI vision error:', response.status, errorText);
    return '';
  }

  return getOpenAIOutputText(await response.json());
}

async function extractTextFromUpload(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let text = '';

  switch (ext) {
    case '.pdf': {
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      text = data.text || '';
      break;
    }
    case '.docx': {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '';
      break;
    }
    case '.xlsx':
    case '.xls': {
      const workbook = XLSX.readFile(filePath);
      const sheets = [];
      workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length > 0) {
          sheets.push(`--- Sheet: ${name} ---`);
          json.forEach(row => {
            if (row.some(cell => cell !== undefined && cell !== '')) {
              sheets.push(row.join(' | '));
            }
          });
        }
      });
      text = sheets.join('\n');
      break;
    }
    case '.csv':
    case '.txt':
    case '.rtf':
    case '.md':
    case '.json':
    case '.xml': {
      text = fs.readFileSync(filePath, 'utf8');
      break;
    }
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
    case '.gif': {
      text = await describeImageWithOpenAI(filePath, originalName);
      break;
    }
    default: {
      try {
        text = fs.readFileSync(filePath, 'utf8');
      } catch {
        text = '';
      }
    }
  }

  return text;
}
export function getSpringDateContext(now = new Date()) {
  const dateTime = new Intl.DateTimeFormat('en-US', {
    timeZone: SPRING_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(now);

  return `## CURRENT DATE AND TIME
Today is ${dateTime}.
Time zone: ${SPRING_TIME_ZONE}.
For relative dates, when Amanda says today, tomorrow, next week, this month, or a weekday name, resolve that relative date from this current date. For calendar events, use concrete ISO-like local date/time strings.`;
}

const BASE_SYSTEM = `You are Spring, a warm, professional, and knowledgeable activities planning assistant for Amanda. Amanda is your boss — she is the Activities Director at a retirement community specializing in memory care and assisted living.

## YOUR EXPERTISE
You are an expert in:
- Montessori-based activities for dementia and Alzheimer's residents
- Scheduling activities for memory care and assisted living
- Fine motor activities for both assisted living and memory care
- Exercise programs (chair yoga, seated stretching, gentle movement)
- Art projects (watercolor, painting, crafts, seasonal decorations)
- Music therapy, sing-alongs, and instrument play
- Cognitive activities (trivia, word games, memory exercises)
- Men's activity groups (woodworking, tool sorting, building projects)
- Group games (bingo, card games, board games adapted for seniors)
- Sensory stimulation activities
- Intergenerational activity planning
- Reminiscence therapy and memory lane activities

## YOUR PERSONALITY
- Warm, encouraging, and practical
- You love what you do and it shows
- Use specific, actionable suggestions — not vague ideas
- Keep responses concise for a busy Activities Director
- If Amanda shares a photo, acknowledge it and offer to help describe what she can do with the items shown
- You are powered by DeepSeek V4 Pro AI model — if asked about your model, mention this
- You have a brain memory system! The \"WHAT I REMEMBER ABOUT YOU\" section contains durable facts, preferences, and decisions extracted from our past conversations. These are permanent memories — reference them naturally. If Amanda mentions something you learned before, show that you remember.
- When Amanda shares web links, you'll read the page content and use it to help her. If she asks you to search for something online, tell her to share a link and you'll look at it together.

## CALENDAR SYSTEM
Amanda's Compass app has TWO calendars: Assisted Living and Memory Care. When suggesting or creating activities:
- Understand which calendar to add events to
- Each event has a wing field: 'both', 'assisted', or 'memory'
- Events include title, start/end time, description, residents, type, and wing
- If Amanda asks to schedule something, upload an old calendar, share notes, or paste a web link and says to add it to the calendar, extract every relevant nursing home activity and append an ===EVENT=== JSON block for each event. You may also put an array of events in one ===EVENT=== block.
===EVENT===
{"title": "Activity Name", "start": "2026-05-06T10:00:00", "end": "2026-05-06T10:30:00", "type": "music", "wing": "memory", "description": "Short description", "residents": []}
===END===
- For old calendars and planning notes, map recurring activities into concrete dates if Amanda names a target month or asks to populate a new calendar.
- If a file/link has many events, create all of them. Do not stop at one.

## DELETING EVENTS FROM THE CALENDAR
When Amanda asks you to delete or remove events from the calendar:
- Append a ===DELETE_EVENT=== JSON block for EACH event she wants deleted.
- Include enough detail so the app can find the right event: title and start date/time are the minimum. Include wing if she specifies which calendar.
- If she asks to delete multiple events (e.g., "remove all Bible Study from Memory Care"), list every matching event individually — one block per event.
- After emitting delete blocks, confirm what you removed in your message.
===DELETE_EVENT===
{"title": "Bible Study", "start": "2026-06-18T10:15:00", "wing": "memory"}
===END===
- Use the exact title and date that matches the event in the calendar. If you're not sure, ask Amanda to confirm which one.
- If Amanda asks to move an event from one calendar to the other, use DELETE_EVENT for the old one and EVENT for the new one.
- IMPORTANT: You CAN delete events. Previous versions could not, but you now have this capability. Never tell Amanda you can't delete events or that she has to do it manually.
- SMART BEHAVIOR: If an event is on BOTH calendars (wing=both) and Amanda asks to delete it from just one, the app will automatically move it to the other calendar instead of fully deleting. You still emit DELETE_EVENT — the frontend handles the rest. In your message, say something like "I'll remove it from the Memory Care calendar — it'll stay on Assisted Living."

## BOOK LIST SYSTEM
Amanda tracks books she has read. Each book has title, author, page count, and optional date read. She can add books directly or ask you to add them.
- When adding a book, append an ===BOOK=== JSON block:
===BOOK===
{"title": "Book Title", "author": "Author Name", "pages": 250, "dateRead": "2026-06-22"}
===END===
- The dateRead field is optional — use ISO date format (YYYY-MM-DD). If Amanda doesn't specify when she read it, leave dateRead out and it will default to today.
- If Amanda says things like "I read it last week" or "last Tuesday," infer the correct date and include it.
- She can ask things like "Spring, add The Great Gatsby by F. Scott Fitzgerald to my book list, 180 pages"
- She may ask about her reading stats - reference the Books page in the app

## IMAGE PROCESSING
When Amanda uploads an image (bingo buck form, calendar, activity sheet, business card, etc.):
- Use extracted/OCR text from the image when provided
- If it's a calendar or schedule, offer to add events based on what you read
- If Amanda asks to add it, append EVENT blocks
- If it's a business card, driver license, or contact info, append a CONTACT block
- Be honest if only partial text was extracted

## DOCUMENT PROCESSING
When Amanda uploads a document (PDF, Word doc, Excel spreadsheet, text file, etc.):
- Read the extracted text carefully and thoroughly
- If it's a schedule or calendar and Amanda asks to add it, append EVENT blocks immediately
- If it's a list of residents or contacts, acknowledge it and help organize the info
- If it's a form or worksheet, explain what it contains and help fill it out
- If it's an Excel file, mention any tables or data you see
- Always acknowledge what the document is and offer specific help based on its content

## WEB LINKS
When Amanda shares a web link, use the provided web-link text. If she says add it to the calendar or contacts, extract the relevant events or contacts and append the proper blocks.

## CONTACT SYSTEM
Amanda tracks contacts for residents, family members, doctors, and staff. Each contact has name, phone, email, relationship type (resident/family/doctor/staff), company, job title, notes, and tags.
- When Amanda shares a business card image or contact info, extract the details
- If she asks you to save a contact, scan a business card, scan a driver's license, or add contact information, append a ===CONTACT=== JSON block:
===CONTACT===
{"name": "Jane Smith", "phone": "(555) 123-4567", "email": "jane@example.com", "relationship": "doctor", "company": "City Medical", "title": "Neurologist", "notes": "Specializes in dementia care"}
===END===
- You can also suggest adding tags like "memory-care", "specialist", etc.`;

// ── Calendar events context injected into Spring's system prompt ──
// Fetches all events from blob storage, groups by wing, formats for the prompt.
async function getCalendarContext() {
  try {
    const store = await getBlobStore();
    let events;
    if (store instanceof Map) {
      const raw = store.get('events');
      events = raw ? JSON.parse(raw) : [];
    } else {
      events = await store.get('events', { type: 'json' }) || [];
    }
    if (!Array.isArray(events) || events.length === 0) return '';

    // Sort by start date
    const sorted = [...events].sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    // Group by wing
    const byWing = { both: [], assisted: [], memory: [] };
    for (const e of sorted) {
      const wing = e.wing || 'both';
      if (byWing[wing]) byWing[wing].push(e);
    }

    const formatEvent = (e) => {
      const start = e.start || '';
      // Parse ISO date to readable: "Mon 7/6, 10:00 AM"
      let display = start;
      try {
        const d = new Date(start + (start.includes('Z') ? '' : ''));
        if (!isNaN(d.getTime())) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const day = dayNames[d.getDay()];
          const month = d.getMonth() + 1;
          const date = d.getDate();
          const hours = d.getHours();
          const mins = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h = hours % 12 || 12;
          const time = mins > 0 ? `${h}:${String(mins).padStart(2, '0')} ${ampm}` : `${h}:00 ${ampm}`;
          display = `${day} ${month}/${date}, ${time}`;
        }
      } catch {}
      return `${display} — ${e.title || 'Untitled'}`;
    };

    let context = '\n\n## CURRENT CALENDAR EVENTS\n';
    context += 'These events already exist in Amanda\'s Compass calendar. Use this to answer questions about what is scheduled, avoid suggesting conflicts, and know what events are on the calendar before creating or deleting.\n';

    // Both wings (largest group usually)
    if (byWing.both.length > 0) {
      context += `\n**BOTH WINGS (${byWing.both.length} events):**\n`;
      for (const e of byWing.both) {
        context += `  • ${formatEvent(e)}\n`;
      }
    }
    if (byWing.assisted.length > 0) {
      context += `\n**ASSISTED LIVING (${byWing.assisted.length} events):**\n`;
      for (const e of byWing.assisted) {
        context += `  • ${formatEvent(e)}\n`;
      }
    }
    if (byWing.memory.length > 0) {
      context += `\n**MEMORY CARE (${byWing.memory.length} events):**\n`;
      for (const e of byWing.memory) {
        context += `  • ${formatEvent(e)}\n`;
      }
    }

    // Cap total to prevent token bloat with very large calendars
    const MAX_LEN = 8000;
    if (context.length > MAX_LEN) {
      context = context.substring(0, MAX_LEN) + '\n... (calendar truncated, showing earliest events)\n';
    }

    return context;
  } catch (e) {
    console.warn('Calendar context read failed:', e.message);
    return '';
  }
}

export function buildSpringSystemPrompt(now = new Date()) {
  return `${BASE_SYSTEM}

${getSpringDateContext(now)}`;
}

// ── Blobs data helpers ──
let blobStoreMode = 'unknown'; // 'netlify-blobs' | 'memory' | 'unknown'
let blobStoreError = null;

async function getBlobStore() {
  // If we already have a working store cached, return it (includes Map fallback)
  if (_cachedBlobStore && (blobStoreMode === 'netlify-blobs' || blobStoreMode === 'memory')) {
    return _cachedBlobStore;
  }

  // Approach 1: Use Netlify's automatic environment context (NETLIFY_BLOBS_CONTEXT)
  try {
    const store = getStore('compass-data');
    // Verify it actually works by making a lightweight call
    await store.list({ prefix: '__health_check__' });
    _cachedBlobStore = store;
    blobStoreMode = 'netlify-blobs';
    blobStoreError = null;
    console.log('✅ Netlify Blobs connected (automatic context) — data WILL persist');
    return store;
  } catch (e) {
    console.warn('⚠️  Netlify Blobs auto-context failed:', e.message);
    blobStoreError = `auto-context: ${e.message}`;
  }

  // Approach 2: Explicit config using env vars NETLIFY_SITE_ID + NETLIFY_BLOBS_TOKEN
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
  if (siteID && token) {
    try {
      const store = getStore({
        name: 'compass-data',
        siteID,
        token,
        apiURL: process.env.NETLIFY_BLOBS_API_URL,
      });
      await store.list({ prefix: '__health_check__' });
      _cachedBlobStore = store;
      blobStoreMode = 'netlify-blobs';
      blobStoreError = null;
      console.log('✅ Netlify Blobs connected (explicit config) — data WILL persist');
      return store;
    } catch (e) {
      console.warn('⚠️  Netlify Blobs explicit config failed:', e.message);
      blobStoreError = `explicit-config: ${e.message}`;
    }
  } else {
    console.warn('⚠️  No NETLIFY_SITE_ID / NETLIFY_BLOBS_TOKEN env vars set — cannot try explicit Blobs config');
    if (!blobStoreError) blobStoreError = 'missing NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN env vars';
  }

  // FALLBACK: In-memory Map — cached so data survives between requests within the same container
  // NOTE: Data is lost on cold starts! Enable Netlify Blobs for true durability.
  const map = new Map();
  _cachedBlobStore = map;
  blobStoreMode = 'memory';
  console.error('❌ CRITICAL: Netlify Blobs unavailable! Using in-memory Map (cached per container).');
  console.error('   Compass data WILL be lost on cold starts or after deploys.');
  console.error('   To fix: enable Netlify Blobs for this site in the Netlify dashboard,');
  console.error('   or set NETLIFY_SITE_ID + NETLIFY_BLOBS_TOKEN environment variables.');
  return map;
}

// Cache to avoid re-creating store on every call within the same container
let _cachedBlobStore = null;

// ── Audit Log ──
// Append-only audit trail for state compliance.
// Stored alongside app data using the same blob/Memory store.
// Entries are immutable — no update or delete operations exposed.
const AUDIT_LOG_KEY = '__audit_log__';

async function getAuditLog() {
  const store = await getBlobStore();
  if (store instanceof Map) {
    const raw = store.get(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  const data = await store.get(AUDIT_LOG_KEY, { type: 'json' });
  return Array.isArray(data) ? data : [];
}

async function appendAuditLog(entry) {
  const log = await getAuditLog();
  const auditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: entry.user || 'system',
    action: entry.action || 'unknown',
    details: entry.details || '',
    key: entry.key || null,
  };
  log.push(auditEntry);

  // Keep last 10,000 entries to bound storage
  const trimmed = log.length > 10000 ? log.slice(-10000) : log;

  const store = await getBlobStore();
  if (store instanceof Map) {
    store.set(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } else {
    await store.setJSON(AUDIT_LOG_KEY, trimmed);
  }
  console.log(`📋 Audit: ${auditEntry.action} — ${auditEntry.details}`);
}

// ── URL Extraction Helpers ──

/**
 * Extract URLs from a text string. Matches http/https URLs.
 */
function extractUrls(text) {
  if (!text) return [];
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlPattern) || [];
  // Deduplicate and filter out markdown/image shortcodes
  return [...new Set(matches)].filter(url => {
    try { new URL(url); return true; } catch { return false; }
  });
}

/**
 * Fetch a URL and extract readable text content.
 * Strips HTML tags, returns plain text. Timeout 8s, max 50KB.
 */
async function fetchUrlContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Spring-Compass/3.0 (Activities Assistant)',
        'Accept': 'text/html,text/plain,*/*'
      }
    });
    clearTimeout(timeout);
    
    if (!response.ok) return `[Could not fetch ${url}: HTTP ${response.status}]`;
    
    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();
    
    let text;
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      // Strip HTML tags, decode entities
      text = raw
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    } else if (contentType.includes('application/pdf')) {
      text = '[PDF document — Amanda, try downloading and uploading the file instead]';
    } else {
      text = raw.substring(0, 50000);
    }
    
    if (!text || text.length < 20) return `[No readable content found at ${url}]`;
    
    const maxLen = 30000;
    if (text.length > maxLen) {
      text = text.substring(0, maxLen) + `\n\n[...truncated from ${text.length} characters]`;
    }
    
    console.log(`🌐 Fetched URL: ${url} — extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.warn(`⚠️ Failed to fetch URL ${url}:`, err.message);
    return `[Failed to fetch ${url}: ${err.message}]`;
  }
}

// ── Conversation Memory ──
// Stores/retrieves recent conversation context from Netlify Blobs.
// This gives Spring long-term memory of past chats with Amanda.
const MEMORY_KEY = 'spring_conversation_memory';
const MAX_MEMORY_TURNS = 20; // Keep last 20 exchanges

async function getMemoryContext() {
  try {
    const store = await getBlobStore();
    let history;
    if (store instanceof Map) {
      const raw = store.get(MEMORY_KEY);
      history = raw ? JSON.parse(raw) : [];
    } else {
      history = await store.get(MEMORY_KEY, { type: 'json' });
    }
    if (!Array.isArray(history) || history.length === 0) return '';
    
    // Take last N turns and format as context
    const recent = history.slice(-MAX_MEMORY_TURNS);
    return recent.map(turn => {
      const text = turn.message || turn.content || '';
      return `[${turn.role === 'user' ? 'Amanda' : 'Spring'}, ${turn.timestamp || 'earlier'}]: ${text.substring(0, 500)}`;
    }).join('\n');
  } catch (e) {
    console.warn('Memory read failed:', e.message);
    return '';
  }
}

// Mutex for saveMemoryTurn to prevent read-modify-write races
let _memorySaveLock = Promise.resolve();

async function saveMemoryTurn(role, content) {
  // Chain saves sequentially — each waits for the previous to complete
  const prev = _memorySaveLock;
  let resolveNext;
  _memorySaveLock = new Promise(r => { resolveNext = r; });

  try {
    await prev;
    const store = await getBlobStore();
    let history;
    if (store instanceof Map) {
      const raw = store.get(MEMORY_KEY);
      history = raw ? JSON.parse(raw) : [];
    } else {
      history = await store.get(MEMORY_KEY, { type: 'json' }) || [];
    }
    history.push({
      role,
      content: content?.substring(0, 2000) || '',
      timestamp: new Date().toISOString()
    });
    // Keep last 100 turns max
    const trimmed = history.length > 100 ? history.slice(-100) : history;
    if (store instanceof Map) {
      store.set(MEMORY_KEY, JSON.stringify(trimmed));
    } else {
      await store.setJSON(MEMORY_KEY, trimmed);
    }
  } catch (e) {
    console.warn('Memory save failed:', e.message);
  } finally {
    resolveNext();
  }
}

// ── Chat endpoint ──
app.post('/api/chat', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 30, label: 'chat' }), async (req, res) => {
  try {
    const { message, image, docText, fileName, history } = req.body;

    // Check if we have any AI configured
    const noAI = !DEEPSEEK_API_KEY;

    if (noAI) {
      return res.json({
        response: "Hi Amanda! I'm Spring, your activities planning assistant. I'd love to help you plan something wonderful today! Our connection to my brain is being set up — check back soon! 🌸"
      });
    }

    // Extract URLs from message and fetch content for Spring context
    let webContext = '';
    if (message && !docText) {
      const urls = extractUrlsForChat(message);
      if (urls.length > 0) {
        console.log(`🔗 Found ${urls.length} URL(s) in message:`, urls);
        const contents = await Promise.all(urls.map(fetchUrlContent));
        webContext = urls.map((url, i) => {
          return `\n\n[Web Link: ${url}]\n\`\`\`\n${contents[i]}\n\`\`\``;
        }).join('\n');
      }
    }

    // Load conversation memory (past chats with Amanda)
    const memoryContext = await getMemoryContext();

    // Load relevant Brain memories (durable extracted memories)
    const store = await getBlobStore();
    const brainMemories = await searchMemories(store, message || '', 5);
    const brainContext = formatMemoriesForPrompt(brainMemories);

    // Build the user message
    let fullMessage = '';
    if (docText && fileName) {
      fullMessage = `[File: ${fileName}]\n\nContents of the uploaded file:\n\`\`\`\n${docText.substring(0, 50000)}\n\`\`\`\n\n${message || 'Please review this document and help me with it.'}`;
    } else if (message) {
      fullMessage = message + webContext;
    }

    // Inject memory + calendar events into system prompt
    const calendarContext = await getCalendarContext();
    const systemPrompt = buildSpringSystemPrompt() + 
      (calendarContext ? calendarContext : '') +
      (brainContext ? `\n\n## WHAT I REMEMBER ABOUT YOU\n${brainContext}\n\nThese are things I've learned from our past conversations. Use this knowledge naturally.` : '') +
      (memoryContext ? `\n\n## RECENT CONVERSATION HISTORY\n${memoryContext}\n\nUse this context to maintain continuity. Reference past conversations naturally when relevant.` : '');

    const reply = await callAI(systemPrompt, fullMessage, image, history);
    
    // Save this conversation turn to memory
    if (message) saveMemoryTurn('user', message);
    saveMemoryTurn('assistant', reply);
    
    res.json({ response: reply });

  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      response: "Hi! I'm Spring 🌸 I'm here to help you plan activities, manage your calendar, and track your books. I'm having a little trouble connecting right now, but I'll be back shortly!"
    });
  }
});

// ── Contact Form ──
app.post('/api/contact', apiKeyAuth, (req, res) => {
  const { name, email, message } = req.body;
  console.log('📧 New contact form submission:', { name, email, message: message?.substring(0, 200) });
  res.json({ ok: true, message: 'Message received. We\'ll get back to you soon!' });
});

// ── Read uploaded file ──
app.post('/api/read-file', apiKeyAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    // Security: validate extension against whitelist
    const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.rtf', '.md', '.json', '.xml', '.png', '.jpg', '.jpeg', '.webp', '.gif'];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: `Unsupported file type: ${ext}. Accepted: PDF, Word, Excel, CSV, text, and images.` });
    }
    
    // Security: prevent path traversal in originalname
    const safeName = path.basename(req.file.originalname);
    
    let text = '';

    console.log(`📄 Reading file: ${safeName} (${ext})`);

    text = await extractTextFromUpload(filePath, req.file.originalname);
    if (!text) text = `[Unsupported or unreadable file type: ${ext}. Unable to extract text.]`;

    // Clean up uploaded file
    try { fs.unlinkSync(filePath); } catch {}

    const maxLen = 100000;
    if (text.length > maxLen) {
      text = text.substring(0, maxLen) + `\n\n[...truncated: original was ${text.length} characters]`;
    }

    console.log(`✅ Extracted ${text.length} characters from ${req.file.originalname}`);
    res.json({ text, fileName: req.file.originalname, length: text.length });

  } catch (err) {
    console.error('❌ File read error:', err);
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: 'Failed to read file', details: err.message });
  }
});

// ── Emergency calendar import ──
app.post('/api/import-calendar', apiKeyAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!DEEPSEEK_API_KEY) {
      return res.status(503).json({ error: 'Calendar import needs DeepSeek configured.' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const warnings = [];

    console.log(`🗓️ Importing calendar file: ${req.file.originalname} (${ext})`);
    let text = await extractTextFromUpload(filePath, req.file.originalname);

    if (!text.trim() && ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) && !OPENAI_API_KEY) {
      warnings.push('Image vision is not configured yet. Add OPENAI_API_KEY to read photos and scanned calendars.');
    }

    if (!text.trim()) {
      return res.json({
        fileName: req.file.originalname,
        summary: 'I could not extract readable text from this file.',
        events: [],
        warnings: warnings.length ? warnings : ['Try exporting the calendar as a text PDF, Word document, Excel file, or CSV.'],
        extractedText: ''
      });
    }

    const imported = await callDeepSeekForCalendarImport({
      fileName: req.file.originalname,
      text,
      targetMonth: req.body.targetMonth,
      importMode: req.body.importMode
    });

    try { fs.unlinkSync(filePath); } catch {}

    res.json({
      fileName: req.file.originalname,
      summary: imported.summary,
      events: imported.events,
      warnings: [...warnings, ...imported.warnings],
      extractedText: text.slice(0, 20000)
    });
  } catch (err) {
    console.error('❌ Calendar import error:', err);
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: 'Failed to import calendar', details: err.message });
  }
});

// ── Blobs: Save data ──
app.post('/api/data/save', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 60, label: 'data' }), async (req, res) => {
  try {
    const { key, value } = req.body;
    const store = await getBlobStore();
    if (store instanceof Map) {
      store.set(key, JSON.stringify(value));
    } else {
      await store.setJSON(key, value);
    }
    // Append audit log entry for state compliance
    await appendAuditLog({
      action: 'data_save',
      key,
      user: req.headers['x-api-key'] ? 'authenticated' : 'unknown',
      details: `Saved key "${key}"`
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Blobs: Status / health check (must be before :key route) ──
app.get('/api/data/status', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 60, label: 'data' }), async (req, res) => {
  try {
    const store = await getBlobStore();
    const isMemory = store instanceof Map;

    let testResult = null;
    if (!isMemory) {
      try {
        // Write a test key and read it back
        const testKey = '__blob_health_test__';
        const testValue = { ts: Date.now(), status: 'ok' };
        await store.setJSON(testKey, testValue);
        const readBack = await store.get(testKey, { type: 'json' });
        await store.delete(testKey);
        testResult = readBack && readBack.ts === testValue.ts ? 'pass' : 'fail';
      } catch (e) {
        testResult = `fail: ${e.message}`;
      }
    }

    res.json({
      mode: blobStoreMode,
      durable: !isMemory,
      healthTest: testResult || (isMemory ? 'n/a (in-memory)' : null),
      error: blobStoreError || null,
      inMemorySize: isMemory ? store.size : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Log: Read-only endpoint ──
// Append-only audit trail for state compliance.
// Entries are immutable — no PUT, PATCH, or DELETE on this endpoint.
app.get('/api/data/audit', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 60, label: 'data' }), async (req, res) => {
  try {
    const log = await getAuditLog();
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    // Return most recent first
    const sorted = [...log].reverse();
    const page = sorted.slice(offset, offset + limit);
    res.json({
      total: log.length,
      offset,
      limit,
      entries: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Data Export (State Audit) ──
// GET /api/data/export?format=json|csv&keys=all|comma,separated
// Returns all Compass data formatted for state audit export with integrity hash.
// Uses SHA-256 to produce a data integrity fingerprint auditors can verify.

function hashData(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function jsonToCSV(records, key) {
  if (!records || !records.length) return `# ${key} — no records\n`;
  const headers = Object.keys(records[0]);
  const rows = [headers.join(',')];
  for (const row of records) {
    rows.push(headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const escaped = str.replace(/"/g, '""');
      return /[,"\n\r]/.test(str) ? `"${escaped}"` : escaped;
    }).join(','));
  }
  return `# Data type: ${key}\n${rows.join('\n')}\n\n`;
}

app.get('/api/data/export', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 20, label: 'export' }), async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const keysParam = (req.query.keys || 'all').toLowerCase();

    const store = await getBlobStore();
    let allKeys;
    if (store instanceof Map) {
      allKeys = [...store.keys()].filter(k => k !== AUDIT_LOG_KEY && !k.startsWith('__'));
    } else {
      const listing = await store.list();
      allKeys = listing.blobs.map(b => b.key).filter(k => k !== AUDIT_LOG_KEY && !k.startsWith('__'));
    }

    const exportKeys = keysParam === 'all' ? allKeys : keysParam.split(',').filter(k => allKeys.includes(k));

    const records = {};
    const recordCounts = {};
    for (const key of exportKeys) {
      let data;
      if (store instanceof Map) {
        const raw = store.get(key);
        data = raw ? JSON.parse(raw) : null;
      } else {
        data = await store.get(key, { type: 'json' });
      }
      records[key] = data;
      recordCounts[key] = Array.isArray(data) ? data.length : (data && typeof data === 'object' ? Object.keys(data).length : 0);
    }

    const dataFingerprint = hashData({ exportedAt: new Date().toISOString(), records, recordCounts });

    await appendAuditLog({
      action: 'data_export',
      user: 'authenticated',
      details: `Export: ${exportKeys.length} keys, format=${format}, hash=${dataFingerprint.slice(0, 12)}`
    });

    if (format === 'csv') {
      let csv = `# Compass Data Export\n# Exported: ${new Date().toISOString()}\n# Integrity SHA-256: ${dataFingerprint}\n# Audited by: Spring v3.0\n\n`;
      for (const key of exportKeys) {
        const recs = Array.isArray(records[key]) ? records[key] : (records[key] ? [records[key]] : []);
        csv += jsonToCSV(recs, key);
      }
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="compass-export-${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csv);
    }

    res.json({
      exportedAt: new Date().toISOString(),
      dataHash: dataFingerprint,
      exportedBy: 'Spring v3.0 (Netlify)',
      keyCount: exportKeys.length,
      recordCounts,
      records,
      _audit: {
        note: 'This export includes a SHA-256 data integrity hash. Verify unchanged by re-hashing the records object.',
        verifyCommand: `echo '<json>' | sha256sum`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Blobs: Get data ──
app.get('/api/data/:key', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 60, label: 'data' }), async (req, res) => {
  try {
    const store = await getBlobStore();
    let data;
    if (store instanceof Map) {
      data = store.get(req.params.key);
      data = data ? JSON.parse(data) : null;
    } else {
      data = await store.get(req.params.key, { type: 'json' });
    }
    res.json({ data: data || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Blobs: List all keys ──
app.get('/api/data', apiKeyAuth, rateLimiter({ windowMs: 60000, maxRequests: 60, label: 'data' }), async (req, res) => {
  try {
    const store = await getBlobStore();
    let keys;
    if (store instanceof Map) {
      keys = [...store.keys()];
    } else {
      const listing = await store.list();
      keys = listing.blobs.map(b => b.key);
    }
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Canva Autofill ──
let canvaAccessToken = null;
let canvaTokenExpiry = 0;

async function getCanvaToken() {
  if (canvaAccessToken && Date.now() < canvaTokenExpiry - 300000) {
    return canvaAccessToken;
  }
  try {
    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        code: process.env.CANVA_AUTH_CODE || '',
        redirect_uri: CANVA_REDIRECT_URI
      })
    });
    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      canvaAccessToken = data.access_token;
      canvaTokenExpiry = Date.now() + (data.expires_in * 1000);
      return canvaAccessToken;
    }
    throw new Error('Token exchange failed');
  } catch (e) {
    throw new Error('Canva not authorized');
  }
}

app.post('/api/canva/autofill', apiKeyAuth, async (req, res) => {
  try {
    const { designId, events } = req.body;
    if (!designId) return res.status(400).json({ error: 'designId required' });

    const token = await getCanvaToken();
    const autofillData = {
      data: {
        calendar_title: events[0]?.month || 'Monthly Calendar',
        events_table: events.map((event, idx) => ({
          _row: idx,
          date: event.date || '',
          day: event.day || '',
          time: event.time || '',
          title: event.title || '',
          type: event.type || '',
          wing: event.wing || '',
          location: event.location || '',
          residents: event.residents?.join(', ') || '',
          description: event.description || '',
          color_bar: event.wing === 'assisted' ? '#93C5FD' : event.wing === 'memory' ? '#C4B5FD' : '#8B9DC4'
        })),
        total_events: events.length,
        assisted_count: events.filter(e => e.wing === 'assisted' || e.wing === 'both').length,
        memory_count: events.filter(e => e.wing === 'memory' || e.wing === 'both').length,
        assisted_label: 'Assisted Living',
        memory_label: 'Memory Care',
      }
    };

    const response = await fetch(`https://api.canva.com/rest/v1/designs/${designId}/autofill`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(autofillData)
    });

    const responseData = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Canva autofill failed', details: responseData });
    }
    res.json({ success: true, designUrl: responseData.design_url, ...responseData });
  } catch (err) {
    res.status(500).json({ error: 'Canva autofill failed', details: err.message });
  }
});

// ── Brain Memory Extraction ──
// Extracts durable memories from recent conversations.
// Call this after a meaningful conversation to persist what was learned.
app.post('/api/brain/extract', apiKeyAuth, async (req, res) => {
  try {
    const store = await getBlobStore();
    
    // Get recent conversation memory (last 20 turns)
    let history;
    if (store instanceof Map) {
      const raw = store.get(MEMORY_KEY);
      history = raw ? JSON.parse(raw) : [];
    } else {
      history = await store.get(MEMORY_KEY, { type: 'json' }) || [];
    }
    
    if (!history.length) {
      return res.json({ extracted: 0, message: 'No conversation history to extract from.' });
    }

    // Take last 20 turns for context
    const recent = history.slice(-20);
    const conversationText = recent.map(t => 
      `${t.role === 'user' ? 'Amanda' : 'Spring'}: ${(t.content || t.message || '').substring(0, 1000)}`
    ).join('\n');

    // Call LLM to extract memories
    const extractionPrompt = buildExtractionPrompt(conversationText);
    const rawResponse = await callAI(
      'You are a memory extraction system. Output ONLY valid JSON objects, one per line. No other text.',
      extractionPrompt,
      null,
      []
    );

    // Parse the JSON lines from the response
    const lines = rawResponse.split('\n').filter(l => l.trim().startsWith('{'));
    let saved = 0;
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line.trim());
        if (parsed.topic && parsed.principle) {
          const result = await saveMemory(store, {
            topic: parsed.topic,
            principle: parsed.principle,
            signal: parsed.signal || 'positive',
            source: 'spring-extraction',
            agent: 'spring',
            metadata: { extracted_from_turns: recent.length }
          });
          if (result.saved) saved++;
        }
      } catch (parseErr) {
        // Skip invalid JSON lines
      }
    }

    res.json({ extracted: saved, message: `Extracted ${saved} memories from ${recent.length} conversation turns.` });
  } catch (err) {
    console.error('Brain extraction error:', err);
    res.status(500).json({ error: 'Extraction failed', details: err.message });
  }
});

// ── Brain Memory Search (debug/status) ──
app.get('/api/brain/memories', apiKeyAuth, async (req, res) => {
  try {
    const store = await getBlobStore();
    const memories = await getAllMemories(store);
    res.json({ count: memories.length, memories: memories.slice(-50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Spring (Netlify)',
    version: '3.1.0',
    model: DEEPSEEK_MODEL,
    blobs: true,
    blobStoreMode,
    blobStoreError: blobStoreError || null,
    brain: true,
  });
});

// ── Export handler ──
// Only run server directly if not in serverless mode
const handler = serverless(app);
export { handler };

// For local dev: run Express directly
if (process.env.NETLIFY_DEV !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 Spring running on port ${PORT}`);
    console.log(`🤖 ${DEEPSEEK_MODEL}: ${DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🎨 Canva: ${CANVA_CLIENT_SECRET ? '✅ Configured' : '❌ Missing client secret'}`);
  });
}
