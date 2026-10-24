"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw, Star, Gem, Trophy, Move, Zap, Heart, Target, Sparkles,
  Gift, Flame, Crown, Shuffle, Clock3, ChevronRight, WandSparkles
} from "lucide-react";
import { ScoreLeaderboard } from "./ScoreLeaderboard";

const GRID_SIZE = 8;
const COLOR_COUNT = 6;
const TILE_COLORS = ["#ff4fa3", "#42d9ff", "#6ce66b", "#ffc857", "#aa78ff", "#ff6b70"];
const COLOR_NAMES = ["Berry", "Aqua", "Lime", "Lemon", "Grape", "Cherry"];
type Tile = { id: number; color: number; special?: "row" | "column" | "bomb" | "rainbow"; jelly?: boolean; blocker?: boolean };
type Cell = Tile | null;
type GoalType = "score" | "collect" | "jelly" | "combo";
type LevelConfig = { level: number; goal: GoalType; target: number; moves: number; colors: number; blockers: number; jellies: number; title: string; intro: string };

const makeLevel = (level: number): LevelConfig => {
  const goals: GoalType[] = ["score", "collect", "jelly", "combo"];
  const goal = level <= 2 ? "score" : goals[(level - 1) % goals.length];
  return {
    level, goal,
    target: goal === "score" ? 1000 + level * 650
      : goal === "collect" ? 10 + level * 2
      : goal === "jelly" ? 8 + level * 2 : 2 + Math.floor(level / 2),
    moves: Math.max(12, 24 - Math.floor(level * 0.7)),
    colors: Math.min(6, 4 + Math.floor((level - 1) / 3)),
    blockers: level < 4 ? 0 : Math.min(12, Math.floor((level - 2) * 1.4)),
    jellies: goal === "jelly" ? 8 + level * 2 : level >= 5 ? Math.min(16, 3 + level) : 0,
    title: ["Sugar Rush", "Bubble Bay", "Jelly Jungle", "Comet Crush", "Candy Castle", "Neon Nebula"][Math.min(5, Math.floor((level - 1) / 3))],
    intro: ["Warm up your sweet tooth.", "Make matches and build a streak.", "Clear the jelly before you run out of moves.", "Special candies are your secret weapon."][Math.min(3, Math.floor((level - 1) / 4))]
  };
};

const uid = (() => { let next = 1; return () => next++; })();
const makeTile = (color: number, extra: Partial<Tile> = {}): Tile => ({ id: uid(), color, ...extra });
const cloneBoard = (board: Cell[][]): Cell[][] => board.map(row => row.map(cell => cell ? { ...cell } : null));

function findMatches(board: Cell[][]): Set<string> {
  const matched = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    let c = 0;
    while (c < GRID_SIZE) {
      const color = board[r][c]?.color;
      if (color === undefined || board[r][c]?.blocker) { c++; continue; }
      let end = c + 1;
      while (end < GRID_SIZE && board[r][end]?.color === color && !board[r][end]?.blocker) end++;
      if (end - c >= 3) for (let x = c; x < end; x++) matched.add(`${r},${x}`);
      c = end;
    }
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let r = 0;
    while (r < GRID_SIZE) {
      const color = board[r][c]?.color;
      if (color === undefined || board[r][c]?.blocker) { r++; continue; }
      let end = r + 1;
      while (end < GRID_SIZE && board[end][c]?.color === color && !board[end][c]?.blocker) end++;
      if (end - r >= 3) for (let y = r; y < end; y++) matched.add(`${y},${c}`);
      r = end;
    }
  }
  return matched;
}

function hasPossibleMove(board: Cell[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= GRID_SIZE || cc >= GRID_SIZE || board[r][c]?.blocker || board[rr][cc]?.blocker) continue;
      const copy = cloneBoard(board);
      [copy[r][c], copy[rr][cc]] = [copy[rr][cc], copy[r][c]];
      if (findMatches(copy).size > 0) return true;
    }
  }
  return false;
}

