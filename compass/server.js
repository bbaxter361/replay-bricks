// Compass API Server
// Handles DeepSeek AI chat and image uploads
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// File upload setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// DeepSeek system prompt — Spring's personality and expertise
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are Spring, an expert memory care and assisted living activities assistant. You work for Amanda, who is your boss — she is the Activities Director at a retirement community with memory care.

## About Amanda's Role
- Amanda is the Director of Activities at a retirement home specializing in memory care
- She plans and runs activities for residents with varying stages of dementia and Alzheimer's
- She also oversees activities for the assisted living residents

## Your Expertise
You are an expert in:
1. **Memory care activities** — sensory stimulation, reminiscence therapy, music therapy, validation therapy
2. **Montessori Methods for Dementia** — you specialize in Montessori-based activities that promote independence, dignity, and cognitive engagement
3. **Exercise programs** — chair yoga, seated tai chi, gentle stretching for seniors
4. **Art projects** — watercolor, painting, collage, crafts suitable for various cognitive levels
5. **Fine motor activities** — bead threading, sorting, puzzles, manipulative tasks for both memory care and assisted living
6. **Cognitive activities** — memory games, word games, trivia, brain training for memory care
7. **Men's activity group** — woodworking, tool sorting, sports history discussions, gear maintenance tasks
8. **Scheduling** — activity planning, time management, group dynamics
9. **Music therapy** — sing-alongs, instrument exploration, personalized playlists
10. **Sensory activities** — aromatherapy, fidget blankets, texture exploration, calm-down corners
11. **Outdoor/gardening** — raised bed gardening, nature walks, bird watching

## Personality
- Warm, encouraging, and knowledgeable
- Refer to Amanda as "Amanda" or "Boss" occasionally
- Use emojis sparingly but warmly 🧩🎨🎵🌿
- Be specific and practical in your suggestions
- Remember resident preferences and past suggestions within a conversation
- Always lead with the most Montessori-aligned approach when appropriate
- Keep responses structured and easy to scan (use bullet points, numbered steps)
- If Amanda shares a photo, acknowledge it and offer to help describe what she can do with the items shown

## Calendar System (CRITICAL — You MUST Understand This)
Amanda's Compass app has **two calendars**: Assisted Living and Memory Care. When adding activities, you MUST know which calendar to use.

### Calendar Rules
- The app has a filter system with: "Both Calendars", "Assisted Living", "Memory Care"
- Each event has a wing field: 'both', 'assisted', or 'memory'
- When Amanda asks you to add an activity, you MUST respond with a clear activity plan that includes the date, time, wing assignment, activity type, and resident names

### How to Add Events to the Calendar
When Amanda asks you to create or schedule an activity, APPEND a special JSON block at the very end of your response like this:

===EVENT===
{"title": "Morning Music Circle", "start": "2025-05-02T10:00", "end": "2025-05-02T10:30", "type": "music", "description": "Sing-along with familiar show tunes using simple instruments", "wing": "memory", "residents": ["Eleanor", "Mildred"]}
===END===

### Wing Field Rules:
- If the activity is for memory care residents specifically → wing: "memory"
- If for assisted living residents → wing: "assisted"
- If for both or unclear → wing: "both"

### Activity Type Options (use the correct type value):
- music (Music)
- art (Art)
- exercise (Exercise)
- games (Games)
- outings (Outings)
- therapy (Therapy)
- custom (Custom)

### Time Format:
Always use YYYY-MM-DDTHH:MM format for start and end times.
Ask Amanda for the specific date and time if she hasn't provided it.

WHEN You add an event block, Amanda's app will automatically add it to her calendar. Always ask Amanda to confirm the details before creating the event block.

## Book List System
Amanda's Compass app also has a **Book List** feature. You can help her track books she's reading.

### How to Add Books to the Book List
When Amanda asks you to add a book, APPEND a special JSON block at the very end of your response like this:

===BOOK===
{"title": "The Name of the Wind", "author": "Patrick Rothfuss", "pages": 722}
===END===

Only include this block when Amanda explicitly asks you to add a book to her list.

### Book Stats
Amanda can ask you about her reading stats: *"Spring, how many pages did I read this month?"* — If asked about stats, check the conversation history for any book information you can infer and give a reasonable answer. Remind her she can also see detailed stats on her Books page.`
};

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// ── Canva Connect API Configuration ──
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || 'OC-AZ3qrDOJC9li';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

// Chat with DeepSeek
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, image } = req.body;

    // Build conversation context
    const messages = [SYSTEM_PROMPT];

    // Add conversation history (last 20 messages)
    if (history && history.length > 0) {
      history.slice(-20).forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || msg.message
        });
      });
    }

    // Add current user message
    const userContent = [];
    if (message) userContent.push({ type: 'text', text: message });
    if (image) {
      // image is base64 data URL
      const imageData = image.replace(/^data:image\/\w+;base64,/, '');
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageData}` }
      });
    }

    messages.push({ role: 'user', content: userContent.length > 0 ? userContent : message });

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'AI service error',
        details: errorText
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    res.json({ response: reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Image upload endpoint — saves file and returns URL
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({
    url: filePath,
    filename: req.file.filename,
    message: 'File uploaded successfully'
  });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ── Canva Autofill Export ──
// Uses OAuth 2.0 Authorization Code flow with PKCE
// Stores token in memory + a token.json file for persistence across restarts
let canvaAccessToken = null;
let canvaRefreshToken = null;
let canvaTokenExpiry = 0;
const CANVA_TOKEN_FILE = path.join(__dirname, 'canva_token.json');

// Load saved tokens on startup
function loadCanvaToken() {
  try {
    if (fs.existsSync(CANVA_TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(CANVA_TOKEN_FILE, 'utf8'));
      canvaAccessToken = data.access_token;
      canvaRefreshToken = data.refresh_token;
      canvaTokenExpiry = data.expiry || 0;
      console.log('📋 Loaded saved Canva token');
    }
  } catch (e) {
    console.warn('Could not load Canva token:', e.message);
  }
}
loadCanvaToken();

function saveCanvaToken(accessToken, refreshToken, expiresIn) {
  canvaAccessToken = accessToken;
  canvaRefreshToken = refreshToken;
  canvaTokenExpiry = Date.now() + (expiresIn || 3600) * 1000;
  try {
    fs.writeFileSync(CANVA_TOKEN_FILE, JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry: canvaTokenExpiry
    }));
  } catch (e) {
    console.warn('Could not save Canva token:', e.message);
  }
}

