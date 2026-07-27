const packSeeds = [
  ['disney', 'Disney', [
    ['Name a Disney character everyone knows.', ['Mickey Mouse', 'Donald Duck', 'Goofy', 'Cinderella', 'Elsa', 'Snow White']],
    ['Name something you see at a Disney park.', ['Castle', 'Parade', 'Fireworks', 'Characters', 'Rides', 'Popcorn']],
    ['Name a Disney animal.', ['Simba', 'Dumbo', 'Bambi', 'Pluto', 'Nemo', 'Baloo']],
    ['Name a Disney princess.', ['Cinderella', 'Snow White', 'Ariel', 'Belle', 'Jasmine', 'Elsa']],
    ['Name a Disney movie song people remember.', ['Let It Go', 'Hakuna Matata', 'A Whole New World', 'Be Our Guest', 'Bare Necessities', 'When You Wish Upon a Star']],
  ]],
  ['seventies-music', '70s Music', [
    ['Name a 70s singer or band.', ['Elvis', 'ABBA', 'Bee Gees', 'Fleetwood Mac', 'Elton John', 'John Denver']],
    ['Name a 70s dance song.', ['Stayin Alive', 'Dancing Queen', 'YMCA', 'Le Freak', 'We Are Family', 'September']],
    ['Name something people wore in the 70s.', ['Bell bottoms', 'Platform shoes', 'Tie dye', 'Leisure suit', 'Big sunglasses', 'Headband']],
    ['Name a music player from the 70s.', ['Record player', 'Radio', '8-track', 'Cassette player', 'Jukebox', 'Stereo']],
    ['Name a 70s song residents may sing along to.', ['Take Me Home Country Roads', 'Sweet Caroline', 'Lean on Me', 'Joy to the World', 'Let It Be', 'Proud Mary']],
  ]],
  ['halloween', 'Halloween', [
    ['Name something you see on Halloween.', ['Pumpkin', 'Costume', 'Candy', 'Ghost', 'Witch', 'Black cat']],
    ['Name a Halloween candy.', ['Chocolate bar', 'Candy corn', 'Lollipop', 'Peanut butter cup', 'Gum', 'Caramel apple']],
    ['Name a costume people wear.', ['Witch', 'Ghost', 'Cowboy', 'Princess', 'Vampire', 'Superhero']],
    ['Name a spooky place.', ['Haunted house', 'Cemetery', 'Dark woods', 'Old attic', 'Basement', 'Castle']],
    ['Name something carved into a pumpkin.', ['Smile', 'Triangle eyes', 'Scary face', 'Star', 'Cat', 'Moon']],
  ]],
  ['christmas', 'Christmas', [
    ['Name something on a Christmas tree.', ['Lights', 'Ornaments', 'Star', 'Angel', 'Tinsel', 'Candy cane']],
    ['Name a Christmas song.', ['Silent Night', 'Jingle Bells', 'White Christmas', 'Joy to the World', 'The First Noel', 'Rudolph']],
    ['Name a Christmas food.', ['Turkey', 'Ham', 'Cookies', 'Pie', 'Candy cane', 'Dressing']],
    ['Name something Santa has.', ['Sleigh', 'Reindeer', 'Bag', 'Red suit', 'Beard', 'List']],
    ['Name a Christmas decoration.', ['Tree', 'Wreath', 'Lights', 'Stocking', 'Nativity', 'Garland']],
  ]],
  ['classic-tv', 'Classic TV', [
    ['Name a classic TV show.', ['I Love Lucy', 'Andy Griffith', 'MASH', 'Gunsmoke', 'Bonanza', 'The Waltons']],
    ['Name a TV western.', ['Gunsmoke', 'Bonanza', 'Rawhide', 'The Rifleman', 'Wagon Train', 'Maverick']],
    ['Name something on old TV sets.', ['Antenna', 'Knobs', 'Black and white picture', 'Static', 'Wood cabinet', 'Rabbit ears']],
    ['Name a classic TV character.', ['Lucy', 'Barney Fife', 'Archie Bunker', 'Fonzie', 'Little Joe', 'Miss Kitty']],
    ['Name a show people watched as a family.', ['The Waltons', 'Little House', 'The Brady Bunch', 'Andy Griffith', 'Ed Sullivan', 'Lawrence Welk']],
  ]],
  ['food-kitchen', 'Food & Kitchen', [
    ['Name something that smells good from the kitchen.', ['Cookies', 'Coffee', 'Fresh bread', 'Bacon', 'Pie', 'Soup']],
    ['Name a favorite dessert.', ['Cake', 'Pie', 'Ice cream', 'Cookies', 'Pudding', 'Cobbler']],
    ['Name a kitchen tool.', ['Spoon', 'Knife', 'Pan', 'Mixer', 'Measuring cup', 'Rolling pin']],
    ['Name a comfort food.', ['Mashed potatoes', 'Mac and cheese', 'Chicken soup', 'Meatloaf', 'Biscuits', 'Gravy']],
    ['Name something served at breakfast.', ['Eggs', 'Bacon', 'Toast', 'Coffee', 'Pancakes', 'Cereal']],
  ]],
  ['patriotic', 'Patriotic / July 4th', [
    ['Name something red, white, and blue.', ['Flag', 'Balloons', 'Cake', 'Shirt', 'Decorations', 'Cupcakes']],
    ['Name something at a July 4th party.', ['Fireworks', 'Hot dogs', 'Hamburgers', 'Lemonade', 'Music', 'Flags']],
    ['Name a patriotic song.', ['God Bless America', 'Star-Spangled Banner', 'America the Beautiful', 'Yankee Doodle', 'This Land Is Your Land', 'Battle Hymn']],
    ['Name something you see in a parade.', ['Band', 'Float', 'Flag', 'Cars', 'Horses', 'Candy']],
    ['Name a picnic food.', ['Sandwiches', 'Chips', 'Watermelon', 'Potato salad', 'Cookies', 'Hot dogs']],
  ]],
  ['classic-movies', 'Classic Movies', [
    ['Name a classic movie.', ['Gone with the Wind', 'Wizard of Oz', 'Casablanca', 'Singing in the Rain', 'Sound of Music', 'White Christmas']],
    ['Name a famous movie star.', ['John Wayne', 'Marilyn Monroe', 'Judy Garland', 'Humphrey Bogart', 'Doris Day', 'Elvis']],
    ['Name something you buy at the movies.', ['Popcorn', 'Candy', 'Soda', 'Ticket', 'Nachos', 'Hot dog']],
    ['Name a movie musical.', ['Sound of Music', 'Singing in the Rain', 'Mary Poppins', 'Grease', 'Oklahoma', 'White Christmas']],
    ['Name something in the Wizard of Oz.', ['Ruby slippers', 'Yellow brick road', 'Tin Man', 'Scarecrow', 'Lion', 'Tornado']],
  ]],
  ['animals', 'Animals', [
    ['Name an animal people like to visit with.', ['Dog', 'Cat', 'Bird', 'Rabbit', 'Horse', 'Fish']],
    ['Name a farm animal.', ['Cow', 'Chicken', 'Pig', 'Horse', 'Goat', 'Sheep']],
    ['Name an animal at the zoo.', ['Lion', 'Elephant', 'Monkey', 'Giraffe', 'Bear', 'Zebra']],
    ['Name something a dog does.', ['Barks', 'Wags tail', 'Fetches', 'Sleeps', 'Licks', 'Rolls over']],
    ['Name an animal sound.', ['Bark', 'Meow', 'Moo', 'Roar', 'Quack', 'Neigh']],
  ]],
  ['texas-southern', 'Texas / Southern Life', [
    ['Name something Texas is known for.', ['Cowboys', 'Barbecue', 'Football', 'Longhorns', 'Bluebonnets', 'Big sky']],
    ['Name a southern food.', ['Fried chicken', 'Biscuits', 'Gravy', 'Pecan pie', 'Grits', 'Cornbread']],
    ['Name something at a rodeo.', ['Horse', 'Bull', 'Cowboy hat', 'Rope', 'Boots', 'Belt buckle']],
    ['Name a Texas city.', ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Fort Worth', 'Waco']],
    ['Name something people say in the South.', ['Yall', 'Bless your heart', 'Howdy', 'Yes maam', 'Fixin to', 'Thank you kindly']],
  ]],
];

const pointSets = [
  [32, 24, 17, 12, 9, 6],
  [30, 25, 18, 13, 8, 6],
  [28, 23, 19, 14, 10, 6],
  [34, 22, 16, 12, 9, 7],
  [31, 21, 18, 15, 9, 6],
];

export const FEUD_ROUND_MULTIPLIERS = [1, 1, 2, 2, 3];

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildRound(packId, question, answers, roundIndex) {
  return {
    id: `${packId}-round-${roundIndex + 1}`,
    question,
    multiplier: FEUD_ROUND_MULTIPLIERS[roundIndex] || 1,
    answers: answers.map((answer, index) => ({
      id: `${packId}-${roundIndex + 1}-${slug(answer)}`,
      text: answer,
      points: pointSets[roundIndex][index] || Math.max(3, 10 - index),
    })),
  };
}

export const FEUD_PACKS = packSeeds.map(([id, name, rounds]) => ({
  id,
  name,
  source: 'estimated',
  rounds: rounds.map(([question, answers], index) => buildRound(id, question, answers, index)),
}));

export const FEUD_ROUNDS = FEUD_PACKS[0].rounds;

export function createFeudSession({ packId, teamNames, startingTeam }) {
  return {
    packId,
    phase: 'setup',
    roundIndex: 0,
    revealedAnswerIds: [],
    strikes: 0,
    scores: { teamA: 0, teamB: 0 },
    controllingTeam: startingTeam || 'teamA',
    stealMode: false,
    teamNames: {
      teamA: teamNames?.teamA || 'Team Sunshine',
      teamB: teamNames?.teamB || 'Team Stars',
    },
    gameStartedAt: '',
    gameEndedAt: '',
    winnerTeam: '',
    summary: null,
  };
}

export function revealAnswer(state, round, answerId) {
  if (!round.answers.some((answer) => answer.id === answerId)) return state;
  return {
    ...state,
    revealedAnswerIds: [...new Set([...(state.revealedAnswerIds || []), answerId])],
  };
}

export function addStrike(state) {
  const strikes = Math.min(3, Number(state.strikes || 0) + 1);
  return {
    ...state,
    strikes,
    stealMode: strikes >= 3,
    lastResult: 'strike',
  };
}

export function roundBank(state, round) {
  const rawBank = round.answers
    .filter((answer) => (state.revealedAnswerIds || []).includes(answer.id))
    .reduce((total, answer) => total + answer.points, 0);
  return rawBank * Number(round.multiplier || 1);
}

export function awardRound(state, round, teamId) {
  const bank = roundBank(state, round);
  return {
    ...state,
    scores: {
      ...state.scores,
      [teamId]: Number(state.scores?.[teamId] || 0) + bank,
    },
    roundWinner: teamId,
    phase: 'between-rounds',
  };
}

export function endGame(state, pack) {
  const teamAScore = Number(state.scores?.teamA || 0);
  const teamBScore = Number(state.scores?.teamB || 0);
  const winnerTeam = teamAScore >= teamBScore ? 'teamA' : 'teamB';
  const endedAt = new Date().toISOString();
  return {
    ...state,
    phase: 'ended',
    gameEndedAt: endedAt,
    winnerTeam,
    summary: {
      id: `family-feud-summary-${Date.now()}`,
      packId: pack.id,
      packName: pack.name,
      teamNames: state.teamNames,
      scores: state.scores,
      winnerTeam,
      winnerName: state.teamNames[winnerTeam],
      createdAt: endedAt,
    },
  };
}

export function buildAnswerKeyText(pack) {
  return [
    `Family Feud Answer Key: ${pack.name}`,
    'These are Family Feud-style estimated answers for activity use.',
    '',
    ...pack.rounds.flatMap((round, index) => [
      `Round ${index + 1} (${round.multiplier}x): ${round.question}`,
      ...round.answers.map((answer, answerIndex) => `${answerIndex + 1}. ${answer.text} - ${answer.points}`),
      '',
    ]),
  ].join('\n');
}

export function buildAnswerKeyMailto(pack, email) {
  const subject = encodeURIComponent(`Family Feud answer key: ${pack.name}`);
  const body = encodeURIComponent(buildAnswerKeyText(pack));
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}