function createBoard(level: LevelConfig): Cell[][] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const board: Cell[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
      const candidates = Array.from({ length: level.colors }, (_, i) => i).filter(color =>
        !(c >= 2 && board[r][c - 1]?.color === color && board[r][c - 2]?.color === color) &&
        !(r >= 2 && board[r - 1][c]?.color === color && board[r - 2][c]?.color === color));
      board[r][c] = makeTile(candidates[Math.floor(Math.random() * candidates.length)] ?? 0);
    }
    let placed = 0;
    while (placed < level.blockers) {
      const r = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
      const c = 1 + Math.floor(Math.random() * (GRID_SIZE - 2));
      if (board[r][c] && !board[r][c]!.blocker) {
        board[r][c] = { ...board[r][c]!, blocker: true };
        placed++;
      }
    }
    if (level.jellies) {
      let jellyCount = 0;
      for (let r = 1; r < GRID_SIZE - 1 && jellyCount < level.jellies; r++) {
        for (let c = 1; c < GRID_SIZE - 1 && jellyCount < level.jellies; c++) {
          if (!board[r][c]?.blocker && Math.random() > 0.35) {
            board[r][c] = { ...board[r][c]!, jelly: true };
            jellyCount++;
          }
        }
      }
    }
    if (findMatches(board).size === 0 && hasPossibleMove(board)) return board;
  }
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => makeTile(Math.floor(Math.random() * level.colors))));
}

function makeSpecial(match: Set<string>, board: Cell[][], swap: [number, number, number, number]): [number, number, Tile["special"]] | null {
  const cells = [...match].map(key => key.split(",").map(Number) as [number, number]);
  const counts = new Map<number, number>();
  cells.forEach(([r, c]) => counts.set(board[r][c]?.color ?? -1, (counts.get(board[r][c]?.color ?? -1) ?? 0) + 1));
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 5) return [swap[2], swap[3], "rainbow"];
  const rowCounts = new Map<number, number>();
  cells.forEach(([r]) => rowCounts.set(r, (rowCounts.get(r) ?? 0) + 1));
  if ([...rowCounts.values()].some(n => n >= 4)) return [swap[2], swap[3], "row"];
  const colCounts = new Map<number, number>();
  cells.forEach(([, c]) => colCounts.set(c, (colCounts.get(c) ?? 0) + 1));
  if ([...colCounts.values()].some(n => n >= 4)) return [swap[2], swap[3], "column"];
  if (cells.length >= 5) return [swap[2], swap[3], "bomb"];
  return null;
}

