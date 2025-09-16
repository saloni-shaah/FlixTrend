
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { Loader, Trophy, XCircle, Clock } from 'lucide-react';

const db = getFirestore(app);

const ROUND_DURATION = 10;
const TOTAL_ROUNDS = 5;

export function FlashPollWars() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'results' | 'ended'>('idle');
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(0);
    const [currentPoll, setCurrentPoll] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION);
    const [userPrediction, setUserPrediction] = useState<number | null>(null);
    const [pollResults, setPollResults] = useState<any>(null);

    const fetchRandomPoll = useCallback(async () => {
        setLoading(true);
        setUserPrediction(null);
        setPollResults(null);
        setRoundTimeLeft(ROUND_DURATION);

        const postsRef = collection(db, "posts");
        // This query requires a composite index in Firestore (type asc, createdAt desc)
        // or a more complex client-side random selection.
        const q = query(postsRef, where("type", "==", "poll"), orderBy("createdAt", "desc"), limit(50));
        const postsSnap = await getDocs(q);
        
        if (postsSnap.empty) {
            setGameState('ended');
            alert("No polls found to start a game!");
            return;
        }

        const polls = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const randomPoll = polls[Math.floor(Math.random() * polls.length)];
        setCurrentPoll(randomPoll);
        setLoading(false);
    }, []);

    const calculateResults = useCallback(async () => {
        if (!currentPoll) return;
        setGameState('results');
        
        const votesRef = collection(db, "posts", currentPoll.id, "pollVotes");
        const votesSnap = await getDocs(votesRef);

        const voteCounts = currentPoll.pollOptions.map(() => 0);
        votesSnap.forEach(doc => {
            const vote = doc.data();
            if (voteCounts[vote.optionIdx] !== undefined) {
                voteCounts[vote.optionIdx]++;
            }
        });
        
        const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
        const winningIndex = voteCounts.indexOf(Math.max(...voteCounts));
        
        const results = {
            counts: voteCounts,
            percentages: voteCounts.map(count => totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0),
            winningIndex: winningIndex,
            totalVotes: totalVotes,
            isCorrect: userPrediction === winningIndex
        };
        
        setPollResults(results);

        if (results.isCorrect) {
             const winnerPercentage = results.percentages[winningIndex] / 100;
             const rarity = 1 - winnerPercentage;
             const points = 100 + Math.floor(rarity * 150); // Higher reward for predicting unpopular winners
             setScore(s => s + points);
        }

    }, [currentPoll, userPrediction]);

    useEffect(() => {
        let roundTimer: NodeJS.Timeout;
        if (gameState === 'playing' && !loading) {
            roundTimer = setInterval(() => {
                setRoundTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(roundTimer);
                        calculateResults();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(roundTimer);
    }, [gameState, loading, calculateResults]);

    const startGame = () => {
        setScore(0);
        setRound(1);
        fetchRandomPoll();
        setGameState('playing');
    };
    
    const nextRound = () => {
        if (round >= TOTAL_ROUNDS) {
            setGameState('ended');
        } else {
            setRound(r => r + 1);
            fetchRandomPoll();
            setGameState('playing');
        }
    };

    const handlePrediction = (index: number) => {
        if (userPrediction === null) {
            setUserPrediction(index);
        }
    };

    if (gameState === 'idle') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl glass-card p-8 text-center">
                <h2 className="text-3xl font-headline text-accent-pink mb-4">Flash Poll Wars</h2>
                <p className="text-gray-400 mb-8">Predict the crowd. Bet on which poll option will get the most votes. Fast predictions and smart insights win.</p>
                <button className="btn-glass bg-accent-pink text-white text-xl" onClick={startGame}>Start a Match</button>
            </motion.div>
        );
    }
    
    if (gameState === 'ended') {
         return (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl glass-card p-8 text-center">
                <h2 className="text-3xl font-headline text-accent-pink mb-4">Game Over!</h2>
                <p className="text-gray-300 text-xl mb-4">Your Final Score:</p>
                <p className="text-6xl font-bold text-brand-gold mb-8">{score}</p>
                <button className="btn-glass bg-accent-pink text-white text-xl" onClick={startGame}>Play Again</button>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-2xl">
             <div className="flex justify-between items-center mb-4 text-white p-3 glass-card">
                <div className="text-lg font-bold">Score: <span className="text-brand-gold">{score}</span></div>
                <div className="text-lg font-bold">Round: <span className="text-accent-cyan">{round} / {TOTAL_ROUNDS}</span></div>
                 <div className="flex items-center gap-2 text-lg font-bold text-accent-cyan">
                    <Clock size={20}/> {roundTimeLeft}s
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-accent-cyan" size={48} /></div>
            ) : currentPoll && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
                    <h3 className="text-2xl font-headline font-bold text-center mb-6">{currentPoll.content}</h3>
                    <div className="flex flex-col gap-3">
                        {currentPoll.pollOptions.map((option: string, index: number) => {
                            const isPredicted = userPrediction === index;
                            const resultData = pollResults?.percentages ? pollResults.percentages[index] : 0;
                            const isWinner = pollResults ? pollResults.winningIndex === index : false;
                            
                            return (
                                <div key={index}>
                                    <button 
                                        className={`w-full p-4 rounded-full font-bold text-lg transition-all relative overflow-hidden btn-glass ${gameState !== 'playing' ? 'cursor-not-allowed' : ''} ${isPredicted ? 'ring-4 ring-accent-cyan' : ''}`}
                                        onClick={() => handlePrediction(index)}
                                        disabled={gameState !== 'playing' || userPrediction !== null}
                                    >
                                        <AnimatePresence>
                                        {gameState === 'results' && (
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${resultData}%`}}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className={`absolute left-0 top-0 h-full ${isWinner ? 'bg-brand-gold/50' : 'bg-gray-500/50'}`} 
                                            />
                                        )}
                                        </AnimatePresence>
                                        <span className="relative z-10">{option}</span>
                                    </button>
                                     {gameState === 'results' && (
                                         <div className="text-center text-sm font-bold mt-1">{resultData}% ({pollResults.counts[index]} votes)</div>
                                     )}
                                </div>
                            );
                        })}
                    </div>
                     {gameState === 'results' && pollResults && (
                        <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0}} className="text-center mt-6">
                            {pollResults.isCorrect ? (
                                <p className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2"><Trophy/> You predicted the winner!</p>
                            ) : (
                                <p className="text-2xl font-bold text-red-500 flex items-center justify-center gap-2"><XCircle/> Not quite!</p>
                            )}
                            <button className="btn-glass bg-accent-cyan text-black mt-4" onClick={nextRound}>
                                {round >= TOTAL_ROUNDS ? 'Finish Game' : 'Next Round'}
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

    