"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

type Color = "white" | "black";
type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type Piece = { color: Color; type: PieceType };
type Square = { row: number; col: number };
type Move = {
  from: Square;
  to: Square;
  enPassant?: boolean;
  castle?: "king" | "queen";
};
type CastlingRights = {
  whiteKing: boolean;
  whiteQueen: boolean;
  blackKing: boolean;
  blackQueen: boolean;
};
type Position = {
  board: (Piece | null)[][];
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
};

const GLYPHS: Record<Color, Record<PieceType, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_STEPS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const INITIAL_BACK_RANK: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

function initialPosition(): Position {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let col = 0; col < 8; col++) {
    board[0][col] = { color: "black", type: INITIAL_BACK_RANK[col] };
    board[1][col] = { color: "black", type: "pawn" };
    board[6][col] = { color: "white", type: "pawn" };
    board[7][col] = { color: "white", type: INITIAL_BACK_RANK[col] };
  }
  return {
    board,
    turn: "white",
    castling: { whiteKing: true, whiteQueen: true, blackKing: true, blackQueen: true },
    enPassant: null,
  };
}

const inBounds = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;
const opposite = (color: Color): Color => color === "white" ? "black" : "white";
const sameSquare = (a: Square, b: Square) => a.row === b.row && a.col === b.col;
const squareName = ({ row, col }: Square) => `${FILES[col]}${8 - row}`;

function isSquareAttacked(board: Position["board"], square: Square, byColor: Color): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== byColor) continue;
      const rowDiff = square.row - row;
      const colDiff = square.col - col;

      if (piece.type === "pawn") {
        const direction = byColor === "white" ? -1 : 1;
        if (rowDiff === direction && Math.abs(colDiff) === 1) return true;
      } else if (piece.type === "knight") {
        if (KNIGHT_STEPS.some(([dr, dc]) => row + dr === square.row && col + dc === square.col)) return true;
      } else if (piece.type === "king") {
        if (Math.max(Math.abs(rowDiff), Math.abs(colDiff)) === 1) return true;
      } else {
        const diagonal = Math.abs(rowDiff) === Math.abs(colDiff);
        const straight = rowDiff === 0 || colDiff === 0;
        if ((piece.type === "bishop" && !diagonal) ||
            (piece.type === "rook" && !straight) ||
            (piece.type === "queen" && !diagonal && !straight)) continue;
        const rowStep = Math.sign(rowDiff);
        const colStep = Math.sign(colDiff);
        let r = row + rowStep;
        let c = col + colStep;
        let clear = true;
        while (r !== square.row || c !== square.col) {
          if (board[r][c]) {
            clear = false;
            break;
          }
          r += rowStep;
          c += colStep;
        }
        if (clear) return true;
      }
    }
  }
  return false;
}

function isInCheck(position: Position, color: Color): boolean {
  let king: Square | null = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = position.board[row][col];
      if (piece?.color === color && piece.type === "king") king = { row, col };
    }
  }
  return king ? isSquareAttacked(position.board, king, opposite(color)) : true;
}

function addRayMoves(position: Position, from: Square, directions: number[][], moves: Move[]) {
  const piece = position.board[from.row][from.col]!;
  for (const [dr, dc] of directions) {
    let row = from.row + dr;
    let col = from.col + dc;
    while (inBounds(row, col)) {
      const target = position.board[row][col];
      if (!target) {
        moves.push({ from, to: { row, col } });
      } else {
        if (target.color !== piece.color && target.type !== "king") moves.push({ from, to: { row, col } });
        break;
      }
      row += dr;
      col += dc;
    }
  }
}

