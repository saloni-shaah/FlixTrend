"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Play, RotateCw } from 'lucide-react';

const PLAYER_SIZE = 40;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLATFORM_HEIGHT = 20;
const PLATFORM_WIDTH_RANGE = [80, 150];
const PLATFORM_SPAWN_Y_RANGE = [80, 150];
const PLAYER_X_POSITION = 100;

const hashtags = ["#fyp", "#tech", "#music", "#gaming", "#art", "#dev", "#science", "#sports", "#foodie"];

type GameStatus = 'waiting' | 'playing' | 'gameOver';

export function VibeJumper() {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [platforms, setPlatforms] = useState<any[]>([]);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const playerY = useRef(300);
    const playerVelocityY = useRef(0);
    const frameId = useRef<number | null>(null);
    const scoreInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('vibeJumperHighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
    }, []);
    
    const resetGame = () => {
        const initialPlatforms = [
            { x: PLAYER_X_POSITION - 30, y: 400, width: PLATFORM_WIDTH_RANGE[1], text: '#welcome' },
        ];
        // Add some initial platforms
        for (let i = 1; i < 10; i++) {
            const lastPlatform = initialPlatforms[initialPlatforms.length - 1];
            initialPlatforms.push(createPlatform(lastPlatform.y));
        }

        setPlatforms(initialPlatforms);
        playerY.current = 300;
        playerVelocityY.current = 0;
        setScore(0);
    };

    const startGame = () => {
        resetGame();
        setStatus('playing');
        scoreInterval.current = setInterval(() => {
          setScore(s => s + 10);
        }, 500);
        gameLoop();
    };

    const gameOver = useCallback(() => {
        setStatus('gameOver');
        if (frameId.current) cancelAnimationFrame(frameId.current);
        if (scoreInterval.current) clearInterval(scoreInterval.current);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('vibeJumperHighScore', score.toString());
        }
    }, [score, highScore]);
    
    const createPlatform = (lastY: number) => {
        const width = Math.random() * (PLATFORM_WIDTH_RANGE[1] - PLATFORM_WIDTH_RANGE[0]) + PLATFORM_WIDTH_RANGE[0];
        const x = Math.random() * (gameAreaRef.current!.offsetWidth - width);
        const y = lastY - (Math.random() * (PLATFORM_SPAWN_Y_RANGE[1] - PLATFORM_SPAWN_Y_RANGE[0]) + PLATFORM_SPAWN_Y_RANGE[0]);
        const text = hashtags[Math.floor(Math.random() * hashtags.length)];
        return { x, y, width, text };
    };

    const gameLoop = useCallback(() => {
        if (status !== 'playing' || !gameAreaRef.current) return;

        // Apply gravity
        playerVelocityY.current += GRAVITY;
        playerY.current += playerVelocityY.current;

        // Check for game over
        if (playerY.current > gameAreaRef.current.offsetHeight) {
            gameOver();
            return;
        }

        // Platform logic
        setPlatforms(prevPlatforms => {
            let highestPlatformY = Math.min(...prevPlatforms.map(p => p.y));

            // Move platforms up
            const newPlatforms = prevPlatforms.map(p => ({
                ...p,
                y: p.y - playerVelocityY.current < 0 ? p.y : p.y - (playerVelocityY.current * 0.5) // Slower scrolling for effect
            })).filter(p => p.y < gameAreaRef.current!.offsetHeight + 50);

            // Add new platforms if needed
            if (highestPlatformY > -20) {
                 newPlatforms.push(createPlatform(highestPlatformY));
            }
            
            return newPlatforms;
        });

        // Check for collision with platforms only when moving down
        if (playerVelocityY.current > 0) {
            platforms.forEach(platform => {
                if (
                    playerY.current + PLAYER_SIZE >= platform.y &&
                    playerY.current + PLAYER_SIZE <= platform.y + PLATFORM_HEIGHT &&
                    PLAYER_X_POSITION + PLAYER_SIZE >= platform.x &&
                    PLAYER_X_POSITION <= platform.x + platform.width
                ) {
                    playerVelocityY.current = JUMP_FORCE;
                }
            });
        }
        
        if (playerRef.current) {
            playerRef.current.style.transform = `translateY(${playerY.current}px)`;
        }

        frameId.current = requestAnimationFrame(gameLoop);
    }, [status, platforms, gameOver]);
    
    const jump = useCallback(() => {
        if (status === 'playing') {
             playerVelocityY.current = JUMP_FORCE;
        }
    }, [status]);
    
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                if(status === 'playing') jump();
                else startGame();
            }
        };
        
        const handleTouch = () => {
            if (status === 'playing') jump();
            else startGame();
        };

        window.addEventListener('keydown', handleKeyPress);
        const gameArea = gameAreaRef.current;
        gameArea?.addEventListener('touchstart', handleTouch);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            gameArea?.removeEventListener('touchstart', handleTouch);
            if (frameId.current) cancelAnimationFrame(frameId.current);
            if(scoreInterval.current) clearInterval(scoreInterval.current);
        };
    }, [status, jump, startGame]);

    return (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white p-4 font-mono relative overflow-hidden" ref={gameAreaRef}>
            <div className="absolute top-4 left-4 text-left z-20">
                <p className="font-bold">Score: <span className="text-accent-cyan">{score}</span></p>
                <p className="text-sm">High Score: <span className="text-brand-gold">{highScore}</span></p>
            </div>
            
            <AnimatePresence>
                {status !== 'playing' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
                    >
                         {status === 'waiting' ? (
                             <>
                                <h2 className="text-4xl font-headline font-bold text-accent-cyan">Vibe Jumper</h2>
                                <p className="text-gray-400 mt-2 mb-6">Jump on the hashtag clouds and climb as high as you can!</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2"><Play/> Start Game</button>
                                <p className="text-sm text-gray-500 mt-8">Press Space or Tap to Jump/Start</p>
                             </>
                         ) : ( // gameOver
                              <>
                                <h2 className="text-4xl font-headline font-bold text-accent-pink">Game Over</h2>
                                <div className="my-4 text-lg">
                                    <p>Your Score: <span className="text-accent-cyan font-bold">{score}</span></p>
                                    <p className="flex items-center gap-2 justify-center">High Score: <span className="text-brand-gold font-bold">{highScore}</span> {score === highScore && score > 0 && <Award className="text-brand-gold"/>}</p>
                                </div>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2"><RotateCw/> Play Again</button>
                             </>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Player */}
            <div ref={playerRef} style={{ width: PLAYER_SIZE, height: PLAYER_SIZE, position: 'absolute', left: PLAYER_X_POSITION, willChange: 'transform' }}>
                <div className="w-full h-full animate-bounce">👟</div>
            </div>

            {/* Platforms */}
            {platforms.map((p, i) => (
                <div key={i} className="absolute bg-accent-cyan/50 border border-accent-cyan rounded-lg flex items-center justify-center px-2"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: p.width,
                        height: PLATFORM_HEIGHT,
                    }}
                >
                    <span className="text-xs font-bold text-black">{p.text}</span>
                </div>
            ))}
        </div>
    );
}
