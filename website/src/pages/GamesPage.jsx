import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Categorized Question Banks ──
const QUESTION_CATEGORIES = {
  'lego': {
    label: '🧱 LEGO Trivia',
    emoji: '🧱',
    questions: [
      {
        question: "Name a reason people buy LEGO sets as adults",
        answers: [
          { text: "Nostalgia / Childhood memories", points: 38 },
          { text: "Stress relief / Relaxation", points: 24 },
          { text: "Investment / Profit", points: 18 },
          { text: "Creativity / Artistic expression", points: 12 },
          { text: "Building with kids / Grandkids", points: 8 },
        ],
      },
      {
        question: "Name something you'd build with a million LEGO bricks",
        answers: [
          { text: "A life-size house / Castle", points: 35 },
          { text: "A giant spaceship / Starship", points: 25 },
          { text: "A full city / Town", points: 20 },
          { text: "A replica of a famous landmark", points: 12 },
          { text: "A working car / Vehicle", points: 8 },
        ],
      },
      {
        question: "Name a LEGO theme that holds its value best",
        answers: [
          { text: "Star Wars", points: 40 },
          { text: "Modular Buildings", points: 25 },
          { text: "LEGO Ideas", points: 16 },
          { text: "Technic", points: 12 },
          { text: "Creator Expert", points: 7 },
        ],
      },
      {
        question: "Name the hardest LEGO color to find",
        answers: [
          { text: "Dark red", points: 32 },
          { text: "Dark brown", points: 26 },
          { text: "Sand green", points: 18 },
          { text: "Transparent / Clear colors", points: 14 },
          { text: "Purple", points: 10 },
        ],
      },
      {
        question: "Name a place where people display their LEGO builds",
        answers: [
          { text: "Living room / Entertainment center", points: 35 },
          { text: "Home office / Desk", points: 24 },
          { text: "Dedicated LEGO room", points: 18 },
          { text: "Shelves / Bookcase", points: 15 },
          { text: "Glass cabinet / Display case", points: 8 },
        ],
      },
      {
        question: "Name a LEGO minifigure every collector wants",
        answers: [
          { text: "Boba Fett (Cloud City)", points: 32 },
          { text: "Mr. Gold", points: 25 },
          { text: "Darth Maul (Chrome)", points: 18 },
          { text: "Original Ghostbusters", points: 15 },
          { text: "Captain Rex", points: 10 },
        ],
      },
      {
        question: "Name a way people organize their LEGO collection",
        answers: [
          { text: "By color", points: 30 },
          { text: "By set / Theme", points: 27 },
          { text: "By piece type", points: 20 },
          { text: "In drawers / Storage bins", points: 15 },
          { text: "In Ziploc bags", points: 8 },
        ],
      },
      {
        question: "Name a LEGO set that everyone seems to want",
        answers: [
          { text: "Millennium Falcon (UCS)", points: 35 },
          { text: "Titanic", points: 22 },
          { text: "Rivendell", points: 18 },
          { text: "Taj Mahal", points: 15 },
          { text: "Eiffel Tower", points: 10 },
        ],
      },
    ],
  },
  'halloween': {
    label: '🎃 Halloween',
    emoji: '🎃',
    questions: [
      {
        question: "What's the first thing you do when you see a spider?",
        answers: [
          { text: "Scream / Yell", points: 35 },
          { text: "Run away", points: 25 },
          { text: "Kill it / Squish it", points: 18 },
          { text: "Catch it / Put it outside", points: 12 },
          { text: "Ignore it", points: 10 },
        ],
      },
      {
        question: "Name a classic Halloween candy",
        answers: [
          { text: "Candy corn", points: 32 },
          { text: "Snickers", points: 24 },
          { text: "Reese's Peanut Butter Cups", points: 20 },
          { text: "Twix", points: 14 },
          { text: "Kit Kat", points: 10 },
        ],
      },
      {
        question: "Name something people carve pumpkins into",
        answers: [
          { text: "Jack-o'-lantern / Face", points: 40 },
          { text: "Cat / Black cat", points: 22 },
          { text: "Spider / Spider web", points: 16 },
          { text: "Ghost", points: 12 },
          { text: "Bat", points: 10 },
        ],
      },
      {
        question: "Name a scary movie you'd show your grandma",
        answers: [
          { text: "Hocus Pocus", points: 35 },
          { text: "The Addams Family", points: 24 },
          { text: "Casper", points: 18 },
          { text: "Beetlejuice", points: 13 },
          { text: "Halloween Town", points: 10 },
        ],
      },
      {
        question: "What's the worst thing to find in your candy bucket?",
        answers: [
          { text: "Toothbrush", points: 30 },
          { text: "Raisins / Dried fruit", points: 25 },
          { text: "Pennies / Coins", points: 18 },
          { text: "An apple", points: 15 },
          { text: "Toothpaste", points: 12 },
        ],
      },
      {
        question: "Name something you'd wear to a Halloween party",
        answers: [
          { text: "Witch costume", points: 32 },
          { text: "Ghost costume", points: 24 },
          { text: "Vampire", points: 18 },
          { text: "Zombie", points: 14 },
          { text: "Cat", points: 12 },
        ],
      },
      {
        question: "What do you say when someone scares you?",
        answers: [
          { text: "Ahh! / Scream", points: 36 },
          { text: "You scared me!", points: 25 },
          { text: "Oh my God!", points: 17 },
          { text: "Not funny!", points: 12 },
          { text: "I'm not scared", points: 10 },
        ],
      },
      {
        question: "Name a place you'd hide on Halloween",
        answers: [
          { text: "Behind a bush / Bushes", points: 30 },
          { text: "In a closet", points: 24 },
          { text: "Under the bed", points: 20 },
          { text: "Behind a tree", points: 14 },
          { text: "In the garage", points: 12 },
        ],
      },
    ],
  },
  'movies': {
    label: '🎬 Hollywood Movies',
    emoji: '🎬',
    questions: [
      {
        question: "Name a movie everyone has seen",
        answers: [
          { text: "Titanic", points: 30 },
          { text: "Star Wars", points: 24 },
          { text: "The Lion King", points: 18 },
          { text: "Forrest Gump", points: 16 },
          { text: "Home Alone", points: 12 },
        ],
      },
      {
        question: "What's the most popular movie snack?",
        answers: [
          { text: "Popcorn", points: 45 },
          { text: "Candy / Chocolate", points: 22 },
          { text: "Nachos", points: 15 },
          { text: "Soda / Pop", points: 12 },
          { text: "Hot dog", points: 6 },
        ],
      },
      {
        question: "Name an actor who voices an animated character",
        answers: [
          { text: "Tom Hanks (Woody)", points: 28 },
          { text: "Robin Williams (Genie)", points: 24 },
          { text: "Ellen DeGeneres (Dory)", points: 20 },
          { text: "Eddie Murphy (Donkey)", points: 16 },
          { text: "Mike Myers (Shrek)", points: 12 },
        ],
      },
      {
        question: "What's the best thing about going to the movies?",
        answers: [
          { text: "The popcorn", points: 32 },
          { text: "Big screen experience", points: 25 },
          { text: "Spending time with friends/family", points: 20 },
          { text: "Escaping reality", points: 13 },
          { text: "The previews / Trailers", points: 10 },
        ],
      },
      {
        question: "Name a movie that makes people cry",
        answers: [
          { text: "The Notebook", points: 32 },
          { text: "Titanic", points: 26 },
          { text: "Up (opening scene)", points: 18 },
          { text: "Marley & Me", points: 14 },
          { text: "Lion King (Mufasa's death)", points: 10 },
        ],
      },
      {
        question: "Name a famous movie quote everyone knows",
        answers: [
          { text: "\"May the Force be with you\"", points: 30 },
          { text: "\"Here's looking at you, kid\"", points: 22 },
          { text: "\"I'll be back\"", points: 20 },
          { text: "\"You can't handle the truth!\"", points: 16 },
          { text: "\"There's no place like home\"", points: 12 },
        ],
      },
      {
        question: "What's the most annoying thing at a theater?",
        answers: [
          { text: "People talking", points: 35 },
          { text: "Cell phone ringing / Texting", points: 25 },
          { text: "Kicking the seat", points: 18 },
          { text: "Loud eating / Crunching", points: 12 },
          { text: "Latecomers", points: 10 },
        ],
      },
      {
        question: "Name a movie character everyone loves",
        answers: [
          { text: "Forrest Gump", points: 28 },
          { text: "Dory (Finding Nemo)", points: 24 },
          { text: "Alladin's Genie", points: 20 },
          { text: "Indiana Jones", points: 16 },
          { text: "Mary Poppins", points: 12 },
        ],
      },
    ],
  },
  'music': {
    label: '🎵 Music Trivia',
    emoji: '🎵',
    questions: [
      {
        question: "Name a song everyone knows the words to",
        answers: [
          { text: "Happy Birthday", points: 35 },
          { text: "Bohemian Rhapsody", points: 22 },
          { text: "Sweet Caroline", points: 18 },
          { text: "Don't Stop Believin'", points: 15 },
          { text: "Twinkle Twinkle Little Star", points: 10 },
        ],
      },
      {
        question: "What's the most popular musical instrument?",
        answers: [
          { text: "Guitar", points: 35 },
          { text: "Piano / Keyboard", points: 28 },
          { text: "Drums", points: 16 },
          { text: "Violin", points: 12 },
          { text: "Saxophone", points: 9 },
        ],
      },
      {
        question: "Name a singer from the 1950s",
        answers: [
          { text: "Elvis Presley", points: 40 },
          { text: "Frank Sinatra", points: 25 },
          { text: "Chuck Berry", points: 15 },
          { text: "Buddy Holly", points: 12 },
          { text: "Ella Fitzgerald", points: 8 },
        ],
      },
      {
        question: "Name a type of music that makes you want to dance",
        answers: [
          { text: "Disco", points: 30 },
          { text: "Rock and roll", points: 24 },
          { text: "Pop", points: 20 },
          { text: "Jazz / Swing", points: 14 },
          { text: "Country", points: 12 },
        ],
      },
      {
        question: "What was the first band you loved?",
        answers: [
          { text: "The Beatles", points: 35 },
          { text: "The Jackson 5", points: 22 },
          { text: "The Beach Boys", points: 18 },
          { text: "Elvis (solo)", points: 15 },
          { text: "Queen", points: 10 },
        ],
      },
      {
        question: "Name a song that always cheers people up",
        answers: [
          { text: "Here Comes the Sun", points: 28 },
          { text: "Happy (Pharrell)", points: 24 },
          { text: "Don't Worry Be Happy", points: 20 },
          { text: "Walking on Sunshine", points: 16 },
          { text: "I Gotta Feeling", points: 12 },
        ],
      },
      {
        question: "Name a concert you'd love to attend",
        answers: [
          { text: "Taylor Swift (Eras Tour)", points: 30 },
          { text: "Beatles (if they were still here)", points: 25 },
          { text: "Elvis in Vegas", points: 18 },
          { text: "Woodstock (original)", points: 15 },
          { text: "Beyoncé", points: 12 },
        ],
      },
      {
        question: "Name a famous music group",
        answers: [
          { text: "The Beatles", points: 35 },
          { text: "The Rolling Stones", points: 22 },
          { text: "ABBA", points: 18 },
          { text: "The Supremes", points: 15 },
          { text: "Queen", points: 10 },
        ],
      },
    ],
  },
  'general': {
    label: '🤔 General Knowledge',
    emoji: '🤔',
    questions: [
      {
        question: "Name something you'd bring to a desert island",
        answers: [
          { text: "Water / Water filter", points: 35 },
          { text: "A knife", points: 22 },
          { text: "Matches / Lighter", points: 18 },
          { text: "A phone / Radio", points: 15 },
          { text: "Food", points: 10 },
        ],
      },
      {
        question: "What's the most popular pet in America?",
        answers: [
          { text: "Dog", points: 40 },
          { text: "Cat", points: 32 },
          { text: "Fish", points: 14 },
          { text: "Bird", points: 8 },
          { text: "Hamster", points: 6 },
        ],
      },
      {
        question: "Name a city everyone should visit once",
        answers: [
          { text: "Paris", points: 30 },
          { text: "New York City", points: 25 },
          { text: "Rome", points: 18 },
          { text: "London", points: 15 },
          { text: "Tokyo", points: 12 },
        ],
      },
      {
        question: "What's the best way to start your morning?",
        answers: [
          { text: "Coffee / Tea", points: 35 },
          { text: "A good breakfast", points: 24 },
          { text: "Exercise / Stretching", points: 18 },
          { text: "A shower", points: 13 },
          { text: "Reading the news", points: 10 },
        ],
      },
      {
        question: "Name something that makes people smile",
        answers: [
          { text: "A funny joke", points: 30 },
          { text: "A baby laughing", points: 25 },
          { text: "A compliment", points: 18 },
          { text: "A cute animal / Puppy", points: 15 },
          { text: "Seeing an old friend", points: 12 },
        ],
      },
      {
        question: "What's the most useful invention ever?",
        answers: [
          { text: "The wheel", points: 30 },
          { text: "Electricity / Light bulb", points: 25 },
          { text: "The internet", points: 18 },
          { text: "The printing press", points: 15 },
          { text: "Medicine / Penicillin", points: 12 },
        ],
      },
      {
        question: "Name a food everyone likes",
        answers: [
          { text: "Pizza", points: 35 },
          { text: "Ice cream", points: 24 },
          { text: "French fries", points: 18 },
          { text: "Chocolate", points: 15 },
          { text: "Bread", points: 8 },
        ],
      },
      {
        question: "What's the best thing about getting older?",
        answers: [
          { text: "Wisdom / Experience", points: 32 },
          { text: "Retirement / Free time", points: 25 },
          { text: "Grandchildren", points: 20 },
          { text: "No more homework / school", points: 13 },
          { text: "Senior discounts", points: 10 },
        ],
      },
    ],
  },
  'memory-care': {
    label: '🧩 Memory Lane',
    emoji: '🧩',
    questions: [
      {
        question: "Name a game you played as a child",
        answers: [
          { text: "Tag / Hide and seek", points: 30 },
          { text: "Marbles", points: 22 },
          { text: "Checkers / Board games", points: 20 },
          { text: "Hopscotch", points: 16 },
          { text: "Jump rope", points: 12 },
        ],
      },
      {
        question: "What was your favorite subject in school?",
        answers: [
          { text: "Art / Music", points: 30 },
          { text: "History", points: 24 },
          { text: "English / Reading", points: 20 },
          { text: "Science", points: 14 },
          { text: "Math", points: 12 },
        ],
      },
      {
        question: "Name something people used to do before cell phones",
        answers: [
          { text: "Write letters", points: 32 },
          { text: "Use a payphone", points: 24 },
          { text: "Make plans in advance", points: 20 },
          { text: "Talk face to face", points: 14 },
          { text: "Use a phone book", points: 10 },
        ],
      },
      {
        question: "What was the best decade for music?",
        answers: [
          { text: "1950s (Rock & Roll birth)", points: 28 },
          { text: "1960s (British Invasion)", points: 26 },
          { text: "1970s (Disco/Classic rock)", points: 22 },
          { text: "1980s (Pop/Michael Jackson)", points: 14 },
          { text: "1940s (Big Band/Swing)", points: 10 },
        ],
      },
      {
        question: "Name a classic TV show everyone watched",
        answers: [
          { text: "I Love Lucy", points: 30 },
          { text: "The Andy Griffith Show", points: 22 },
          { text: "M*A*S*H", points: 18 },
          { text: "Happy Days", points: 16 },
          { text: "The Golden Girls", points: 14 },
        ],
      },
      {
        question: "What's something you'd tell your younger self?",
        answers: [
          { text: "Enjoy every moment / Live in the now", points: 30 },
          { text: "Don't worry so much", points: 25 },
          { text: "Save money", points: 18 },
          { text: "Family is everything", points: 15 },
          { text: "Follow your dreams", points: 12 },
        ],
      },
      {
        question: "Name the best invention of your lifetime",
        answers: [
          { text: "Television", points: 28 },
          { text: "Microwave oven", points: 22 },
          { text: "Computer / Internet", points: 20 },
          { text: "Cell phone", points: 18 },
          { text: "Automatic washing machine", points: 12 },
        ],
      },
      {
        question: "What's the secret to a happy marriage",
        answers: [
          { text: "Communication / Talk things out", points: 30 },
          { text: "Patience", points: 24 },
          { text: "Sense of humor / Laughter", points: 20 },
          { text: "Trust / Honesty", points: 16 },
          { text: "Compromise", points: 10 },
        ],
      },
    ],
  },
  'disney': {
    label: '🏰 Disney Magic',
    emoji: '🏰',
    questions: [
      {
        question: "Name a classic Disney movie everyone loves",
        answers: [
          { text: "The Lion King", points: 32 },
          { text: "Beauty and the Beast", points: 22 },
          { text: "Snow White", points: 18 },
          { text: "Aladdin", points: 16 },
          { text: "Frozen", points: 12 },
        ],
      },
      {
        question: "Name a Disney character that makes you smile",
        answers: [
          { text: "Mickey Mouse", points: 30 },
          { text: "Goofy", points: 24 },
          { text: "Olaf", points: 20 },
          { text: "Stitch", points: 16 },
          { text: "Winnie the Pooh", points: 10 },
        ],
      },
      {
        question: "Name your favorite thing about Disney parks",
        answers: [
          { text: "The rides / Attractions", points: 32 },
          { text: "The food / Treats", points: 24 },
          { text: "The characters / Meet & greets", points: 20 },
          { text: "The parades / Fireworks", points: 14 },
          { text: "The music / Atmosphere", points: 10 },
        ],
      },
      {
        question: "Name a Disney song everyone knows the words to",
        answers: [
          { text: "Let It Go (Frozen)", points: 30 },
          { text: "Hakuna Matata (Lion King)", points: 25 },
          { text: "A Whole New World (Aladdin)", points: 20 },
          { text: "Under the Sea (Little Mermaid)", points: 15 },
          { text: "Circle of Life (Lion King)", points: 10 },
        ],
      },
      {
        question: "Name a Disney ride you'd wait in line for",
        answers: [
          { text: "Space Mountain", points: 30 },
          { text: "It's a Small World", points: 22 },
          { text: "Haunted Mansion", points: 18 },
          { text: "Pirates of the Caribbean", points: 16 },
          { text: "Splash Mountain", points: 14 },
        ],
      },
      {
        question: "Name the best Disney princess",
        answers: [
          { text: "Belle (Beauty & the Beast)", points: 28 },
          { text: "Ariel (Little Mermaid)", points: 22 },
          { text: "Moana", points: 20 },
          { text: "Cinderella", points: 18 },
          { text: "Mulan", points: 12 },
        ],
      },
      {
        question: "Name a Disney villain you love to hate",
        answers: [
          { text: "Maleficent", points: 30 },
          { text: "Ursula", points: 24 },
          { text: "Scar", points: 20 },
          { text: "Jafar", points: 14 },
          { text: "Cruella De Vil", points: 12 },
        ],
      },
      {
        question: "Name a Pixar movie that made you cry",
        answers: [
          { text: "Up", points: 32 },
          { text: "Toy Story 3", points: 25 },
          { text: "Inside Out", points: 18 },
          { text: "Coco", points: 15 },
          { text: "Finding Nemo", points: 10 },
        ],
      },
    ],
  },
};