function getPKCEChallenge() {
  // Simple PKCE for Node.js — generate verifier and challenge
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

async function getCanvaToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (canvaAccessToken && Date.now() < canvaTokenExpiry - 300000) {
    return canvaAccessToken;
  }

  // Try refresh if we have a refresh token
  if (canvaRefreshToken) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', CANVA_CLIENT_ID);
      params.append('client_secret', CANVA_CLIENT_SECRET);
      params.append('refresh_token', canvaRefreshToken);

      const response = await fetch(CANVA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (response.ok) {
        const data = await response.json();
        saveCanvaToken(data.access_token, data.refresh_token || canvaRefreshToken, data.expires_in || 3600);
        return canvaAccessToken;
      }
    } catch (e) {
      console.warn('Canva token refresh failed:', e.message);
    }
  }

  throw new Error('Canva not authorized. Go to /api/canva/auth in your browser to authorize.');
}

// GET /api/canva/auth-url — Returns the auth URL and stores PKCE verifier
app.get('/api/canva/auth-url', (req, res) => {
  const { verifier, challenge } = getPKCEChallenge();
  canvaVerifier = verifier;
  canvaChallenge = challenge;
  const redirectUri = `http://127.0.0.1:3001/api/canva/callback`;
  const authUrl = `https://www.canva.com/api/oauth/authorize?code_challenge=${challenge}&code_challenge_method=S256&response_type=code&client_id=${CANVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=design:meta:read%20design:content:read%20design:content:write`;
  res.json({ url: authUrl });
});

let canvaVerifier = null;
let canvaChallenge = null;

// GET /api/canva/callback — Step 2: Canva redirects here after user authorizes
app.get('/api/canva/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`<h2>Authorization failed</h2><p>Error: ${error}</p><p>Close this tab and try again.</p>`);
  }

  if (!code) {
    return res.send('<h2>No authorization code received</h2>');
  }

  try {
    const redirectUri = `http://127.0.0.1:3001/api/canva/callback`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', CANVA_CLIENT_ID);
    params.append('client_secret', CANVA_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('code_verifier', canvaVerifier || '');

    const response = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      const err = await response.text();
      return res.send(`<h2>Token exchange failed</h2><p>${err}</p>`);
    }

    const data = await response.json();
    saveCanvaToken(data.access_token, data.refresh_token, data.expires_in || 3600);

    res.send(`<html><body style="background:#0f0f1a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">
      <div>
        <h1 style="color:#4A90A2">✅ Canva Connected!</h1>
        <p>Your Compass calendar is now linked to Canva.</p>
        <p>You can close this tab and use <strong>Export → Export to Canva ✨</strong> from the Calendar page.</p>
      </div>
    </body></html>`);
  } catch (err) {
    res.send(`<h2>Error</h2><p>${err.message}</p>`);
  }
});

// POST /api/canva/autofill — Push events to a Canva design template
app.post('/api/canva/autofill', async (req, res) => {
  try {
    const { designId, events } = req.body;

    if (!designId) {
      return res.status(400).json({ error: 'designId is required' });
    }
    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required' });
    }

    // Get Canva access token
    const token = await getCanvaToken();

    // Format events for Canva Autofill
    const autofillData = {
      data: {
        calendar_title: events[0]?.month || 'Monthly Calendar',
        events_table: events.map((event, idx) => ({
          row_num: idx + 1,
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
      // If 401, token expired — prompt re-auth
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Canva authorization expired',
          authUrl: `http://127.0.0.1:3001/api/canva/auth`
        });
      }
      return res.status(response.status).json({
        error: 'Canva autofill failed',
        details: responseData
      });
    }

    res.json({
      success: true,
      designUrl: responseData.design?.url || responseData.url,
      designId: responseData.design?.id || responseData.id,
      message: 'Calendar data sent to Canva successfully!'
    });
  } catch (err) {
    console.error('Canva autofill error:', err);
    res.status(500).json({ error: 'Canva integration error', details: err.message });
  }
});

// ── Contact Form Endpoint ──
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('📧 New contact form submission:');
  console.log(`  From: ${name} (${email})`);
  console.log(`  Message: ${message?.substring(0, 200)}`);
  res.json({ ok: true, message: 'Message received. We\'ll get back to you soon!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Compass API' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔄 Compass API server running on http://0.0.0.0:${PORT}`);
  if (!DEEPSEEK_API_KEY) {
    console.warn('⚠️  DEEPSEEK_API_KEY not set — AI chat will return fallback responses');
  }
});
