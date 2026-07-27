export const GAME_LIBRARY = [
  {
    id: 'bingo-caller',
    name: 'Bingo Caller',
    type: 'caller',
    description: 'Large TV-ready bingo caller with host controls.',
    hostPath: '/app/games/bingo-caller',
    tvPath: '/app/games/bingo-caller/tv',
    theme: 'bingo-night',
  },
  {
    id: 'family-feud',
    name: 'Family Feud',
    type: 'survey',
    description: 'Reveal survey answers one at a time for group play.',
    hostPath: '/app/games/family-feud',
    tvPath: '/app/games/family-feud/tv',
    theme: 'survey-stage',
  },
  {
    id: 'music-trivia-bingo',
    name: 'Music Trivia Bingo',
    type: 'music',
    description: 'Call familiar music prompts and mark the round as Amanda hosts.',
    hostPath: '/app/games/music-trivia-bingo',
    tvPath: '/app/games/music-trivia-bingo/tv',
    theme: 'jukebox',
  },
  {
    id: 'jeopardy-trivia',
    name: 'Jeopardy Trivia',
    type: 'trivia-board',
    description: 'Customizable category board with revealable answers.',
    hostPath: '/app/games/jeopardy-trivia',
    tvPath: '/app/games/jeopardy-trivia/tv',
    theme: 'quiz-board',
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    type: 'matching',
    description: 'Simple matching game with large cards for TV display.',
    hostPath: '/app/games/memory-match',
    tvPath: '/app/games/memory-match/tv',
    theme: 'picture-cards',
  },
];

export function getGameById(gameId) {
  return GAME_LIBRARY.find((game) => game.id === gameId) || GAME_LIBRARY[0];
}