// ── Freshness Tracking ──
const FEUD_USAGE_KEY = 'feud_question_usage';
const FEUD_FRESHNESS_DAYS = 60;

function getFreshQuestions(categoryKey, count = 8) {
  const category = QUESTION_CATEGORIES[categoryKey];
  if (!category) return [];

  const allQuestions = category.questions;
  let usageLog = [];
  try {
    const stored = localStorage.getItem(FEUD_USAGE_KEY);
    if (stored) usageLog = JSON.parse(stored);
  } catch (e) {
    usageLog = [];
  }

  const now = Date.now();
  const sixtyDays = FEUD_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

  // Filter out questions used in the last 60 days
  const fresh = allQuestions.filter(q => {
    const usage = usageLog.find(u => u.question === q.question);
    return !usage || (now - usage.usedAt > sixtyDays);
  });

  // Fallback if not enough fresh questions: use all questions (least recently used)
  const pool = fresh.length >= count ? fresh : allQuestions;

  // Randomly pick `count` from the pool, preferring fresh ones
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Record usage for selected questions
  selected.forEach(q => {
    const existing = usageLog.findIndex(u => u.question === q.question);
    if (existing >= 0) {
      usageLog[existing].usedAt = now;
    } else {
      usageLog.push({ question: q.question, usedAt: now });
    }
  });

  // Clean up stale entries for questions no longer in any category
  const allQuestionTexts = new Set();
  Object.values(QUESTION_CATEGORIES).forEach(cat => {
    cat.questions.forEach(q => allQuestionTexts.add(q.question));
  });
  usageLog = usageLog.filter(u => allQuestionTexts.has(u.question));

  try {
    localStorage.setItem(FEUD_USAGE_KEY, JSON.stringify(usageLog));
  } catch (e) {
    // localStorage might be full, silently ignore
  }

  return selected;
}

