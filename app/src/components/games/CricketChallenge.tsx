'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Trophy, ArrowRight, Shield } from 'lucide-react';
import { iplTeams, internationalTeams } from '@/lib/cricket-data';
import AdModal from '../AdModal';

// --- GAME CONFIGURATION ---
const PITCH_HEIGHT = 450;
const PITCH_WIDTH = 350;
const BAT_WIDTH = 20;
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

type GameState = 'setup' | 'playing' | 'ballInPlay' | 'gameOver' | 'paused';
type Feedback = { text: string; color: string, ballPath?: { x: number, y: number } } | null;
type SetupStep = 'tournament' | 'team' | 'overs';
type Tournament = 'IPL' | 'ICC';

const Bat = ({ swinging }: { swinging: boolean }) => (
     <motion.g
        transform="translate(5, 8)"
        animate={{ rotate: swinging ? [-20, 80, -20] : -20 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ originX: `10px`, originY: `70px` }}
    >
        <path d={`M0,0 L${BAT_WIDTH},0 L${BAT_WIDTH},${BAT_HEIGHT - 20} Q${BAT_WIDTH / 2},${BAT_HEIGHT} 0,${BAT_HEIGHT - 20} Z`} fill="#D2B48C" stroke="#8B4513" strokeWidth="2" />
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

const Bowler = () => (
     <g transform={`translate(${PITCH_WIDTH/2 - 10}, 20)`}>
        <circle cx="10" cy="10" r="8" fill="#FFADAD" />
        <rect x="5" y="18" width="10" height="25" fill="#FFADAD" />
    </g>
);

const Batsman = ({ swinging }: { swinging: boolean }) => (
    <g transform={`translate(${PITCH_WIDTH/2 - 15}, ${PITCH_HEIGHT - 60})`}>
        <circle cx="10" cy="-25" r="8" fill="#F8F7F8" />
        <rect x="5" y="-17" width="10" height="25" fill="#F8F7F8" />
        <rect x="0" y="8" width="20" height="4" fill="#F8F7F8" />
        <rect x="3" y="12" width="5" height="15" fill="#F8F7F8" />
        <rect x="12" y="12" width="5" height="15" fill="#F8F7F8" />
        <Bat swinging={swinging} />
    </g>
);


export function CricketChallenge() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [setupStep, setSetupStep] = useState<SetupStep>('tournament');

    // Game Config State
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
    const [totalOvers, setTotalOvers] = useState(1);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [ballsLeft, setBallsLeft] = useState(6);

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
        setBallsLeft(totalOvers * 6);
        setBallPosition({ x: PITCH_WIDTH / 2, y: BALL_START_Y });
        batSwingingRef.current = false;
        feedbackRef.current = null;
        setGameState('playing');
        setTimeout(() => setGameState('ballInPlay'), 1000);
    };

    const handleConfigSelect = (step: SetupStep, value: any) => {
        if (step === 'tournament') {
            setTournament(value);
            setSetupStep('team');
        } else if (step === 'team') {
            setSelectedTeam(value);
            setSetupStep('overs');
        } else if (step === 'overs') {
            setTotalOvers(value);
            setBallsLeft(value * 6);
            setGameState('playing');
            setTimeout(() => setGameState('ballInPlay'), 1000);
        }
    };
    
    const handleSwing = () => {
        if (gameState !== 'ballInPlay' || batSwingingRef.current) return;

        batSwingingRef.current = true;
        setTimeout(() => { batSwingingRef.current = false; }, 300);

        const impactDifference = Math.abs(ballPosition.y - SWEET_SPOT_Y);
        let runsScored = 0;
        let currentFeedback: Feedback;
        
        let ballPath = { x: 0, y: 0 };
        const randomAngle = (Math.random() - 0.5) * Math.PI / 3; 

        if (impactDifference < 10) { runsScored = 6; currentFeedback = scoreMap.perfect; ballPath = { x: Math.sin(randomAngle) * 200, y: -250 };
        } else if (impactDifference < 20) { runsScored = 4; currentFeedback = scoreMap.good; ballPath = { x: Math.sin(randomAngle) * 150, y: -200 };
        } else if (impactDifference < 35) { runsScored = 2; currentFeedback = { text: `${runsScored} Runs`, color: "text-yellow-400"}; ballPath = { x: (Math.random() > 0.5 ? 1 : -1) * 80, y: -150 };
        } else if (impactDifference < 50) { runsScored = 1; currentFeedback = { text: `${runsScored} Run`, color: "text-orange-400"}; ballPath = { x: (Math.random() > 0.5 ? 1 : -1) * 40, y: -100 };
        } else { currentFeedback = { text: "OUT!", color: "text-red-500" }; }
        
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
        if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
        const deltaTime = (timestamp - lastTimeRef.current) / 1000;
        
        if (gameState === 'ballInPlay') {
            setBallPosition(prevPos => {
                const newY = prevPos.y + BALL_SPEED * deltaTime;
                if (newY > PITCH_HEIGHT) {
                    feedbackRef.current = { text: "Missed!", color: "text-red-500" };
                    setGameState('paused');
                    return prevPos;
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

    const teamOptions = tournament === 'IPL' ? iplTeams : internationalTeams;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-card p-4 flex flex-col items-center gap-4"
        >
            <h2 className="text-3xl font-headline text-accent-green">Super Over Challenge</h2>

            {gameState === 'setup' ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={setupStep}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full"
                    >
                        {setupStep === 'tournament' && (
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-bold text-accent-cyan">Choose Tournament</h3>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('tournament', 'IPL')}>IPL</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('tournament', 'ICC')}>ICC World Cup</button>
                            </div>
                        )}
                        {setupStep === 'team' && (
                            <div>
                                <h3 className="text-xl font-bold text-accent-cyan text-center mb-4">Select Your Team</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {teamOptions.map(team => (
                                        <div key={team.name} className="glass-card p-3 text-center cursor-pointer hover:border-accent-pink" onClick={() => handleConfigSelect('team', team)}>
                                            <img src={team.logo} alt={team.name} className="w-20 h-20 mx-auto object-contain mb-2"/>
                                            <p className="font-bold text-sm">{team.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {setupStep === 'overs' && (
                            <div className="flex flex-col items-center gap-4">
                                <h3 className="text-xl font-bold text-accent-cyan">Choose Format</h3>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 1)}>Super Over (1 Over)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 6)}>Powerplay (6 Overs)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 20)}>T20 Match (20 Overs)</button>
                                <button className="btn-glass w-full" onClick={() => handleConfigSelect('overs', 50)}>ODI Match (50 Overs)</button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <>
                    <div className="flex justify-between items-center w-full font-bold text-lg">
                        <div className="flex items-center gap-2 text-accent-cyan">
                           {selectedTeam && <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-8 h-8"/>}
                           <span>Score: {score}</span>
                        </div>
                        <span className="text-accent-pink">Balls Left: {ballsLeft}</span>
                    </div>

                    <div 
                        className="relative cursor-pointer overflow-hidden rounded-lg bg-green-900/50"
                        style={{ width: PITCH_WIDTH, height: PITCH_HEIGHT }}
                        onClick={handleSwing}
                    >
                        <svg width="100%" height="100%" viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}>
                            <ellipse cx={PITCH_WIDTH/2} cy={PITCH_HEIGHT/2} rx={PITCH_WIDTH/2 - 10} ry={PITCH_HEIGHT/2 - 10} fill="#4C9A2A" />
                            <rect x={PITCH_WIDTH/2 - 40} y={0} width="80" height={PITCH_HEIGHT} fill="#A0522D" opacity="0.3" />
                            <rect x={PITCH_WIDTH/2 - 2} y="50" width="4" height={PITCH_HEIGHT - 100} fill="white" opacity="0.4" />
                            <Stumps y={45} />
                            <Stumps y={PITCH_HEIGHT - 65} />
                            <Bowler />
                            <Batsman swinging={batSwingingRef.current} />
                        </svg>

                        <motion.div
                            className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
                            animate={{ 
                                top: ballPosition.y - (BALL_SIZE/2), 
                                left: ballPosition.x - (BALL_SIZE/2),
                            }}
                            transition={{ duration: 0, ease: 'linear' }}
                        />

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
                        {(gameState === 'gameOver') ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-10"
                            >
                                <Trophy className="mx-auto mb-2 text-brand-gold" size={32}/>
                                <h3 className="text-2xl font-bold text-accent-cyan">Game Over</h3>
                                <p className="text-gray-300">Your final score: {score}</p>
                                {score > 0 && score >= highScore && <p className="font-bold text-brand-gold animate-pulse">New High Score!</p>}
                                <button onClick={() => setGameState('setup')} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4">
                                    <RotateCcw size={16}/> Play Again
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
                     <button onClick={() => setGameState('setup')} className="btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-2">
                        <RotateCcw size={16}/> Change Settings
                    </button>
                </>
            )}
        </motion.div>
    );
}
