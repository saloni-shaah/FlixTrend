"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Flag, RotateCcw, Timer, Trophy } from "lucide-react";
import { ScoreLeaderboard } from "./ScoreLeaderboard";

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type Difficulty = "easy" | "medium" | "hard";
type GameStatus = "ready" | "playing" | "won" | "lost";

const LEVELS: Record<Difficulty, { rows: number; cols: number; mines: number; label: string }> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "Easy" },
  medium: { rows: 12, cols: 12, mines: 24, label: "Medium" },
  hard: { rows: 16, cols: 16, mines: 40, label: "Hard" },
};
const emptyBoard = (rows: number, cols: number): Cell[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })));
const neighbors = (row: number, col: number, rows: number, cols: number) => {
  const cells: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = row + dr; const c = col + dc;
    if ((dr !== 0 || dc !== 0) && r >= 0 && r < rows && c >= 0 && c < cols) cells.push([r, c]);
  }
  return cells;
};
const NUMBER_COLORS = ["", "text-sky-300", "text-emerald-400", "text-rose-400", "text-violet-300", "text-amber-400", "text-cyan-300", "text-white", "text-gray-400"];

function layMines(rows: number, cols: number, count: number, safeRow: number, safeCol: number): Cell[][] {
  const board = emptyBoard(rows, cols);
  const safe = new Set([`${safeRow},${safeCol}`, ...neighbors(safeRow, safeCol, rows, cols).map(([r, c]) => `${r},${c}`)]);
  const candidates: [number, number][] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    if (!safe.has(`${row},${col}`)) candidates.push([row, col]);
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (const [row, col] of candidates.slice(0, count)) board[row][col].mine = true;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    board[row][col].adjacent = neighbors(row, col, rows, cols).filter(([r, c]) => board[r][c].mine).length;
  }
  return board;
}

function reveal(board: Cell[][], row: number, col: number): Cell[][] {
  const next = board.map(line => line.map(cell => ({ ...cell })));
  const pending: [number, number][] = [[row, col]];
  while (pending.length) {
    const [r, c] = pending.pop()!;
    const cell = next[r][c];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (!cell.mine && cell.adjacent === 0) {
      for (const [nr, nc] of neighbors(r, c, next.length, next[0].length)) {
        if (!next[nr][nc].revealed && !next[nr][nc].flagged) pending.push([nr, nc]);
      }
    }
  }
  return next;
}

