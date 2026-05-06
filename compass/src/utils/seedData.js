// Seed data for Compass - Memory Care Activities App
// Provides realistic demo data for Amanda to test the app

import { v4 as uuidv4 } from 'uuid';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

// Helper to create dates relative to today
function makeDate(dayOffset, hour, minute = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const seedContacts = [
  {
    id: uuidv4(),
    name: "Eleanor Whitmore",
    phone: "(555) 234-5678",
    email: "eleanor.whitmore@email.com",
    relationship: "resident",
    notes: "Loves classical music, especially Mozart. Enjoys watercolor painting. Late-stage Alzheimer's - responds well to music therapy. Favorite color is lavender.",
    tags: ["music-lover", "painting", "afternoon-preferred", "friendly"],
    createdAt: new Date(2024, 8, 15).toISOString()
  },
  {
    id: uuidv4(),
    name: "George Martinez",
    phone: "(555) 345-6789",
    email: "george.m@email.com",
    relationship: "resident",
    notes: "Retired carpenter. Enjoys woodworking and building things. Early-stage dementia. Very social, loves group games like bingo and card games. Has a great sense of humor.",
    tags: ["hands-on", "social", "games", "morning-person"],
    createdAt: new Date(2024, 7, 20).toISOString()
  },
  {
    id: uuidv4(),
    name: "Mildred Chen",
    phone: "(555) 456-7890",
    email: "mildred.chen@email.com",
    relationship: "resident",
    notes: "Former librarian. Loves reading and poetry. Moderate Alzheimer's. Enjoys gentle exercise like chair yoga. Can get anxious in noisy environments - prefers quiet activities.",
    tags: ["reading", "quiet", "yoga", "anxious-loud-noises", "morning-preferred"],
    createdAt: new Date(2024, 6, 10).toISOString()
  },
  {
    id: uuidv4(),
    name: "Harold Washington",
    phone: "(555) 567-8901",
    email: "harold.w@email.com",
    relationship: "resident",
    notes: "Retired postal worker. Very active for his age. Early-stage dementia. Loves going on walks, gardening, and any outdoor activities. Has a green thumb - helps with the garden.",
    tags: ["outdoors", "gardening", "active", "walks", "afternoon"],
    createdAt: new Date(2024, 9, 1).toISOString()
  },
  {
    id: uuidv4(),
    name: "Patricia O'Brien",
    phone: "(555) 678-9012",
    email: "patty.obrien@email.com",
    relationship: "resident",
    notes: "Former music teacher. Advanced Alzheimer's but lights up when music is playing. Loves singing along to old show tunes. Can be restless in afternoons - music soothes her.",
    tags: ["music", "singing", "show-tunes", "soothing-music"],
    createdAt: new Date(2024, 5, 5).toISOString()
  },
  {
    id: uuidv4(),
    name: "Sarah Whitmore",
    phone: "(555) 234-5679",
    email: "sarah.whitmore@email.com",
    relationship: "family",
    notes: "Eleanor Whitmore's daughter. Visits every Sunday. Very involved in her mother's care. Prefers phone calls for updates rather than emails.",
    tags: ["primary-contact", "weekly-visitor", "phone-preferred"],
    createdAt: new Date(2024, 8, 15).toISOString()
  },
  {
    id: uuidv4(),
    name: "Dr. Rachel Kim",
    phone: "(555) 789-0123",
    email: "rkim@northside-medical.com",
    relationship: "doctor",
    notes: "Geriatric specialist. Rounds on Wednesdays. Specializes in dementia care. Prefers email communication. Available for emergency consultations.",
    tags: ["geriatric", "wednesday-rounds", "email-preferred"],
    createdAt: new Date(2024, 4, 20).toISOString()
  },
  {
    id: uuidv4(),
    name: "Maria Santos",
    phone: "(555) 890-1234",
    email: "maria.santos@email.com",
    relationship: "staff",
    notes: "Certified Nursing Assistant. Works morning shift (6AM-2PM). Excellent with residents - very patient and kind. Speaks both English and Spanish. Leads the morning exercise group.",
    tags: ["cna", "morning-shift", "bilingual", "exercise-leader"],
    createdAt: new Date(2024, 3, 1).toISOString()
  }
];

export const seedEvents = [
  {
    id: uuidv4(),
    title: "Morning Stretching Circle",
    start: makeDate(0, 9, 0).toISOString(),
    end: makeDate(0, 9, 30).toISOString(),
    description: "Gentle morning stretches with Maria. Chair-based exercises suitable for all mobility levels. Music: soft instrumental.",
    residents: ["Eleanor Whitmore", "George Martinez", "Mildred Chen", "Harold Washington"],
    type: "exercise",
    color: "#8CB08C",
    wing: "both",
    createdAt: new Date(2024, 10, 1).toISOString()
  },
  {
    id: uuidv4(),
    title: "Music Therapy - Show Tunes",
    start: makeDate(0, 14, 0).toISOString(),
    end: makeDate(0, 14, 45).toISOString(),
    description: "Group sing-along featuring songs from classic musicals. Patricia O'Brien loves this session. Using the new portable speaker system.",
    residents: ["Patricia O'Brien", "Eleanor Whitmore", "George Martinez"],
    type: "music",
    color: "#D4A855",
    wing: "memory",
    createdAt: new Date(2024, 10, 1).toISOString()
  },
  {
    id: uuidv4(),
    title: "Gardening Club",
    start: makeDate(1, 10, 0).toISOString(),
    end: makeDate(1, 11, 0).toISOString(),
    description: "Planting spring bulbs in the raised garden beds. Harold's leading the group. Weather permitting - meet in the garden courtyard.",
    residents: ["Harold Washington", "Mildred Chen", "George Martinez"],
    type: "outings",
    color: "#4A90A2",
    wing: "both",
    createdAt: new Date(2024, 10, 2).toISOString()
  },
  {
    id: uuidv4(),
    title: "Watercolor Painting Session",
    start: makeDate(2, 10, 30).toISOString(),
    end: makeDate(2, 11, 30).toISOString(),
    description: "Guided watercolor painting. Theme: 'Spring Flowers'. Eleanor especially enjoys this. All supplies provided. Aprons available.",
    residents: ["Eleanor Whitmore", "Mildred Chen", "Patricia O'Brien"],
    type: "art",
    color: "#9B8EC4",
    wing: "memory",
    createdAt: new Date(2024, 10, 2).toISOString()
  },
  {
    id: uuidv4(),
    title: "Bingo & Board Games",
    start: makeDate(3, 14, 0).toISOString(),
    end: makeDate(3, 15, 30).toISOString(),
    description: "Afternoon bingo followed by board games. George loves this. Small prizes for bingo winners. Snacks provided.",
    residents: ["George Martinez", "Harold Washington", "Eleanor Whitmore"],
    type: "games",
    color: "#E88D67",
    wing: "assisted",
    createdAt: new Date(2024, 10, 3).toISOString()
  }
];

export const seedChatHistory = [
  {
    id: uuidv4(),
    role: "assistant",
    message: "👋 Welcome to Compass! I'm your activities planning assistant. You can ask me anything about:\n\n• **Activity ideas** for different stages of memory care\n• **Session planning** for groups or individuals\n• **Reminders** about resident preferences\n• **Suggestions** for engaging residents\n\nFor example, try asking: \"What activities work well for late-stage Alzheimer's residents?\" or \"Help me plan a 30-minute music session this afternoon.\"",
    timestamp: new Date().toISOString()
  }
];
