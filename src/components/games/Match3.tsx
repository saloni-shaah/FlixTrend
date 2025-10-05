
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Star, Gem, Trophy, Move } from 'lucide-react';

const GRID_SIZE = 8;
const TILE_COLORS = ['#FF3CAC', '#00F0FF', '#39FF14', '#FFB400', '#BF00FF', '#FF5F6D'];

// --- LEVEL DEFINITIONS ---
const levels = [
  { level: 1, goal: { type: 'score', value: 1000 }, moves: 20 },
  { level: 2, goal: { type: 'score', value: 2500 }, moves: 25 },
  { level: 3, goal: { type: 'clearColor', colorIndex: 2, value: 15 }, moves: 30 }, // Clear 15 green gems
];

const hasMatches = (board: (number | null)[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (c < GRID_SIZE - 2 && board[r][c] !== null && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2]) return true;
            if (r < GRID_SIZE - 2 && board[r][c] !== null && board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c]) return true;
        }
    }
    return false;
}

const createInitialBoard = () => {
    const newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            newBoard[r][c] = Math.floor(Math.random() * TILE_COLORS.length);
        }
    }
    // Prevent initial matches
    if (hasMatches(newBoard)) {
        return createInitialBoard(); // Recurse until a match-free board is made
    }
    return newBoard;
};