function pseudoMoves(position: Position, from: Square): Move[] {
  const { board, turn, castling, enPassant } = position;
  const piece = board[from.row][from.col];
  if (!piece || piece.color !== turn) return [];
  const moves: Move[] = [];

  if (piece.type === "pawn") {
    const direction = piece.color === "white" ? -1 : 1;
    const startRow = piece.color === "white" ? 6 : 1;
    const oneRow = from.row + direction;
    if (inBounds(oneRow, from.col) && !board[oneRow][from.col]) {
      moves.push({ from, to: { row: oneRow, col: from.col } });
      const twoRow = from.row + direction * 2;
      if (from.row === startRow && !board[twoRow][from.col]) {
        moves.push({ from, to: { row: twoRow, col: from.col } });
      }
    }
    for (const colDelta of [-1, 1]) {
      const row = from.row + direction;
      const col = from.col + colDelta;
      if (!inBounds(row, col)) continue;
      const target = board[row][col];
      if (target && target.color !== piece.color && target.type !== "king") {
        moves.push({ from, to: { row, col } });
      } else if (enPassant && sameSquare(enPassant, { row, col })) {
        moves.push({ from, to: { row, col }, enPassant: true });
      }
    }
  } else if (piece.type === "knight") {
    for (const [dr, dc] of KNIGHT_STEPS) {
      const row = from.row + dr;
      const col = from.col + dc;
      const target = inBounds(row, col) ? board[row][col] : null;
      if (inBounds(row, col) && (!target || (target.color !== piece.color && target.type !== "king"))) {
        moves.push({ from, to: { row, col } });
      }
    }
  } else if (piece.type === "king") {
    for (const [dr, dc] of KING_STEPS) {
      const row = from.row + dr;
      const col = from.col + dc;
      const target = inBounds(row, col) ? board[row][col] : null;
      if (inBounds(row, col) && (!target || (target.color !== piece.color && target.type !== "king"))) {
        moves.push({ from, to: { row, col } });
      }
    }

    const row = piece.color === "white" ? 7 : 0;
    const canCastle = castling[`${piece.color}King` as keyof CastlingRights] && from.row === row && from.col === 4;
    if (canCastle && !isInCheck(position, piece.color)) {
      const kingSideRook = board[row][7];
      if (kingSideRook?.color === piece.color && kingSideRook.type === "rook" &&
          !board[row][5] && !board[row][6] &&
          !isSquareAttacked(board, { row, col: 5 }, opposite(piece.color)) &&
          !isSquareAttacked(board, { row, col: 6 }, opposite(piece.color))) {
        moves.push({ from, to: { row, col: 6 }, castle: "king" });
      }
      const queenSideRook = board[row][0];
      if (castling[`${piece.color}Queen` as keyof CastlingRights] &&
          queenSideRook?.color === piece.color && queenSideRook.type === "rook" &&
          !board[row][1] && !board[row][2] && !board[row][3] &&
          !isSquareAttacked(board, { row, col: 3 }, opposite(piece.color)) &&
          !isSquareAttacked(board, { row, col: 2 }, opposite(piece.color))) {
        moves.push({ from, to: { row, col: 2 }, castle: "queen" });
      }
    }
  } else {
    const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const straights = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    addRayMoves(position, from, piece.type === "bishop" ? diagonals : piece.type === "rook" ? straights : [...diagonals, ...straights], moves);
  }

  return moves;
}

function applyMove(position: Position, move: Move): Position {
  const board = position.board.map(row => [...row]);
  const piece = board[move.from.row][move.from.col]!;
  const captured = move.enPassant ? board[move.from.row][move.to.col] : board[move.to.row][move.to.col];
  board[move.from.row][move.from.col] = null;
  board[move.to.row][move.to.col] = piece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)
    ? { ...piece, type: "queen" }
    : piece;

  if (move.enPassant) board[move.from.row][move.to.col] = null;
  if (move.castle) {
    const rookFrom = move.castle === "king" ? 7 : 0;
    const rookTo = move.castle === "king" ? 5 : 3;
    board[move.from.row][rookTo] = board[move.from.row][rookFrom];
    board[move.from.row][rookFrom] = null;
  }

  const castling = { ...position.castling };
  if (piece.type === "king") {
    castling[`${piece.color}King`] = false;
    castling[`${piece.color}Queen`] = false;
  }
  if (piece.type === "rook" && move.from.row === (piece.color === "white" ? 7 : 0)) {
    if (move.from.col === 0) castling[`${piece.color}Queen`] = false;
    if (move.from.col === 7) castling[`${piece.color}King`] = false;
  }
  if (captured?.type === "rook") {
    const capturedColor = captured.color;
    const homeRow = capturedColor === "white" ? 7 : 0;
    if (move.to.row === homeRow && move.to.col === 0) castling[`${capturedColor}Queen`] = false;
    if (move.to.row === homeRow && move.to.col === 7) castling[`${capturedColor}King`] = false;
  }

  const enPassant = piece.type === "pawn" && Math.abs(move.to.row - move.from.row) === 2
    ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
    : null;
  return { board, turn: opposite(position.turn), castling, enPassant };
}

function legalMoves(position: Position, from: Square): Move[] {
  const piece = position.board[from.row][from.col];
  if (!piece || piece.color !== position.turn) return [];
  return pseudoMoves(position, from).filter(move => !isInCheck(applyMove(position, move), piece.color));
}

function allLegalMoves(position: Position): Move[] {
  const moves: Move[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (position.board[row][col]?.color === position.turn) {
        moves.push(...legalMoves(position, { row, col }));
      }
    }
  }
  return moves;
}

