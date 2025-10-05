
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Trophy } from 'lucide-react';

// --- GAME CONFIGURATION ---
const PITCH_HEIGHT = 450;
const PITCH_WIDTH = 350;
const BAT_WIDTH = 20; // Adjusted for a better bat shape
const BAT_HEIGHT = 80;
const BALL_SIZE = 15;
const SWEET_SPOT_Y = PITCH_HEIGHT - BAT_HEIGHT - 35;
const BALL_START_Y = 70;
const BALL_SPEED = 400; // pixels per second

const scoreMap = {
    perfect: { runs: 6, text: "SIX!", color: "text-green-400" },
    good: { runs: 4, text: "FOUR!", color: "text-blue-400" },
    ok: { runs: 2, text: "2 Runs", color: "text-yellow-400" },
    bad: { runs: 1, text: "1 Run", color: "text-orange-400" },
};

type GameState = 'start' | 'playing' | 'ballInPlay' | 'gameOver' | 'paused';
type Feedback = { text: string; color: string, ballPath?: { x: number, y: number } } | null;

const Bat = ({ swinging }: { swinging: boolean }) => (
    <motion.g
        transform={`translate(${PITCH_WIDTH / 2 - BAT_WIDTH / 2 + 10}, ${PITCH_HEIGHT - BAT_HEIGHT - 60})`}
        animate={{ rotate: swinging ? [-20, 80, -20] : -20 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ originX: `${BAT_WIDTH / 2}px`, originY: `${BAT_HEIGHT}px` }}
    >
        {/* Bat shape */}
        <path d={`M0,0 L${BAT_WIDTH},0 L${BAT_WIDTH},${BAT_HEIGHT - 20} Q${BAT_WIDTH / 2},${BAT_HEIGHT} 0,${BAT_HEIGHT - 20} Z`} fill="#D2B48C" stroke="#8B4513" strokeWidth="2" />
        <rect x={BAT_WIDTH/2 - 2} y={-20} width="4" height="20" fill="#8B4513" />
    </motion.g>
);

const Stumps = ({ y }: { y: number }) => (
    <g transform={`translate(${PITCH_WIDTH/2 - 10}, ${y})`}>
        <rect x="0" y="0" width="4" height="30" fill="white" />
        <rect x="8" y="0" width="4" height="30" fill="white" />
        <rect x="16" y="0" width="4" height="30" fill="white" />
        <rect x="0" y="-2" width="10" height="3" fill="#B22222" />
        <rect x="10" y="-2" width="10" height="3" fill="#B22222" />
    </g>
);