// ── Bingo ──
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const BINGO_RANGES = [1, 16, 31, 46, 61];

function generateBingoNumbers() {
  const card = [];
  for (let col = 0; col < 5; col++) {
    const nums = [];
    const min = BINGO_RANGES[col];
    const max = min + 14;
    while (nums.length < (col === 2 ? 4 : 5)) {
      const n = min + Math.floor(Math.random() * 15);
      if (!nums.includes(n)) nums.push(n);
    }
    nums.sort((a, b) => a - b);
    if (col === 2) nums.splice(2, 0, 'FREE');
    nums.forEach((n, row) => {
      card.push({ col, row, num: n, marked: false });
    });
  }
  return card;
}

function generateAll75Balls() {
  const balls = [];
  for (let col = 0; col < 5; col++) {
    const min = BINGO_RANGES[col];
    for (let n = min; n < min + 15; n++) {
      balls.push({ call: `${BINGO_LETTERS[col]}-${n}`, num: n, letter: BINGO_LETTERS[col] });
    }
  }
  return balls;
}

export default function GamesPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('menu');

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Portal</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <span className="font-anton text-lg text-white tracking-wider">REPLAY<span className="text-[#FF6B35]">.</span>BRICKS</span>
          <span className="text-xs bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-0.5 rounded-full font-medium">Games</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.name}</span>
          <button onClick={() => { onLogout(); navigate('/'); }} className="px-4 py-1.5 text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-lg transition-colors cursor-pointer">Sign Out</button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {screen === 'menu' && <GameMenu onSelect={setScreen} />}
        {screen === 'feud' && <FamilyFeud onBack={() => setScreen('menu')} />}
        {screen === 'bingo' && <BingoCaller onBack={() => setScreen('menu')} />}
      </div>
    </div>
  );
}

