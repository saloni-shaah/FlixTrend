
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Play, RotateCw, Award } from 'lucide-react';

const COLORS = ["#FF3CAC", "#00F0FF", "#39FF14", "#FFB400"]; // Pink, Cyan, Green, Gold
type GameStatus = 'waiting' | 'playing' | 'gameOver' | 'showingSequence';

export function EchoChamber() {
    const [status, setStatus] = useState<GameStatus>('waiting');
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [activeButton, setActiveButton] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    const playSound = (index: number) => {
        // In a real app, you would use a web audio API for better sound
        // For now, we'll just visualise it.
    };

    const nextRound = useCallback(() => {
        setPlayerSequence([]);
        const nextColorIndex = Math.floor(Math.random() * COLORS.length);
        setSequence(prev => [...prev, nextColorIndex]);
        setStatus('showingSequence');
    }, []);

    useEffect(() => {
        if (status === 'showingSequence') {
            let i = 0;
            const interval = setInterval(() => {
                if (i < sequence.length) {
                    setActiveButton(sequence[i]);
                    playSound(sequence[i]);
                    i++;
                    setTimeout(() => setActiveButton(null), 400);
                } else {
                    clearInterval(interval);
                    setStatus('playing');
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [status, sequence]);

    useEffect(() => {
        if (status === 'playing' && playerSequence.length > 0) {
            const currentStep = playerSequence.length - 1;
            if (playerSequence[currentStep] !== sequence[currentStep]) {
                setStatus('gameOver');
            } else if (playerSequence.length === sequence.length) {
                setScore(s => s + 1);
                setTimeout(nextRound, 1000);
            }
        }
    }, [playerSequence, sequence, status, nextRound]);
    
    const handlePlayerClick = (index: number) => {
        if (status !== 'playing') return;
        setPlayerSequence(prev => [...prev, index]);
        playSound(index);
    };
    
    const startGame = () => {
        setSequence([]);
        setPlayerSequence([]);
        setScore(0);
        setStatus('playing');
        setTimeout(nextRound, 500);
    }

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white p-4 font-body relative overflow-hidden gap-8">
            <h2 className="text-3xl font-headline font-bold text-accent-cyan">Echo Chamber</h2>
            
            <AnimatePresence>
                {status !== 'playing' && status !== 'showingSequence' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center text-center p-4"
                    >
                         {status === 'waiting' ? (
                            <>
                                <BrainCircuit size={64} className="text-accent-cyan mb-4"/>
                                <h2 className="text-4xl font-headline font-bold text-accent-cyan">Echo Chamber</h2>
                                <p className="text-gray-400 mt-2 mb-6">Watch the pattern, repeat the sequence. Test your memory!</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white flex items-center gap-2 text-lg"><Play/> Start Game</button>
                            </>
                         ) : ( // gameOver
                            <>
                                <Award size={64} className="text-brand-gold mb-4"/>
                                <h2 className="text-4xl font-headline font-bold text-accent-pink">Game Over</h2>
                                <p className="text-lg mt-2">You remembered a sequence of <span className="font-bold text-accent-cyan">{score}</span>!</p>
                                <button onClick={startGame} className="btn-glass bg-accent-pink text-white mt-8 flex items-center gap-2"><RotateCw/> Play Again</button>
                            </>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center">
                <p className="text-gray-400">Score</p>
                <p className="text-4xl font-bold text-brand-gold">{score}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full max-w-sm aspect-square">
                {COLORS.map((color, index) => (
                    <motion.div
                        key={index}
                        className="w-full h-full rounded-full cursor-pointer"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 20px ${activeButton === index ? color : 'transparent'}, 0 0 40px ${activeButton === index ? color : 'transparent'}`
                        }}
                        whileTap={{ scale: status === 'playing' ? 0.95 : 1 }}
                        onClick={() => handlePlayerClick(index)}
                    />
                ))}
            </div>

            <div className="text-center text-sm text-gray-500 h-6">
                {status === 'showingSequence' && 'Watch carefully...'}
                {status === 'playing' && playerSequence.length < sequence.length && 'Your turn!'}
            </div>

        </div>
    );
}