export function CricketChallenge() {
    const [gameState, setGameState] = useState<GameState>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [ballsLeft, setBallsLeft] = useState(6);
    
    // Ball's visual position is now state to force re-renders
    const [ballPosition, setBallPosition] = useState({ x: PITCH_WIDTH / 2, y: BALL_START_Y });

    const batSwingingRef = useRef(false);
    const feedbackRef = useRef<Feedback>(null);
    const animationFrameId = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('cricketHighScore');
        if (storedHighScore) setHighScore(parseInt(storedHighScore));
    }, []);

    const resetGame = () => {
        setScore(0);
        setBallsLeft(6);
        setBallPosition({ x: PITCH_WIDTH / 2, y: BALL_START_Y });
        batSwingingRef.current = false;
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
        if (gameState !== 'ballInPlay' || batSwingingRef.current) return;

        batSwingingRef.current = true;
        setTimeout(() => { batSwingingRef.current = false; }, 300);

        const impactDifference = Math.abs(ballPosition.y - SWEET_SPOT_Y);
        let runsScored = 0;
        let currentFeedback: Feedback;
        
        let ballPath = { x: 0, y: 0 };
        const randomAngle = (Math.random() - 0.5) * Math.PI / 3; 

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

    const gameLoop = useCallback((timestamp: number) => {
        if (lastTimeRef.current === 0) {
            lastTimeRef.current = timestamp;
        }
        const deltaTime = (timestamp - lastTimeRef.current) / 1000; // time in seconds
        
        if (gameState === 'ballInPlay') {
            setBallPosition(prevPos => {
                const newY = prevPos.y + BALL_SPEED * deltaTime;
                if (newY > PITCH_HEIGHT) {
                    feedbackRef.current = { text: "Missed!", color: "text-red-500" };
                    setGameState('paused');
                    return prevPos; // Stop moving
                }
                return { ...prevPos, y: newY };
            });
        }
        lastTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameState]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [gameLoop]);

    useEffect(() => {
        if (gameState === 'paused') {
            const timeout = setTimeout(() => {
                if (ballsLeft - 1 <= 0) {
                    setGameState('gameOver');
                } else {
                    setBallsLeft(b => b - 1);
                    setBallPosition({ x: PITCH_WIDTH / 2, y: BALL_START_Y });
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
                className="relative cursor-pointer overflow-hidden rounded-lg bg-green-900/50"
                style={{ width: PITCH_WIDTH, height: PITCH_HEIGHT }}
                onClick={handleSwing}
            >
                <svg width="100%" height="100%" viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}>
                    {/* Field markings */}
                    <ellipse cx={PITCH_WIDTH/2} cy={PITCH_HEIGHT/2} rx={PITCH_WIDTH/2 - 10} ry={PITCH_HEIGHT/2 - 10} fill="#4C9A2A" />
                    <rect x={PITCH_WIDTH/2 - 40} y={0} width="80" height={PITCH_HEIGHT} fill="#A0522D" opacity="0.3" />
                    <rect x={PITCH_WIDTH/2 - 2} y="50" width="4" height={PITCH_HEIGHT - 100} fill="white" opacity="0.4" />
                    
                    {/* Stumps */}
                    <Stumps y={45} />
                    <Stumps y={PITCH_HEIGHT - 65} />

                    {/* Bowler */}
                    <g transform={`translate(${PITCH_WIDTH/2 - 10}, 20)`}>
                        <circle cx="10" cy="10" r="8" fill="#FFADAD" />
                        <rect x="5" y="18" width="10" height="25" fill="#FFADAD" />
                    </g>
                    
                    {/* Batsman */}
                    <g transform={`translate(${PITCH_WIDTH/2 - 15}, ${PITCH_HEIGHT - 65})`}>
                        <circle cx="10" cy="-25" r="8" fill="#F8F7F8" />
                        <rect x="5" y="-17" width="10" height="25" fill="#F8F7F8" />
                        <rect x="0" y="8" width="20" height="4" fill="#F8F7F8" />
                        <rect x="3" y="12" width="5" height="15" fill="#F8F7F8" />
                        <rect x="12" y="12" width="5" height="15" fill="#F8F7F8" />
                    </g>

                    <Bat swinging={batSwingingRef.current} />
                </svg>

                {/* Visible Ball */}
                <motion.div
                    className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
                    animate={{ 
                        top: ballPosition.y - (BALL_SIZE/2), 
                        left: ballPosition.x - (BALL_SIZE/2),
                    }}
                    transition={{ duration: 0, ease: 'linear' }}
                />

                {/* Hit Ball Animation */}
                {feedbackRef.current?.ballPath && gameState === 'paused' && (
                    <motion.div
                        className="absolute w-5 h-5 bg-white rounded-full shadow-lg z-20"
                        initial={{ x: ballPosition.x - (BALL_SIZE/2), y: ballPosition.y - (BALL_SIZE/2) }}
                        animate={{ 
                            x: ballPosition.x + feedbackRef.current.ballPath.x, 
                            y: ballPosition.y + feedbackRef.current.ballPath.y, 
                            opacity: 0 
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                )}
            
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
                        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold drop-shadow-lg ${feedbackRef.current.color}`}
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
