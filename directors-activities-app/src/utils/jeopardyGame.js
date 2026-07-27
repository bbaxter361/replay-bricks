const themeNames = [
  ['disney', 'Disney'],
  ['seventies-music', '70s Music'],
  ['halloween', 'Halloween'],
  ['christmas', 'Christmas'],
  ['classic-tv', 'Classic TV'],
  ['food-kitchen', 'Food & Kitchen'],
  ['patriotic', 'Patriotic / July 4th'],
  ['classic-movies', 'Classic Movies'],
  ['animals', 'Animals'],
  ['texas-southern', 'Texas / Southern Life'],
  ['custom', 'Custom Board'],
];

const categoryNames = ['Songs', 'People', 'Places', 'Things', 'Memories'];
const values = [100, 200, 300, 400, 500];

function clueFor(themeName, category, value, index) {
  return {
    id: `${themeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${category.toLowerCase()}-${value}`,
    value,
    question: `${themeName}: ${category} clue for ${value} points.`,
    answer: `${themeName} answer ${index + 1}`,
  };
}

export const JEOPARDY_PACKS = themeNames.map(([id, name]) => ({
  id,
  name,
  final: {
    question: `${name}: Final Jeopardy question.`,
    answer: `${name} final answer`,
  },
  categories: categoryNames.map((category) => ({
    id: `${id}-${category.toLowerCase()}`,
    name: category,
    clues: values.map((value, index) => clueFor(name, category, value, index)),
  })),
}));

export function createJeopardySession({
  packId = 'disney',
  teamNames = ['Team 1', 'Team 2'],
  subtractWrong = false,
  showQuestionOnTv = true,
  answersVisible = false,
} = {}) {
  return {
    packId,
    phase: 'setup',
    activeTeamId: 'team-0',
    subtractWrong,
    showQuestionOnTv,
    answersVisible,
    selectedClueId: '',
    usedClueIds: [],
    finalWagers: {},
    teams: teamNames.slice(0, 4).map((name, index) => ({
      id: `team-${index}`,
      name: name || `Team ${index + 1}`,
      score: 0,
    })),
  };
}

export function selectJeopardyClue(session, clueId) {
  return { ...session, phase: 'clue', selectedClueId: clueId };
}

export function markJeopardyAnswer(session, clue, teamId, isCorrect) {
  const delta = isCorrect ? clue.value : (session.subtractWrong ? -clue.value : 0);
  return {
    ...session,
    phase: 'board',
    selectedClueId: '',
    usedClueIds: [...new Set([...(session.usedClueIds || []), clue.id])],
    teams: session.teams.map((team) => (
      team.id === teamId ? { ...team, score: team.score + delta } : team
    )),
  };
}

export function buildJeopardyAnswerKeyText(pack) {
  return [
    `Jeopardy Answer Key: ${pack.name}`,
    '',
    ...pack.categories.flatMap((category) => [
      category.name,
      ...category.clues.map((clue) => `${clue.value}: ${clue.question} / ${clue.answer}`),
      '',
    ]),
    `Final Jeopardy: ${pack.final.question} / ${pack.final.answer}`,
  ].join('\n');
}

export function buildJeopardyAnswerKeyMailto(pack, email) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Jeopardy answer key: ${pack.name}`)}&body=${encodeURIComponent(buildJeopardyAnswerKeyText(pack))}`;
}
