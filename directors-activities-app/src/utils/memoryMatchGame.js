export const MEMORY_MATCH_THEMES = [
  { id: 'animals', name: 'Animals', cards: [['Dog', '🐶'], ['Cat', '🐱'], ['Bird', '🐦'], ['Horse', '🐴'], ['Fish', '🐟'], ['Butterfly', '🦋'], ['Rabbit', '🐰'], ['Cow', '🐮']] },
  { id: 'food', name: 'Food', cards: [['Cake', '🍰'], ['Coffee', '☕'], ['Apple', '🍎'], ['Bread', '🍞'], ['Soup', '🍲'], ['Pie', '🥧'], ['Cookie', '🍪'], ['Lemonade', '🍋']] },
  { id: 'holidays', name: 'Holidays', cards: [['Tree', '🎄'], ['Pumpkin', '🎃'], ['Flag', '🇺🇸'], ['Gift', '🎁'], ['Heart', '❤️'], ['Fireworks', '🎆'], ['Bell', '🔔'], ['Star', '⭐']] },
  { id: 'music', name: 'Music', cards: [['Guitar', '🎸'], ['Piano', '🎹'], ['Microphone', '🎙️'], ['Notes', '🎵'], ['Drum', '🥁'], ['Record', '💿'], ['Radio', '📻'], ['Violin', '🎻']] },
  { id: 'garden', name: 'Garden', cards: [['Flower', '🌼'], ['Rose', '🌹'], ['Tree', '🌳'], ['Sun', '☀️'], ['Watering Can', '🚿'], ['Tomato', '🍅'], ['Butterfly', '🦋'], ['Leaf', '🍃']] },
  { id: 'classic-movies', name: 'Classic Movies', cards: [['Film', '🎞️'], ['Ticket', '🎟️'], ['Popcorn', '🍿'], ['Star', '⭐'], ['Camera', '🎥'], ['Music', '🎵'], ['Ruby Shoes', '👠'], ['Castle', '🏰']] },
  { id: 'texas', name: 'Texas', cards: [['Boot', '🥾'], ['Star', '⭐'], ['Hat', '🤠'], ['Football', '🏈'], ['Flower', '🌼'], ['Guitar', '🎸'], ['Cow', '🐮'], ['Sun', '☀️']] },
  { id: 'colors-shapes', name: 'Colors & Shapes', cards: [['Red', '🔴'], ['Blue', '🔵'], ['Green', '🟢'], ['Yellow', '🟡'], ['Square', '◼️'], ['Diamond', '🔷'], ['Heart', '❤️'], ['Star', '⭐']] },
  { id: 'everyday', name: 'Everyday Objects', cards: [['Cup', '☕'], ['Key', '🔑'], ['Phone', '☎️'], ['Book', '📖'], ['Chair', '🪑'], ['Clock', '🕰️'], ['Lamp', '💡'], ['Glasses', '👓']] },
  { id: 'travel', name: 'Travel', cards: [['Car', '🚗'], ['Bus', '🚌'], ['Plane', '✈️'], ['Train', '🚂'], ['Map', '🗺️'], ['Suitcase', '🧳'], ['Ship', '🚢'], ['Hotel', '🏨']] },
];

const difficultyPairs = { easy: 4, medium: 6, hard: 8 };

export function buildMemoryDeck(theme, difficulty = 'medium') {
  const pairCount = difficultyPairs[difficulty] || difficultyPairs.medium;
  return theme.cards.slice(0, pairCount).flatMap(([label, icon], index) => [
    { id: `${theme.id}-${index}-a`, label, icon },
    { id: `${theme.id}-${index}-b`, label, icon },
  ]);
}

export function createMemorySession({ themeId = 'animals', difficulty = 'medium', showWords = true } = {}) {
  return {
    themeId,
    difficulty,
    showWords,
    phase: 'setup',
    flippedCardIds: [],
    matchedLabels: [],
    revealAll: false,
  };
}
