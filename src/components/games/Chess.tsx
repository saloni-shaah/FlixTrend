"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess as ChessRules, type Color, type PieceSymbol, type Square } from "chess.js";
import { motion } from "framer-motion";
import { ArrowDownUp, Bot, RotateCcw, Undo2, Wifi } from "lucide-react";
import { OnlineMatchPanel, useOnlineMatch } from "./OnlineMatch";

type ChessState = {
  fen: string;
  moves: string[];
  lastMove: { from: string; to: string } | null;
  captures: { w: PieceSymbol[]; b: PieceSymbol[] };
};
type Strength = "casual" | "club" | "expert";
type Mode = "computer" | "local" | "online";
type EngineMessage =
  | { type: "info"; depth: number; nodes: number }
  | { type: "bestmove"; from: string; to: string; promotion?: string; depth: number; nodes: number }
  | { type: "error"; message: string };

const START_FEN = new ChessRules().fen();
const START_STATE: ChessState = { fen: START_FEN, moves: [], lastMove: null, captures: { w: [], b: [] } };
const FILES = "abcdefgh";
const PIECES: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};
const CAPTURE_ORDER: PieceSymbol[] = ["q", "r", "b", "n", "p"];
const SQUARES = new Set<string>([
  ...Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => `${FILES[col]}${8 - row}`)).flat(),
]);

function isChessState(value: unknown): value is ChessState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const captures = state.captures;
  const lastMove = state.lastMove;
  const validCaptureList = (list: unknown) =>
    Array.isArray(list) && list.every(piece => CAPTURE_ORDER.includes(piece as PieceSymbol));
  return typeof state.fen === "string" && state.fen.length <= 128 &&
    Array.isArray(state.moves) && state.moves.length <= 512 && state.moves.every(move => typeof move === "string") &&
    (lastMove === null || Boolean(lastMove && typeof lastMove === "object" &&
      SQUARES.has(String((lastMove as Record<string, unknown>).from)) &&
      SQUARES.has(String((lastMove as Record<string, unknown>).to)))) &&
    Boolean(captures && typeof captures === "object" &&
      validCaptureList((captures as Record<string, unknown>).w) &&
      validCaptureList((captures as Record<string, unknown>).b));
}

function rankMove(pair: ChessState["lastMove"], square: string) {
  return Boolean(pair && (pair.from === square || pair.to === square));
}

function makeRules(state: ChessState) {
  try {
    const chess = new ChessRules();
    for (const move of state.moves) chess.move(move);
    if (chess.fen() !== state.fen) throw new Error("The move history does not match the board.");
    return { chess, invalid: false };
  } catch (error) {
    console.error("An invalid chess position was received.", error);
    return { chess: new ChessRules(), invalid: true };
  }
}

