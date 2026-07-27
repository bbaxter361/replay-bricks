import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEUD_PACKS,
  addStrike,
  awardRound,
  buildAnswerKeyText,
  createFeudSession,
  endGame,
  revealAnswer,
} from '../src/utils/familyFeud.js';
import { GAME_LIBRARY, getGameById } from '../src/utils/gameLibrary.js';
import {
  JEOPARDY_PACKS,
  createJeopardySession,
  markJeopardyAnswer,
} from '../src/utils/jeopardyGame.js';
import {
  MUSIC_BINGO_PACKS,
  buildMusicBingoCards,
  createMusicBingoSession,
} from '../src/utils/musicTriviaBingo.js';
import {
  MEMORY_MATCH_THEMES,
  buildMemoryDeck,
  createMemorySession,
} from '../src/utils/memoryMatchGame.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('each game has a separate host route and TV route', () => {
  const bingo = getGameById('bingo-caller');

  assert.equal(bingo.hostPath, '/app/games/bingo-caller');
  assert.equal(bingo.tvPath, '/app/games/bingo-caller/tv');
  assert.ok(GAME_LIBRARY.every((game) => game.hostPath && game.tvPath && game.theme));
});

test('Family Feud has enough scored survey rounds for real hosting', () => {
  assert.equal(FEUD_PACKS.length, 10);
  assert.ok(FEUD_PACKS.every((pack) => pack.rounds.length === 5));
  assert.ok(FEUD_PACKS.every((pack) => pack.rounds.every((round) => round.answers.length >= 5)));
  assert.ok(FEUD_PACKS.every((pack) => pack.rounds.every((round) => round.answers.every((answer) => Number.isInteger(answer.points)))));
});

test('Family Feud round helpers handle correct answers, strikes, and scoring', () => {
  const session = createFeudSession({
    packId: FEUD_PACKS[0].id,
    teamNames: { teamA: 'Blue', teamB: 'Gold' },
    startingTeam: 'teamA',
  });
  const round = FEUD_PACKS[0].rounds[0];
  let state = revealAnswer(session, round, round.answers[0].id);
  state = addStrike(state);
  state = awardRound(state, round, 'teamA');

  assert.deepEqual(state.revealedAnswerIds, [round.answers[0].id]);
  assert.equal(state.strikes, 1);
  assert.equal(state.scores.teamA, round.answers[0].points);
});

test('Family Feud can build answer keys and end-game summaries', () => {
  const pack = FEUD_PACKS.find((item) => item.id === 'christmas');
  const session = createFeudSession({
    packId: pack.id,
    teamNames: { teamA: 'Holly', teamB: 'Jolly' },
    startingTeam: 'teamB',
  });
  const ended = endGame({ ...session, scores: { teamA: 25, teamB: 40 } }, pack);
  const answerKey = buildAnswerKeyText(pack);

  assert.equal(session.controllingTeam, 'teamB');
  assert.equal(ended.winnerTeam, 'teamB');
  assert.equal(ended.summary.packName, 'Christmas');
  assert.match(answerKey, /Christmas/);
  assert.match(answerKey, /Round 1/);
});

test('Family Feud host screen is a control desk, not the TV board', () => {
  const source = readFileSync(join(__dirname, '../src/pages/Games.jsx'), 'utf8');

  assert.match(source, /Host Control Desk/);
  assert.match(source, /Private Answer Key/);
  assert.match(source, /Launch TV/);
});

test('Jeopardy supports 10 themed packs plus custom, with 5 categories and 5 clues', () => {
  assert.equal(JEOPARDY_PACKS.length, 11);
  assert.ok(JEOPARDY_PACKS.every((pack) => pack.categories.length === 5));
  assert.ok(JEOPARDY_PACKS.every((pack) => pack.categories.every((category) => category.clues.length === 5)));

  const session = createJeopardySession({
    packId: 'disney',
    teamNames: ['Red', 'Blue', 'Green'],
    subtractWrong: true,
    showQuestionOnTv: true,
    answersVisible: false,
  });
  const updated = markJeopardyAnswer(session, JEOPARDY_PACKS[0].categories[0].clues[0], 'team-1', false);

  assert.equal(session.teams.length, 3);
  assert.equal(session.showQuestionOnTv, true);
  assert.equal(updated.teams[1].score, -100);
});

test('Music Trivia Bingo has music packs and printable resident cards', () => {
  assert.equal(MUSIC_BINGO_PACKS.length, 10);
  assert.ok(MUSIC_BINGO_PACKS.every((pack) => pack.prompts.length >= 24));

  const session = createMusicBingoSession({ packId: 'elvis' });
  const cards = buildMusicBingoCards(MUSIC_BINGO_PACKS[0], 3);

  assert.equal(session.packId, 'elvis');
  assert.equal(cards.length, 3);
  assert.equal(cards[0].squares.length, 25);
  assert.equal(cards[0].squares[12].label, 'FREE');
});

test('Memory Match supports approved themes, difficulty, and picture-word options', () => {
  assert.equal(MEMORY_MATCH_THEMES.length, 10);
  assert.equal(MEMORY_MATCH_THEMES.some((theme) => /bible/i.test(theme.name)), false);
  assert.equal(MEMORY_MATCH_THEMES.some((theme) => theme.name === 'Travel'), true);

  const session = createMemorySession({ themeId: 'animals', difficulty: 'medium', showWords: false });
  const deck = buildMemoryDeck(MEMORY_MATCH_THEMES[0], 'medium');

  assert.equal(session.showWords, false);
  assert.equal(deck.length, 12);
});
