
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Trophy, Shield } from 'lucide-react';

// --- GAME CONFIGURATION ---
const PITCH_HEIGHT = 400;
const BAT_WIDTH = 10;
const BAT_HEIGHT = 60;
const BALL_SIZE = 15;
const SWEET_SPOT_Y = PITCH_HEIGHT - BAT_HEIGHT - 35;
const BALL_SPEED = 300; // pixels per second

const scoreMap = {
    perfect: { runs: 6, text: "SIX!", color: "text-green-400" },
    good: { runs: 4, text: "FOUR!", color: "text-blue-400" },
    ok: { runs: 2, text: "2 Runs", color: "text-yellow-400" },
    bad: { runs: 1, text: "1 Run", color: "text-orange-400" },
};

type GameState = 'start' | 'playing' | 'ballInPlay' | 'gameOver' | 'paused';
type SwingState = 'idle' | 'swinging';
type Feedback = { text: string; color: string, ballPath?: { x: number, y: number } } | null;

// Simple SVG for a batsman
const Batsman = () => (
    <g transform={`translate(${280}, ${PITCH_HEIGHT - 50})`}>
        <circle cx="10" cy="-25" r="8" fill="#F8F7F8" />
        <rect x="5" y="-17" width="10" height="25" fill="#F8F7F8" />
        <rect x="0" y="8" width="20" height="4" fill="#F8F7F8" />
        <rect x="3" y="12" width="5" height="15" fill="#F8F7F8" />
        <rect x="12" y="12" width="5" height="15" fill="#F8F7F8" />
    </g>
);

// Simple SVG for a bowler
const Bowler = () => (
    <g transform="translate(290, 20)">
        <circle cx="10" cy="10" r="8" fill="#FFADAD" />
        <rect x="5" y="18" width="10" height="25" fill="#FFADAD" />
    </g>
);


