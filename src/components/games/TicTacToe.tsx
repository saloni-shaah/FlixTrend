"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Circle, RotateCcw } from 'lucide-react';

const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
];

function calculateWinner(squares: ('X' | 'O' | null)[]) {
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { winner: squares[a], line: lines[i] };
        }
    }
    return null;
}


function Square({ value, onSquareClick, isWinning }: { value: 'X' | 'O' | null, onSquareClick: () => void, isWinning: boolean }) {
  return (
    <button 
        className={`w-20 h-20 md:w-24 md:h-24 bg-black/20 flex items-center justify-center transition-all duration-300 ${isWinning ? 'bg-brand-gold/30' : 'hover:bg-accent-cyan/10'}`}
        onClick={onSquareClick}
    >
        {value === 'X' && <X className={`w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-pink'}`} />}
        {value === 'O' && <Circle className={`w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-cyan'}`} />}
    </button>
  );
}

function Board({ squares, onPlay, xIsNext, winningLine }: { squares: ('X' | 'O' | null)[], onPlay: (i:number) => void, xIsNext: boolean, winningLine: number[] | null }) {
    const winnerInfo = calculateWinner(squares);
    const winner = winnerInfo?.winner;
    
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    } else if (squares.every(Boolean)) {
        status = 'Draw!';
    } else {
        status = `Next player: ${xIsNext ? 'X' : 'O'}`;
    }

    function handleClick(i: number) {
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        onPlay(i);
    }
    
    return (
        <div className="flex flex-col items-center gap-4">
             <div className={`font-bold text-xl transition-colors ${winner ? 'text-brand-gold' : 'text-gray-300'}`}>{status}</div>
            <div className="grid grid-cols-3 gap-1 bg-accent-cyan/20 p-1 rounded-lg relative">
                {squares.map((square, i) => (
                    <Square key={i} value={square} onSquareClick={() => handleClick(i)} isWinning={winningLine?.includes(i) || false}/>
                ))}
                 {winningLine && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                        <line 
                            x1={getCoord(winningLine[0]).x} y1={getCoord(winningLine[0]).y}
                            x2={getCoord(winningLine[2]).x} y2={getCoord(winningLine[2]).y}
                            stroke="var(--brand-gold)" 
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}

function getCoord(index: number) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = col * 33.33 + 16.66;
    const y = row * 33.33 + 16.66;
    return { x, y };
}


function OfflineGame() {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = useState(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const winnerInfo = calculateWinner(currentSquares);

    function handlePlay(nextSquares: ('X' | 'O' | null)[]) {
        const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }

    function onSquareClick(i: number) {
        const nextSquares = currentSquares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        handlePlay(nextSquares);
    }

    const resetGame = () => {
      setHistory([Array(9).fill(null)]);
      setCurrentMove(0);
    }
    
    return (
        <div className="flex flex-col items-center gap-6">
            <Board squares={currentSquares} onPlay={onSquareClick} xIsNext={xIsNext} winningLine={winnerInfo?.line || null}/>
            <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
                <RotateCcw size={16}/> Reset Game
            </button>
             {winnerInfo && (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-brand-gold animate-bounce">✨ Winner! ✨</h3>
                    <p className="text-gray-300">Congratulations to Player {winnerInfo.winner}!</p>
                </div>
            )}
        </div>
    )
}

export function TicTacToe() {
    return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-8 flex flex-col items-center gap-6"
        >
            <h2 className="text-3xl font-headline text-accent-pink">Tic-Tac-Toe</h2>
            <OfflineGame />
        </motion.div>
    )
}
