
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { generateFakePost } from '@/ai/flows/generate-fake-post-flow';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const db = getFirestore(app);

const GamePostCard = ({ post, onSelect, disabled }: { post: any, onSelect: () => void, disabled: boolean }) => (
    <motion.div
        whileHover={{ y: disabled ? 0 : -5 }}
        className={`glass-card p-4 flex flex-col gap-2 h-64 overflow-hidden cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onSelect()}
    >
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex-shrink-0"></div>
            <span className="font-bold text-sm text-accent-cyan truncate">@{post.username}</span>
        </div>
        <p className="text-sm text-gray-300 line-clamp-6 flex-1">{post.content}</p>
    </motion.div>
);

const GAME_DURATION = 30; // 30 seconds

export function TrendChase() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [currentPosts, setCurrentPosts] = useState<{ real: any, fake: any } | null>(null);
    const [loadingNext, setLoadingNext] = useState(true);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const fetchPostsForRound = useCallback(async () => {
        setLoadingNext(true);
        setFeedback(null);
        
        // 1. Fetch a random real post from Firestore
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"), limit(20)); // Fetch 20 recent posts
        const postsSnap = await getDocs(q);
        const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const realPost = posts[Math.floor(Math.random() * posts.length)];

        // 2. Generate a fake post using the AI flow
        const fakePost = await generateFakePost({ theme: realPost.hashtags?.[0] || 'social media' });

        // 3. Randomly shuffle their positions
        const isRealFirst = Math.random() > 0.5;
        setCurrentPosts({
            real: { ...realPost, isReal: true },
            fake: { ...fakePost, isReal: false }
        });

        setLoadingNext(false);
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            fetchPostsForRound();
            const timer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(timer);
                        setGameState('ended');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, fetchPostsForRound]);

    const handleSelectPost = (isSelectedReal: boolean) => {
        if (isSelectedReal) {
            setScore(s => s + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
            setTimeLeft(t => Math.max(0, t - 5)); // Penalty for wrong guess
        }

        setTimeout(() => {
            fetchPostsForRound();
        }, 800);
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setGameState('playing');
    };

    if (gameState === 'idle') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl glass-card p-8 text-center"
            >
                <h2 className="text-3xl font-headline text-accent-pink mb-4">Trend Chase</h2>
                <p className="text-gray-400 mb-8">Can you spot the real vibe? Two posts will appear. One is a certified trend, the other is a fake. Choose wisely and quickly!</p>
                <button className="btn-glass bg-accent-pink text-white text-xl" onClick={startGame}>Start Game</button>
            </motion.div>
        );
    }

    if (gameState === 'ended') {
        return (
             <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl glass-card p-8 text-center"
            >
                <h2 className="text-3xl font-headline text-accent-pink mb-4">Game Over!</h2>
                <p className="text-gray-300 text-xl mb-4">Your Final Score:</p>
                <p className="text-6xl font-bold text-brand-gold mb-8">{score}</p>
                <button className="btn-glass bg-accent-pink text-white text-xl" onClick={startGame}>Play Again</button>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4 text-white">
                <div className="text-xl font-bold">Score: <span className="text-brand-gold">{score}</span></div>
                <div className="text-xl font-bold">Time: <span className="text-accent-pink">{timeLeft}</span></div>
            </div>

            <div className="relative">
                {loadingNext ? (
                     <div className="flex items-center justify-center h-64">
                        <Loader className="animate-spin text-accent-cyan" size={48} />
                     </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPosts?.real.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20}}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <GamePostCard post={currentPosts?.real} onSelect={() => handleSelectPost(true)} disabled={!!feedback} />
                            <GamePostCard post={currentPosts?.fake} onSelect={() => handleSelectPost(false)} disabled={!!feedback} />
                        </motion.div>
                    </AnimatePresence>
                )}
                 {feedback && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5}}
                        animate={{ opacity: 1, scale: 1}}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {feedback === 'correct' ? <CheckCircle size={96} className="text-green-400"/> : <XCircle size={96} className="text-red-500"/>}
                    </motion.div>
                 )}
            </div>
        </div>
    );
}