export function Match3() {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [board, setBoard] = useState<(number | null)[][]>(createInitialBoard());
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [movesLeft, setMovesLeft] = useState(levels[currentLevel].moves);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [goalProgress, setGoalProgress] = useState(0);

    const [selectedTile, setSelectedTile] = useState<{r: number, c: number} | null>(null);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('match3HighScore');
        if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
    }, []);
    
    const checkMatches = useCallback((currentBoard: (number | null)[][]) => {
        const matches = new Set<string>();
        // Horizontal
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                if (currentBoard[r][c] !== null && currentBoard[r][c] === currentBoard[r][c + 1] && currentBoard[r][c] === currentBoard[r][c + 2]) {
                    matches.add(`${r}-${c}`);
                    matches.add(`${r}-${c + 1}`);
                    matches.add(`${r}-${c + 2}`);
                }
            }
        }
        // Vertical
        for (let c = 0; c < GRID_SIZE; c++) {
            for (let r = 0; r < GRID_SIZE - 2; r++) {
                if (currentBoard[r][c] !== null && currentBoard[r][c] === currentBoard[r + 1][c] && currentBoard[r][c] === currentBoard[r + 2][c]) {
                    matches.add(`${r}-${c}`);
                    matches.add(`${r + 1}-${c}`);
                    matches.add(`${r + 2}-${c}`);
                }
            }
        }
        return matches;
    }, []);
    
    const dropAndRefill = useCallback((boardAfterClear: (number | null)[][]) => {
        const newBoard = boardAfterClear.map(row => [...row]);
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptyCount = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (newBoard[r][c] === null) {
                    emptyCount++;
                } else if (emptyCount > 0) {
                    newBoard[r + emptyCount][c] = newBoard[r][c];
                    newBoard[r][c] = null;
                }
            }
            for (let r = 0; r < emptyCount; r++) {
                newBoard[r][c] = Math.floor(Math.random() * TILE_COLORS.length);
            }
        }
        return newBoard;
    }, []);

    const processMatches = useCallback((currentBoard: (number | null)[][]): { newBoard: (number | null)[][], scoreGained: number, clearedColors: {[key: number]: number} } => {
        let matches = checkMatches(currentBoard);
        if (matches.size === 0) return { newBoard: currentBoard, scoreGained: 0, clearedColors: {} };

        let scoreGained = 0;
        let clearedColors: {[key: number]: number} = {};
        const boardAfterClear = currentBoard.map(row => [...row]);

        matches.forEach(key => {
            const [r, c] = key.split('-').map(Number);
            const colorIndex = boardAfterClear[r][c];
            if (colorIndex !== null) {
                clearedColors[colorIndex] = (clearedColors[colorIndex] || 0) + 1;
                boardAfterClear[r][c] = null;
                scoreGained += 10;
            }
        });
        
        const refilledBoard = dropAndRefill(boardAfterClear);

        // Chain reaction
        const chainedResult = processMatches(refilledBoard);
        
        let finalClearedColors = { ...clearedColors };
        for (const color in chainedResult.clearedColors) {
            finalClearedColors[color] = (finalClearedColors[color] || 0) + chainedResult.clearedColors[color];
        }
        
        return {
            newBoard: chainedResult.newBoard,
            scoreGained: scoreGained + chainedResult.scoreGained,
            clearedColors: finalClearedColors
        };

    }, [checkMatches, dropAndRefill]);

    const handleSwap = (r1: number, c1: number, r2: number, c2: number) => {
        if (gameState !== 'playing' || movesLeft <= 0) return;
        
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);

        if (dr + dc !== 1) return; // Not an adjacent swap

        const newBoard = board.map(row => [...row]);
        [newBoard[r1][c1], newBoard[r2][c2]] = [newBoard[r2][c2], newBoard[r1][c1]];

        const { newBoard: boardAfterMatches, scoreGained, clearedColors } = processMatches(newBoard);

        if (scoreGained > 0) {
            setBoard(boardAfterMatches);
            const newScore = score + scoreGained;
            setScore(newScore);
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('match3HighScore', newScore.toString());
            }

            const levelGoal = levels[currentLevel].goal;
            if (levelGoal.type === 'clearColor') {
                setGoalProgress(prev => prev + (clearedColors[levelGoal.colorIndex] || 0));
            } else {
                setGoalProgress(newScore);
            }
            
            setMovesLeft(moves => moves - 1);
        }
        // If swap is invalid, we could swap them back visually, but for simplicity, we do nothing.
    };

    const handleTileClick = (r: number, c: number) => {
        if (gameState !== 'playing') return;

        if (!selectedTile) {
            setSelectedTile({ r, c });
        } else {
            handleSwap(selectedTile.r, selectedTile.c, r, c);
            setSelectedTile(null); // Reset selection after attempting a swap
        }
    };
    
    useEffect(() => {
        if (gameState !== 'playing') return;
        
        const levelGoal = levels[currentLevel].goal;
        let goalMet = false;
        if (levelGoal.type === 'score' && score >= levelGoal.value) goalMet = true;
        if (levelGoal.type === 'clearColor' && goalProgress >= levelGoal.value) goalMet = true;

        if (goalMet) {
            setGameState('won');
        } else if (movesLeft <= 0) {
            setGameState('lost');
        }

    }, [score, movesLeft, goalProgress, currentLevel, gameState]);


    const resetGame = (levelIndex = 0) => {
        setCurrentLevel(levelIndex);
        setBoard(createInitialBoard());
        setScore(levelIndex > 0 ? score : 0);
        setMovesLeft(levels[levelIndex].moves);
        setGameState('playing');
        setGoalProgress(0);
        setSelectedTile(null);
    };

    const level = levels[currentLevel];

    return (
         <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-pink">Match-3 Madness</h2>
            <div className="flex justify-between w-full font-bold text-lg">
                <span className="text-accent-cyan flex items-center gap-2"><Star size={18}/> Score: {score}</span>
                <span className="text-accent-pink flex items-center gap-2"><Move size={18}/> Moves: {movesLeft}</span>
            </div>
             <div className="w-full text-center bg-black/20 p-2 rounded-lg">
                <p className="font-bold text-brand-gold">Level {level.level}: {
                    level.goal.type === 'score' ? `Reach ${level.goal.value} points` : `Clear ${level.goal.value} green gems`
                }</p>
                {level.goal.type === 'clearColor' && (
                    <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                        <div className="bg-green-400 h-2.5 rounded-full" style={{ width: `${Math.min(100, (goalProgress / level.goal.value) * 100)}%` }}></div>
                    </div>
                )}
            </div>

            <div 
                className="grid gap-1 bg-black/30 border-2 border-accent-cyan/20 p-1 rounded-lg relative"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`}}
            >
                <AnimatePresence>
                {board.map((row, r) => row.map((colorIndex, c) => (
                    <motion.div
                        key={`${r}-${c}`}
                        layoutId={`${r}-${c}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`w-full aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all ${selectedTile?.r === r && selectedTile?.c === c ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ backgroundColor: colorIndex !== null ? TILE_COLORS[colorIndex] : 'transparent' }}
                        onClick={() => handleTileClick(r, c)}
                    >
                       <Gem className="text-white/50" />
                    </motion.div>
                )))}
                </AnimatePresence>
                 {(gameState === 'won' || gameState === 'lost') && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10"
                    >
                        <Trophy className={`mx-auto mb-2 ${gameState === 'won' ? 'text-brand-gold' : 'text-gray-500'}`} size={32}/>
                        <h3 className={`text-2xl font-bold ${gameState === 'won' ? 'text-green-400' : 'text-red-500'}`}>{gameState === 'won' ? 'Level Complete!' : 'Game Over'}</h3>
                        <p className="text-gray-300">Your score: {score}</p>
                        <div className="flex gap-2 mt-4">
                        {gameState === 'won' && levels[currentLevel + 1] && (
                            <button onClick={() => resetGame(currentLevel + 1)} className="btn-glass bg-green-500">Next Level</button>
                        )}
                        <button onClick={() => resetGame(currentLevel)} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2">
                            <RotateCcw size={16}/> {gameState === 'won' ? 'Play Again' : 'Try Again'}
                        </button>
                        </div>
                    </motion.div>
                )}
            </div>
            <button onClick={() => resetGame(currentLevel)} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                <RotateCcw size={16}/> Reset Game
            </button>
        </motion.div>
    );
}
