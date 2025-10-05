
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy, Heart } from 'lucide-react';

// --- GAME CONFIGURATION ---
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const INITIAL_LIVES = 3;

const BRICK_COLORS = ['#FF3CAC', '#BF00FF', '#00F0FF', '#39FF14', '#FFB400'];

const levelLayouts = [
  // Level 1: Solid Wall with varied colors
  Array(BRICK_ROW_COUNT).fill(0).map((_, r) => Array(BRICK_COLUMN_COUNT).fill(0).map((_, c) => ({ status: 1, color: BRICK_COLORS[(r + c) % BRICK_COLORS.length] }))),
  // Level 2: Pyramid
  [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
  ].map((row, r) => row.map(cell => ({ status: cell, color: BRICK_COLORS[r % BRICK_COLORS.length] }))),
  // Level 3: Checkered
  Array(BRICK_ROW_COUNT).fill(0).map((_, r) => 
    Array(BRICK_COLUMN_COUNT).fill(0).map((_, c) => ({ status: (r + c) % 2, color: BRICK_COLORS[c % BRICK_COLORS.length] }))
  )
];

export function BrickBreaker() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [level, setLevel] = useState(0);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'won' | 'lost'>('start');

    // Use refs for state that changes every frame to avoid re-renders
    const ballRef = useRef({ x: 0, y: 0, dx: 4, dy: -4 });
    const paddleRef = useRef({ x: 0 });
    const bricksRef = useRef(JSON.parse(JSON.stringify(levelLayouts[level])));

    const resetBallAndPaddle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        paddleRef.current.x = (canvas.width - PADDLE_WIDTH) / 2;
        ballRef.current = { x: canvas.width / 2, y: canvas.height - 50, dx: 4, dy: -4 };
    }, []);

    const resetLevel = useCallback((levelIndex: number) => {
        bricksRef.current = JSON.parse(JSON.stringify(levelLayouts[levelIndex]));
        setLevel(levelIndex);
        setLives(INITIAL_LIVES);
        setScore(0);
        resetBallAndPaddle();
        setGameState('start');
    }, [resetBallAndPaddle]);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('brickBreakerHighScore');
        if (storedHighScore) setHighScore(parseInt(storedHighScore));
        resetBallAndPaddle(); // Initial position
    }, [resetBallAndPaddle]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Bricks
            bricksRef.current.forEach((row: any[], r: number) => {
                row.forEach((brick: { status: number; color: string }, c: number) => {
                    if (brick.status === 1) {
                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                        const brickY = r * 30 + 30;
                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                        const brickHeight = 25;
                        
                        ctx.beginPath();
                        ctx.rect(brickX + 2, brickY + 2, brickWidth - 4, brickHeight - 4);
                        ctx.fillStyle = brick.color || BRICK_COLORS[r % BRICK_COLORS.length];
                        ctx.fill();
                        ctx.closePath();
                    }
                });
            });

            // Draw Ball
            ctx.beginPath();
            ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#00F0FF';
            ctx.shadowColor = '#00F0FF';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;

            // Draw Paddle
            ctx.beginPath();
            ctx.rect(paddleRef.current.x, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = '#FF3CAC';
            ctx.shadowColor = '#FF3CAC';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
        };

        const update = () => {
            const ball = ballRef.current;
            const paddle = paddleRef.current;
            const bricks = bricksRef.current;

            // Collision Detection
            bricks.forEach((row: any[], r: number) => {
                row.forEach((brick: { status: number; }, c: number) => {
                    if (brick.status === 1) {
                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                        const brickY = r * 30 + 30;
                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                        const brickHeight = 25;
                        
                        if (ball.x > brickX && ball.x < brickX + brickWidth && ball.y > brickY && ball.y < brickY + brickHeight) {
                            ball.dy = -ball.dy;
                            brick.status = 0;
                            setScore(s => {
                                const newScore = s + 10;
                                if (newScore > highScore) {
                                    setHighScore(newScore);
                                    localStorage.setItem('brickBreakerHighScore', newScore.toString());
                                }
                                return newScore;
                            });
                        }
                    }
                });
            });

            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collision
            if (ball.x > canvas.width - BALL_RADIUS || ball.x < BALL_RADIUS) {
                ball.dx = -ball.dx;
            }
            if (ball.y < BALL_RADIUS) {
                ball.dy = -ball.dy;
                // FIX: Prevent ball getting stuck at top
                if (Math.abs(ball.dy) < 1) {
                    ball.dy = 2;
                }
            } else if (ball.y > canvas.height - PADDLE_HEIGHT - 10 - BALL_RADIUS) {
                if (ball.x > paddle.x && ball.x < paddle.x + PADDLE_WIDTH) {
                    ball.dy = -ball.dy;
                } else {
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) {
                            setGameState('lost');
                        } else {
                            resetBallAndPaddle();
                            setGameState('paused');
                        }
                        return newLives;
                    });
                }
            }

            if (bricks.every((row: any[]) => row.every(brick => brick.status === 0))) {
                setGameState('won');
            }
        };

        const gameLoop = () => {
            if (gameState === 'playing') {
                update();
            }
            draw();
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameState, resetBallAndPaddle, highScore]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddleRef.current.x = Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH);
        }
    }, []);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
         if (relativeX > 0 && relativeX < canvas.width) {
            paddleRef.current.x = Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH);
        }
    }, []);
    
    const startGame = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (gameState === 'start' || gameState === 'paused') {
            setGameState('playing');
        }
    }
    
    const goToNextLevel = () => {
        const nextLevel = (level + 1) % levelLayouts.length;
        resetLevel(nextLevel);
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl glass-card p-4 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-pink">Brick Breaker</h2>
            <div className="flex justify-between w-full font-bold text-lg">
                <span className="text-accent-cyan">Score: {score}</span>
                <span className="text-gray-400">High Score: {highScore}</span>
                <div className="flex items-center gap-2 text-accent-pink">
                    <Heart /> {lives}
                </div>
            </div>

            <div className="relative w-full aspect-[4/3] bg-black/50 border-2 border-accent-cyan/20 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={450}
                    className="w-full h-full"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                />
                 <AnimatePresence>
                {(gameState !== 'playing') && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10 cursor-pointer"
                        onClick={startGame}
                        onTouchStart={startGame}
                    >
                       {gameState === 'start' && <h3 className="text-2xl font-bold text-green-400 animate-pulse">Tap to Start</h3>}
                       {gameState === 'paused' && <h3 className="text-2xl font-bold text-yellow-400">Paused - Tap to Resume</h3>}
                       {gameState === 'lost' && (
                           <>
                               <Trophy className="mx-auto mb-2 text-gray-500" size={32}/>
                               <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                               <p className="text-gray-300">Your final score is {score}.</p>
                               <button onClick={(e) => {e.stopPropagation(); resetLevel(level)}} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                                   <RotateCcw size={16}/> Try Again
                               </button>
                           </>
                       )}
                        {gameState === 'won' && (
                           <>
                               <Trophy className="mx-auto mb-2 text-brand-gold" size={32}/>
                               <h3 className="text-2xl font-bold text-green-400">Level Complete!</h3>
                               <p className="text-gray-300">Final Score: {score}</p>
                               <button onClick={(e) => {e.stopPropagation(); goToNextLevel()}} className="btn-glass bg-green-500/20 text-green-400 flex items-center gap-2 mt-4">
                                   Next Level
                               </button>
                           </>
                       )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
             <button onClick={() => resetLevel(level)} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-2">
                <RotateCcw size={16}/> Reset Game
            </button>
        </motion.div>
    );
}