function hasWon(board: Cell[][]) {
  return board.every(row => row.every(cell => cell.mine || cell.revealed));
}

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Cell[][]>(() => emptyBoard(9, 9));
  const [status, setStatus] = useState<GameStatus>("ready");
  const [seconds, setSeconds] = useState(0);
  const [completedScore, setCompletedScore] = useState(0);
  const [bestTimes, setBestTimes] = useState<Partial<Record<Difficulty, number>>>({});
  const level = LEVELS[difficulty];
  const flags = useMemo(() => board.flat().filter(cell => cell.flagged).length, [board]);
  const bestTime = bestTimes[difficulty];
  const bestScore = bestTime === undefined
    ? completedScore
    : Math.round((level.mines * 1000) / Math.max(1, bestTime + 1));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("minesweeperBestTimes");
      if (raw) setBestTimes(JSON.parse(raw) as Partial<Record<Difficulty, number>>);
    } catch (error) {
      console.error("Could not load Minesweeper best times.", error);
    }
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [status]);

  const newGame = (nextDifficulty = difficulty) => {
    const nextLevel = LEVELS[nextDifficulty];
    setDifficulty(nextDifficulty);
    setBoard(emptyBoard(nextLevel.rows, nextLevel.cols));
    setSeconds(0);
    setCompletedScore(0);
    setStatus("ready");
  };

  const checkWin = (next: Cell[][]) => {
    if (!hasWon(next)) return false;
    setStatus("won");
    const score = Math.round((LEVELS[difficulty].mines * 1000) / Math.max(1, seconds + 1));
    setCompletedScore(score);
    setBestTimes(previous => {
      const best = previous[difficulty];
      if (best !== undefined && best <= seconds) return previous;
      const updated = { ...previous, [difficulty]: seconds };
      try { localStorage.setItem("minesweeperBestTimes", JSON.stringify(updated)); }
      catch (error) { console.error("Could not save Minesweeper best times.", error); }
      return updated;
    });
    return true;
  };

  const openCell = (row: number, col: number) => {
    if (status === "won" || status === "lost" || board[row][col].flagged) return;
    const current = status === "ready"
      ? layMines(level.rows, level.cols, level.mines, row, col).map((line, r) =>
        line.map((cell, c) => ({ ...cell, flagged: board[r][c].flagged })))
      : board;
    if (current[row][col].revealed) {
      const around = neighbors(row, col, level.rows, level.cols);
      const adjacentFlags = around.filter(([r, c]) => current[r][c].flagged).length;
      if (current[row][col].adjacent === 0 || adjacentFlags !== current[row][col].adjacent) return;
      const mineHit = around.some(([r, c]) => !current[r][c].flagged && current[r][c].mine);
      if (mineHit) {
        const finished = current.map(line => line.map(cell => ({ ...cell, revealed: cell.revealed || cell.mine })));
        setBoard(finished);
        setStatus("lost");
        return;
      }
      const next = around.reduce((state, [r, c]) => reveal(state, r, c), current);
      setBoard(next);
      checkWin(next);
      return;
    }
    const next = reveal(current, row, col);
    setBoard(next);
    if (status === "ready") setStatus("playing");
    if (next[row][col].mine) setStatus("lost");
    else checkWin(next);
  };

  const toggleFlag = (event: MouseEvent, row: number, col: number) => {
    event.preventDefault();
    if (status === "won" || status === "lost" || board[row][col].revealed) return;
    const current = board;
    const next = current.map(line => line.map(cell => ({ ...cell })));
    next[row][col].flagged = !next[row][col].flagged;
    setBoard(next);
    checkWin(next);
  };

  return (
    <section className="glass-card mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-pink sm:text-3xl">Minesweeper</h2>
          <p className="mt-1 text-sm text-gray-400">Clear the board. Trust your numbers.</p>
        </div>
        <button onClick={() => newGame()} className="btn-glass flex items-center gap-2"><RotateCcw size={16} /> New game</button>
      </header>

      <div className="flex flex-wrap items-center gap-2" aria-label="Difficulty">
        {(Object.keys(LEVELS) as Difficulty[]).map(key => (
          <button key={key} onClick={() => newGame(key)} aria-pressed={difficulty === key}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${difficulty === key ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan" : "border-white/10 bg-white/[.04] text-gray-400 hover:text-white"}`}>
            {LEVELS[key].label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[.08] bg-black/20 px-4 py-3">
        <span className="flex items-center gap-2 text-rose-300"><Flag size={17} /> <b>{Math.max(0, level.mines - flags)}</b></span>
        <span aria-live="polite" className="text-sm font-bold text-gray-200">
          {status === "ready" ? "Pick a square to start" : status === "won" ? "Board cleared!" : status === "lost" ? "Boom! Try again." : "Find every safe square"}
        </span>
        <span className="flex items-center gap-2 text-amber-300"><Timer size={17} /> <b>{seconds}s</b></span>
      </div>

      <div className="mx-auto max-w-full overflow-x-auto rounded-xl border border-accent-cyan/20 bg-black/30 p-1.5 sm:p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))` }} role="grid" aria-label={`${LEVELS[difficulty].label} Minesweeper board`}>
          {board.map((line, row) => line.map((cell, col) => (
            <button
              key={`${row}-${col}`}
              type="button"
              role="gridcell"
              aria-label={cell.revealed ? cell.mine ? "Mine" : cell.adjacent ? `${cell.adjacent} nearby mines` : "Empty" : cell.flagged ? "Flagged square" : "Covered square"}
              onClick={() => openCell(row, col)}
              onContextMenu={event => toggleFlag(event, row, col)}
              className={`flex aspect-square min-h-6 min-w-6 items-center justify-center rounded text-[clamp(10px,2.3vw,15px)] font-black transition-colors sm:min-h-8 sm:min-w-8 ${
                cell.revealed
                  ? cell.mine ? "bg-rose-500/70 text-white" : "bg-slate-800/90"
                  : "border border-white/10 bg-slate-600/70 text-gray-100 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] hover:bg-slate-500"
              }`}>
              {cell.flagged && !cell.revealed ? <Flag size={14} className="text-rose-300" fill="currentColor" /> : cell.revealed && cell.mine ? "✹" : cell.revealed && cell.adjacent ? <span className={NUMBER_COLORS[cell.adjacent]}>{cell.adjacent}</span> : null}
            </button>
          )))}
        </div>
      </div>

      <ScoreLeaderboard gameId={`minesweeper-${difficulty}`} score={bestScore} canPost={status === "won"} />

      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>Left-click to reveal · Right-click to flag</span>
        <span className="flex items-center gap-1">{bestTimes[difficulty] !== undefined && <><Trophy size={13} className="text-amber-300" /> Best {bestTimes[difficulty]}s</>}</span>
      </footer>
    </section>
  );
}