function GameMenu({ onSelect }) {
  return (
    <div className="max-w-3xl mx-auto">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        Memory Care Games 🎮
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-400 text-center mb-10 text-lg">
        Choose a game to play with the residents
      </motion.p>
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={() => onSelect('feud')} className="w-full text-left bg-[#1a1a2e] border border-white/10 hover:border-[#FF6B35]/50 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <div className="text-5xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold text-white mb-2">Family Feud</h2>
            <p className="text-[#FF6B35] text-sm font-medium mb-3">Survey Says!</p>
            <p className="text-gray-400 text-sm">Guess the top answers to fun survey questions. Two teams compete to name the most popular answers!</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#FF6B35] group-hover:translate-x-1 transition-transform">
              <span>Play Now</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <button onClick={() => onSelect('bingo')} className="w-full text-left bg-[#1a1a2e] border border-white/10 hover:border-[#FF6B35]/50 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <div className="text-5xl mb-4">🔢</div>
            <h2 className="text-2xl font-bold text-white mb-2">Bingo Caller</h2>
            <p className="text-[#FF6B35] text-sm font-medium mb-3">Standard 75-Ball Bingo</p>
            <p className="text-gray-400 text-sm">Vegas-style big board with auto-mark cards, flashboard display, and printable bingo cards for residents.</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#FF6B35] group-hover:translate-x-1 transition-transform">
              <span>Play Now</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// FAMILY FEUD
// ═══════════════════════════════════════════

function FamilyFeud({ onBack }) {
  // ── Category state ──
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameQuestions, setGameQuestions] = useState([]);

  // ── Setup state ──
  const [phase, setPhase] = useState('category');
  const [hostName, setHostName] = useState('Vicki');
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');

  // ── Game state ──
  const [questionIdx, setQuestionIdx] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [correctIds, setCorrectIds] = useState(new Set());
  const [strikeIds, setStrikeIds] = useState(new Set());
  const [showDecision, setShowDecision] = useState(false);
  const [stealRevealed, setStealRevealed] = useState(false);
  const [stealSuccess, setStealSuccess] = useState(null);
  const [lastAnimIdx, setLastAnimIdx] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [showRedX, setShowRedX] = useState(false);

  const teams = [team1Name || 'Team 1', team2Name || 'Team 2'];
  const teamColors = ['#FFD700', '#4FC3F7'];
  const teamBgClasses = ['bg-yellow-500/20 border-yellow-500/40', 'bg-blue-500/20 border-blue-500/40'];
  const teamBorderGlows = ['shadow-yellow-500/30', 'shadow-blue-500/30'];
  const q = gameQuestions[questionIdx];
  const totalAnswers = q?.answers?.length || 0;
  const isAllRevealed = revealedCount >= totalAnswers;

  // Compute points earned so far this round for the current team
  const roundPoints = q ? [...correctIds].reduce((sum, idx) => sum + q.answers[idx].points, 0) : 0;
  const totalRoundPoints = q ? q.answers.reduce((sum, a) => sum + a.points, 0) : 0;

  // ── Handlers ──

  const startGame = () => {
    const freshQuestions = getFreshQuestions(selectedCategory, 8);
    setGameQuestions(freshQuestions);
    setPhase('playing');
    setQuestionIdx(0);
    setRevealedCount(0);
    setScores([0, 0]);
    setCurrentTeam(0);
    setStrikes(0);
    setCorrectIds(new Set());
    setStrikeIds(new Set());
    setShowDecision(false);
    setStealRevealed(false);
    setStealSuccess(null);
    setLastAnimIdx(null);
    setAnswerInput('');
    setShowRedX(false);
  };

  const revealNextAnswer = () => {
    if (revealedCount < totalAnswers) {
      setRevealedCount(prev => prev + 1);
      setLastAnimIdx(revealedCount);
      setShowDecision(true);
      setAnswerInput('');
    }
  };

  const handleSubmitAnswer = () => {
    const input = answerInput.trim().toLowerCase();
    if (!input) return;

    // First reveal the next answer
    const nextIdx = revealedCount;
    if (nextIdx >= totalAnswers) return;

    setRevealedCount(prev => prev + 1);
    setLastAnimIdx(nextIdx);

    // Check if input matches the just-revealed answer (substring match, case-insensitive)
    const match = q.answers[nextIdx].text.toLowerCase().includes(input);

    if (match) {
      // Correct! — green flash, add points
      setCorrectIds(prev => new Set([...prev, nextIdx]));
      setScores(prev => {
        const next = [...prev];
        next[currentTeam] += q.answers[nextIdx].points;
        return next;
      });
      setLastAnimIdx(null);
      setAnswerInput('');
    } else {
      // Wrong — show big red X, count as strike after 1 second
      setShowRedX(true);
      setAnswerInput('');
      const newStrikes = strikes + 1;
      setTimeout(() => {
        setShowRedX(false);
        setStrikeIds(prev => new Set([...prev, nextIdx]));
        setStrikes(newStrikes);
        setLastAnimIdx(null);
        if (newStrikes >= 3) {
          setPhase('stealing');
          setStealRevealed(false);
          setStealSuccess(null);
        }
      }, 1000);
    }
  };

  const handleStealReveal = () => {
    setStealRevealed(true);
  };

  const handleStealSuccess = () => {
    // Stealing team gets ALL points from this question
    setStealSuccess(true);
    const stealTeam = currentTeam === 0 ? 1 : 0;
    setScores(prev => {
      const next = [...prev];
      next[stealTeam] += roundPoints;
      return next;
    });
  };

  const handleStealFail = () => {
    setStealSuccess(false);
  };

  const handleNextQuestion = () => {
    if (questionIdx < gameQuestions.length - 1) {
      setQuestionIdx(prev => prev + 1);
      setRevealedCount(0);
      setCorrectIds(new Set());
      setStrikeIds(new Set());
      setStrikes(0);
      setShowDecision(false);
      setStealRevealed(false);
      setStealSuccess(null);
      setLastAnimIdx(null);
      setAnswerInput('');
      setShowRedX(false);
      // Switch which team starts the next question
      setCurrentTeam(prev => prev === 0 ? 1 : 0);
      setPhase('playing');
    } else {
      setPhase('game_over');
    }
  };

  const resetGame = () => {
    setPhase('category');
    setSelectedCategory(null);
    setGameQuestions([]);
    setQuestionIdx(0);
    setRevealedCount(0);
    setScores([0, 0]);
    setCurrentTeam(0);
    setStrikes(0);
    setCorrectIds(new Set());
    setStrikeIds(new Set());
    setShowDecision(false);
    setStealRevealed(false);
    setStealSuccess(null);
    setLastAnimIdx(null);
    setAnswerInput('');
    setShowRedX(false);
  };

  const backToMenu = () => {
    resetGame();
    onBack();
  };

  // ── CATEGORY PICKER SCREEN ──
  if (phase === 'category') {
    const categoryKeys = Object.keys(QUESTION_CATEGORIES);
    const categoryBorders = [
      'border-yellow-500/40 hover:border-yellow-400 shadow-yellow-500/20',
      'border-orange-500/40 hover:border-orange-400 shadow-orange-500/20',
      'border-blue-500/40 hover:border-blue-400 shadow-blue-500/20',
      'border-green-500/40 hover:border-green-400 shadow-green-500/20',
      'border-purple-500/40 hover:border-purple-400 shadow-purple-500/20',
      'border-pink-500/40 hover:border-pink-400 shadow-pink-500/20',
    ];
    const categoryLetters = [
      'from-yellow-500 to-yellow-600',
      'from-orange-500 to-orange-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
    ];

    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={backToMenu} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="text-5xl mb-3">🎤</div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 tracking-tight drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            FAMILY FEUD
          </h1>
          <p className="text-gray-400 text-lg mt-2">Choose a Category!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryKeys.map((key, idx) => {
            const cat = QUESTION_CATEGORIES[key];
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedCategory(key);
                  setPhase('setup');
                }}
                className={`relative bg-[#1a1a2e] border-2 ${categoryBorders[idx % categoryBorders.length]} rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl group`}
              >
                <div className="text-5xl mb-3">{cat.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
                <p className="text-gray-500 text-sm">{cat.questions.length} questions</p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r ${categoryLetters[idx % categoryLetters.length]}`}>
                    SELECT →
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SETUP SCREEN ──
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={backToMenu} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 tracking-tight drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            FAMILY FEUD
          </h1>
          <p className="text-[#FF6B35] text-lg font-semibold mt-1 uppercase tracking-[0.2em]">TV Game Show</p>
        </motion.div>

        {/* Spotlight effect */}
        <div className="relative mb-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative bg-[#1a1a2e]/80 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Host Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <span>🎤</span> Host Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={e => setHostName(e.target.value)}
                placeholder="Enter host name"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all"
              />
            </div>

            {/* Team 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <span>🔴</span> Team 1 Name
              </label>
              <input
                type="text"
                value={team1Name}
                onChange={e => setTeam1Name(e.target.value)}
                placeholder="Enter Team 1 name"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-yellow-500/20 rounded-xl text-white text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all"
              />
            </div>

            {/* Team 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <span>🔵</span> Team 2 Name
              </label>
              <input
                type="text"
                value={team2Name}
                onChange={e => setTeam2Name(e.target.value)}
                placeholder="Enter Team 2 name"
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-blue-400/20 rounded-xl text-white text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all"
              />
            </div>
          </div>
        </div>

        <motion.button
          onClick={startGame}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-2xl rounded-2xl shadow-xl shadow-red-600/30 transition-all cursor-pointer tracking-wider"
        >
          🎬 START GAME →
        </motion.button>

        <p className="text-gray-600 text-xs text-center mt-4">
          Press START to begin the TV game show experience
        </p>
      </div>
    );
  }

  // ── GAME OVER SCREEN ──
  if (phase === 'game_over') {
    const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
    const winnerName = winner >= 0 ? teams[winner] : null;
    return (
      <div className="max-w-lg mx-auto">
        <button onClick={backToMenu} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-2">
            GAME OVER
          </h2>
          {winner >= 0 ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-white mb-6"
            >
              🎉 {winnerName} Wins! 🎉
            </motion.p>
          ) : (
            <p className="text-2xl font-bold text-white mb-6">It's a Tie!</p>
          )}

          {/* Final scores */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#1a1a2e] border border-yellow-500/30 rounded-2xl p-6">
              <p className="text-yellow-400 text-sm font-semibold mb-1">{teams[0]}</p>
              <p className="text-4xl font-black text-white">{scores[0]}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-blue-400/30 rounded-2xl p-6">
              <p className="text-blue-400 text-sm font-semibold mb-1">{teams[1]}</p>
              <p className="text-4xl font-black text-white">{scores[1]}</p>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-xl rounded-2xl shadow-xl shadow-yellow-500/30 hover:scale-105 transition-all cursor-pointer"
          >
            🔄 Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ── GAME PLAYING SCREEN (including steal phase) ──
  const isStealPhase = phase === 'stealing';
  const revealAllForSteal = isStealPhase && stealRevealed;
  const team1Active = !isStealPhase && currentTeam === 0;
  const team2Active = !isStealPhase && currentTeam === 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button + Host show */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={backToMenu} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="text-xs text-gray-500 font-medium">
          🎤 Host: <span className="text-yellow-400">{hostName}</span>
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Team 1 */}
        <motion.div
          animate={team1Active ? { scale: 1.03 } : { scale: 1 }}
          className={`relative rounded-xl p-4 border-2 transition-all duration-300 ${
            team1Active
              ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-400/60 shadow-lg shadow-yellow-500/20'
              : 'bg-[#1a1a2e]/60 border-white/10'
          }`}
        >
          {team1Active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full"
            >
              Playing
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" />
            <p className="text-sm font-bold text-yellow-300 truncate">{teams[0]}</p>
          </div>
          <motion.p
            key={scores[0]}
            initial={{ scale: 1.3, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black text-white mt-1"
          >
            {scores[0]}
          </motion.p>
        </motion.div>

        {/* Team 2 */}
        <motion.div
          animate={team2Active ? { scale: 1.03 } : { scale: 1 }}
          className={`relative rounded-xl p-4 border-2 transition-all duration-300 ${
            team2Active
              ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-400/60 shadow-lg shadow-blue-500/20'
              : 'bg-[#1a1a2e]/60 border-white/10'
          }`}
        >
          {team2Active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full"
            >
              Playing
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
            <p className="text-sm font-bold text-blue-300 truncate">{teams[1]}</p>
          </div>
          <motion.p
            key={scores[1]}
            initial={{ scale: 1.3, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black text-white mt-1"
          >
            {scores[1]}
          </motion.p>
        </motion.div>
      </div>

      {/* ── STEAL BANNER ── */}
      <AnimatePresence>
        {isStealPhase && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-xl p-3 mb-4 text-center shadow-xl shadow-red-600/40 border border-red-400/50"
          >
            <div className="text-xs uppercase tracking-[0.25em] text-red-200 font-semibold">⚡ Steal Opportunity ⚡</div>
            <p className="text-lg font-black text-white mt-0.5">
              {teams[currentTeam === 0 ? 1 : 0]}, you have <span className="text-yellow-300">ONE</span> chance to steal!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Question Display ── */}
      <motion.div
        key={questionIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border-2 border-white/10 rounded-2xl p-6 mb-5 relative overflow-hidden"
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-blue-500" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold">
            Question {questionIdx + 1} of {gameQuestions.length}
          </span>
          <div className="mt-3 mb-1">
            <span className="text-yellow-400 text-xl font-bold italic drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">
              {hostName}: &ldquo;{(() => {
                const catLabels = {
                  'lego': 'We surveyed 100 LEGO fans...',
                  'halloween': 'We asked 100 Halloween lovers...',
                  'movies': 'We polled 100 movie fans...',
                  'music': 'We surveyed 100 music lovers...',
                  'general': 'We asked 100 people...',
                  'memory-care': 'We asked 100 seniors...',
                  'disney': 'We asked 100 Disney fans...',
                };
                return catLabels[selectedCategory] || 'We surveyed 100 people...';
              })()}&rdquo;
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
            &ldquo;{q.question}&rdquo;
          </h2>
          {(revealedCount > 0 || isStealPhase) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400 text-lg mt-2 font-bold uppercase tracking-[0.15em] drop-shadow-[0_0_6px_rgba(255,215,0,0.3)]"
            >
              {isStealPhase ? '...Stealing team, what do you think?' : '...Survey says!'}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* ── Strikes Indicator ── */}
      {!isStealPhase && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mr-1">Strikes:</span>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={i < strikes ? { scale: 0 } : { scale: 1 }}
              animate={i < strikes ? { scale: [0, 1.3, 1], rotate: [0, -10, 0] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                i < strikes
                  ? 'bg-red-600/30 border-red-500/60 text-red-400 shadow-sm shadow-red-500/30'
                  : 'bg-[#1a1a2e]/50 border-white/10 text-gray-600'
              }`}
            >
              {i < strikes ? '✗' : '○'}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Answer Board ── */}
      <div className="space-y-2.5 mb-5">
        {q.answers.map((answer, i) => {
          const isRevealed = i < revealedCount || (isStealPhase && stealRevealed && i >= revealedCount) || (isStealPhase && i < revealedCount);
          const showFull = isRevealed || (isStealPhase && stealRevealed);
          const isCorrect = correctIds.has(i);
          const isStrike = strikeIds.has(i);
          const isLastRevealed = i === lastAnimIdx;
          const isHiddenSteal = isStealPhase && !stealRevealed && i >= revealedCount;

          return (
            <motion.div
              key={i}
              initial={isLastRevealed ? { scale: 0.7, opacity: 0, y: -10 } : false}
              animate={isLastRevealed ? { scale: 1, opacity: 1, y: 0 } : {}}
              transition={isLastRevealed ? { type: 'spring', stiffness: 300, damping: 20, delay: 0.1 } : {}}
              className={`
                relative rounded-xl px-5 py-3.5 border-2 transition-all duration-500
                ${isHiddenSteal
                  ? 'bg-gradient-to-r from-red-900/40 to-red-800/20 border-red-500/40 animate-pulse'
                  : showFull
                    ? isCorrect
                      ? 'bg-gradient-to-r from-green-900/40 to-green-800/20 border-green-500/40 shadow-lg shadow-green-500/10'
                      : isStrike
                        ? 'bg-gradient-to-r from-red-900/30 to-red-800/15 border-red-500/30'
                        : isStealPhase && stealRevealed && i >= revealedCount
                          ? 'bg-gradient-to-r from-green-900/50 to-green-800/30 border-green-400/60 shadow-lg shadow-green-400/20'
                          : 'bg-[#0f0f1a]/80 border-white/10'
                    : 'bg-[#0f0f1a]/30 border-white/5'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Answer number badge */}
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isHiddenSteal
                      ? 'bg-red-600/30 text-red-400 border border-red-500/40'
                      : showFull
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-gray-600 border border-white/10'
                  }`}>
                    {showFull ? i + 1 : '?'}
                  </span>

                  {/* Answer text or hidden */}
                  <span className={`text-lg md:text-xl font-bold truncate ${
                    isHiddenSteal
                      ? 'text-red-300'
                      : showFull
                        ? 'text-white'
                        : 'text-gray-600'
                  }`}>
                    {isHiddenSteal ? (
                      <span className="tracking-[0.3em]">???</span>
                    ) : showFull ? (
                      answer.text
                    ) : (
                      <span className="tracking-[0.3em]">• • • • •</span>
                    )}
                  </span>
                </div>

                {/* Points badge / Strike mark */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isHiddenSteal ? (
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider bg-red-600/20 px-2 py-1 rounded-lg">
                      Steal?
                    </span>
                  ) : showFull ? (
                    isStrike ? (
                      <span className="text-sm font-bold text-red-400 bg-red-600/20 px-2 py-1 rounded-lg">✗ STRIKE</span>
                    ) : (
                      <motion.span
                        initial={isLastRevealed ? { scale: 1.5, opacity: 0 } : {}}
                        animate={isLastRevealed ? { scale: 1, opacity: 1 } : {}}
                        className={`text-base md:text-lg font-black ${
                          isCorrect ? 'text-green-400' : 'text-yellow-400'
                        }`}
                      >
                        {answer.points}
                      </motion.span>
                    )
                  ) : (
                    <span className="text-gray-600 text-sm font-mono">---</span>
                  )}
                </div>
              </div>

              {/* "Ding" flash effect on reveal */}
              {isLastRevealed && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-transparent to-transparent rounded-xl pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Control Buttons ── */}
      <div className="space-y-3">
        {isStealPhase && !stealRevealed && (
          <motion.button
            onClick={handleStealReveal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xl rounded-2xl shadow-xl shadow-red-600/40 transition-all cursor-pointer tracking-wider"
          >
            🎯 STEAL ATTEMPT
          </motion.button>
        )}

        {isStealPhase && stealRevealed && stealSuccess === null && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStealSuccess}
              className="py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-600/30 transition-all cursor-pointer"
            >
              ✓ Steal Successful!
            </button>
            <button
              onClick={handleStealFail}
              className="py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              ✗ Steal Failed
            </button>
          </div>
        )}

        {isStealPhase && stealSuccess !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {stealSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-gradient-to-r from-green-600/30 to-green-500/20 border border-green-400/40 rounded-2xl p-5 mb-3"
              >
                <div className="text-3xl mb-1">🎉🎉🎉</div>
                <p className="text-green-300 font-bold text-lg">
                  {teams[currentTeam === 0 ? 1 : 0]} STEALS {roundPoints} POINTS!
                </p>
              </motion.div>
            ) : (
              <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-400/30 rounded-2xl p-5 mb-3">
                <div className="text-3xl mb-1">😅</div>
                <p className="text-red-300 font-bold text-lg">
                  Steal failed! {teams[currentTeam]} keeps {roundPoints} points!
                </p>
              </div>
            )}
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-black text-xl rounded-2xl shadow-xl shadow-yellow-500/30 transition-all cursor-pointer mt-2"
            >
              {questionIdx < gameQuestions.length - 1 ? 'Next Question →' : '🏆 See Final Scores'}
            </button>
          </motion.div>
        )}

        {!isStealPhase && revealedCount < totalAnswers && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-center text-gray-400 text-sm font-medium">
              Type what {teams[currentTeam]} said then press Submit
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitAnswer(); }}
                placeholder="Type what the team said..."
                className="flex-1 px-5 py-4 bg-[#0f0f1a] border-2 border-white/20 rounded-2xl text-white text-xl font-bold placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
              <motion.button
                onClick={handleSubmitAnswer}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-black text-xl rounded-2xl shadow-xl shadow-yellow-500/40 transition-all cursor-pointer tracking-wider flex-shrink-0"
              >
                SUBMIT ANSWER →
              </motion.button>
            </div>
          </motion.div>
        )}

        {!isStealPhase && revealedCount >= totalAnswers && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-green-600/20 to-green-500/10 border border-green-400/30 rounded-2xl p-4 mb-3">
              <p className="text-green-300 font-bold text-lg">
                {teams[currentTeam]} earned {roundPoints} points this round!
              </p>
            </div>
            <button
              onClick={handleNextQuestion}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-black text-xl rounded-2xl shadow-xl shadow-yellow-500/30 transition-all cursor-pointer"
            >
              {questionIdx < gameQuestions.length - 1 ? 'Next Question →' : '🏆 See Final Scores'}
            </button>
          </motion.div>
        )}

        {!isStealPhase && strikes > 0 && revealedCount < totalAnswers && (
          <p className="text-center text-gray-500 text-xs mt-1">
            Type the answer and press Submit
          </p>
        )}
      </div>

      {/* ── Full-screen Red X Overlay ── */}
      <AnimatePresence>
        {showRedX && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-[25vw] font-black text-red-500 select-none"
              style={{ textShadow: '0 0 60px rgba(255,0,0,0.7), 0 0 120px rgba(255,0,0,0.4), 0 0 200px rgba(255,0,0,0.2)' }}
            >
              ✗
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════
// BINGO CALLER — Vegas-Style 75-Ball Bingo
// ═══════════════════════════════════════════

function BingoCaller({ onBack }) {
  const [balls] = useState(() => generateAll75Balls());
  const [called, setCalled] = useState([]);
  const [currentBall, setCurrentBall] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [bingoCard, setBingoCard] = useState(null);
  const [bingoResult, setBingoResult] = useState(null);

  // ── Auto-mark called numbers on bingo card ──
  useEffect(() => {
    if (!bingoCard || called.length === 0) return;
    setBingoCard(prev => {
      if (!prev) return prev;
      let changed = false;
      const updated = prev.map(cell => {
        if (cell.marked) return cell;
        if (cell.num === 'FREE') {
          changed = true;
          return { ...cell, marked: true };
        }
        const cellLetter = BINGO_LETTERS[cell.col];
        const wasCalled = called.some(c => c.letter === cellLetter && c.num === cell.num);
        if (wasCalled) {
          changed = true;
          return { ...cell, marked: true };
        }
        return cell;
      });
      return changed ? updated : prev;
    });
    setBingoResult(null);
  }, [called]);

  // ── Call next number (instant, no countdown) ──
  const callNext = () => {
    const available = balls.filter(b => !called.find(c => c.call === b.call));
    if (available.length === 0) return;

    const pick = available[Math.floor(Math.random() * available.length)];
    setCalled(prev => [pick, ...prev]);
    setCurrentBall(pick);
  };

  // ── New game ──
  const newGame = () => {
    setCalled([]);
    setCurrentBall(null);
    setBingoCard(null);
    setShowCard(false);
    setBingoResult(null);
  };

  // ── Generate bingo card ──
  const generateCard = () => {
    const card = generateBingoNumbers();
    const marked = card.map(cell => {
      if (cell.num === 'FREE') return { ...cell, marked: true };
      const cellLetter = BINGO_LETTERS[cell.col];
      const wasCalled = called.some(c => c.letter === cellLetter && c.num === cell.num);
      return { ...cell, marked: wasCalled };
    });
    setBingoCard(marked);
    setShowCard(true);
    setBingoResult(null);
  };

  // ── Manual toggle mark ──
  const toggleMark = (idx) => {
    if (!bingoCard) return;
    const newCard = [...bingoCard];
    if (newCard[idx].num !== 'FREE') {
      newCard[idx] = { ...newCard[idx], marked: !newCard[idx].marked };
    }
    setBingoCard(newCard);
    setBingoResult(null);
  };

  // ── Check for Bingo ──
  const checkBingo = () => {
    if (!bingoCard) return;
    const lines = [];

    for (let row = 0; row < 5; row++) {
      const cells = [];
      for (let col = 0; col < 5; col++) cells.push(row * 5 + col);
      if (cells.every(idx => bingoCard[idx].marked)) lines.push({ type: 'row', index: row, cells });
    }

    for (let col = 0; col < 5; col++) {
      const cells = [];
      for (let row = 0; row < 5; row++) cells.push(row * 5 + col);
      if (cells.every(idx => bingoCard[idx].marked)) lines.push({ type: 'col', index: col, cells });
    }

    const diag1 = [0, 6, 12, 18, 24];
    if (diag1.every(idx => bingoCard[idx].marked)) lines.push({ type: 'diag', index: 0, cells: diag1 });

    const diag2 = [4, 8, 12, 16, 20];
    if (diag2.every(idx => bingoCard[idx].marked)) lines.push({ type: 'diag', index: 1, cells: diag2 });

    setBingoResult({ hasBingo: lines.length > 0, lines });
  };

  const cardNum = (n) => n === 'FREE' ? '★' : n;
  const gamesPlayed = called.length;
  const isGameOver = gamesPlayed >= 75;

  const isWinningCell = (idx) => {
    if (!bingoResult?.lines) return false;
    return bingoResult.lines.some(line => line.cells.includes(idx));
  };

  // ── Styles for print ──
  const printStyles = `@media print{body *{visibility:hidden!important}#bingo-card-printable,#bingo-card-printable *{visibility:visible!important}#bingo-card-printable{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:90%!important;max-width:500px!important}.no-print,.no-print *{display:none!important}}`;

  // ═══════════════════════════════════════════
  // SINGLE-SCREEN TV DISPLAY LAYOUT
  // ═══════════════════════════════════════════

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#08080f] via-[#0f0f1a] to-[#08080f] overflow-hidden">
      <style>{printStyles}</style>

      {/* ── Top bar: Back + My Card ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 md:px-6 md:py-3 z-20">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs md:text-sm cursor-pointer">
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] md:text-xs text-gray-600 font-mono">{gamesPlayed}/75</span>
          <button
            onClick={() => { if (!bingoCard) generateCard(); else setShowCard(s => !s); }}
            className="no-print px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-[#1a1a2e] border border-white/10 hover:border-white/30 text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            {showCard ? '✕ Close Card' : '🎴 My Card'}
          </button>
        </div>
      </div>

      {/* ── Current Ball Display ── */}
      <div className="flex-shrink-0 px-4 md:px-6 mb-0.5">
        <div className="text-center">
          {currentBall ? (
            <motion.div
              key={currentBall.call}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              className="inline-flex items-baseline gap-3 md:gap-5"
            >
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                {currentBall.letter}
              </span>
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#FF6B35] drop-shadow-[0_0_25px_rgba(255,107,53,0.6)]">
                {currentBall.num}
              </span>
            </motion.div>
          ) : (
            <div className="text-lg md:text-xl text-gray-700 font-semibold tracking-wide">
              Ready to Play
            </div>
          )}
        </div>
      </div>

      {/* ── Vegas Big Board (flex-1 fills remaining space) ── */}
      <div className="flex-1 min-h-0 px-1 md:px-4 pb-1 md:pb-2">
        <div className="h-full bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] border border-[#FF6B35]/15 rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-2xl">
          <div className="grid grid-cols-5 gap-[1px] md:gap-0.5 h-full content-stretch"
               style={{ gridTemplateRows: 'auto repeat(15, 1fr)' }}>
            {/* Column Headers — rainbow colors */}
            {BINGO_LETTERS.map((letter, i) => {
              const colors = [
                'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]',
                'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]',
                'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]',
                'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]',
                'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]',
              ];
              return (
                <div key={`hdr-${letter}`}
                     className={`text-center font-black text-sm sm:text-base md:text-xl lg:text-2xl ${colors[i]} py-0.5 md:py-1 tracking-widest leading-none flex items-center justify-center`}>
                  {letter}
                </div>
              );
            })}
            {/* Number grid: 15 rows × 5 columns - dynamic fill */}
            {Array.from({ length: 15 }, (_, row) =>
              BINGO_LETTERS.map((letter, col) => {
                const num = BINGO_RANGES[col] + row;
                const isCalled = called.some(c => c.letter === letter && c.num === num);
                const isCurrent = currentBall && currentBall.letter === letter && currentBall.num === num;
                return (
                  <div
                    key={`${letter}-${num}`}
                    className={`
                      flex items-center justify-center rounded-sm
                      text-[clamp(8px,2vw,18px)] font-bold leading-none
                      transition-all duration-200
                      ${isCurrent
                        ? 'bg-gradient-to-br from-[#FF6B35] to-[#ff4500] text-white shadow-lg shadow-[#FF6B35]/80 scale-110 z-10 ring-1 ring-yellow-300/50'
                        : isCalled
                          ? 'bg-gradient-to-br from-[#FF6B35]/35 to-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 shadow-sm shadow-[#FF6B35]/10'
                          : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] text-gray-700 border border-white/[0.04]'
                      }
                    `}
                  >
                    {num}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 flex items-center justify-center gap-3 md:gap-4 z-20">
        <button
          onClick={callNext}
          disabled={isGameOver}
          className="px-6 py-3 md:px-10 md:py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#e05a2a] hover:from-[#e05a2a] hover:to-[#cc4f1f] text-white font-bold text-base md:text-lg rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#FF6B35]/30 active:scale-95"
        >
          {isGameOver ? '🏁 Game Over' : '🎰 Call Next Number'}
        </button>
        <button
          onClick={newGame}
          className="px-5 py-3 md:px-8 md:py-3.5 bg-[#1a1a2e] border border-white/10 hover:border-white/30 text-white font-semibold text-sm md:text-base rounded-xl transition-all cursor-pointer active:scale-95"
        >
          🔄 New Game
        </button>
      </div>

      {/* ── Game Over Banner (overlay at bottom) ── */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF6B35]/90 to-[#e05a2a]/90 text-white px-5 py-2.5 rounded-xl shadow-2xl shadow-[#FF6B35]/40 text-sm md:text-base font-bold z-30"
        >
          🏁 All 75 balls called! Start a new game.
        </motion.div>
      )}

      {/* ── Bingo Card Overlay ── */}
      <AnimatePresence>
        {bingoCard && showCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCard(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-5 md:p-6 shadow-2xl max-w-sm w-full mx-auto"
              id="bingo-card-printable"
              onClick={e => e.stopPropagation()}
            >
              {/* Card header */}
              <div className="text-center mb-3">
                <h3 className="text-2xl md:text-3xl font-black tracking-[0.15em] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  BINGO
                </h3>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Replay Bricks</p>
              </div>

              {/* Bingo result */}
              {bingoResult && (
                <div className={`text-center mb-2 py-1.5 px-2.5 rounded-lg font-bold text-xs ${
                  bingoResult.hasBingo
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {bingoResult.hasBingo
                    ? `🎉 BINGO! ${bingoResult.lines.length} line${bingoResult.lines.length > 1 ? 's' : ''}!`
                    : '❌ No bingo yet'}
                </div>
              )}

              {/* 5×5 Grid */}
              <div className="grid grid-cols-5 gap-0.5">
                {['B','I','N','G','O'].map((l, i) => {
                  const colColors = ['text-red-500','text-yellow-500','text-green-500','text-blue-500','text-purple-500'];
                  return <div key={l} className={`text-center font-black text-base ${colColors[i]} py-0.5`}>{l}</div>;
                })}
                {bingoCard.map((cell, idx) => {
                  const winning = isWinningCell(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleMark(idx)}
                      className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-bold rounded transition-all cursor-pointer ${
                        winning
                          ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-1 animate-pulse'
                          : cell.marked || cell.num === 'FREE'
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {cardNum(cell.num)}
                    </button>
                  );
                })}
              </div>

              {/* Card controls */}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <button onClick={checkBingo} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer">
                  ✅ Check
                </button>
                <button onClick={() => { setTimeout(() => window.print(), 100); }} className="px-3 py-1.5 bg-[#1a1a2e] border border-white/20 text-gray-700 hover:text-gray-900 rounded-lg text-xs transition-all cursor-pointer">
                  🖨️ Print
                </button>
                <button onClick={generateCard} className="px-3 py-1.5 bg-[#1a1a2e] border border-white/20 text-gray-700 hover:text-gray-900 rounded-lg text-xs transition-all cursor-pointer">
                  🎴 New
                </button>
                <button onClick={() => setShowCard(false)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition-all cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
