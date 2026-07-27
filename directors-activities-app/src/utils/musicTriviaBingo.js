const musicThemes = [
  ['fifties', '50s Classics'],
  ['sixties', '60s Classics'],
  ['seventies', '70s Music'],
  ['country', 'Country Classics'],
  ['elvis', 'Elvis'],
  ['hymns', 'Hymns'],
  ['patriotic', 'Patriotic Songs'],
  ['movie-musicals', 'Movie Musicals'],
  ['christmas', 'Christmas Songs'],
  ['love-songs', 'Love Songs'],
];

function promptsFor(name) {
  return Array.from({ length: 30 }, (_, index) => ({
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
    label: `${name} prompt ${index + 1}`,
    hint: `Ask residents to name or sing a ${name.toLowerCase()} favorite.`,
  }));
}

export const MUSIC_BINGO_PACKS = musicThemes.map(([id, name]) => ({
  id,
  name,
  prompts: promptsFor(name),
}));

export function createMusicBingoSession({ packId = 'fifties' } = {}) {
  return {
    packId,
    calledPromptIds: [],
    currentPromptId: '',
    phase: 'setup',
    showHistory: true,
  };
}

export function callMusicPrompt(session, pack) {
  const next = pack.prompts.find((prompt) => !session.calledPromptIds.includes(prompt.id));
  if (!next) return session;
  return {
    ...session,
    phase: 'calling',
    currentPromptId: next.id,
    calledPromptIds: [next.id, ...session.calledPromptIds],
  };
}

export function buildMusicBingoCards(pack, count = 4) {
  return Array.from({ length: count }, (_, cardIndex) => {
    const shifted = [...pack.prompts.slice(cardIndex), ...pack.prompts.slice(0, cardIndex)];
    const squares = shifted.slice(0, 24).map((prompt) => ({ id: prompt.id, label: prompt.label }));
    squares.splice(12, 0, { id: 'free', label: 'FREE' });
    return { id: `music-card-${cardIndex + 1}`, squares };
  });
}
