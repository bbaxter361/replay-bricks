# 🧭 Compass — Amanda's Memory Care Activities App

**Compass** is a complete resident activities management dashboard built for Amanda, the Activities Director at a retirement community with both Memory Care and Assisted Living wings.

---

## 📚 Book List Tracking

The **Books page** (`/books`) helps Amanda track her reading journey across the year.

### Features
- **Add books manually** — Click the "Add New Book" button, fill in Title, Author, and Pages, and the book is added to your list
- **Add books via AI** — Ask Spring in the AI Chat: *"Spring, add 'The Name of the Wind' by Patrick Rothfuss, 722 pages"* and Spring will automatically add it to the book list and show a confirmation message
- **Reading stats dashboard** — Four stats cards show:
  - **This Week** — pages read this calendar week
  - **This Month** — pages read this calendar month
  - **This Year** — pages read this calendar year
  - **Total Books** — total number of books finished
- **Book list display** — Each book shows the title, author, page count, date read, and who added it (Amanda or Spring)
- **Remove books** — Click the trash icon on any book to remove it from the list
- **Smart date tracking** — Books inherit the current date when added, so the stats auto-calculate

### How to Use
1. Navigate to **Books** in the sidebar
2. Click **Add New Book** and fill in the details, **or**
3. Go to **AI Chat** and tell Spring: *"Add [Title] by [Author] to my book list, [N] pages"*
4. Your reading stats update automatically

---

## 🤖 AI Chat (Spring — Your Activities Planning Assistant)

The **AI Chat page** (`/chat`) connects Amanda with **Spring**, an AI-powered expert in memory care activities planning. Spring is powered by DeepSeek AI and runs through a local backend server.

### Spring's Expertise
Spring is knowledgeable in:
- **Memory care activities** — sensory stimulation, reminiscence therapy, music therapy
- **Montessori Methods for Dementia** — activities promoting independence and dignity
- **Exercise programs** — chair yoga, seated tai chi, gentle stretching
- **Art projects** — watercolor, collage, crafts for all cognitive levels
- **Fine motor activities** — bead threading, sorting, puzzles
- **Cognitive activities** — memory games, trivia, brain training
- **Men's activity group** — woodworking, tool sorting, sports discussions
- **Music therapy** — sing-alongs, instruments, personalized playlists
- **Sensory activities** — aromatherapy, texture exploration, calm-down corners
- **Outdoor/gardening** — raised bed gardening, nature walks, bird watching

### Features
| Feature | Description |
|---------|-------------|
| **Natural chat** | Ask questions in plain English about activities, residents, or planning |
| **Suggested prompts** | Click any suggestion to instantly start a conversation |
| **Calendar integration** | Spring can create events directly on Amanda's calendar |
| **Book list integration** | Spring can add books to Amanda's reading tracker |
| **Image upload** | Share photos of supplies or spaces and Spring will offer activity ideas |
| **Wing-aware scheduling** | Spring knows about both Assisted Living and Memory Care calendars |
| **Conversation history** | Clears with a confirmation prompt — preserves context within sessions |

### How to Get Calendar Events via Chat
1. Ask Spring something like: *"Schedule a 30-minute music therapy session for memory care tomorrow at 2pm with Eleanor and Patricia"*
2. Spring will confirm the details and automatically add the event to your calendar with the correct wing assignment
3. A confirmation message appears in the chat with the event details

### How to Add Books via Chat
1. Tell Spring: *"Spring, add 'The Name of the Wind' by Patrick Rothfuss, 722 pages to my book list"*
2. Spring confirms and adds it — check the Books page to see your updated stats

### Image Upload
1. Click the 📎 attachment button next to the chat input
2. Select an image (under 10MB)
3. Type a message describing what you need (or send the image alone)
4. Spring will analyze the image and provide activity suggestions

### Running the Chat Server
```bash
# From the compass directory:
node server.js
```
The API server runs on port 3001. Chat requires a DeepSeek API key in the environment variable `DEEPSEEK_API_KEY`. If the key is not set, Spring will return a friendly fallback message asking you to start the server.

---

## 🗓️ Other Compass Features at a Glance

| Page | Description |
|------|-------------|
| **Dashboard** | Today's schedule, upcoming week events, quick contact search, recent conversations |
| **Calendar** | Full calendar with month/week/day views. Filter by Assisted Living, Memory Care, or Both. Export to PDF, CSV, iCal, or Canva |
| **Contacts** | Full contact management for residents, family members, doctors, and staff. Search by name, notes, tags, phone, or email |
| **Books** | Reading list tracker with weekly/monthly/yearly page stats |
| **AI Chat** | Spring — your AI activities planning assistant |

---

## 🚀 Quick Start

```bash
cd compass
npm install
npm run dev        # Start Vite dev server (port 5174)
node server.js     # Start API server for AI chat (port 3001)
```

The app stores all data in your browser's localStorage — no database required for the MVP.
