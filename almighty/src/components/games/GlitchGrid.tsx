
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BrainCircuit, RefreshCw, Play } from 'lucide-react';
import { FaReact, FaNodeJs, FaGoogle, FaApple, FaAndroid, FaFigma } from 'react-icons/fa';

const ICONS: { [key: number]: React.ReactNode } = {
  2: <FaReact />, 4: <FaNodeJs />, 8: <FaGoogle />, 16: <FaApple />,
  32: <FaAndroid />, 64: <FaFigma />, 128: <span className="font-bold">JS</span>, 256: <span className="font-bold">TS</span>,
  512: <span className="font-bold">PY</span>, 1024: <span className="font-bold">GO</span>, 2048: <span className="font-bold">AI</span>
};

const COLORS: { [key: number]: string } = {
  2: 'bg-sky-200 text-sky-800', 4: 'bg-green-200 text-green-800', 8: 'bg-red-200 text-red-800',
  16: 'bg-gray-300 text-gray-900', 32: 'bg-lime-300 text-lime-900', 64: 'bg-purple-300 text-purple-900',
  128: 'bg-yellow-300 text-yellow-900', 256: 'bg-blue-400 text-white', 512: 'bg-indigo-400 text-white',
  1024: 'bg-teal-400 text-white', 2048: 'bg-gradient-to-r from-accent-pink to-accent-cyan text-white'
};

const GRID_SIZE = 4;
type GameStatus = 'waiting' | 'playing' | 'gameOver';

const initializeGrid = (): (number | null)[][] => {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
};

const addRandomTile = (grid: (number | null)[][]) => {
  let emptyTiles = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        emptyTiles.push({ r, c });
      }
    }
  }
  if (emptyTiles.length > 0) {
    const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  return grid;
};

export function GlitchGrid() {
    const [grid, setGrid] = useState<(number | null)[][]>(initializeGrid());
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

    const move = (direction: 'up' | 'down' | 'left' | 'right') => {
        if (status !== 'playing') return;

        let newGrid = JSON.parse(JSON.stringify(grid));
        let moved = false;
        let scoreToAdd = 0;

        const merge = (row: (number | null)[]) => {
            let newRow = row.filter(tile => tile !== null);
            for (let i = 0; i < newRow.length - 1; i++) {
                if (newRow[i] !== null && newRow[i] === newRow[i+1]) {
                    newRow[i]! *= 2;
                    scoreToAdd += newRow[i]!;
                    newRow.splice(i+1, 1);
                    moved = true;
                }
            }
            let finalRow = newRow.filter(tile => tile !== null);
            while (finalRow.length < GRID_SIZE) {
                finalRow.push(null);
            }
            return finalRow;
        }
        
        const transpose = (matrix: (number|null)[][]) => {
            return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
        }

        if (direction === 'left' || direction === 'right') {
            for (let r = 0; r < GRID_SIZE; r++) {
                const originalRow = [...newGrid[r]];
                const rowToMerge = direction === 'left' ? newGrid[r] : newGrid[r].reverse();
                const mergedRow = merge(rowToMerge);
                newGrid[r] = direction === 'left' ? mergedRow : mergedRow.reverse();
                 if (JSON.stringify(originalRow) !== JSON.stringify(newGrid[r])) moved = true;
            }
        } else { // 'up' or 'down'
            newGrid = transpose(newGrid);
            for (let r = 0; r < GRID_SIZE; r++) {
                const originalCol = [...newGrid[r]];
                const colToMerge = direction === 'up' ? newGrid[r] : newGrid[r].reverse();
                const mergedCol = merge(colToMerge);
                newGrid[r] = direction === 'up' ? mergedCol : mergedCol.reverse();
                 if (JSON.stringify(originalCol) !== JSON.stringify(newGrid[r])) moved = true;
            }
            newGrid = transpose(newGrid);
        }

        if (moved) {
            setGrid(addRandomTile(newGrid));
            setScore(s => s + scoreToAdd);
        } else {
             // Check for game over
            let canMove = false;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (grid[r][c] === null) canMove = true;
                    if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) canMove = true;
                    if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) canMove = true;
                }
            }
            if (!canMove) setStatus('gameOver');
        }
    };
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp': move('up'); break;
            case 'ArrowDown': move('down'); break;
            case 'ArrowLeft': move('left'); break;
            case 'ArrowRight': move('right'); break;
        }
    }, [move]);
    
    useEffect(() => {
        if(status === 'playing') {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status, handleKeyDown]);
    
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const deltaX = e.changedTouches[0].clientX - touchStart.x;
        const deltaY = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (deltaX > 50) move('right');
            else if (deltaX < -50) move('left');
        } else { // Vertical swipe
            if (deltaY > 50) move('down');
            else if (deltaY < -50) move('up');
        }
        setTouchStart(null);
    };

    const resetGame = () => {
        setGrid(initializeGrid());
        setScore(0);
        setStatus('waiting');
    };
    
    const startGame = () => {
        resetGame();
        setStatus('playing');
    }

    return (
        <div 
            className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-4 font-body relative overflow-hidden gap-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <h2 className="text-3xl font-headline font-bold text-accent-cyan">Glitch Grid</h2>

            <AnimatePresence>
                {status !== 'playing' && (
                     <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
                    >
                         {status === 'waiting' ? (
                            <>
                                <BrainCircuit size={64} className="text-accent-cyan mb-4"/>
                                <h2 className="text-4xl font-headline font-bold text-accent-cyan">Glitch Grid</h2>
                                <p className="text-gray-400 mt-2 mb-6">Merge tiles to reach the ultimate goal. Use arrow keys or swipe.</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2 text-lg"><Play/> Start Game</button>
                            </>
                         ) : ( // gameOver
                            <>
                                <Award size={64} className="text-brand-gold mb-4"/>
                                <h2 className="text-4xl font-headline font-bold text-accent-pink">Game Over</h2>
                                <p className="text-lg mt-2">Final Score: <span className="font-bold text-accent-cyan">{score}</span></p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white mt-8 flex items-center gap-2"><RefreshCw/> Play Again</button>
                            </>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="text-center">
                <p className="text-gray-400">Score</p>
                <p className="text-4xl font-bold text-brand-gold">{score}</p>
            </div>

            <div className="grid grid-cols-4 gap-3 p-3 bg-black/20 rounded-lg w-full max-w-sm aspect-square">
                {grid.map((row, rIdx) => 
                    row.map((tile, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className="w-full h-full rounded-md bg-gray-700/50 flex items-center justify-center">
                            <AnimatePresence>
                                {tile && (
                                    <motion.div
                                        key={tile}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={`w-full h-full rounded-md flex flex-col items-center justify-center text-2xl font-bold ${COLORS[tile] || 'bg-gray-500'}`}
                                    >
                                        <div className="text-4xl">{ICONS[tile] || ''}</div>
                                        {tile > 1024 && <span className="text-xs">{tile}</span>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
