
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Apple, Trophy } from 'lucide-react';

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
    const [highScore, setHighScore] = useState(0);

    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);


    // Load high score from local storage
    useEffect(() => {
        const storedHighScore = localStorage.getItem('snakeHighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
    }, []);

    const changeDirection = useCallback((newDir: Direction) => {
        setDirection(currentDir => {
             if (newDir === 'UP' && currentDir !== 'DOWN') return 'UP';
             if (newDir === 'DOWN' && currentDir !== 'UP') return 'DOWN';
             if (newDir === 'LEFT' && currentDir !== 'RIGHT') return 'LEFT';
             if (newDir === 'RIGHT' && currentDir !== 'LEFT') return 'RIGHT';
             return currentDir;
        });
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        e.preventDefault(); // Prevent page scrolling with arrow keys
        switch (e.key) {
            case 'ArrowUp': changeDirection('UP'); break;
            case 'ArrowDown': changeDirection('DOWN'); break;
            case 'ArrowLeft': changeDirection('LEFT'); break;
            case 'ArrowRight': changeDirection('RIGHT'); break;
        }
    }, [changeDirection]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (deltaX > 30) changeDirection('RIGHT');
            else if (deltaX < -30) changeDirection('LEFT');
        } else { // Vertical swipe
            if (deltaY > 30) changeDirection('DOWN');
            else if (deltaY < -30) changeDirection('UP');
        }
        touchStartRef.current = null;
    };


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
                const newScore = score + 10;
                setScore(newScore);
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('snakeHighScore', newScore.toString());
                }
                setFood(getRandomCoordinate(newSnake));
                // Increase speed slightly
                setSpeed(s => Math.max(50, s! * 0.95));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [direction, food, gameOver, score, highScore]);


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
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.3, times: [0, 0.5, 1] }} key={score} className="text-accent-cyan text-lg">
                    Score: {score}
                </motion.span>
                <span className="text-accent-pink text-lg">High Score: {highScore}</span>
            </div>

            <div 
                className="grid bg-black/30 border-2 border-accent-cyan/20 relative shadow-[0_0_15px_rgba(0,240,255,0.3)] touch-none"
                style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    width: `${GRID_SIZE * TILE_SIZE}px`,
                    height: `${GRID_SIZE * TILE_SIZE}px`,
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {snake.map((segment, index) => (
                    <div 
                        key={index} 
                        className={`w-full h-full rounded-sm transition-colors duration-200 ${index === 0 ? 'bg-accent-green shadow-[0_0_8px_rgba(57,255,20,0.7)]' : 'bg-green-400/80'}`} 
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
                    <Apple className="animate-pulse drop-shadow-[0_0_5px_rgba(255,50,50,0.8)]"/>
                 </div>
            </div>

            {gameOver && (
                <motion.div 
                    initial={{opacity: 0, y: 10}} 
                    animate={{opacity: 1, y: 0}}
                    className="text-center bg-red-500/10 p-4 rounded-xl border border-red-500/30"
                >
                    <Trophy className="mx-auto text-brand-gold mb-2" size={32}/>
                    <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                    <p className="text-gray-300">Your final score is {score}.</p>
                    {score > 0 && score === highScore && <p className="font-bold text-brand-gold animate-pulse">New High Score!</p>}
                </motion.div>
            )}
            
            <div className="flex flex-col items-center gap-4">
                {/* Hide controls on mobile, show on medium screens and up */}
                <div className="hidden md:grid grid-cols-3 gap-2">
                    <div />
                    <button className="btn-glass p-4" onClick={() => changeDirection('UP')}><ArrowUp/></button>
                    <div />
                    <button className="btn-glass p-4" onClick={() => changeDirection('LEFT')}><ArrowLeft/></button>
                    <button className="btn-glass p-4" onClick={() => changeDirection('DOWN')}><ArrowDown/></button>
                    <button className="btn-glass p-4" onClick={() => changeDirection('RIGHT')}><ArrowRight/></button>
                </div>

                <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                    <RotateCcw size={16}/> New Game
                </button>
            </div>
        </motion.div>
    );
}
