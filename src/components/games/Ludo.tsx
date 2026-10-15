"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Trophy, Sparkles, ShieldCheck, Dices } from "lucide-react";

type PlayerColor = "red" | "green" | "yellow" | "blue";
type TokenPosition = number; // -1 = yard, 0–51 = shared track, 52–57 = home lane, 58 = finished.
type Token = { player: number; token: number };

const COLORS: PlayerColor[] = ["red", "green", "yellow", "blue"];
const PLAYER_NAMES = ["Ruby", "Emerald", "Amber", "Sapphire"];

const COLOR_STYLES: Record<PlayerColor, {
  token: string; lane: string; base: string; ring: string; label: string;
  glow: string; solid: string; soft: string;
}> = {
  red: {
    token: "from-rose-400 to-red-600 text-white", lane: "bg-rose-200",
    base: "bg-rose-500/15", ring: "ring-rose-300", label: "text-rose-300",
    glow: "shadow-[0_0_18px_rgba(244,63,94,.45)]", solid: "bg-rose-500", soft: "bg-rose-500/10",
  },
  green: {
    token: "from-emerald-300 to-emerald-600 text-white", lane: "bg-emerald-200",
    base: "bg-emerald-500/15", ring: "ring-emerald-300", label: "text-emerald-300",
    glow: "shadow-[0_0_18px_rgba(16,185,129,.4)]", solid: "bg-emerald-500", soft: "bg-emerald-500/10",
  },
  yellow: {
    token: "from-yellow-200 to-amber-500 text-slate-950", lane: "bg-amber-200",
    base: "bg-amber-400/15", ring: "ring-amber-200", label: "text-amber-200",
    glow: "shadow-[0_0_18px_rgba(251,191,36,.4)]", solid: "bg-amber-400", soft: "bg-amber-400/10",
  },
  blue: {
    token: "from-sky-300 to-blue-600 text-white", lane: "bg-sky-200",
    base: "bg-sky-500/15", ring: "ring-sky-300", label: "text-sky-300",
    glow: "shadow-[0_0_18px_rgba(56,189,248,.4)]", solid: "bg-sky-500", soft: "bg-sky-500/10",
  },
};

const TRACK: [number, number][] = [
  ...Array.from({ length: 13 }, (_, i): [number, number] => [0, i + 1]),
  ...Array.from({ length: 13 }, (_, i): [number, number] => [i + 1, 14]),
  ...Array.from({ length: 13 }, (_, i): [number, number] => [14, 13 - i]),
  ...Array.from({ length: 13 }, (_, i): [number, number] => [13 - i, 0]),
];
const START_INDEX = [32, 45, 6, 19];
const SAFE_INDEXES = new Set(START_INDEX);
const HOME_LANES: [number, number][][] = [
  Array.from({ length: 6 }, (_, i): [number, number] => [13 - i, 7]),
  Array.from({ length: 6 }, (_, i): [number, number] => [7, i + 1]),
  Array.from({ length: 6 }, (_, i): [number, number] => [i + 1, 7]),
  Array.from({ length: 6 }, (_, i): [number, number] => [7, 13 - i]),
];
const YARD_SPOTS: [number, number][][] = [
  [[10, 2], [10, 4], [12, 2], [12, 4]],
  [[2, 2], [2, 4], [4, 2], [4, 4]],
  [[2, 10], [2, 12], [4, 10], [4, 12]],
  [[10, 10], [10, 12], [12, 10], [12, 12]],
];
const TRACK_INDEX = new Map(TRACK.map(([r, c], i) => [`${r},${c}`, i]));
const LANE_COLOR = new Map<string, number>();
HOME_LANES.forEach((lane, player) => lane.forEach(([r, c]) => LANE_COLOR.set(`${r},${c}`, player)));

function positionSquare(player: number, progress: TokenPosition): [number, number] | null {
  if (progress < 0) return null;
  if (progress < 52) return TRACK[(START_INDEX[player] + progress) % 52];
  if (progress < 58) return HOME_LANES[player][progress - 52];
  return [7, 7];
}
function newTokens(playerCount: number): TokenPosition[][] {
  return COLORS.slice(0, playerCount).map(() => [-1, -1, -1, -1]);
}

