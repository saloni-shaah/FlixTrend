
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 4;

const TILE_COLORS: { [key: number]: string } = {
  2: 'bg-gray-700 text-gray-200',
  4: 'bg-gray-600 text-gray-100',
  8: 'bg-orange-500 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-red-500 text-white',
  64: 'bg-red-600 text-white',
  128: 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50',
  256: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50',
  512: 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/50',
  1024: 'bg-purple-500 text-white shadow-lg shadow-purple-500/50',
  2048: 'bg-purple-600 text-white shadow-lg shadow-purple-600/50',
};

const createEmptyBoard = () => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

const addRandomTile = (board: number[][]) => {
    const newBoard = board.map(row => [...row]);
    let added = false;
    while (!added) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        if (newBoard[row][col] === 0) {
            newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
            added = true;
        }
    }
    return newBoard;
};

const slide = (row: number[]) => {
    const arr = row.filter(val => val);
    const missing = GRID_SIZE - arr.length;
    const zeros = Array(missing).fill(0);
    return arr.concat(zeros);
};

const combine = (row: number[]) => {
    let scoreToAdd = 0;
    for (let i = 0; i < GRID_SIZE - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            scoreToAdd += row[i];
            row[i + 1] = 0;
        }
    }
    return { newRow: row, score: scoreToAdd };
};

const rotate = (board: number[][]) => {
    const newBoard = createEmptyBoard();
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            newBoard[i][j] = board[j][i];
        }
    }
    return newBoard;
};

const flip = (board: number[][]) => {
    return board.map(row => row.slice().reverse());
};

const moveLeft = (board: number[][]) => {
    let totalScore = 0;
    const newBoard = board.map(row => {
        let newRow = slide(row);
        const { newRow: combinedRow, score } = combine(newRow);
        totalScore += score;
        return slide(combinedRow);
    });
    return { board: newBoard, score: totalScore };
};

const moveRight = (board: number[][]) => {
    const flippedBoard = flip(board);
    const { board: newBoard, score } = moveLeft(flippedBoard);
    return { board: flip(newBoard), score: score };
};

const moveUp = (board: number[][]) => {
    const rotatedBoard = rotate(board);
    const { board: newBoard, score } = moveLeft(rotatedBoard);
    return { board: rotate(rotate(rotate(newBoard))), score: score };
};

const moveDown = (board: number[][]) => {
    const rotatedBoard = rotate(board);
    const { board: newBoard, score } = moveRight(rotatedBoard);
    return { board: rotate(rotate(rotate(newBoard))), score: score };
};


export function Game2048() {
    const [board, setBoard] = useState(addRandomTile(addRandomTile(createEmptyBoard())));
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('2048HighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
    }, []);

    const resetGame = useCallback(() => {
        setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
        setScore(0);
        setGameOver(false);
    }, []);

    const isGameOver = (board: number[][]): boolean => {
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (board[i][j] === 0) return false;
                if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
                if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
            }
        }
        return true;
    };
    
    const handleMove = (newBoard: number[][], scoreGained: number, moved: boolean) => {
        if(moved) {
            const boardWithNewTile = addRandomTile(newBoard);
            setBoard(boardWithNewTile);
            const newScore = score + scoreGained;
            setScore(newScore);
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('2048HighScore', newScore.toString());
            }
            if (isGameOver(boardWithNewTile)) {
                setGameOver(true);
            }
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver) return;
        let result;
        const originalBoard = JSON.stringify(board);

        switch (e.key) {
            case 'ArrowLeft': result = moveLeft(board); break;
            case 'ArrowRight': result = moveRight(board); break;
            case 'ArrowUp': result = moveUp(board); break;
            case 'ArrowDown': result = moveDown(board); break;
            default: return;
        }
        
        e.preventDefault();
        const moved = JSON.stringify(result.board) !== originalBoard;
        handleMove(result.board, result.score, moved);

    }, [board, score, highScore, gameOver]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || gameOver) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        
        if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

        let result;
        const originalBoard = JSON.stringify(board);
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) result = moveRight(board);
            else result = moveLeft(board);
        } else {
            if (deltaY > 0) result = moveDown(board);
            else result = moveUp(board);
        }
        
        const moved = JSON.stringify(result.board) !== originalBoard;
        handleMove(result.board, result.score, moved);
        touchStartRef.current = null;
    };


    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6 flex flex-col items-center gap-6"
        >
            <h2 className="text-3xl font-headline text-accent-cyan">2048</h2>

             <div className="flex justify-between w-full font-bold">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3, times: [0, 0.5, 1] }} key={score} className="text-accent-cyan text-lg">
                    Score: {score}
                </motion.span>
                <span className="text-accent-pink text-lg">High Score: {highScore}</span>
            </div>

            <div 
                className="grid grid-cols-4 gap-2 bg-black/30 border-2 border-accent-cyan/20 p-2 rounded-lg relative touch-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {board.map((row, i) =>
                    row.map((val, j) => (
                        <div key={`${i}-${j}`} className={`w-20 h-20 md:w-24 md:h-24 rounded-md flex items-center justify-center font-bold text-2xl md:text-3xl ${val === 0 ? 'bg-gray-800/50' : TILE_COLORS[val] || 'bg-gray-500'}`}>
                           <AnimatePresence>
                             {val !== 0 && (
                                <motion.div
                                    key={val}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                >
                                    {val}
                                </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                    ))
                )}
                 {gameOver && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10"
                    >
                        <Trophy className="mx-auto text-brand-gold mb-2" size={32}/>
                        <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                        <p className="text-gray-300">Your final score is {score}.</p>
                    </motion.div>
                )}
            </div>
            
            <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                <RotateCcw size={16}/> New Game
            </button>
        </motion.div>
    );
}
