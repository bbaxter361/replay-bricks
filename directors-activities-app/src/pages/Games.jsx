import { Blocks, ExternalLink, Mail, Printer, RotateCcw, Shuffle, Trophy, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';
import {
  FEUD_PACKS,
  addStrike,
  awardRound,
  buildAnswerKeyMailto,
  buildAnswerKeyText,
  createFeudSession,
  endGame,
  revealAnswer,
  roundBank,
} from '../utils/familyFeud.js';
import { GAME_LIBRARY, getGameById } from '../utils/gameLibrary.js';
import {
  JEOPARDY_PACKS,
  buildJeopardyAnswerKeyMailto,
  buildJeopardyAnswerKeyText,
  createJeopardySession,
  markJeopardyAnswer,
  selectJeopardyClue,
} from '../utils/jeopardyGame.js';
import {
  MUSIC_BINGO_PACKS,
  buildMusicBingoCards,
  callMusicPrompt,
  createMusicBingoSession,
} from '../utils/musicTriviaBingo.js';
import {
  MEMORY_MATCH_THEMES,
  buildMemoryDeck,
  createMemorySession,
} from '../utils/memoryMatchGame.js';

const themeClass = {
  'bingo-night': 'bg-[#102a43] text-white',
  'survey-stage': 'bg-[#07143d] text-white',
  jukebox: 'bg-[#2a1037] text-white',
  'quiz-board': 'bg-[#061f4f] text-white',
  'picture-cards': 'bg-[#113d36] text-white',
};

const FEUD_SESSION_KEY = 'director-family-feud-session';
const FEUD_SUMMARIES_KEY = 'director-family-feud-summaries';
const JEOPARDY_SESSION_KEY = 'director-jeopardy-session';
const MUSIC_BINGO_SESSION_KEY = 'director-music-bingo-session';
const MEMORY_MATCH_SESSION_KEY = 'director-memory-match-session';

function readStoredSession(key) {
  try {
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed?.phase ? parsed : null;
  } catch {
    return null;
  }
}

function readFeudSession() {
  const parsed = readStoredSession(FEUD_SESSION_KEY);
  return parsed?.packId ? parsed : null;
}

function GameShell({ game, children, controls, hint, tvOnly }) {
  return (
    <section className={`min-h-[calc(100vh-2rem)] rounded-lg p-5 shadow-xl ${themeClass[game.theme] || 'bg-[#170f28] text-white'} ${tvOnly ? 'min-h-screen rounded-none p-6' : ''}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <StatusPill tone="gold">{tvOnly ? 'TV window' : 'host console'}</StatusPill>
          <h2 className="mt-3 text-5xl font-black leading-tight md:text-6xl">{game.name}</h2>
          {hint && <p className="mt-2 max-w-3xl text-lg font-bold text-white/75">{hint}</p>}
        </div>
        <div className="flex flex-wrap gap-2">{controls}</div>
      </div>
      {children}
    </section>
  );
}

function BingoCaller({ game, tvOnly }) {
  const [called, setCalled] = useState([]);
  const nextNumber = useCallback(() => {
    setCalled((current) => {
      const remaining = Array.from({ length: 75 }, (_, index) => index + 1).filter((number) => !current.includes(number));
      if (!remaining.length) return current;
      return [remaining[Math.floor(Math.random() * remaining.length)], ...current];
    });
  }, []);
  const letterFor = (number) => ['B', 'I', 'N', 'G', 'O'][Math.floor((number - 1) / 15)];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        nextNumber();
      }
      if (event.key.toLowerCase() === 'r') setCalled([]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nextNumber]);

  return (
    <GameShell
      game={game}
      hint="Space calls the next number. R resets the board."
      tvOnly={tvOnly}
      controls={(
        <>
          <button className="app-button app-button-primary" onClick={nextNumber} type="button">Call Next</button>
          <button className="app-button app-button-secondary" onClick={() => setCalled([])} type="button"><RotateCcw size={16} /> Reset</button>
        </>
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg bg-[#f3d45d] p-8 text-center text-[#102a43]">
          <p className="text-2xl font-black">Current call</p>
          <p className="mt-4 text-9xl font-black">{called[0] ? `${letterFor(called[0])}${called[0]}` : '--'}</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 75 }, (_, index) => index + 1).map((number) => (
            <div className={`rounded-lg p-3 text-center text-2xl font-black ${called.includes(number) ? 'bg-[#f3d45d] text-[#102a43]' : 'bg-white/10'}`} key={number}>
              {letterFor(number)}{number}
            </div>
          ))}
        </div>
      </div>
    </GameShell>
  );
}

function FamilyFeudGame({ game, tvOnly }) {
  const storedSession = useMemo(() => readFeudSession(), []);
  const [session, setSession] = useState(storedSession || createFeudSession({
    packId: 'disney',
    teamNames: { teamA: 'Team Sunshine', teamB: 'Team Stars' },
    startingTeam: 'teamA',
  }));
  const [hostEmail, setHostEmail] = useState('');
  const [coinMessage, setCoinMessage] = useState('');
  const selectedPack = FEUD_PACKS.find((pack) => pack.id === session.packId) || FEUD_PACKS[0];
  const round = selectedPack.rounds[session.roundIndex] || selectedPack.rounds[0];
  const bank = roundBank(session, round);
  const answerKeyText = buildAnswerKeyText(selectedPack);

  useEffect(() => {
    if (tvOnly) return undefined;
    localStorage.setItem(FEUD_SESSION_KEY, JSON.stringify(session));
    return undefined;
  }, [session, tvOnly]);

  useEffect(() => {
    if (!tvOnly) return undefined;
    const refresh = () => {
      const latest = readFeudSession();
      if (latest) setSession(latest);
    };
    const intervalId = window.setInterval(refresh, 500);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, [tvOnly]);

  const updateTeamName = (teamId, value) => {
    setSession((current) => ({ ...current, teamNames: { ...current.teamNames, [teamId]: value } }));
  };

  const choosePack = (packId) => {
    setSession((current) => createFeudSession({
      packId,
      teamNames: current.teamNames,
      startingTeam: current.controllingTeam,
    }));
    setCoinMessage('');
  };

  const flipCoin = () => {
    const startingTeam = Math.random() >= 0.5 ? 'teamA' : 'teamB';
    setSession((current) => ({ ...current, controllingTeam: startingTeam }));
    setCoinMessage(`${session.teamNames[startingTeam]} won the coin flip.`);
  };

  const startGame = () => {
    setSession((current) => ({
      ...current,
      phase: 'playing',
      gameStartedAt: current.gameStartedAt || new Date().toISOString(),
      revealedAnswerIds: [],
      strikes: 0,
      stealMode: false,
    }));
  };

  const restartGame = () => {
    setSession((current) => createFeudSession({
      packId: current.packId,
      teamNames: current.teamNames,
      startingTeam: current.controllingTeam,
    }));
    setCoinMessage('');
  };

  const saveSummary = (summary) => {
    try {
      const summaries = JSON.parse(localStorage.getItem(FEUD_SUMMARIES_KEY) || '[]');
      localStorage.setItem(FEUD_SUMMARIES_KEY, JSON.stringify([summary, ...summaries].slice(0, 25)));
    } catch {
      localStorage.setItem(FEUD_SUMMARIES_KEY, JSON.stringify([summary]));
    }
  };

  const endCurrentGame = () => {
    setSession((current) => {
      const ended = endGame(current, selectedPack);
      if (ended.summary) saveSummary(ended.summary);
      return ended;
    });
  };

  const nextRound = useCallback(() => {
    setSession((current) => {
      const nextIndex = Math.min(current.roundIndex + 1, selectedPack.rounds.length - 1);
      return {
        ...current,
        phase: 'playing',
        roundIndex: nextIndex,
        revealedAnswerIds: [],
        strikes: 0,
        stealMode: false,
        roundWinner: '',
      };
    });
  }, [selectedPack.rounds.length]);

  const revealByIndex = useCallback((index) => {
    const answer = round.answers[index];
    if (answer) setSession((current) => revealAnswer(current, round, answer.id));
  }, [round]);

  const markStrike = useCallback(() => setSession((current) => addStrike(current)), []);
  const awardTeam = useCallback((teamId) => setSession((current) => awardRound(current, round, teamId)), [round]);
  const setControl = useCallback((teamId) => setSession((current) => ({ ...current, controllingTeam: teamId, stealMode: false })), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (/^[1-6]$/.test(key)) revealByIndex(Number(key) - 1);
      if (key === 'x') markStrike();
      if (key === 'a') setControl('teamA');
      if (key === 'b') setControl('teamB');
      if (key === 's') setSession((current) => ({ ...current, stealMode: true }));
      if (key === 'enter') awardTeam(session.stealMode ? (session.controllingTeam === 'teamA' ? 'teamB' : 'teamA') : session.controllingTeam);
      if (key === 'n' && session.phase === 'between-rounds') nextRound();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [awardTeam, markStrike, nextRound, revealByIndex, setControl, session.controllingTeam, session.phase, session.stealMode]);

  if (tvOnly && session.phase === 'setup') {
    return (
      <GameShell game={game} hint="Waiting for the host to start the game." tvOnly>
        <div className="grid min-h-[60vh] place-items-center rounded-lg bg-[#0e2f82] p-8 text-center">
          <div>
            <p className="text-7xl font-black">{selectedPack.name}</p>
            <p className="mt-6 text-3xl font-black text-[#f3d45d]">Waiting for host</p>
          </div>
        </div>
      </GameShell>
    );
  }

  if (session.phase === 'between-rounds' || session.phase === 'ended') {
    const winnerName = session.teamNames[session.winnerTeam || session.roundWinner] || 'Winner';
    return (
      <GameShell
        game={game}
        hint={session.phase === 'ended' ? 'Game complete.' : 'Big transition screen for the TV.'}
        tvOnly={tvOnly}
        controls={!tvOnly && (
          <>
            {session.phase !== 'ended' && <button className="app-button app-button-primary" onClick={nextRound} type="button">Start Next Round</button>}
            <button className="app-button app-button-secondary" onClick={restartGame} type="button"><RotateCcw size={16} /> Restart Game</button>
          </>
        )}
      >
        <div className="grid min-h-[62vh] place-items-center rounded-lg bg-[#0e2f82] p-8 text-center">
          <div>
            <p className="text-6xl font-black text-[#f3d45d]">{session.phase === 'ended' ? 'Final Winner' : 'Round Winner'}</p>
            <p className="mt-5 text-8xl font-black">{winnerName}</p>
            <div className="mt-8 grid gap-4 text-4xl font-black md:grid-cols-2">
              <p>{session.teamNames.teamA}: {session.scores.teamA}</p>
              <p>{session.teamNames.teamB}: {session.scores.teamB}</p>
            </div>
            {session.phase !== 'ended' && <p className="mt-8 text-3xl font-black">Round {session.roundIndex + 2} coming up</p>}
          </div>
        </div>
      </GameShell>
    );
  }

  if (!tvOnly) {
    return (
      <GameShell
        game={game}
        hint="Host Control Desk. The TV window shows the big board; this laptop screen keeps answers and controls private."
        controls={<button className="app-button app-button-primary" onClick={() => window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer')} type="button"><ExternalLink size={16} /> Launch TV</button>}
      >
        {session.phase === 'setup' && (
          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <section className="rounded-lg bg-white p-4 text-[#07143d]">
              <h3 className="text-2xl font-black">Choose Game Pack</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {FEUD_PACKS.map((pack) => (
                  <button className={`rounded-lg border p-3 text-left font-black ${pack.id === selectedPack.id ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2]'}`} key={pack.id} onClick={() => choosePack(pack.id)} type="button">
                    {pack.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-bold">
                  Team A
                  <input className="app-input mt-1" onChange={(event) => updateTeamName('teamA', event.target.value)} value={session.teamNames.teamA} />
                </label>
                <label className="text-sm font-bold">
                  Team B
                  <input className="app-input mt-1" onChange={(event) => updateTeamName('teamB', event.target.value)} value={session.teamNames.teamB} />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="app-button app-button-secondary" onClick={flipCoin} type="button"><Shuffle size={16} /> Flip Coin</button>
                <button className="app-button app-button-primary" onClick={startGame} type="button">Start Game</button>
              </div>
              {coinMessage && <p className="mt-3 rounded-lg bg-[#f3d45d] p-3 text-lg font-black">{coinMessage}</p>}
            </section>
            <section className="rounded-lg bg-white p-4 text-[#07143d]">
              <h3 className="text-2xl font-black">Private Answer Key</h3>
              <p className="mt-1 text-sm text-[#74638d]">This stays on the host laptop only.</p>
              <input className="app-input mt-3" onChange={(event) => setHostEmail(event.target.value)} placeholder="Host email" type="email" value={hostEmail} />
              <div className="mt-3 flex flex-wrap gap-2">
                <a className={`app-button app-button-primary ${hostEmail ? '' : 'pointer-events-none opacity-50'}`} href={hostEmail ? buildAnswerKeyMailto(selectedPack, hostEmail) : '#'}><Mail size={16} /> Email Key</a>
                <button className="app-button app-button-secondary" onClick={() => window.print()} type="button"><Printer size={16} /> Print Key</button>
              </div>
              <textarea className="mt-3 h-72 w-full rounded-lg border border-[#ded0f2] p-3 text-xs leading-5" readOnly value={answerKeyText} />
            </section>
          </div>
        )}

        {session.phase === 'playing' && (
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <section className="rounded-lg bg-white p-4 text-[#07143d]">
              <h3 className="text-2xl font-black">Score & Turn</h3>
              {['teamA', 'teamB'].map((teamId) => (
                <button className={`mt-3 w-full rounded-lg border p-4 text-left ${session.controllingTeam === teamId ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2]'}`} key={teamId} onClick={() => setControl(teamId)} type="button">
                  <p className="text-xl font-black">{session.teamNames[teamId]}</p>
                  <p className="text-4xl font-black">{session.scores[teamId]}</p>
                </button>
              ))}
              <div className="mt-4 rounded-lg bg-[#f3d45d] p-3 text-[#07143d]">
                <p className="text-sm font-black">Round bank</p>
                <p className="text-4xl font-black">{bank}</p>
              </div>
              <p className="mt-3 text-sm font-bold text-[#74638d]">Keyboard: 1-6 reveal answers, X adds a strike, S starts steal mode, Enter awards the round.</p>
            </section>

            <section className="rounded-lg bg-white p-4 text-[#07143d]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black">Private Answer Key</h3>
                  <p className="mt-1 text-sm text-[#74638d]">{selectedPack.name} · Round {session.roundIndex + 1} · {round.multiplier}x</p>
                </div>
                <StatusPill tone="gold">{session.stealMode ? 'steal chance' : `${session.strikes} strikes`}</StatusPill>
              </div>
              <p className="mt-4 rounded-lg bg-[#efe4ff] p-4 text-2xl font-black">{round.question}</p>
              <div className="mt-4 grid gap-2">
                {round.answers.map((answer, index) => {
                  const revealed = session.revealedAnswerIds.includes(answer.id);
                  return (
                    <button className={`rounded-lg border p-3 text-left ${revealed ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2]'}`} key={answer.id} onClick={() => revealByIndex(index)} type="button">
                      <span className="font-black">{index + 1}. {answer.text}</span>
                      <span className="float-right font-black">{answer.points}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="app-button app-button-primary" onClick={() => awardTeam(session.controllingTeam)} type="button">Award Control Team</button>
                <button className="app-button app-button-secondary" onClick={() => awardTeam(session.controllingTeam === 'teamA' ? 'teamB' : 'teamA')} type="button">Award Steal Team</button>
                <button className="app-button app-button-secondary" onClick={() => setSession((current) => ({ ...current, stealMode: true }))} type="button">Steal Mode</button>
                <button className="app-button app-button-secondary" onClick={() => setSession((current) => ({ ...current, revealedAnswerIds: round.answers.map((answer) => answer.id) }))} type="button">Reveal Board</button>
              </div>
            </section>
          </div>
        )}
      </GameShell>
    );
  }

  return (
    <GameShell
      game={game}
      hint={tvOnly ? `${selectedPack.name} board. Host controls the game from the laptop.` : 'Keys: 1-6 reveal answers, X strike, A/B choose team, S steal, Enter award, N next transition.'}
      tvOnly={tvOnly}
      controls={!tvOnly && (
        <>
          <button className="app-button app-button-primary" onClick={() => window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer')} type="button"><ExternalLink size={16} /> Launch TV</button>
          <button className="app-button app-button-primary" onClick={markStrike} type="button"><X size={16} /> Strike</button>
          <button className="app-button app-button-secondary" onClick={() => setSession((current) => ({ ...current, stealMode: true }))} type="button">Steal</button>
          <button className="app-button app-button-secondary" onClick={endCurrentGame} type="button">End Game</button>
          <button className="app-button app-button-secondary" onClick={restartGame} type="button"><RotateCcw size={16} /> Restart</button>
        </>
      )}
    >
      {!tvOnly && session.phase === 'setup' && (
        <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg bg-white p-4 text-[#07143d]">
            <h3 className="text-2xl font-black">Choose Game Pack</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {FEUD_PACKS.map((pack) => (
                <button className={`rounded-lg border p-3 text-left font-black ${pack.id === selectedPack.id ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2]'}`} key={pack.id} onClick={() => choosePack(pack.id)} type="button">
                  {pack.name}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-bold">
                Team A
                <input className="app-input mt-1" onChange={(event) => updateTeamName('teamA', event.target.value)} value={session.teamNames.teamA} />
              </label>
              <label className="text-sm font-bold">
                Team B
                <input className="app-input mt-1" onChange={(event) => updateTeamName('teamB', event.target.value)} value={session.teamNames.teamB} />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="app-button app-button-secondary" onClick={flipCoin} type="button"><Shuffle size={16} /> Flip Coin</button>
              <button className="app-button app-button-primary" onClick={startGame} type="button">Start Game</button>
            </div>
            {coinMessage && <p className="mt-3 rounded-lg bg-[#f3d45d] p-3 text-lg font-black">{coinMessage}</p>}
          </section>
          <section className="rounded-lg bg-white p-4 text-[#07143d]">
            <h3 className="text-2xl font-black">Answer Key</h3>
            <p className="mt-1 text-sm text-[#74638d]">Private host copy. The TV window will not show this.</p>
            <input className="app-input mt-3" onChange={(event) => setHostEmail(event.target.value)} placeholder="Host email" type="email" value={hostEmail} />
            <div className="mt-3 flex flex-wrap gap-2">
              <a className={`app-button app-button-primary ${hostEmail ? '' : 'pointer-events-none opacity-50'}`} href={hostEmail ? buildAnswerKeyMailto(selectedPack, hostEmail) : '#'}><Mail size={16} /> Email Key</a>
              <button className="app-button app-button-secondary" onClick={() => window.print()} type="button"><Printer size={16} /> Print Key</button>
            </div>
            <textarea className="mt-3 h-72 w-full rounded-lg border border-[#ded0f2] p-3 text-xs leading-5" readOnly value={answerKeyText} />
          </section>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_260px]">
        {['teamA', 'teamB'].map((teamId) => (
          <div className={`rounded-lg p-4 text-center ${session.controllingTeam === teamId ? 'bg-[#f3d45d] text-[#07143d]' : 'bg-white/10'}`} key={teamId}>
            <p className="text-2xl font-black">{session.teamNames[teamId]}</p>
            <p className="mt-3 text-6xl font-black">{session.scores[teamId]}</p>
            {!tvOnly && <button className="app-button app-button-secondary mt-3" onClick={() => setControl(teamId)} type="button">Control</button>}
          </div>
        ))}
        <div className="order-first rounded-lg bg-[#0e2f82] p-5 text-center shadow-inner lg:order-none">
          <p className="mb-2 text-lg font-black text-[#f3d45d]">{selectedPack.name} · Round {session.roundIndex + 1} · {round.multiplier}x</p>
          <p className="text-3xl font-black leading-tight">{round.question}</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {[0, 1, 2].map((strike) => (
              <div className={`grid size-16 place-items-center rounded-full border-4 text-4xl font-black ${session.strikes > strike ? 'border-[#ff4d5d] bg-[#ff4d5d]' : 'border-white/40 text-white/40'}`} key={strike}>X</div>
            ))}
          </div>
          <p className="mt-3 text-xl font-black text-[#f3d45d]">{session.stealMode ? 'Steal chance' : `Bank: ${bank}`}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {round.answers.map((answer, index) => {
          const revealed = session.revealedAnswerIds.includes(answer.id);
          return (
            <button className={`rounded-lg border-4 p-5 text-left text-3xl font-black transition ${revealed ? 'border-[#f3d45d] bg-[#f3d45d] text-[#07143d]' : 'border-[#2b5fd9] bg-[#0e2f82]'}`} disabled={tvOnly} key={answer.id} onClick={() => revealByIndex(index)} type="button">
              <span>{index + 1}. {revealed ? answer.text : '__________'}</span>
              <span className="float-right">{revealed ? answer.points : ''}</span>
            </button>
          );
        })}
      </div>
      {!tvOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="app-button app-button-primary" onClick={() => awardTeam(session.controllingTeam)} type="button">Award Control Team</button>
          <button className="app-button app-button-secondary" onClick={() => awardTeam(session.controllingTeam === 'teamA' ? 'teamB' : 'teamA')} type="button">Award Steal Team</button>
          <button className="app-button app-button-secondary" onClick={() => setSession((current) => ({ ...current, revealedAnswerIds: round.answers.map((answer) => answer.id) }))} type="button">Reveal Board</button>
        </div>
      )}
    </GameShell>
  );
}

function MusicTriviaBingo({ game, tvOnly }) {
  const storedSession = useMemo(() => readStoredSession(MUSIC_BINGO_SESSION_KEY), []);
  const [session, setSession] = useState(storedSession || createMusicBingoSession());
  const pack = MUSIC_BINGO_PACKS.find((item) => item.id === session.packId) || MUSIC_BINGO_PACKS[0];
  const currentPrompt = pack.prompts.find((prompt) => prompt.id === session.currentPromptId);
  const cards = useMemo(() => buildMusicBingoCards(pack, 4), [pack]);

  useEffect(() => {
    if (tvOnly) return undefined;
    localStorage.setItem(MUSIC_BINGO_SESSION_KEY, JSON.stringify(session));
    return undefined;
  }, [session, tvOnly]);

  useEffect(() => {
    if (!tvOnly) return undefined;
    const refresh = () => {
      const latest = readStoredSession(MUSIC_BINGO_SESSION_KEY);
      if (latest) setSession(latest);
    };
    const intervalId = window.setInterval(refresh, 500);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, [tvOnly]);

  const choosePack = (packId) => setSession(createMusicBingoSession({ packId }));
  const callNext = () => setSession((current) => callMusicPrompt(current, pack));

  const promptBoard = (
    <div className="grid gap-2 md:grid-cols-5">
      {pack.prompts.slice(0, 25).map((prompt) => {
        const called = session.calledPromptIds.includes(prompt.id);
        return (
          <div className={`rounded-lg border p-3 text-center text-lg font-black ${called ? 'border-[#f3d45d] bg-[#f3d45d] text-[#2a1037]' : 'border-white/20 bg-white/10'}`} key={prompt.id}>
            {prompt.label}
          </div>
        );
      })}
    </div>
  );

  return (
    <GameShell
      game={game}
      hint={tvOnly ? 'TV prompt board. Called prompts are marked for the group.' : 'Music Trivia Bingo Host Desk. Choose a music pack, print resident cards, and call prompts.'}
      tvOnly={tvOnly}
      controls={!tvOnly && <button className="app-button app-button-primary" onClick={() => window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer')} type="button"><ExternalLink size={16} /> Launch TV</button>}
    >
      {tvOnly && (
        <>
          <div className="mb-5 rounded-lg bg-[#ffdfef] p-7 text-center text-[#2a1037]">
            <p className="text-xl font-black">Current prompt</p>
            <p className="mt-4 text-5xl font-black leading-tight">{currentPrompt?.label || 'Waiting for host'}</p>
          </div>
          {promptBoard}
        </>
      )}
      {!tvOnly && (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <section className="rounded-lg bg-white p-4 text-[#2a1037]">
            <h3 className="text-2xl font-black">Host Setup</h3>
            <select className="app-input mt-3" onChange={(event) => choosePack(event.target.value)} value={session.packId}>
              {MUSIC_BINGO_PACKS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="app-button app-button-primary mt-4 w-full" onClick={callNext} type="button">Call Next Prompt</button>
            <button className="app-button app-button-secondary mt-2 w-full" onClick={() => setSession(createMusicBingoSession({ packId: session.packId }))} type="button"><RotateCcw size={16} /> Reset Caller</button>
            <button className="app-button app-button-secondary mt-2 w-full" onClick={() => window.print()} type="button"><Printer size={16} /> Print Cards</button>
            <div className="mt-4 rounded-lg bg-[#ffdfef] p-4">
              <p className="text-sm font-black">Current prompt</p>
              <p className="mt-2 text-3xl font-black">{currentPrompt?.label || 'Not started'}</p>
              <p className="mt-2 text-sm font-bold">{currentPrompt?.hint || 'Choose a pack and call the first prompt.'}</p>
            </div>
          </section>
          <section className="rounded-lg bg-white p-4 text-[#2a1037]">
            <h3 className="text-2xl font-black">Printable Resident Cards</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {cards.map((card) => (
                <div className="rounded-lg border border-[#ded0f2] p-2" key={card.id}>
                  <p className="mb-2 text-center text-sm font-black">{pack.name}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {card.squares.map((square, index) => (
                      <div className="grid min-h-12 place-items-center rounded border border-[#ded0f2] p-1 text-center text-[10px] font-bold" key={`${square.id}-${index}`}>
                        {square.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </GameShell>
  );
}

function JeopardyTrivia({ game, tvOnly }) {
  const storedSession = useMemo(() => readStoredSession(JEOPARDY_SESSION_KEY), []);
  const [session, setSession] = useState(storedSession || createJeopardySession());
  const [hostEmail, setHostEmail] = useState('');
  const [showJeopardyAnswer, setShowJeopardyAnswer] = useState(false);
  const pack = JEOPARDY_PACKS.find((item) => item.id === session.packId) || JEOPARDY_PACKS[0];
  const selectedClue = pack.categories.flatMap((category) => category.clues).find((clue) => clue.id === session.selectedClueId);
  const answerKeyText = buildJeopardyAnswerKeyText(pack);

  useEffect(() => {
    if (tvOnly) return undefined;
    localStorage.setItem(JEOPARDY_SESSION_KEY, JSON.stringify(session));
    return undefined;
  }, [session, tvOnly]);

  useEffect(() => {
    if (!tvOnly) return undefined;
    const refresh = () => {
      const latest = readStoredSession(JEOPARDY_SESSION_KEY);
      if (latest) setSession(latest);
    };
    const intervalId = window.setInterval(refresh, 500);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, [tvOnly]);

  const updateTeamCount = (count) => {
    const names = Array.from({ length: Number(count) }, (_, index) => session.teams[index]?.name || `Team ${index + 1}`);
    setSession((current) => createJeopardySession({
      packId: current.packId,
      teamNames: names,
      subtractWrong: current.subtractWrong,
      showQuestionOnTv: current.showQuestionOnTv,
      answersVisible: current.answersVisible,
    }));
  };

  const updateTeamName = (teamId, name) => {
    setSession((current) => ({ ...current, teams: current.teams.map((team) => (team.id === teamId ? { ...team, name } : team)) }));
  };

  const choosePack = (packId) => {
    setSession((current) => createJeopardySession({
      packId,
      teamNames: current.teams.map((team) => team.name),
      subtractWrong: current.subtractWrong,
      showQuestionOnTv: current.showQuestionOnTv,
      answersVisible: current.answersVisible,
    }));
  };

  const startGame = () => setSession((current) => ({ ...current, phase: 'board' }));
  const selectClue = (clue) => {
    setShowJeopardyAnswer(false);
    setSession((current) => selectJeopardyClue(current, clue.id));
  };
  const gradeClue = (teamId, isCorrect) => {
    if (!selectedClue) return;
    setSession((current) => markJeopardyAnswer(current, selectedClue, teamId, isCorrect));
  };
  const startFinal = () => setSession((current) => ({ ...current, phase: 'final' }));
  const endGame = () => {
    setSession((current) => ({
      ...current,
      phase: 'ended',
      winnerTeamId: current.teams.reduce((winner, team) => (team.score > winner.score ? team : winner), current.teams[0]).id,
    }));
  };

  const board = (
    <div className="grid gap-2 md:grid-cols-5">
      {pack.categories.map((category) => (
        <div className="space-y-2" key={category.id}>
          <div className="rounded-lg bg-[#0c3c8c] p-3 text-center text-xl font-black text-[#f3d45d]">{category.name}</div>
          {category.clues.map((clue) => {
            const used = session.usedClueIds.includes(clue.id);
            return (
              <button className={`w-full rounded-lg p-4 text-4xl font-black ${used ? 'bg-white/10 text-white/40' : 'bg-[#f3d45d] text-[#061f4f]'}`} disabled={tvOnly || used} key={clue.id} onClick={() => selectClue(clue)} type="button">
                {used ? '✓' : clue.value}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <GameShell
      game={game}
      hint={tvOnly ? 'TV board. Host controls the game from the laptop.' : 'Jeopardy Host Control Desk. Set teams, choose a pack, launch the TV board, and keep answers private.'}
      tvOnly={tvOnly}
      controls={!tvOnly && <button className="app-button app-button-primary" onClick={() => window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer')} type="button"><ExternalLink size={16} /> Launch TV</button>}
    >
      {tvOnly && session.phase === 'setup' && (
        <div className="grid min-h-[60vh] place-items-center rounded-lg bg-[#0c3c8c] p-8 text-center">
          <div><p className="text-7xl font-black">{pack.name}</p><p className="mt-6 text-3xl font-black text-[#f3d45d]">Waiting for host</p></div>
        </div>
      )}
      {tvOnly && session.phase === 'board' && board}
      {tvOnly && session.phase === 'clue' && selectedClue && (
        <div className="grid min-h-[60vh] place-items-center rounded-lg bg-[#0c3c8c] p-8 text-center">
          <p className="text-6xl font-black leading-tight">{session.showQuestionOnTv ? selectedClue.question : 'Host is reading the clue'}</p>
        </div>
      )}
      {tvOnly && session.phase === 'final' && (
        <div className="grid min-h-[60vh] place-items-center rounded-lg bg-[#0c3c8c] p-8 text-center">
          <div><p className="text-6xl font-black text-[#f3d45d]">Final Jeopardy</p><p className="mt-5 text-5xl font-black">{pack.final.question}</p></div>
        </div>
      )}
      {tvOnly && session.phase === 'ended' && (
        <div className="grid min-h-[60vh] place-items-center rounded-lg bg-[#0c3c8c] p-8 text-center">
          <p className="text-7xl font-black">{session.teams.find((team) => team.id === session.winnerTeamId)?.name || 'Winner'} Wins</p>
        </div>
      )}
      {!tvOnly && (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <section className="rounded-lg bg-white p-4 text-[#061f4f]">
            <h3 className="text-2xl font-black">Host Setup</h3>
            <select className="app-input mt-3" onChange={(event) => choosePack(event.target.value)} value={session.packId}>
              {JEOPARDY_PACKS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <label className="mt-3 block text-sm font-bold">Teams
              <select className="app-input mt-1" onChange={(event) => updateTeamCount(event.target.value)} value={session.teams.length}>
                {[2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </label>
            {session.teams.map((team) => (
              <input className="app-input mt-2" key={team.id} onChange={(event) => updateTeamName(team.id, event.target.value)} value={team.name} />
            ))}
            <label className="mt-3 flex gap-2 text-sm font-bold"><input checked={session.subtractWrong} onChange={(event) => setSession((current) => ({ ...current, subtractWrong: event.target.checked }))} type="checkbox" /> Wrong answers subtract points</label>
            <label className="mt-2 flex gap-2 text-sm font-bold"><input checked={session.showQuestionOnTv} onChange={(event) => setSession((current) => ({ ...current, showQuestionOnTv: event.target.checked }))} type="checkbox" /> Show question on TV</label>
            <label className="mt-2 flex gap-2 text-sm font-bold"><input checked={session.answersVisible} onChange={(event) => setSession((current) => ({ ...current, answersVisible: event.target.checked }))} type="checkbox" /> Keep answers visible</label>
            <button className="app-button app-button-primary mt-3" onClick={startGame} type="button">Start Game</button>
            <input className="app-input mt-4" onChange={(event) => setHostEmail(event.target.value)} placeholder="Host email" value={hostEmail} />
            <div className="mt-3 flex flex-wrap gap-2">
              <a className={`app-button app-button-primary ${hostEmail ? '' : 'pointer-events-none opacity-50'}`} href={hostEmail ? buildJeopardyAnswerKeyMailto(pack, hostEmail) : '#'}><Mail size={16} /> Email Key</a>
              <button className="app-button app-button-secondary" onClick={() => window.print()} type="button"><Printer size={16} /> Print Key</button>
            </div>
          </section>
          <section className="rounded-lg bg-white p-4 text-[#061f4f]">
            <h3 className="text-2xl font-black">Host Board</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              {session.teams.map((team) => (
                <button className={`rounded-lg border p-3 text-left ${session.activeTeamId === team.id ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2]'}`} key={team.id} onClick={() => setSession((current) => ({ ...current, activeTeamId: team.id }))} type="button">
                  <p className="font-black">{team.name}</p><p className="text-3xl font-black">{team.score}</p>
                </button>
              ))}
            </div>
            {session.phase !== 'clue' && <div className="mt-4">{board}</div>}
            {session.phase === 'clue' && selectedClue && (
              <div className="mt-4 rounded-lg bg-[#efe4ff] p-4">
                <p className="text-2xl font-black">{selectedClue.question}</p>
                {session.answersVisible || showJeopardyAnswer ? (
                  <p className="mt-2 text-xl font-black text-[#6d4cc2]">Answer: {selectedClue.answer}</p>
                ) : (
                  <button className="app-button app-button-secondary mt-3" onClick={() => setShowJeopardyAnswer(true)} type="button">Show Answer</button>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.teams.map((team) => (
                    <span className="flex gap-2" key={team.id}>
                      <button className="app-button app-button-primary" onClick={() => gradeClue(team.id, true)} type="button">{team.name} Right</button>
                      <button className="app-button app-button-secondary" onClick={() => gradeClue(team.id, false)} type="button">{team.name} Wrong</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="app-button app-button-secondary" onClick={startFinal} type="button">Final Jeopardy</button>
              <button className="app-button app-button-secondary" onClick={endGame} type="button">End Game</button>
            </div>
            <textarea className="mt-4 h-60 w-full rounded-lg border border-[#ded0f2] p-3 text-xs leading-5" readOnly value={answerKeyText} />
          </section>
        </div>
      )}
    </GameShell>
  );
}

function MemoryMatch({ game, tvOnly }) {
  const storedSession = useMemo(() => readStoredSession(MEMORY_MATCH_SESSION_KEY), []);
  const [session, setSession] = useState(storedSession || createMemorySession());
  const theme = MEMORY_MATCH_THEMES.find((item) => item.id === session.themeId) || MEMORY_MATCH_THEMES[0];
  const deck = useMemo(() => buildMemoryDeck(theme, session.difficulty), [theme, session.difficulty]);

  useEffect(() => {
    if (tvOnly) return undefined;
    localStorage.setItem(MEMORY_MATCH_SESSION_KEY, JSON.stringify(session));
    return undefined;
  }, [session, tvOnly]);

  useEffect(() => {
    if (!tvOnly) return undefined;
    const refresh = () => {
      const latest = readStoredSession(MEMORY_MATCH_SESSION_KEY);
      if (latest) setSession(latest);
    };
    const intervalId = window.setInterval(refresh, 500);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh);
    };
  }, [tvOnly]);

  const updateSession = (updates) => setSession((current) => ({ ...current, ...updates, flippedCardIds: [], matchedLabels: [] }));
  const flipCard = (card) => {
    if (session.flippedCardIds.includes(card.id) || session.matchedLabels.includes(card.label) || session.flippedCardIds.length >= 2) return;
    const next = [...session.flippedCardIds, card.id];
    const first = deck.find((item) => item.id === next[0]);
    const isMatch = next.length === 2 && first?.label === card.label;
    setSession((current) => ({
      ...current,
      flippedCardIds: isMatch ? [] : next,
      matchedLabels: isMatch ? [...current.matchedLabels, card.label] : current.matchedLabels,
    }));
    if (next.length === 2 && !isMatch) {
      window.setTimeout(() => setSession((current) => ({ ...current, flippedCardIds: [] })), 900);
    }
  };

  const cardGrid = (
    <div className="grid grid-cols-4 gap-3">
      {deck.map((card) => {
        const isOpen = session.revealAll || session.flippedCardIds.includes(card.id) || session.matchedLabels.includes(card.label);
        return (
          <button className={`aspect-[4/3] rounded-lg border-4 text-center font-black shadow-lg ${isOpen ? 'border-[#f3d45d] bg-[#f3d45d] text-[#113d36]' : 'border-white/20 bg-[#1d675c] text-white'}`} disabled={tvOnly} key={card.id} onClick={() => flipCard(card)} type="button">
            <span className="block text-6xl">{isOpen ? card.icon : '❋'}</span>
            {session.showWords && <span className="mt-2 block text-xl">{isOpen ? card.label : 'Pick'}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <GameShell
      game={game}
      hint={tvOnly ? 'TV card grid. Host controls matching from the laptop.' : 'Memory Match Host Desk. Choose theme, difficulty, and picture/word options.'}
      tvOnly={tvOnly}
      controls={!tvOnly && <button className="app-button app-button-primary" onClick={() => window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer')} type="button"><ExternalLink size={16} /> Launch TV</button>}
    >
      {tvOnly && cardGrid}
      {!tvOnly && (
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <section className="rounded-lg bg-white p-4 text-[#113d36]">
            <h3 className="text-2xl font-black">Host Setup</h3>
            <select className="app-input mt-3" onChange={(event) => updateSession({ themeId: event.target.value })} value={session.themeId}>
              {MEMORY_MATCH_THEMES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="app-input mt-3" onChange={(event) => updateSession({ difficulty: event.target.value })} value={session.difficulty}>
              <option value="easy">Easy: 8 cards</option>
              <option value="medium">Medium: 12 cards</option>
              <option value="hard">Hard: 16 cards</option>
            </select>
            <label className="mt-3 flex gap-2 text-sm font-bold"><input checked={session.showWords} onChange={(event) => setSession((current) => ({ ...current, showWords: event.target.checked }))} type="checkbox" /> Show words with pictures</label>
            <label className="mt-2 flex gap-2 text-sm font-bold"><input checked={session.revealAll} onChange={(event) => setSession((current) => ({ ...current, revealAll: event.target.checked }))} type="checkbox" /> Reveal all as hint</label>
            <button className="app-button app-button-secondary mt-4 w-full" onClick={() => setSession(createMemorySession({ themeId: session.themeId, difficulty: session.difficulty, showWords: session.showWords }))} type="button"><RotateCcw size={16} /> Restart Game</button>
            <p className="mt-4 text-sm font-bold text-[#5a4873]">Matched pairs: {session.matchedLabels.length}</p>
          </section>
          <section className="rounded-lg bg-[#174f46] p-4">
            {cardGrid}
          </section>
        </div>
      )}
    </GameShell>
  );
}

function ActiveGame({ game, tvOnly }) {
  if (game.id === 'family-feud') return <FamilyFeudGame game={game} tvOnly={tvOnly} />;
  if (game.id === 'music-trivia-bingo') return <MusicTriviaBingo game={game} tvOnly={tvOnly} />;
  if (game.id === 'jeopardy-trivia') return <JeopardyTrivia game={game} tvOnly={tvOnly} />;
  if (game.id === 'memory-match') return <MemoryMatch game={game} tvOnly={tvOnly} />;
  return <BingoCaller game={game} tvOnly={tvOnly} />;
}

export default function Games({ tvOnly = false }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();
  const selectedGameId = gameId || state.activeGameId || 'bingo-caller';
  const selectedGame = useMemo(() => getGameById(selectedGameId), [selectedGameId]);

  const selectGame = (game) => {
    dispatch({ type: 'launchGame', gameId: game.id });
    navigate(game.hostPath);
  };

  const launchTvWindow = (game) => {
    window.open(game.tvPath, `director-game-${game.id}`, 'popup=yes,width=1400,height=850,noopener,noreferrer');
  };

  if (tvOnly) {
    return <ActiveGame game={selectedGame} tvOnly />;
  }

  return (
    <>
      <SectionHeader
        eyebrow="Games"
        title="Staff-Hosted Group Games"
        actions={<button className="app-button app-button-primary" onClick={() => launchTvWindow(selectedGame)} type="button"><ExternalLink size={16} /> Launch TV Window</button>}
      >
        Pick a game here, then launch a separate game-only window for the TV. The TV window keeps oversized text, keyboard controls, and no portal sidebar.
      </SectionHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {GAME_LIBRARY.map((game) => (
          <button className={`rounded-lg border p-4 text-left transition ${selectedGame.id === game.id ? 'border-[#6d4cc2] bg-[#efe4ff]' : 'border-[#ded0f2] bg-white hover:border-[#6d4cc2]'}`} key={game.id} onClick={() => selectGame(game)} type="button">
            {game.type === 'matching' ? <Blocks className="text-[#6d4cc2]" /> : <Trophy className="text-[#6d4cc2]" />}
            <p className="mt-3 text-lg font-black text-[#25183f]">{game.name}</p>
            <p className="mt-1 text-sm leading-5 text-[#74638d]">{game.description}</p>
            <button className="app-button app-button-secondary mt-3" onClick={(event) => { event.stopPropagation(); launchTvWindow(game); }} type="button"><ExternalLink size={15} /> TV</button>
          </button>
        ))}
      </div>

      <ActiveGame game={selectedGame} />
    </>
  );
}