const DIE_DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceFace({ value, rolling = false }: { value: number; rolling?: boolean }) {
  return (
    <motion.div
      animate={rolling ? { rotateX: [0, 180, 360, 540], rotateY: [0, 270, 450, 720], rotateZ: [0, 18, -18, 0], scale: [1, 1.12, 0.94, 1] } : { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 }}
      transition={rolling ? { duration: 0.72, repeat: Infinity, ease: "linear" } : { type: "spring", stiffness: 240, damping: 13 }}
      className="relative grid aspect-square w-[clamp(3.25rem,10vw,4.5rem)] grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl border border-white/80 bg-gradient-to-br from-white via-slate-100 to-slate-300 p-2.5 shadow-[0_10px_25px_rgba(0,0,0,.38),inset_0_2px_3px_rgba(255,255,255,.95),inset_0_-3px_5px_rgba(15,23,42,.12)]"
      style={{ transformStyle: "preserve-3d" }}
      aria-label={`Dice showing ${value}`}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const visible = DIE_DOTS[value]?.some(([r, c]) => r === row && c === col);
        return <span key={i} className={`rounded-full ${visible ? "bg-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,.18)]" : "bg-transparent"}`} />;
      })}
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
    </motion.div>
  );
}

export function Ludo() {
  const [playerCount, setPlayerCount] = useState(4);
  const [tokens, setTokens] = useState<TokenPosition[][]>(() => newTokens(4));
  const [turn, setTurn] = useState(0);
  const [die, setDie] = useState<number | null>(null);
  const [rollingFace, setRollingFace] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [message, setMessage] = useState("Roll a six to bring your first token onto the board.");
  const [winner, setWinner] = useState<number | null>(null);
  const [lastEvent, setLastEvent] = useState("YOUR MOVE");
  const [moveCount, setMoveCount] = useState(0);

  useEffect(() => {
    if (!isRolling) return;
    const interval = window.setInterval(() => setRollingFace(Math.floor(Math.random() * 6) + 1), 85);
    return () => window.clearInterval(interval);
  }, [isRolling]);

  const legalTokens = useMemo(() => {
    if (die === null || winner !== null) return [];
    return tokens[turn].flatMap((progress, token) => {
      if (progress === -1) return die === 6 ? [token] : [];
      return progress + die <= 58 ? [token] : [];
    });
  }, [die, tokens, turn, winner]);

  const resetGame = (count = playerCount) => {
    setPlayerCount(count);
    setTokens(newTokens(count));
    setTurn(0);
    setDie(null);
    setIsRolling(false);
    setWinner(null);
    setMoveCount(0);
    setLastEvent("NEW GAME");
    setMessage("Roll a six to bring your first token onto the board.");
  };

  const rollDie = () => {
    if (die !== null || isRolling || winner !== null) return;
    setIsRolling(true);
    setLastEvent("ROLLING…");
    const result = Math.floor(Math.random() * 6) + 1;
    window.setTimeout(() => {
      setIsRolling(false);
      setDie(result);
      setRollingFace(result);
      setLastEvent(result === 6 ? "LUCKY SIX!" : `ROLLED ${result}`);
      setMessage(`${PLAYER_NAMES[turn]} rolled ${result}.${result === 6 ? " Choose a token — you get another roll after moving." : ""}`);
    }, 850);
  };

  const passTurn = () => {
    if (die === null || legalTokens.length > 0 || winner !== null) return;
    const next = (turn + 1) % playerCount;
    setMessage(`${PLAYER_NAMES[turn]} has no legal move. ${PLAYER_NAMES[next]}'s turn.`);
    setLastEvent("TURN PASSED");
    setDie(null);
    setTurn(next);
  };

  const moveToken = (tokenIndex: number) => {
    if (die === null || !legalTokens.includes(tokenIndex) || winner !== null) return;
    const rolled = die;
    const progress = tokens[turn][tokenIndex] === -1 ? 0 : tokens[turn][tokenIndex] + rolled;
    const nextTokens = tokens.map(playerTokens => [...playerTokens]);
    nextTokens[turn][tokenIndex] = progress;
    let captured = false;

    if (progress < 52) {
      const targetIndex = (START_INDEX[turn] + progress) % 52;
      if (!SAFE_INDEXES.has(targetIndex)) {
        nextTokens.forEach((playerTokens, player) => {
          if (player === turn) return;
          playerTokens.forEach((opponentProgress, opponentToken) => {
            if (opponentProgress >= 0 && opponentProgress < 52 &&
              (START_INDEX[player] + opponentProgress) % 52 === targetIndex) {
              playerTokens[opponentToken] = -1;
              captured = true;
            }
          });
        });
      }
    }

    setTokens(nextTokens);
    setDie(null);
    setMoveCount(count => count + 1);
    const hasWon = nextTokens[turn].every(p => p === 58);
    if (hasWon) {
      setWinner(turn);
      setLastEvent("CHAMPION!");
      setMessage(`${PLAYER_NAMES[turn]} wins the game!`);
      return;
    }

    const extraTurn = rolled === 6 || captured;
    const nextTurn = extraTurn ? turn : (turn + 1) % playerCount;
    setTurn(nextTurn);
    if (captured) {
      setLastEvent("TOKEN CAPTURED");
      setMessage(`${PLAYER_NAMES[turn]} captured a token! ${extraTurn ? "Roll again." : `${PLAYER_NAMES[nextTurn]}'s turn.`}`);
    } else if (progress === 58) {
      setLastEvent("HOME RUN");
      setMessage(`${PLAYER_NAMES[turn]} got a token home! ${extraTurn ? "Roll again." : `${PLAYER_NAMES[nextTurn]}'s turn.`}`);
    } else {
      setLastEvent(rolled === 6 ? "NICE ROLL" : "TOKEN MOVED");
      setMessage(`${PLAYER_NAMES[turn]} moved a token. ${extraTurn ? "Roll again!" : `${PLAYER_NAMES[nextTurn]}'s turn.`}`);
    }
  };

  const tokenMap = new Map<string, Token[]>();
  tokens.forEach((playerTokens, player) => playerTokens.forEach((progress, token) => {
    const square = progress === -1 ? YARD_SPOTS[player][token] : positionSquare(player, progress);
    if (!square) return;
    const key = `${square[0]},${square[1]}`;
    tokenMap.set(key, [...(tokenMap.get(key) ?? []), { player, token }]);
  }));

  const basePlayerAt = (row: number, col: number) => {
    if (row < 6 && col < 6) return 1;
    if (row < 6 && col > 8) return 2;
    if (row > 8 && col > 8) return 3;
    if (row > 8 && col < 6) return 0;
    return null;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101116] p-3 text-white shadow-[0_24px_90px_rgba(0,0,0,.42)] sm:gap-6 sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-950/50">
            <Dices size={25} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ludo Royale</h2>
              <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.18em] text-violet-200">Classic</span>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">A polished pass-and-play board game</p>
          </div>
        </div>
        <button onClick={() => resetGame()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]">
          <RotateCcw size={15} /> New game
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
              Local multiplayer
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {[2, 3, 4].map(count => (
                <button key={count} type="button" aria-pressed={playerCount === count}
                  onClick={() => resetGame(count)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${playerCount === count ? "bg-violet-500 text-white shadow-md shadow-violet-950/50" : "text-slate-400 hover:text-white"}`}>
                  {count}P
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto grid aspect-square w-full max-w-[min(100%,43rem)] grid-cols-[repeat(15,minmax(0,1fr))] overflow-hidden rounded-2xl border-[5px] border-[#252832] bg-[#252832] shadow-[0_16px_45px_rgba(0,0,0,.38)] sm:rounded-3xl sm:border-[7px]">
            {Array.from({ length: 225 }, (_, index) => {
              const row = Math.floor(index / 15);
              const col = index % 15;
              const key = `${row},${col}`;
              const trackIndex = TRACK_INDEX.get(key);
              const lanePlayer = LANE_COLOR.get(key);
              const basePlayer = basePlayerAt(row, col);
              const occupants = tokenMap.get(key) ?? [];
              const safe = trackIndex !== undefined && SAFE_INDEXES.has(trackIndex);
              const isCenter = row === 7 && col === 7;
              const inYard = basePlayer !== null && row >= 1 && row <= 4 && col >= 1 && col <= 4 ||
                basePlayer !== null && row >= 1 && row <= 4 && col >= 10 && col <= 13 ||
                basePlayer !== null && row >= 10 && row <= 13 && col >= 1 && col <= 4 ||
                basePlayer !== null && row >= 10 && row <= 13 && col >= 10 && col <= 13;

              return (
                <div key={key} className={`relative flex min-w-0 items-center justify-center border-[0.5px] border-black/[0.06] ${
                  trackIndex !== undefined ? "bg-gradient-to-br from-slate-50 to-slate-200" :
                  lanePlayer !== undefined ? COLOR_STYLES[COLORS[lanePlayer]].lane :
                  basePlayer !== null ? COLOR_STYLES[COLORS[basePlayer]].base : "bg-[#1b1d25]"
                } ${safe ? "z-[1] ring-1 ring-inset ring-amber-400/80" : ""} ${isCenter ? "bg-[#1b1d25]" : ""}`}>
                  {inYard && basePlayer !== null && (
                    <div className={`absolute inset-[10%] rounded-[18%] border border-white/45 bg-gradient-to-br ${COLOR_STYLES[COLORS[basePlayer]].token} p-[7%] shadow-inner`}>
                      <div className="h-full w-full rounded-[14%] border border-black/10 bg-white/90 shadow-[inset_0_2px_8px_rgba(0,0,0,.13)]" />
                    </div>
                  )}
                  {trackIndex !== undefined && (
                    <span className={`pointer-events-none absolute left-[12%] top-[4%] text-[clamp(4px,.8vw,8px)] font-black ${safe ? "text-amber-500" : "text-slate-400"}`}>
                      {safe ? "★" : ""}
                    </span>
                  )}
                  {isCenter && (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden">
                      <div className="bg-gradient-to-br from-rose-400 to-red-600" />
                      <div className="bg-gradient-to-br from-emerald-300 to-emerald-600" />
                      <div className="bg-gradient-to-br from-amber-200 to-amber-500" />
                      <div className="bg-gradient-to-br from-sky-300 to-blue-600" />
                      <div className="absolute inset-[20%] grid place-items-center rounded-full border-2 border-white/80 bg-[#15161d] text-[clamp(4px,.85vw,9px)] font-black tracking-wider text-white shadow-xl">HOME</div>
                    </div>
                  )}
                  {occupants.length > 0 && (
                    <div className={`absolute inset-0 z-10 grid ${occupants.length > 1 ? "grid-cols-2 grid-rows-2 gap-px p-px" : "place-items-center"} ${occupants.length === 1 ? "p-[5%]" : ""}`}>
                      {occupants.map(({ player, token }) => {
                        const canMove = player === turn && legalTokens.includes(token);
                        const style = COLOR_STYLES[COLORS[player]];
                        return (
                          <motion.button
                            layout
                            key={`${player}-${token}`}
                            type="button"
                            aria-label={`${PLAYER_NAMES[player]} token ${token + 1}${canMove ? ", move token" : ""}`}
                            disabled={!canMove}
                            onClick={() => moveToken(token)}
                            whileHover={canMove ? { scale: 1.15, y: -1 } : undefined}
                            whileTap={canMove ? { scale: 0.88 } : undefined}
                            animate={canMove ? { y: [0, -2, 0] } : { y: 0 }}
                            transition={canMove ? { y: { duration: 0.8, repeat: Infinity }, layout: { type: "spring", stiffness: 320, damping: 25 } } : { layout: { type: "spring", stiffness: 320, damping: 25 } }}
                            className={`relative flex min-h-0 min-w-0 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br ${style.token} text-[clamp(5px,1.1vw,10px)] font-black shadow-[0_3px_0_rgba(0,0,0,.28),0_5px_10px_rgba(0,0,0,.22)] ${canMove ? `z-20 cursor-pointer ring-2 ${style.ring} ${style.glow}` : "cursor-default"} ${occupants.length > 1 ? "m-[2%]" : "h-full w-full"}`}
                          >
                            <span className="absolute inset-[18%] rounded-full border border-white/35" />
                            <span className="relative drop-shadow-sm">{token + 1}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">★ Safe square · Select a glowing token after rolling to move it</p>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Current turn</span>
              {winner !== null && <Trophy size={16} className="text-amber-300" />}
            </div>
            {winner !== null ? (
              <div className="py-3 text-center">
                <Trophy className="mx-auto mb-2 text-amber-300" size={36} />
                <p className="text-xl font-black">{PLAYER_NAMES[winner]} wins!</p>
                <p className="mt-1 text-xs text-slate-400">A royal finish.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${COLOR_STYLES[COLORS[turn]].soft} ${COLOR_STYLES[COLORS[turn]].label}`}>
                  <span className={`h-4 w-4 rounded-full ${COLOR_STYLES[COLORS[turn]].solid} shadow-lg`} />
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xl font-black ${COLOR_STYLES[COLORS[turn]].label}`}>{PLAYER_NAMES[turn]}</p>
                  <p className="text-xs text-slate-400">{die !== null ? "Choose a highlighted token" : isRolling ? "Rolling the dice…" : "Ready to roll"}</p>
                </div>
              </div>
            )}
            <div className="my-4 h-px bg-white/[0.08]" />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Dice roll</p>
                <p className="mt-1 text-sm font-bold text-white">{isRolling ? "Rolling…" : die !== null ? `You rolled ${die}` : "Your move awaits"}</p>
                <p className="mt-1 text-[10px] text-slate-500">Move with a six to start</p>
              </div>
              <DiceFace value={isRolling ? rollingFace : die ?? rollingFace} rolling={isRolling} />
            </div>
            <button type="button" onClick={rollDie} disabled={die !== null || isRolling || winner !== null}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-extrabold shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40">
              <Dices size={18} />
              {winner !== null ? "Game finished" : isRolling ? "Rolling dice…" : die !== null ? "Choose a token" : `Roll ${PLAYER_NAMES[turn]}'s dice`}
            </button>
            {die !== null && legalTokens.length === 0 && (
              <button type="button" onClick={passTurn} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08]">Pass turn</button>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5">
              <Sparkles size={14} className="shrink-0 text-violet-300" />
              <span className="text-xs font-semibold text-slate-300">{lastEvent}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">Players</h3>
              <span className="text-[10px] text-slate-600">{playerCount} players</span>
            </div>
            <div className="space-y-2">
              {COLORS.slice(0, playerCount).map((color, player) => {
                const home = tokens[player].filter(progress => progress === 58).length;
                const active = tokens[player].filter(progress => progress >= 0).length;
                return (
                  <div key={color} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${turn === player && winner === null ? "border-white/15 bg-white/[0.06]" : "border-transparent bg-black/10"}`}>
                    <span className={`h-3 w-3 shrink-0 rounded-full ${COLOR_STYLES[color].solid} ${turn === player && winner === null ? "ring-4 ring-white/5" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold ${COLOR_STYLES[color].label}`}>{PLAYER_NAMES[player]}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{active} on board · {home} home</p>
                    </div>
                    <div className="flex gap-1" aria-label={`${home} of 4 tokens home`}>
                      {Array.from({ length: 4 }, (_, i) => <span key={i} className={`h-1.5 w-3 rounded-full ${i < home ? COLOR_STYLES[color].solid : "bg-white/10"}`} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" />
            <p className="text-[11px] leading-relaxed text-slate-500">Classic rules: roll a six to leave the yard, capture opponents on non-safe squares, and reach home with an exact roll.</p>
          </div>
        </aside>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={message} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center text-sm text-slate-300" aria-live="polite">
          {message}
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-600">
        <span>{moveCount} moves played</span><span>•</span><span>2–4 players</span><span>•</span><span>Pass and play</span>
      </div>
    </motion.section>
  );
}
