
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  // Level 1: Solid Wall
  Array(BRICK_ROW_COUNT).fill(0).map(() => Array(BRICK_COLUMN_COUNT).fill({ status: 1 })),
  // Level 2: Pyramid
  [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
  ].map(row => row.map(cell => ({ status: cell }))),
  // Level 3: Checkered
  Array(BRICK_ROW_COUNT).fill(0).map((_, r) => 
    Array(BRICK_COLUMN_COUNT).fill(0).map((_, c) => ({ status: (r + c) % 2 }))
  )
];

export function BrickBreaker() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'won' | 'lost'>('start');
    const [level, setLevel] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [highScore, setHighScore] = useState(0);
    const [bricks, setBricks] = useState(levelLayouts[level]);
    const [ball, setBall] = useState({ x: 0, y: 0, dx: 4, dy: -4 });
    const [paddle, setPaddle] = useState({ x: 0 });

    const resetBallAndPaddle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setPaddle({ x: (canvas.width - PADDLE_WIDTH) / 2 });
        setBall({ x: canvas.width / 2, y: canvas.height - 50, dx: 4, dy: -4 });
    }, []);

    const resetLevel = useCallback((levelIndex: number) => {
        setBricks(levelLayouts[levelIndex]);
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

        const drawBall = () => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = '#00F0FF';
            ctx.shadowColor = '#00F0FF';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0; // Reset blur for other elements
        };

        const drawPaddle = () => {
            ctx.beginPath();
            ctx.rect(paddle.x, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
            ctx.fillStyle = '#FF3CAC';
            ctx.shadowColor = '#FF3CAC';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
        };

        const drawBricks = () => {
            bricks.forEach((row, r) => {
                row.forEach((brick, c) => {
                    if (brick.status === 1) {
                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                        const brickY = r * 30 + 30; // 30px height + 30px top offset
                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                        const brickHeight = 25;
                        
                        ctx.beginPath();
                        ctx.rect(brickX + 2, brickY + 2, brickWidth - 4, brickHeight - 4);
                        ctx.fillStyle = BRICK_COLORS[r % BRICK_COLORS.length];
                        ctx.fill();
                        ctx.closePath();
                    }
                });
            });
        };
        
        const collisionDetection = () => {
            bricks.forEach((row, r) => {
                row.forEach((brick, c) => {
                    if (brick.status === 1) {
                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                        const brickY = r * 30 + 30;
                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                        const brickHeight = 25;
                        
                        if (
                            ball.x > brickX &&
                            ball.x < brickX + brickWidth &&
                            ball.y > brickY &&
                            ball.y < brickY + brickHeight
                        ) {
                            setBall(b => ({ ...b, dy: -b.dy }));
                            const newBricks = [...bricks];
                            newBricks[r][c].status = 0;
                            setBricks(newBricks);
                            
                            const newScore = score + 10;
                            setScore(newScore);
                            if (newScore > highScore) {
                                setHighScore(newScore);
                                localStorage.setItem('brickBreakerHighScore', newScore.toString());
                            }
                        }
                    }
                });
            });
        };

        const gameLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBricks();
            drawBall();
            drawPaddle();

            if (gameState === 'playing') {
                collisionDetection();

                let newX = ball.x + ball.dx;
                let newY = ball.y + ball.dy;

                // Wall collision
                if (newX > canvas.width - BALL_RADIUS || newX < BALL_RADIUS) {
                    setBall(b => ({ ...b, dx: -b.dx }));
                }
                if (newY < BALL_RADIUS) {
                    setBall(b => ({ ...b, dy: -b.dy }));
                } else if (newY > canvas.height - PADDLE_HEIGHT - 10 - BALL_RADIUS) {
                    // Paddle collision
                    if (newX > paddle.x && newX < paddle.x + PADDLE_WIDTH) {
                        setBall(b => ({ ...b, dy: -b.dy }));
                    } else {
                        // Ball missed
                        setLives(l => l - 1);
                        if (lives - 1 <= 0) {
                            setGameState('lost');
                        } else {
                            resetBallAndPaddle();
                            setGameState('paused');
                        }
                    }
                }
                
                // Check for win
                if (bricks.every(row => row.every(brick => brick.status === 0))) {
                    setGameState('won');
                }

                setBall(b => ({ ...b, x: b.x + b.dx, y: b.y + b.dy }));
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [ball, bricks, gameState, paddle, resetBallAndPaddle, score, highScore, lives]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.clientX - canvas.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < canvas.width) {
            setPaddle({ x: Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH) });
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
         if (relativeX > 0 && relativeX < canvas.width) {
            setPaddle({ x: Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH) });
        }
    }
    
    const startGame = () => {
        if (gameState === 'start' || gameState === 'paused') {
            setGameState('playing');
        }
    }
    
    const goToNextLevel = () => {
        const nextLevel = (level + 1) % levelLayouts.length;
        setLevel(nextLevel);
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
                    onClick={startGame}
                />
                 <AnimatePresence>
                {(gameState !== 'playing') && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10"
                    >
                       {gameState === 'start' && <h3 className="text-2xl font-bold text-green-400">Click to Start</h3>}
                       {gameState === 'paused' && <h3 className="text-2xl font-bold text-yellow-400">Paused - Click to Resume</h3>}
                       {gameState === 'lost' && (
                           <>
                               <Trophy className="mx-auto mb-2 text-gray-500" size={32}/>
                               <h3 className="text-2xl font-bold text-red-500">Game Over!</h3>
                               <p className="text-gray-300">Your final score is {score}.</p>
                               <button onClick={() => resetLevel(level)} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                                   <RotateCcw size={16}/> Try Again
                               </button>
                           </>
                       )}
                        {gameState === 'won' && (
                           <>
                               <Trophy className="mx-auto mb-2 text-brand-gold" size={32}/>
                               <h3 className="text-2xl font-bold text-green-400">Level Complete!</h3>
                               <p className="text-gray-300">Final Score: {score}</p>
                               <button onClick={goToNextLevel} className="btn-glass bg-green-500/20 text-green-400 flex items-center gap-2 mt-4">
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