export function CricketChallenge() {
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [ballsLeft, setBallsLeft] = useState(6);
    
    const ballRef = useRef({ x: 300, y: 50, dx: 0, dy: (BALL_SPEED / 60) });
    const batRef = useRef({ swinging: false });
    const feedbackRef = useRef<Feedback>(null);
    const animationFrameId = useRef<number>(0);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('cricketHighScore');
        if (storedHighScore) setHighScore(parseInt(storedHighScore));
    }, []);

    const resetGame = () => {
        setScore(0);
        setBallsLeft(6);
        ballRef.current = { x: 300, y: 50, dx: 0, dy: (BALL_SPEED / 60) };
        batRef.current.swinging = false;
        feedbackRef.current = null;
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
        if (gameState !== 'ballInPlay' || batRef.current.swinging) return;

        batRef.current.swinging = true;
        setTimeout(() => { batRef.current.swinging = false; }, 300);

        const impactDifference = Math.abs(ballRef.current.y - SWEET_SPOT_Y);
        let runsScored = 0;
        let currentFeedback: Feedback;
        
        let ballPath = { x: 0, y: 0 };
        const randomAngle = (Math.random() - 0.5) * Math.PI / 4; 

        if (impactDifference < 10) {
            runsScored = scoreMap.perfect.runs;
            currentFeedback = scoreMap.perfect;
            ballPath = { x: Math.sin(randomAngle) * 200, y: -250 };
        } else if (impactDifference < 20) {
            runsScored = scoreMap.good.runs;
            currentFeedback = scoreMap.good;
            ballPath = { x: Math.sin(randomAngle) * 150, y: -200 };
        } else if (impactDifference < 35) {
             runsScored = scoreMap.ok.runs;
            currentFeedback = { text: `${runsScored} Runs`, color: "text-yellow-400"};
            ballPath = { x: (Math.random() > 0.5 ? 1 : -1) * 80, y: -150 };
        } else if (impactDifference < 50) {
             runsScored = scoreMap.bad.runs;
            currentFeedback = { text: `${runsScored} Run`, color: "text-orange-400"};
            ballPath = { x: (Math.random() > 0.5 ? 1 : -1) * 40, y: -100 };
        } else {
            currentFeedback = { text: "OUT!", color: "text-red-500" };
        }
        
        feedbackRef.current = {...currentFeedback, ballPath };
        const newScore = score + runsScored;
        setScore(newScore);

        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('cricketHighScore', newScore.toString());
        }

        setGameState('paused'); 
    };

    useEffect(() => {
        const gameLoop = () => {
            if (gameState === 'ballInPlay') {
                ballRef.current.y += ballRef.current.dy;
                if (ballRef.current.y > PITCH_HEIGHT) {
                    feedbackRef.current = { text: "Missed!", color: "text-red-500" };
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
                if (ballsLeft - 1 <= 0) {
                    setGameState('gameOver');
                } else {
                    setBallsLeft(b => b - 1);
                    ballRef.current = { x: 300, y: 50, dx: 0, dy: (BALL_SPEED / 60) };
                    feedbackRef.current = null;
                    setGameState('playing');
                    setTimeout(() => setGameState('ballInPlay'), 500);
                }
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [gameState, ballsLeft]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-4 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-green">Super Over</h2>
            <div className="flex justify-between w-full font-bold text-lg">
                <span className="text-accent-cyan">Score: {score}</span>
                <span className="text-accent-pink">Balls Left: {ballsLeft}</span>
            </div>

            <div 
                className="relative w-[350px] h-[450px] bg-green-800/20 border-4 border-white/10 rounded-full overflow-hidden flex flex-col items-center cursor-pointer"
                onClick={handleSwing}
            >
                {/* Pitch */}
                <div className="absolute top-0 w-32 h-full bg-yellow-900/30"></div>
                <div className="absolute top-[10%] w-2 h-[80%] bg-white/20"></div>

                <Bowler/>
                <Batsman/>
                
                {/* Hit Ball Animation */}
                 {feedbackRef.current?.ballPath && gameState === 'paused' && (
                    <motion.div
                        className="absolute w-5 h-5 bg-white rounded-full shadow-lg z-20"
                        initial={{ x: ballRef.current.x, y: ballRef.current.y }}
                        animate={{ x: ballRef.current.x + feedbackRef.current.ballPath.x, y: ballRef.current.y + feedbackRef.current.ballPath.y, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                )}

                {/* Bowling Ball */}
                <motion.div
                    className="absolute w-5 h-5 bg-white rounded-full shadow-lg"
                    style={{
                        top: ballRef.current.y - (BALL_SIZE/2),
                        left: 'calc(50% - 10px)'
                    }}
                />

                {/* Bat Swing Animation */}
                <motion.div
                    className="absolute origin-bottom-right"
                    style={{
                        width: BAT_WIDTH,
                        height: BAT_HEIGHT,
                        bottom: 65,
                        left: `calc(50% - ${BAT_WIDTH/2 + 20}px)`,
                        backgroundColor: '#D2B48C',
                        borderRadius: '4px',
                        border: '2px solid #8B4513'
                    }}
                    animate={{ rotate: batRef.current.swinging ? [20, -60, 20] : 20 }}
                    transition={{ duration: 0.2 }}
                />
            
                <AnimatePresence>
                {(gameState === 'start' || gameState === 'gameOver') ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-10"
                    >
                        {gameState === 'gameOver' ? (
                            <>
                                <Trophy className="mx-auto mb-2 text-brand-gold" size={32}/>
                                <h3 className="text-2xl font-bold text-accent-cyan">Game Over</h3>
                                <p className="text-gray-300">Your final score: {score}</p>
                                {score > 0 && score >= highScore && <p className="font-bold text-brand-gold animate-pulse">New High Score!</p>}
                            </>
                        ) : (
                             <h3 className="text-2xl font-bold text-green-400">Ready to Bat?</h3>
                        )}
                        <button onClick={startGame} className="btn-glass bg-green-500/20 text-green-400 flex items-center gap-2 mt-4">
                            <Play size={16}/> {gameState === 'gameOver' ? 'Play Again' : 'Start Game'}
                        </button>
                    </motion.div>
                ) : feedbackRef.current && gameState === 'paused' && (
                     <motion.div
                        key={feedbackRef.current.text + score}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold drop-shadow-lg ${feedbackRef.current.color}`}
                    >
                        {feedbackRef.current.text}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
             <button onClick={resetGame} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-2">
                <RotateCcw size={16}/> Reset Game
            </button>
        </motion.div>
    );
}