export function Chess() {
  const [mode, setMode] = useState<Mode>("computer");
  const [strength, setStrength] = useState<Strength>("club");
  const [humanColor, setHumanColor] = useState<Color>("w");
  const [flipped, setFlipped] = useState(false);
  const [localState, setLocalState] = useState<ChessState>(START_STATE);
  const [history, setHistory] = useState<ChessState[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [engineDepth, setEngineDepth] = useState(0);
  const online = useOnlineMatch<ChessState>("chess", START_STATE);
  const room = mode === "online" ? online.room : null;
  const invalidOnlineState = Boolean(room && !isChessState(room.state));
  const game = room && isChessState(room.state) ? room.state : localState;
  const position = useMemo(() => makeRules(game), [game.fen, game.moves]);
  const chess = position.chess;
  const legalMoves = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const isOver = chess.isGameOver() || room?.status === "finished" || invalidOnlineState;
  const mayMove = mode !== "online" || Boolean(!invalidOnlineState && room?.status === "active" && room.turnUid === online.user?.uid);
  const computerTurn = mode === "computer" && chess.turn() !== humanColor && !chess.isGameOver();

  const resetGame = useCallback(() => {
    setLocalState({ ...START_STATE, captures: { w: [], b: [] } });
    setHistory([]);
    setSelected(null);
    setPendingPromotion(null);
    setThinking(false);
    setEngineDepth(0);
  }, []);

  const commitMove = useCallback(async (from: Square, to: Square, promotion: string = "q") => {
    if (!mayMove || isOver) return;
    const nextChess = makeRules(game).chess;
    let played;
    try {
      played = nextChess.move({ from, to, promotion });
    } catch (error) {
      console.error("The chess engine returned an illegal move.", error);
      return;
    }
    if (!played) return;
    const captures = {
      w: [...game.captures.w],
      b: [...game.captures.b],
    };
    if (played.captured) captures[played.color === "w" ? "b" : "w"].push(played.captured);
    const next: ChessState = {
      fen: nextChess.fen(),
      moves: [...game.moves, played.san],
      lastMove: { from: played.from, to: played.to },
      captures,
    };

    if (mode === "online" && room && online.user) {
      const nextPlayerUid = nextChess.turn() === "w" ? room.host.uid : room.guest?.uid;
      if (!nextPlayerUid) return;
      const winnerUid = nextChess.isCheckmate() ? online.user.uid : null;
      await online.play(next, nextPlayerUid, winnerUid, nextChess.isGameOver());
    } else {
      setHistory(previous => [...previous, game]);
      setLocalState(next);
    }
    setSelected(null);
    setPendingPromotion(null);
  }, [game, isOver, mayMove, mode, online.play, online.user?.uid, room]);

  useEffect(() => {
    if (!computerTurn || position.invalid || invalidOnlineState) {
      setThinking(false);
      return;
    }
    setThinking(true);
    setEngineDepth(0);
    const worker = new Worker(new URL("./chessEngine.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<EngineMessage>) => {
      const result = event.data;
      if (result.type === "info") {
        setEngineDepth(result.depth);
      } else if (result.type === "bestmove") {
        setThinking(false);
        if (SQUARES.has(result.from) && SQUARES.has(result.to)) {
          void commitMove(result.from as Square, result.to as Square, result.promotion || "q");
        }
      } else {
        setThinking(false);
        console.error("The chess engine could not analyze this position.", result.message);
      }
    };
    worker.onerror = event => {
      setThinking(false);
      console.error("The chess engine worker failed.", event.message);
    };
    worker.postMessage({ fen: game.fen, moves: game.moves, strength });
    return () => worker.terminate();
  }, [commitMove, computerTurn, game.fen, game.moves, invalidOnlineState, position.invalid, strength]);

  const chooseSquare = (square: Square) => {
    if (!mayMove || isOver || computerTurn || thinking) return;
    const move = legalMoves.find(candidate => candidate.to === square);
    if (move && selected) {
      if (move.promotion) setPendingPromotion({ from: move.from, to: move.to });
      else void commitMove(move.from, move.to);
      return;
    }
    const piece = chess.get(square);
    if (piece?.color === chess.turn()) setSelected(square);
    else setSelected(null);
  };

  const undo = () => {
    if (mode === "online" || !history.length) return;
    const removeCount = mode === "computer" && history.length > 1 ? 2 : 1;
    setLocalState(history[history.length - removeCount]);
    setHistory(previous => previous.slice(0, -removeCount));
    setSelected(null);
    setPendingPromotion(null);
  };

  const selectMode = (next: Mode) => {
    setMode(next);
    setSelected(null);
    setPendingPromotion(null);
    if (next !== "online") resetGame();
  };

  const lastMove = game.lastMove;
  const sideName = (color: Color) => color === "w" ? "White" : "Black";
  let status: string;
  if (room?.status === "waiting") status = "Room ready · waiting for your opponent";
  else if (position.invalid || invalidOnlineState) status = "Invalid online position · leave the room and start a new game";
  else if (chess.isCheckmate()) status = `${sideName(chess.turn() === "w" ? "b" : "w")} wins by checkmate`;
  else if (chess.isStalemate()) status = "Draw by stalemate";
  else if (chess.isDraw()) status = "Game drawn";
  else if (mode === "online" && !room) status = "Create a room or join a friend";
  else if (room?.status === "finished") status = room.winnerUid === online.user?.uid ? "You won!" : room.winnerUid ? "Your opponent won" : "Game drawn";
  else if (chess.isCheck()) status = `${sideName(chess.turn())} is in check`;
  else if (mode === "computer" && computerTurn) status = `Flix engine is thinking${engineDepth ? ` · depth ${engineDepth}` : "…"}`;
  else if (room) status = room.turnUid === online.user?.uid ? "Your turn" : `${room.turnUid === room.host.uid ? room.host.name : room.guest?.name}'s turn`;
  else status = `${sideName(chess.turn())} to move`;

  const visibleRows = Array.from({ length: 8 }, (_, index) => flipped ? 7 - index : index);
  const visibleCols = Array.from({ length: 8 }, (_, index) => flipped ? 7 - index : index);
  const board = chess.board();
  const capturedWhite = CAPTURE_ORDER.flatMap(type => Array.from({ length: game.captures.w.filter(piece => piece === type).length }, () => type));
  const capturedBlack = CAPTURE_ORDER.flatMap(type => Array.from({ length: game.captures.b.filter(piece => piece === type).length }, () => type));

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-pink sm:text-3xl">Chess</h2>
          <p className="mt-1 text-sm text-gray-400">A complete chess ruleset, smart engine, and live online matches.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode !== "online" && <button onClick={undo} disabled={!history.length} className="btn-glass flex items-center gap-2 disabled:opacity-40"><Undo2 size={16} /> Undo</button>}
          <button onClick={() => mode === "online" ? online.leaveRoom() : resetGame()} className="btn-glass flex items-center gap-2">
            <RotateCcw size={16} /> New game
          </button>
          <button onClick={() => setFlipped(value => !value)} aria-label="Flip board" className="btn-glass flex items-center gap-2"><ArrowDownUp size={16} /> Flip</button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1">
        {([
          ["computer", "vs Computer", Bot],
          ["local", "Pass & play", null],
          ["online", "Online", Wifi],
        ] as const).map(([option, label, Icon]) => (
          <button key={option} onClick={() => selectMode(option)} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition-colors sm:px-4 ${mode === option ? "bg-accent-pink text-white" : "text-gray-400 hover:text-white"}`}>
            {Icon && <Icon size={15} />}{label}
          </button>
        ))}
      </div>

      {mode === "online" && <OnlineMatchPanel room={online.room} userId={online.user?.uid} busy={online.busy}
        error={online.error} createRoom={async () => { await online.createRoom(); }}
        joinRoom={online.joinRoom} leaveRoom={online.leaveRoom} resign={online.resign} />}

      {mode === "computer" && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">Play as
            <select aria-label="Choose your color" value={humanColor} onChange={event => {
              setHumanColor(event.target.value as Color);
              resetGame();
            }} className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white">
              <option value="w">White</option><option value="b">Black</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">Engine
            <select aria-label="Choose engine strength" value={strength} onChange={event => setStrength(event.target.value as Strength)}
              className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white">
              <option value="casual">Casual</option><option value="club">Club</option><option value="expert">Expert</option>
            </select>
          </label>
          <span className="text-xs text-gray-500">Local search · no connection or engine download required</span>
        </div>
      )}

      <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,.52fr)]">
        <div className="flex min-w-0 flex-col items-center gap-3">
          <div className={`w-full max-w-[min(100%,38rem)] rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
            isOver ? "border-amber-300/35 bg-amber-300/10 text-amber-200"
              : chess.isCheck() ? "border-red-400/40 bg-red-400/10 text-red-300"
                : "border-accent-cyan/20 bg-accent-cyan/[.06] text-gray-200"
          }`} role="status" aria-live="polite">{status}</div>

          <div className="w-full max-w-[min(100%,38rem)] overflow-hidden rounded-xl border-2 border-accent-cyan/25 shadow-2xl shadow-black/30">
            {visibleRows.map((rowIndex, displayRow) => (
              <div key={rowIndex} className="grid grid-cols-8">
                {visibleCols.map((colIndex, displayCol) => {
                  const square = `${FILES[colIndex]}${8 - rowIndex}` as Square;
                  const piece = board[rowIndex][colIndex];
                  const light = (rowIndex + colIndex) % 2 === 0;
                  const isSelected = selected === square;
                  const target = legalMoves.find(move => move.to === square);
                  const checkedKing = piece?.type === "k" && piece.color === chess.turn() && chess.isCheck();
                  const rankLabel = displayCol === 0;
                  const fileLabel = displayRow === 7;
                  return (
                    <button key={square} type="button"
                      aria-label={`${square}${piece ? ` ${sideName(piece.color)} ${PIECE_NAMES[piece.type]}` : ""}${target ? ", legal move" : ""}`}
                      aria-pressed={isSelected}
                      disabled={!mayMove || isOver || computerTurn || thinking || Boolean(room && room.status !== "active")}
                      onClick={() => chooseSquare(square)}
                      className={`relative flex aspect-square min-w-0 items-center justify-center text-[clamp(1.65rem,7vw,3.45rem)] leading-none transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan disabled:cursor-default ${
                        light ? "bg-[#e7edf2]" : "bg-[#4d7080]"
                      } ${isSelected ? "!bg-cyan-300/85" : ""} ${rankMove(lastMove, square) && !isSelected ? "after:absolute after:inset-0 after:bg-yellow-300/20" : ""} ${checkedKing ? "!bg-red-500/75" : ""} hover:brightness-110`}>
                      {rankLabel && <span className={`absolute left-1 top-0.5 z-10 text-[9px] font-bold sm:text-[11px] ${light ? "text-[#315169]" : "text-white"}`}>{8 - rowIndex}</span>}
                      {fileLabel && <span className={`absolute bottom-0.5 right-1 z-10 text-[9px] font-bold sm:text-[11px] ${light ? "text-[#315169]" : "text-white"}`}>{FILES[colIndex]}</span>}
                      {piece && <span className={`${piece.color === "w" ? "text-white [text-shadow:0_2px_4px_rgba(0,0,0,.95)]" : "text-slate-950 [text-shadow:0_1px_2px_rgba(255,255,255,.52)]"}`}>{PIECES[piece.color][piece.type]}</span>}
                      {target && <span className={`pointer-events-none absolute z-[2] rounded-full ${target.isCapture() ? "inset-1 border-[3px] border-emerald-400/85" : "h-3 w-3 bg-emerald-600/70 sm:h-4 sm:w-4"}`} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {pendingPromotion && (
            <div role="group" aria-label="Promote pawn" className="flex items-center gap-2 rounded-xl border border-accent-cyan/20 bg-slate-900/90 p-3">
              <span className="mr-2 text-sm text-gray-300">Promote to</span>
              {(["q", "r", "b", "n"] as PieceSymbol[]).map(type => (
                <button key={type} onClick={() => void commitMove(pendingPromotion.from, pendingPromotion.to, type)}
                  aria-label={`Promote to ${PIECE_NAMES[type]}`} className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-3xl text-white hover:bg-accent-cyan/20">
                  {PIECES[chess.turn()][type]}
                </button>
              ))}
            </div>
          )}

          {mode === "computer" && isOver && <button onClick={resetGame} className="btn-glass border-accent-cyan/30 text-accent-cyan">Play again</button>}
          {mode === "local" && isOver && <button onClick={resetGame} className="btn-glass border-accent-cyan/30 text-accent-cyan">New game</button>}
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          {mode === "computer" && <div className="rounded-xl border border-accent-cyan/15 bg-black/20 p-4">
            <div className="flex items-center gap-2 font-bold text-accent-cyan"><Bot size={17} /> Flix chess engine</div>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              Searches legal moves with iterative deepening, alpha-beta pruning, quiescence search, move ordering, a transposition table, and positional evaluation.
            </p>
            <p className="mt-2 text-xs text-gray-500">{thinking ? `Calculating · depth ${engineDepth || "…"}` : `${strength[0].toUpperCase()}${strength.slice(1)} strength`}</p>
          </div>}

          <div className="rounded-xl border border-white/[.08] bg-black/20 p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Captured by White</h3>
            <div className="min-h-7 text-xl leading-none" aria-label="Pieces captured by white">{capturedWhite.map((piece, index) =>
              <span key={`${piece}-${index}`} className="text-white [text-shadow:0_1px_2px_rgba(0,0,0,.85)]">{PIECES.b[piece]}</span>)}</div>
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">Captured by Black</h3>
            <div className="min-h-7 text-xl leading-none" aria-label="Pieces captured by black">{capturedBlack.map((piece, index) =>
              <span key={`${piece}-${index}`} className="text-slate-200">{PIECES.w[piece]}</span>)}</div>
          </div>

          <div className="rounded-xl border border-white/[.08] bg-black/20 p-3">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Move history</h3>
            {game.moves.length ? <ol className="grid max-h-60 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto text-sm tabular-nums">
              {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, index) => (
                <li key={index} className="contents">
                  <span className="text-gray-500">{index + 1}. <span className="text-gray-200">{game.moves[index * 2]}</span></span>
                  {game.moves[index * 2 + 1] && <span className="text-gray-200">{game.moves[index * 2 + 1]}</span>}
                </li>
              ))}
            </ol> : <p className="text-sm text-gray-500">Moves appear here as you play.</p>}
          </div>
        </aside>
      </div>
      <p className="text-center text-xs text-gray-500">
        Select a piece to reveal legal moves · Castling, en passant, all promotion choices, checkmate, stalemate, repetition, and draw rules are supported.
      </p>
    </motion.section>
  );
}
