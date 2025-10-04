"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Apple } from 'lucide-react';

const GRID_SIZE = 20;
const TILE_SIZE = 20; // in pixels

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomCoordinate = (snakeBody: {x: number, y: number}[]) => {
    let coordinate;
    do {
        coordinate = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (snakeBody.some(segment => segment.x === coordinate.x && segment.y === coordinate.y));
    return coordinate;
};

export function Snake() {
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState(getRandomCoordinate(snake));
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [speed, setSpeed] = useState<number | null>(200);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'DOWN') setDirection('UP');
                break;
            case 'ArrowDown':
                if (direction !== 'UP') setDirection('DOWN');
                break;
            case 'ArrowLeft':
                if (direction !== 'RIGHT') setDirection('LEFT');
                break;
            case 'ArrowRight':
                if (direction !== 'LEFT') setDirection('RIGHT');
                break;
        }
    }, [direction]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(getRandomCoordinate([{ x: 10, y: 10 }]));
        setDirection('RIGHT');
        setGameOver(false);
        setScore(0);
        setSpeed(200);
    };

    const runGame = useCallback(() => {
        if (gameOver) return;

        setSnake(prevSnake => {
            const newSnake = [...prevSnake];
            const head = { ...newSnake[0] };

            switch (direction) {
                case 'UP': head.y -= 1; break;
                case 'DOWN': head.y += 1; break;
                case 'LEFT': head.x -= 1; break;
                case 'RIGHT': head.x += 1; break;
            }

            // Wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameOver(true);
                setSpeed(null);
                return prevSnake;
            }
            
            // Self collision
            for (let i = 1; i < newSnake.length; i++) {
                if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
                    setGameOver(true);
                    setSpeed(null);
                    return prevSnake;
                }
            }
            
            newSnake.unshift(head);

            // Food collision
            if (head.x === food.x && head.y === food.y) {
                setScore(s => s + 10);
                setFood(getRandomCoordinate(newSnake));
                // Increase speed slightly
                setSpeed(s => Math.max(50, s! * 0.95));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, gameOver]);


    useEffect(() => {
        if (speed !== null && !gameOver) {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
            gameLoopRef.current = setInterval(runGame, speed);
        } else if (gameLoopRef.current) {
            clearInterval(gameLoopRef.current);
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [runGame, speed, gameOver]);


    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6 flex flex-col items-center gap-6"
        >
             <h2 className="text-3xl font-headline text-accent-green">Snake</h2>

            <div className="flex justify-between w-full font-bold">
                <span className="text-accent-cyan">Score: {score}</span>
                <span className="text-accent-pink">Length: {snake.length}</span>
            </div>

            <div 
                className="grid bg-black/30 border-2 border-accent-cyan/20"
                style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    width: `${GRID_SIZE * TILE_SIZE}px`,
                    height: `${GRID_SIZE * TILE_SIZE}px`,
                }}
            >
                {snake.map((segment, index) => (
                    <div 
                        key={index} 
                        className={`transition-colors duration-200 ${index === 0 ? 'bg-accent-green' : 'bg-green-400/80'}`} 
                        style={{
                            gridColumnStart: segment.x + 1,
                            gridRowStart: segment.y + 1,
                        }}
                    />
                ))}
                 <div
                    className="flex items-center justify-center text-red-500"
                    style={{
                        gridColumnStart: food.x + 1,
                        gridRowStart: food.y + 1,
                    }}
                 >
                    <Apple className="animate-pulse"/>
                 </div>
            </div>

            {gameOver && (
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                    <p className="text-gray-300">Your final score is {score}.</p>
                </div>
            )}
            
            <div className="flex flex-col items-center gap-4">
                <div className="hidden md:flex gap-2">
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↑</kbd>
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↓</kbd>
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">←</kbd>
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">→</kbd>
                </div>
                <div className="grid grid-cols-3 gap-2 md:hidden">
                    <div />
                    <button className="btn-glass p-3" onClick={() => handleKeyDown({ key: 'ArrowUp' } as KeyboardEvent)}><ArrowUp/></button>
                    <div />
                    <button className="btn-glass p-3" onClick={() => handleKeyDown({ key: 'ArrowLeft' } as KeyboardEvent)}><ArrowLeft/></button>
                    <button className="btn-glass p-3" onClick={() => handleKeyDown({ key: 'ArrowDown' } as KeyboardEvent)}><ArrowDown/></button>
                    <button className="btn-glass p-3" onClick={() => handleKeyDown({ key: 'ArrowRight' } as KeyboardEvent)}><ArrowRight/></button>
                </div>

                <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                    <RotateCcw size={16}/> New Game
                </button>
            </div>
        </motion.div>
    );
}