export function Chess() {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const movesFromSelected = selected ? legalMoves(position, selected) : [];
  const check = isInCheck(position, position.turn);
  const remainingMoves = useMemo(() => allLegalMoves(position), [position]);
  const gameOver = remainingMoves.length === 0;
  const status = gameOver
    ? check ? `${position.turn === "white" ? "Black" : "White"} wins by checkmate` : "Draw by stalemate"
    : check ? `${position.turn === "white" ? "White" : "Black"} is in check`
    : `${position.turn === "white" ? "White" : "Black"} to move`;

  const playMove = (move: Move) => {
    setPosition(applyMove(position, move));
    setLastMove(move);
    setSelected(null);
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;
    const square = { row, col };
    const move = movesFromSelected.find(candidate => sameSquare(candidate.to, square));
    if (move) {
      playMove(move);
      return;
    }
    const piece = position.board[row][col];
    setSelected(piece?.color === position.turn ? square : null);
  };

  const resetGame = () => {
    setPosition(initialPosition());
    setSelected(null);
    setLastMove(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-accent-pink sm:text-3xl">Chess</h2>
          <p className="mt-1 text-sm text-gray-400">Local two-player · White moves first</p>
        </div>
        <button onClick={resetGame} className="btn-glass flex items-center gap-2">
          <RotateCcw size={16} /> New game
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          role="status"
          aria-live="polite"
          className={`w-full max-w-[min(100%,32rem)] rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
            gameOver
              ? "border-accent-pink/40 bg-accent-pink/10 text-accent-pink"
              : check
                ? "border-red-400/40 bg-red-400/10 text-red-300"
                : "border-accent-cyan/20 bg-accent-cyan/[0.06] text-gray-200"
          }`}
        >
          {status}
        </div>

        <div className="w-full max-w-[min(100%,32rem)] overflow-hidden rounded-xl border-2 border-accent-cyan/25 shadow-2xl shadow-black/30">
          {position.board.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8">
              {row.map((piece, colIndex) => {
                const square = { row: rowIndex, col: colIndex };
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selected && sameSquare(selected, square);
                const isLastMove = lastMove && (sameSquare(lastMove.from, square) || sameSquare(lastMove.to, square));
                const isLegalTarget = movesFromSelected.some(move => sameSquare(move.to, square));
                const isKingInCheck = piece?.type === "king" && piece.color === position.turn && check;
                return (
                  <button
                    key={colIndex}
                    type="button"
                    aria-label={`${squareName(square)}${piece ? ` ${piece.color} ${piece.type}` : ""}${isLegalTarget ? ", legal move" : ""}`}
                    aria-pressed={Boolean(isSelected)}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    className={`relative flex aspect-square items-center justify-center text-[clamp(1.6rem,7vw,3rem)] leading-none transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan ${
                      isLight ? "bg-[#dbe7ef]" : "bg-[#315169]"
                    } ${isSelected ? "!bg-cyan-300/80" : ""} ${isLastMove && !isSelected ? "after:absolute after:inset-0 after:bg-yellow-300/20" : ""} ${
                      isKingInCheck ? "!bg-red-500/70" : ""
                    } hover:brightness-110`}
                  >
                    {colIndex === 0 && (
                      <span className={`absolute left-1 top-0.5 z-10 text-[9px] font-bold sm:text-[11px] ${isLight ? "text-[#315169]" : "text-[#dbe7ef]"}`}>
                        {8 - rowIndex}
                      </span>
                    )}
                    {rowIndex === 7 && (
                      <span className={`absolute bottom-0.5 right-1 z-10 text-[9px] font-bold sm:text-[11px] ${isLight ? "text-[#315169]" : "text-[#dbe7ef]"}`}>
                        {FILES[colIndex]}
                      </span>
                    )}
                    {piece && (
                      <span className={`relative z-[1] drop-shadow-sm ${piece.color === "white" ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]" : "text-slate-950 [text-shadow:0_1px_2px_rgba(255,255,255,0.4)]"}`}>
                        {GLYPHS[piece.color][piece.type]}
                      </span>
                    )}
                    {isLegalTarget && (
                      <span className={`pointer-events-none absolute z-[2] rounded-full ${
                        piece ? "inset-1 border-[3px] border-emerald-400/80" : "h-3 w-3 bg-emerald-500/70 sm:h-4 sm:w-4"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500">
          Select a piece to see its legal moves. Pawns promote to queens automatically.
        </p>
      </div>
    </motion.section>
  );
}