export function Match3() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const level = useMemo(() => makeLevel(currentLevel), [currentLevel]);
  const [board, setBoard] = useState<Cell[][]>(() => createBoard(makeLevel(1)));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [goalProgress, setGoalProgress] = useState(0);
  const [selectedTile, setSelectedTile] = useState<{ r: number; c: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [banner, setBanner] = useState("LET'S CRUSH!");
  const [levelWonCount, setLevelWonCount] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastCleared, setLastCleared] = useState<number[]>([]);
  const boardRef = useRef<Cell[][]>(board);
  const runId = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("match3Royale");
      if (saved) {
        const parsed = JSON.parse(saved);
        setHighScore(parsed.highScore ?? 0);
        setLevelWonCount(parsed.levelWonCount ?? 0);
        setCurrentLevel(parsed.currentLevel ?? 1);
      }
    } catch { /* ignore unavailable storage */ }
  }, []);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    setMovesLeft(level.moves);
  }, [level.moves]);

  const persistProgress = useCallback((newHigh: number, newWins: number, newLevel: number) => {
    try { localStorage.setItem("match3Royale", JSON.stringify({ highScore: newHigh, levelWonCount: newWins, currentLevel: newLevel })); } catch { /* private browsing */ }
  }, []);

  const checkWin = useCallback((nextScore: number, nextProgress: number, nextCombo: number) => {
    if (level.goal === "score") return nextScore >= level.target;
    if (level.goal === "collect") return nextProgress >= level.target;
    if (level.goal === "jelly") return nextProgress >= level.target;
    return nextCombo >= level.target;
  }, [level]);

  const processTurn = useCallback(async (startBoard: Cell[][], swap: [number, number, number, number]) => {
    if (busy || gameState !== "playing") return;
    setBusy(true);
    setSelectedTile(null);
    setHint(null);
    let working = cloneBoard(startBoard);
    [working[swap[0]][swap[1]], working[swap[2]][swap[3]]] = [working[swap[2]][swap[3]], working[swap[0]][swap[1]]];
    let matches = findMatches(working);
    if (!matches.size) {
      setBanner("NO MATCH — TRY AGAIN");
      setTimeout(() => setBanner("MAKE A SWEET MOVE"), 650);
      setBusy(false);
      return;
    }

    const newSpecial = makeSpecial(matches, working, swap);
    let totalScore = score;
    let collected = goalProgress;
    let comboCount = 0;
    let chain = 0;
    let current = working;
    const maxChain = 18;
    let firstPass = true;
    let clearedAny = false;

    while (matches.size && chain < maxChain) {
      chain++;
      comboCount++;
      const toClear = new Set(matches);
      matches.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        const tile = current[r][c];
        if (!tile) return;
        if (tile.special === "row") for (let x = 0; x < GRID_SIZE; x++) toClear.add(`${r},${x}`);
        if (tile.special === "column") for (let y = 0; y < GRID_SIZE; y++) toClear.add(`${y},${c}`);
        if (tile.special === "bomb") for (let y = Math.max(0, r - 1); y <= Math.min(GRID_SIZE - 1, r + 1); y++) for (let x = Math.max(0, c - 1); x <= Math.min(GRID_SIZE - 1, c + 1); x++) toClear.add(`${y},${x}`);
        if (tile.special === "rainbow") {
          const targetColor = current[swap[0]][swap[1]]?.color ?? tile.color;
          current.forEach((row, y) => row.forEach((other, x) => { if (other?.color === targetColor) toClear.add(`${y},${x}`); }));
        }
      });

      const beforeClear = cloneBoard(current);
      const next = cloneBoard(current);
      let cleared = 0;
      const clearedColors: number[] = [];
      const jellyCleared: string[] = [];
      toClear.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        const tile = next[r][c];
        if (!tile || tile.blocker) return;
        cleared++;
        clearedColors.push(tile.color);
        if (tile.jelly) jellyCleared.push(key);
        next[r][c] = null;
      });
      if (!cleared) break;
      clearedAny = true;
      setLastCleared(clearedColors);
      if (level.goal === "collect") collected += clearedColors.filter(color => color === 0).length;
      if (level.goal === "jelly") collected += jellyCleared.length;
      totalScore += cleared * 60 * chain + (cleared >= 5 ? 300 : cleared === 4 ? 120 : 0);
      setScore(totalScore);
      setGoalProgress(collected);
      setCombo(comboCount);
      setStreak(chain);
      setBanner(chain > 1 ? `${chain}× CHAIN COMBO!` : cleared >= 5 ? "SUGAR EXPLOSION!" : cleared >= 4 ? "SWEET COMBO!" : "CRUSH!");
      setBoard(beforeClear);
      await new Promise(resolve => setTimeout(resolve, 170));
      current = next;

      // Gravity: compact each column and refill with fresh candy.
      for (let c = 0; c < GRID_SIZE; c++) {
        const survivors: Cell[] = [];
        for (let r = GRID_SIZE - 1; r >= 0; r--) if (current[r][c]) survivors.push(current[r][c]);
        for (let r = GRID_SIZE - 1; r >= 0; r--) current[r][c] = survivors[GRID_SIZE - 1 - r] ?? makeTile(Math.floor(Math.random() * level.colors));
      }
      setBoard(cloneBoard(current));
      await new Promise(resolve => setTimeout(resolve, 210));
      matches = findMatches(current);
      firstPass = false;
    }

    if (!clearedAny) {
      setBusy(false);
      return;
    }
    if (newSpecial && firstPass === false) {
      const [r, c, special] = newSpecial;
      if (current[r][c] && special) {
        current[r][c] = { ...current[r][c]!, special };
        setBoard(cloneBoard(current));
        setBanner(special === "rainbow" ? "RAINBOW CANDY UNLOCKED!" : special === "bomb" ? "CANDY BOMB!" : "POWER CANDY!");
      }
    }

    const newHigh = Math.max(highScore, totalScore);
    setHighScore(newHigh);
    const won = checkWin(totalScore, collected, comboCount);
    if (won) {
      setGameState("won");
      setLevelWonCount(n => {
        const nextWins = n + 1;
        persistProgress(newHigh, nextWins, currentLevel + 1);
        return nextWins;
      });
      setBanner("LEVEL CLEARED!");
    } else {
      setMovesLeft(m => {
        const remaining = m - 1;
        if (remaining <= 0) setGameState("lost");
        return remaining;
      });
    }
    setBoard(cloneBoard(current));
    setBusy(false);
  }, [busy, gameState, score, goalProgress, level, highScore, checkWin, currentLevel, persistProgress]);

  const swapTiles = (r: number, c: number) => {
    if (busy || gameState !== "playing") return;
    if (!selectedTile) { setSelectedTile({ r, c }); return; }
    const { r: sr, c: sc } = selectedTile;
    if (sr === r && sc === c) { setSelectedTile(null); return; }
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) { setSelectedTile({ r, c }); return; }
    const working = cloneBoard(board);
    [working[sr][sc], working[r][c]] = [working[r][c], working[sr][sc]];
    if (!findMatches(working).size) {
      setSelectedTile(null);
      setBanner("NO MATCH — TRY AGAIN");
      return;
    }
    processTurn(board, [sr, sc, r, c]);
  };

  const resetLevel = (toLevel = currentLevel, keepScore = true) => {
    runId.current++;
    const nextLevel = makeLevel(toLevel);
    setCurrentLevel(toLevel);
    const nextBoard = createBoard(nextLevel);
    setBoard(nextBoard);
    boardRef.current = nextBoard;
    setMovesLeft(nextLevel.moves);
    setGameState("playing");
    setGoalProgress(0);
    setSelectedTile(null);
    setCombo(0);
    setStreak(0);
    setHint(null);
    setBusy(false);
    setBanner(nextLevel.intro.toUpperCase());
    if (!keepScore) setScore(0);
  };

  const showHint = () => {
    for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= GRID_SIZE || cc >= GRID_SIZE || board[r][c]?.blocker || board[rr][cc]?.blocker) continue;
      const copy = cloneBoard(board);
      [copy[r][c], copy[rr][cc]] = [copy[rr][cc], copy[r][c]];
      if (findMatches(copy).size) { setHint([r, c]); setBanner("HINT: TRY THIS MOVE"); return; }
    }
    setBoard(createBoard(level));
    setBanner("FRESH BOARD!");
  };

  const progress = level.goal === "score" ? score : goalProgress;
  const progressPct = Math.min(100, (progress / level.target) * 100);
  const goalLabel = level.goal === "score" ? `Reach ${level.target.toLocaleString()} points`
    : level.goal === "collect" ? `Collect ${level.target} Berry candies`
    : level.goal === "jelly" ? `Clear ${level.target} jelly tiles`
    : `Create a ${level.target}× chain combo`;
  const levelTheme = ["#ff4fa3", "#aa78ff", "#42d9ff", "#ffc857"][Math.floor((currentLevel - 1) % 4)];

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#100f18] p-3 text-white shadow-[0_25px_90px_rgba(0,0,0,.42)] sm:gap-5 sm:p-6"
      style={{ "--level-accent": levelTheme } as React.CSSProperties}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 via-violet-500 to-cyan-400 shadow-lg shadow-fuchsia-950/40">
            <WandSparkles size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Candy Chaos</h2>
              <span className="rounded-full border border-pink-300/20 bg-pink-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.18em] text-pink-200">Royale</span>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">Match. Cascade. Conquer.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundOn(v => !v)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${soundOn ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400"}`}>{soundOn ? "Sound ON" : "Sound OFF"}</button>
          <button onClick={() => resetLevel(currentLevel)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/[.08]"><RotateCcw size={14} /> Restart</button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/[.08] bg-white/[.035] p-3">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Level</p>
              <p className="mt-1 text-2xl font-black">{currentLevel}<span className="ml-1 text-xs font-semibold text-slate-500">/ ∞</span></p>
              <p className="truncate text-[10px] font-semibold text-pink-200">{level.title}</p>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.035] p-3">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{score.toLocaleString()}</p>
              <p className="truncate text-[10px] text-slate-500">Best {highScore.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.035] p-3">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Moves</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{movesLeft}</p>
              <p className="truncate text-[10px] text-slate-500">Combo {combo}×</p>
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-white/[.08] bg-gradient-to-r from-white/[.055] to-white/[.015] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-500">Mission briefing</p>
                <p className="mt-1 text-sm font-extrabold">{goalLabel}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{level.intro} Every new level brings a twist.</p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pink-400/10 text-pink-200"><Target size={19} /></div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[.08]">
              <motion.div animate={{ width: `${progressPct}%` }} className="h-full rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[35rem] rounded-[1.4rem] border border-white/[.12] bg-gradient-to-br from-[#252039] to-[#171622] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_20px_50px_rgba(0,0,0,.3)] sm:p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">Candy grid</span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-violet-200"><Sparkles size={11} /> {banner}</span>
            </div>
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
              {board.map((row, r) => row.map((tile, c) => {
                const isSelected = selectedTile?.r === r && selectedTile?.c === c;
                const isHint = hint?.[0] === r && hint?.[1] === c;
                return (
                  <motion.button key={tile?.id ?? `${r}-${c}`} layout type="button" disabled={busy || gameState !== "playing"}
                    onClick={() => swapTiles(r, c)}
                    whileTap={{ scale: .88 }}
                    animate={{ scale: isSelected ? 1.08 : 1, y: isHint ? [0, -4, 0] : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className={`relative aspect-square min-w-0 overflow-hidden rounded-[24%] border p-[5%] transition-shadow ${
                      isSelected ? "z-10 border-white ring-2 ring-white/80 shadow-[0_0_18px_rgba(255,255,255,.45)]" :
                      isHint ? "z-10 border-amber-200 ring-2 ring-amber-200/70" : "border-white/20"
                    }`}
                    style={{ background: tile?.blocker ? "linear-gradient(145deg,#5e566f,#292538)" : `linear-gradient(145deg,${TILE_COLORS[tile?.color ?? 0]}dd,${TILE_COLORS[tile?.color ?? 0]}66)` }}
                    aria-label={`Row ${r + 1}, column ${c + 1}, ${COLOR_NAMES[tile?.color ?? 0]} candy${tile?.special ? `, ${tile.special} special` : ""}`}>
                    <span className="pointer-events-none absolute inset-[8%] rounded-[25%] border border-white/40 bg-gradient-to-br from-white/35 via-white/5 to-black/10 shadow-[inset_0_1px_3px_rgba(255,255,255,.5),0_3px_5px_rgba(0,0,0,.18)]" />
                    <span className="pointer-events-none absolute left-[18%] top-[12%] h-[18%] w-[34%] rounded-full bg-white/65 blur-[1px]" />
                    <span className="relative z-[1] flex h-full w-full items-center justify-center">
                      {tile?.blocker ? <span className="text-[clamp(8px,2vw,20px)] drop-shadow">🪨</span> :
                        tile?.special === "rainbow" ? <span className="text-[clamp(10px,2.3vw,23px)] drop-shadow">🌈</span> :
                        tile?.special === "bomb" ? <span className="text-[clamp(10px,2.3vw,23px)] drop-shadow">💣</span> :
                        tile?.special === "row" ? <span className="text-[clamp(10px,2.3vw,23px)] drop-shadow">↔</span> :
                        tile?.special === "column" ? <span className="text-[clamp(10px,2.3vw,23px)] drop-shadow">↕</span> :
                        <Gem size="65%" strokeWidth={2.5} className="drop-shadow-[0_2px_3px_rgba(0,0,0,.22)]" />}
                    </span>
                    {tile?.jelly && <span className="pointer-events-none absolute inset-0 rounded-[24%] border-2 border-cyan-100/70 bg-cyan-200/10 shadow-[inset_0_0_10px_rgba(103,232,249,.4)]" />}
                    {isHint && <span className="pointer-events-none absolute inset-0 animate-ping rounded-[24%] border-2 border-amber-200/80" />}
                  </motion.button>
                );
              }))}
            </div>
            {gameState !== "playing" && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[1.4rem] bg-[#0c0b13]/85 p-4 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xs rounded-3xl border border-white/10 bg-[#1c1929] p-6 text-center shadow-2xl">
                  {gameState === "won" ? <Trophy className="mx-auto mb-3 text-amber-300" size={42} /> : <Heart className="mx-auto mb-3 text-pink-300" size={42} />}
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200">{gameState === "won" ? "Mission complete" : "So close!"}</p>
                  <h3 className="mt-2 text-2xl font-black">{gameState === "won" ? "SWEET VICTORY!" : "OUT OF MOVES"}</h3>
                  <p className="mt-2 text-xs text-slate-400">{gameState === "won" ? "You crushed the challenge. A new surprise awaits." : "Shuffle the board and give this mission another shot."}</p>
                  <button onClick={() => gameState === "won" ? resetLevel(currentLevel + 1) : resetLevel(currentLevel)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 px-4 py-3 text-sm font-black text-white shadow-lg">
                    {gameState === "won" ? "Next level" : "Retry level"} <ChevronRight size={17} />
                  </button>
                  <button onClick={() => resetLevel(currentLevel, false)} className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400">Restart from scratch</button>
                </motion.div>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1"><Gem size={11} /> Match 3+</span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1"><Zap size={11} /> Special candies</span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1"><Target size={11} /> Mission goals</span>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[.09] bg-white/[.025] p-4">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Power-ups</h3><WandSparkles size={15} className="text-pink-200" /></div>
            <div className="space-y-2">
              <button disabled={busy || gameState !== "playing"} onClick={showHint} className="flex w-full items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.035] p-3 text-left transition hover:bg-white/[.07] disabled:opacity-40">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/10 text-amber-200"><Star size={17} /></span>
                <span className="flex-1"><span className="block text-xs font-bold">Sweet hint</span><span className="block text-[10px] text-slate-500">Find a possible match</span></span><ChevronRight size={14} className="text-slate-600" />
              </button>
              <button disabled={busy || gameState !== "playing"} onClick={() => { const next = createBoard(level); setBoard(next); setHint(null); setBanner("BOARD SHUFFLED!"); }} className="flex w-full items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.035] p-3 text-left transition hover:bg-white/[.07] disabled:opacity-40">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Shuffle size={17} /></span>
                <span className="flex-1"><span className="block text-xs font-bold">Magic shuffle</span><span className="block text-[10px] text-slate-500">Refresh the board</span></span><ChevronRight size={14} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Clock3 size={17} /></span>
                <span className="flex-1"><span className="block text-xs font-bold">Cascade streak</span><span className="block text-[10px] text-slate-500">Current chain: {streak}×</span></span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.09] bg-white/[.025] p-4">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Candy collection</h3><Gift size={15} className="text-amber-200" /></div>
            <div className="space-y-2">
              {TILE_COLORS.slice(0, level.colors).map((color, i) => {
                const amount = i === 0 ? goalProgress : 0;
                return <div key={color} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full shadow-md" style={{ backgroundColor: color }} /><span className="flex-1 text-[11px] text-slate-400">{COLOR_NAMES[i]}</span><span className="text-[11px] font-bold tabular-nums text-slate-300">{amount}{i === 0 && level.goal === "collect" ? ` / ${level.target}` : ""}</span></div>;
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.09] bg-gradient-to-br from-amber-300/[.09] to-transparent p-4">
            <div className="flex items-center gap-2 text-amber-200"><Crown size={16} /><h3 className="text-xs font-black uppercase tracking-[.16em]">Candy passport</h3></div>
            <p className="mt-2 text-2xl font-black">{levelWonCount} <span className="text-xs font-semibold text-slate-500">levels cleared</span></p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Keep winning to unlock new themes, trickier boards and bigger surprises.</p>
            <div className="mt-3 flex gap-1.5">{Array.from({ length: 8 }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.min(8, levelWonCount) ? "bg-gradient-to-r from-amber-300 to-pink-400" : "bg-white/10"}`} />)}</div>
          </div>
        </aside>
      </div>
      <ScoreLeaderboard gameId="match3" score={highScore} canPost={gameState !== "playing"} />
    </motion.section>
  );
}