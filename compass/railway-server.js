// Compass API Server - Railway ready
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
console.log(`🌱 Starting Compass API on port ${PORT}`);

// CORS - allow requests from the Compass frontend on any domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// File upload setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Environment Variables ──
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || 'OC-AZ3qrDOJC9li';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';

// ── System Prompts ──
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

## CALENDAR SYSTEM
Amanda's Compass app has TWO calendars: Assisted Living and Memory Care. When suggesting or creating activities:
- Understand which calendar to add events to
- Each event has a wing field: 'both', 'assisted', or 'memory'
- Events include title, start/end time, description, residents, type, and wing
- If Amanda asks to schedule something, append an ===EVENT=== JSON block:
===EVENT===
{"title": "Activity Name", "start": "2026-05-06T10:00:00", "end": "2026-05-06T10:30:00", "type": "music", "wing": "memory", "description": "Short description", "residents": []}
===END===

## BOOK LIST SYSTEM
Amanda tracks books she has read. Each book has title, author, and page count. She can add books directly or ask you to add them.
- When adding a book, append an ===BOOK=== JSON block:
===BOOK===
{"title": "Book Title", "author": "Author Name", "pages": 250}
===END===
- She can ask things like "Spring, add The Great Gatsby by F. Scott Fitzgerald to my book list, 180 pages"
- She may ask about her reading stats - reference the Books page in the app

## IMAGE PROCESSING
When Amanda uploads an image (bingo buck form, calendar, activity sheet, business card, etc.):
- Describe what you see in the image
- If it's a calendar or schedule, offer to add events based on what you read
- If it's a form, help her understand and fill it out
- Be thorough — she relies on your observations`;

// ── Chat endpoint ──
app.post('/api/chat', async (req, res) => {
  try {
    const { message, image, history } = req.body;

    if (!DEEPSEEK_API_KEY) {
      return res.json({
        response: "Hi Amanda! I'm Spring, your activities planning assistant. I'd love to help you plan something wonderful today! Our connection to my brain is being set up — check back soon! 🌸"
      });
    }

    // Build messages array
    const messages = [
      { role: 'system', content: BASE_SYSTEM },
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
    ];

    // Add current user message
    const userContent = [];
    if (message) userContent.push({ type: 'text', text: message });
    if (image) {
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
    res.json({
      response: "Hi! I'm Spring 🌸 I'm here to help you plan activities, manage your calendar, and track your books. I'm having a little trouble connecting right now, but I'll be back shortly!"
    });
  }
});

// ── Contact Form ──
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('📧 New contact form submission:', { name, email, message: message?.substring(0, 200) });
  res.json({ ok: true, message: 'Message received. We\'ll get back to you soon!' });
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
        redirect_uri: `http://127.0.0.1:3001/api/canva/callback`
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

app.post('/api/canva/autofill', async (req, res) => {
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

// ── Serve uploaded files ──
app.use('/uploads', express.static(uploadsDir));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Compass API', version: '1.0.0' });
});

// ── Start server ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 Compass API server running on port ${PORT}`);
  console.log(`🤖 DeepSeek: ${DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Missing API key'}`);
  console.log(`🎨 Canva: ${CANVA_CLIENT_SECRET ? '✅ Configured' : '❌ Missing client secret'}`);
});
