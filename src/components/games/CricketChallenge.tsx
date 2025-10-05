
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Play, Trophy } from 'lucide-react';

// --- GAME CONFIGURATION ---
const PITCH_HEIGHT = 400;
const BAT_WIDTH = 80;
const BAT_HEIGHT = 20;
const BALL_SIZE = 20;
const SWEET_SPOT_Y = PITCH_HEIGHT - BAT_HEIGHT - 30;
const BALL_SPEED = 250; // pixels per second

const scoreMap = {
    perfect: 6,
    good: 4,
    ok: 2,
    bad: 1,
};

type GameState = 'start' | 'playing' | 'ballInPlay' | 'gameOver' | 'paused';
type SwingState = 'idle' | 'swinging';
type Feedback = { text: string; color: string } | null;

export function CricketChallenge() {
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [ballsLeft, setBallsLeft] = useState(6);
    const [wickets, setWickets] = useState(1);
    
    const ballY = useRef(0);
    const swingState = useRef<SwingState>('idle');
    const feedback = useRef<Feedback>(null);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('cricketHighScore');
        if (storedHighScore) setHighScore(parseInt(storedHighScore));
    }, []);

    const resetGame = () => {
        setScore(0);
        setBallsLeft(6);
        setWickets(1);
        ballY.current = 0;
        swingState.current = 'idle';
        feedback.current = null;
        setGameState('start');
    };
    
    const startGame = () => {
        if (gameState === 'start' || gameState === 'gameOver') {
            resetGame();
        }
        setGameState('playing');
        setTimeout(() => setGameState('ballInPlay'), 1000);
    }

    const handleSwing = () => {
        if (gameState !== 'ballInPlay' || swingState.current === 'swinging') return;

        swingState.current = 'swinging';
        setTimeout(() => { swingState.current = 'idle'; }, 300);

        const impactDifference = Math.abs(ballY.current - SWEET_SPOT_Y);
        let currentFeedback: Feedback;
        let runsScored = 0;

        if (impactDifference < 10) {
            runsScored = scoreMap.perfect;
            currentFeedback = { text: "SIX!", color: "text-green-400" };
        } else if (impactDifference < 20) {
            runsScored = scoreMap.good;
            currentFeedback = { text: "FOUR!", color: "text-blue-400" };
        } else if (impactDifference < 40) {
             runsScored = scoreMap.ok;
            currentFeedback = { text: `${runsScored} Runs`, color: "text-yellow-400" };
        } else {
             setWickets(w => w - 1);
            currentFeedback = { text: "OUT!", color: "text-red-500" };
        }
        
        feedback.current = currentFeedback;
        const newScore = score + runsScored;
        setScore(newScore);

        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('cricketHighScore', newScore.toString());
        }

        setGameState('paused'); // Pause to show feedback
    };

    useEffect(() => {
        const gameLoop = () => {
            if (gameState === 'ballInPlay') {
                ballY.current += (BALL_SPEED / 60); // Assuming 60fps
                if (ballY.current > PITCH_HEIGHT) {
                    feedback.current = { text: "Missed!", color: "text-red-500" };
                    setWickets(w => w - 1);
                    setGameState('paused');
                }
            }
            animationFrameId.current = requestAnimationFrame(gameLoop);
        };
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'paused') {
            const timeout = setTimeout(() => {
                if(wickets <= 0 || ballsLeft - 1 <= 0) {
                    setGameState('gameOver');
                } else {
                    setBallsLeft(b => b - 1);
                    ballY.current = 0;
                    setGameState('playing');
                    setTimeout(() => setGameState('ballInPlay'), 500);
                }
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [gameState, wickets, ballsLeft]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm glass-card p-4 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-green">Super Over</h2>
            <div className="flex justify-between w-full font-bold text-lg">
                <span className="text-accent-cyan">Score: {score}</span>
                <span className="text-accent-pink">Balls Left: {ballsLeft}</span>
            </div>

            <div 
                className="relative w-full h-[400px] bg-green-900/50 border-4 border-white/30 rounded-lg overflow-hidden flex flex-col items-center"
                onClick={handleSwing}
            >
                {/* Pitch markings */}
                <div className="absolute top-0 w-2 h-full bg-white/10 left-1/2 -translate-x-1/2"></div>
                <div className="absolute top-4 w-24 h-1 bg-white/20"></div>
                <div className="absolute bottom-1 w-24 h-1 bg-white/20"></div>

                <AnimatePresence>
                {feedback.current && (
                    <motion.div
                        key={feedback.current.text + Date.now()}
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -20 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold drop-shadow-lg ${feedback.current.color}`}
                    >
                        {feedback.current.text}
                    </motion.div>
                )}
                </AnimatePresence>
                
                {/* Ball */}
                <motion.div
                    className="absolute w-5 h-5 bg-red-500 rounded-full shadow-lg"
                    style={{
                        top: ballY.current,
                        left: 'calc(50% - 10px)'
                    }}
                />

                {/* Bat */}
                 <motion.div
                    className="absolute bottom-5 bg-yellow-900 border-2 border-yellow-700 rounded-md"
                    style={{
                        width: BAT_WIDTH,
                        height: BAT_HEIGHT,
                        left: `calc(50% - ${BAT_WIDTH/2}px)`
                    }}
                    animate={{ rotate: swingState.current === 'swinging' ? [0, -45, 0] : 0 }}
                    transition={{ duration: 0.2 }}
                />
            </div>

             {(gameState === 'start' || gameState === 'gameOver') && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10 cursor-pointer">
                    {gameState === 'gameOver' ? (
                        <>
                            <Trophy className="mx-auto mb-2 text-brand-gold" size={32}/>
                            <h3 className="text-2xl font-bold text-accent-cyan">Game Over</h3>
                            <p className="text-gray-300">Your final score: {score}</p>
                            {score > 0 && score === highScore && <p className="font-bold text-brand-gold animate-pulse">New High Score!</p>}
                        </>
                    ) : (
                         <h3 className="text-2xl font-bold text-green-400">Ready to Bat?</h3>
                    )}
                    <button onClick={startGame} className="btn-glass bg-green-500/20 text-green-400 flex items-center gap-2 mt-4">
                        <Play size={16}/> {gameState === 'gameOver' ? 'Play Again' : 'Start Game'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

