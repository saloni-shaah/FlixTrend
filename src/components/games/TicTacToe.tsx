"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Circle, RotateCcw } from 'lucide-react';

function Square({ value, onSquareClick }: { value: 'X' | 'O' | null, onSquareClick: () => void }) {
  return (
    <button 
        className="w-20 h-20 md:w-24 md:h-24 glass-card rounded-lg flex items-center justify-center"
        onClick={onSquareClick}
    >
        {value === 'X' && <X className="w-12 h-12 text-accent-pink" />}
        {value === 'O' && <Circle className="w-12 h-12 text-accent-cyan" />}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }: { xIsNext: boolean, squares: ('X' | 'O' | null)[], onPlay: (nextSquares: ('X' | 'O' | null)[]) => void }) {
    function handleClick(i: number) {
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        const nextSquares = squares.slice();
        if (xIsNext) {
            nextSquares[i] = 'X';
        } else {
            nextSquares[i] = 'O';
        }
        onPlay(nextSquares);
    }

    const winner = calculateWinner(squares);
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    } else if (squares.every(Boolean)) {
        status = 'Draw!';
    }
    else {
        status = 'Next player: ' + (xIsNext ? 'X' : 'O');
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="font-bold text-xl text-brand-gold">{status}</div>
            <div className="grid grid-cols-3 gap-2">
                {squares.map((_, i) => (
                    <Square key={i} value={squares[i]} onSquareClick={() => handleClick(i)} />
                ))}
            </div>
        </div>
    );
}

export function TicTacToe() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares: ('X' | 'O' | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }
  
  const resetGame = () => {
      setHistory([Array(9).fill(null)]);
      setCurrentMove(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md glass-card p-8 flex flex-col items-center gap-6"
    >
        <h2 className="text-3xl font-headline text-accent-pink mb-4">Tic-Tac-Toe</h2>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
        <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
            <RotateCcw size={16}/> Reset Game
        </button>
    </motion.div>
  );
}

function calculateWinner(squares: ('X' | 'O' | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
