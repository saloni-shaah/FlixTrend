
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Play, RotateCw, BrainCircuit, Users } from 'lucide-react';

type GameStatus = 'waiting' | 'playing' | 'gameOver';
type GameMode = 'local' | 'ai' | 'online';

// --- SVG Chess Pieces --- //
const pieces: { [key: string]: string } = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
};

export function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [mode, setMode] = useState<GameMode>('local');
  const [from, setFrom] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameOverMessage, setGameOverMessage] = useState('');

  const updateBoard = (newGame: any) => {
    setBoard(newGame.board());
  };

  const handleSquareClick = (square: string) => {
    if (status !== 'playing' || game.isGameOver()) return;

    if (from) {
      // Trying to make a move
      try {
        const move = game.move({ from, to: square, promotion: 'q' }); // Auto-promote to queen for simplicity
        if (move) {
          updateBoard(game);
          setFrom(null);
          setPossibleMoves([]);
          checkGameOver();
        } else {
          // Invalid move, maybe select new piece?
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setFrom(square);
            const moves = game.moves({ square: square, verbose: true });
            setPossibleMoves(moves.map(m => m.to));
          } else {
            setFrom(null);
            setPossibleMoves([]);
          }
        }
      } catch (e) {
        console.warn("Invalid move", e);
        setFrom(null);
        setPossibleMoves([]);
      }
    } else {
      // Selecting a piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setFrom(square);
        const moves = game.moves({ square: square, verbose: true });
        setPossibleMoves(moves.map(m => m.to));
      }
    }
  };

  const checkGameOver = () => {
    if (game.isGameOver()) {
      setStatus('gameOver');
      if (game.isCheckmate()) {
        setGameOverMessage(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
      } else if (game.isDraw()) {
        setGameOverMessage('Draw!');
      } else if (game.isStalemate()) {
        setGameOverMessage('Stalemate!');
      } else if (game.isThreefoldRepetition()) {
        setGameOverMessage('Draw by threefold repetition!');
      } else if (game.isInsufficientMaterial()) {
        setGameOverMessage('Draw by insufficient material!');
      }
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    updateBoard(newGame);
    setStatus('waiting');
    setFrom(null);
    setPossibleMoves([]);
    setGameOverMessage('');
  };

  const startGame = (selectedMode: GameMode) => {
    resetGame();
    setMode(selectedMode);
    setStatus('playing');
  };

  const renderBoardCells = () => {
    const cells = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = `${'abcdefgh'[j]}${8 - i}`;
        const isLight = (i + j) % 2 !== 0;
        const piece = board[i][j];
        const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : '';
        const isPossibleMove = possibleMoves.includes(square);

        cells.push(
          <div
            key={square}
            onClick={() => handleSquareClick(square)}
            className={`w-full h-full flex items-center justify-center cursor-pointer relative ${isLight ? 'bg-gray-400' : 'bg-gray-700'}`}
          >
            {piece && <img src={pieces[pieceKey]} alt={`${piece.color} ${piece.type}`} className="w-10/12 h-10/12" />}
            {isPossibleMove && <div className="absolute w-1/3 h-1/3 rounded-full bg-accent-green/50" />}
            {from === square && <div className="absolute inset-0 bg-yellow-400/50" />}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col md:flex-row items-center justify-center text-white p-4 font-body relative overflow-hidden gap-8">
      {/* Game Board */}
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-lg aspect-square border-4 border-accent-cyan rounded-lg overflow-hidden">
        {renderBoardCells()}
      </div>

      {/* Controls & Info */}
      <div className="w-full md:w-64 flex flex-col items-center gap-4">
        <h2 className="text-3xl font-headline font-bold text-accent-cyan">Chess</h2>
        <AnimatePresence>
            {status !== 'playing' && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
                >
                    {status === 'waiting' ? (
                        <>
                            <h2 className="text-4xl font-headline font-bold text-accent-cyan">Chess Game</h2>
                            <p className="text-gray-400 mt-2 mb-6">Play against a friend, Almighty AI, or another user online.</p>
                            <div className="flex flex-col gap-4 w-full max-w-xs">
                                <button onClick={() => startGame('local')} className="btn-glass flex items-center justify-center gap-2 hover:border-green-400 text-lg"><Users /> Local Multiplayer</button>
                                <button disabled className="btn-glass flex items-center justify-center gap-2 disabled:opacity-50"><BrainCircuit /> Play vs Almighty (Soon)</button>
                                <button disabled className="btn-glass flex items-center justify-center gap-2 disabled:opacity-50"><Play /> Find Online Match (Soon)</button>
                            </div>
                        </>
                    ) : ( // gameOver
                        <>
                            <h2 className="text-4xl font-headline font-bold text-accent-pink">Game Over</h2>
                            <p className="my-4 text-lg text-brand-gold">{gameOverMessage}</p>
                            <button onClick={resetGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2"><RotateCw/> Play Again</button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {status === 'playing' && (
          <div className="text-center w-full bg-black/20 p-4 rounded-lg">
            <p className="text-xl font-bold">Turn: <span className={game.turn() === 'w' ? 'text-white' : 'text-accent-pink'}>{game.turn() === 'w' ? 'White' : 'Black'}</span></p>
            {game.inCheck() && <p className="text-red-500 font-bold animate-pulse">Check!</p>}
            <button onClick={resetGame} className="btn-glass text-xs mt-4">Reset Game</button>
          </div>
        )}
      </div>
    </div>
  );
}
