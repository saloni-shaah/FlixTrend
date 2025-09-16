"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { generateFakePost } from '@/ai/flows/generate-fake-post-flow';
import { Loader, CheckCircle, XCircle, Zap, Clock } from 'lucide-react';

const db = getFirestore(app);

const GamePostCard = ({ post, onSelect, disabled, feedback, isReal }: { post: any, onSelect: () => void, disabled: boolean, feedback: 'correct' | 'incorrect' | null, isReal: boolean }) => {
    let cardStyle = '';
    if (disabled && feedback) {
        cardStyle = isReal ? 'ring-4 ring-green-400' : 'opacity-30';
    }

    return (
        <motion.div
            whileHover={{ y: disabled ? 0 : -5 }}
            className={`glass-card p-4 flex flex-col gap-2 h-64 overflow-hidden cursor-pointer transition-all duration-300 ${disabled ? 'cursor-not-allowed' : ''} ${cardStyle}`}
            onClick={() => !disabled && onSelect()}
        >
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex-shrink-0">
                    {post.avatar_url && <img src={post.avatar_url} alt={post.username} className="w-full h-full object-cover rounded-full" />}
                </div>
                <span className="font-bold text-sm text-accent-cyan truncate">@{post.username}</span>
            </div>
            <p className="text-sm text-gray-300 line-clamp-[7] flex-1">{post.content}</p>
        </motion.div>
    );
};

const GAME_DURATION = 60; // seconds per game
const ROUND_DURATION = 8; // seconds per round

export function TrendChase() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION);
    const [currentPosts, setCurrentPosts] = useState<any[]>([]);
    const [loadingNext, setLoadingNext] = useState(true);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [streak, setStreak] = useState(0);

    const fetchPostsForRound = useCallback(async () => {
        setLoadingNext(true);
        setFeedback(null);
        setRoundTimeLeft(ROUND_DURATION);
        try {
            const postsRef = collection(db, "posts");
            const q = query(postsRef, orderBy("createdAt", "desc"), limit(50));
            const postsSnap = await getDocs(q);
            const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (posts.length === 0) {
                setGameState('ended');
                alert("Not enough posts to play Trend Chase!");
                return;
            }

            const realPost = posts[Math.floor(Math.random() * posts.length)];
            const fakePostThemes = ['tech', 'fashion', 'music', 'gaming', 'food'];
            const randomTheme = realPost.hashtags?.[0] || fakePostThemes[Math.floor(Math.random() * fakePostThemes.length)];
            const fakePostPromises = Array.from({ length: 3 }).map(() => generateFakePost({ theme: randomTheme }));
            const fakePostsData = await Promise.all(fakePostPromises);

            const allPosts = [
                { ...realPost, isReal: true },
                ...fakePostsData.map(fp => ({ ...fp, isReal: false }))
            ];

            setCurrentPosts(allPosts.sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error("Error fetching posts for round:", error);
        } finally {
            setLoadingNext(false);
        }
    }, []);

    const handleSelectPost = (isSelectedReal: boolean) => {
        if (feedback) return;

        if (isSelectedReal) {
            const timeBonus = Math.max(0, roundTimeLeft * 10);
            const streakBonus = streak * 25;
            setScore(s => s + 100 + timeBonus + streakBonus);
            setFeedback('correct');
            setStreak(s => s + 1);
        } else {
            setFeedback('incorrect');
            setStreak(0);
        }

        setTimeout(() => {
            if (gameState === 'playing' && timeLeft > 1) {
                fetchPostsForRound();
            } else if (gameState === 'playing') {
                setGameState('ended');
            }
        }, 1500);
    };

    const startGame = () => {
        setScore(0);
        setStreak(0);
        setTimeLeft(GAME_DURATION);
        setGameState('playing');
        fetchPostsForRound();
    };

    useEffect(() => {
        if (gameState !== 'playing') return;

        const gameTimer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(gameTimer);
                    setGameState('ended');
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(gameTimer);
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing' || loadingNext || feedback) return;

        const roundTimer = setInterval(() => {
            setRoundTimeLeft(rt => {
                if (rt <= 1) {
                    handleSelectPost(false); // Timeout counts as incorrect
                    return ROUND_DURATION;
                }
                return rt - 1;
            });
        }, 1000);

        return () => clearInterval(roundTimer);
    }, [gameState, loadingNext, feedback]);

    if (gameState === 'idle') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl glass-card p-8 text-center">
                <h2 className="text-3xl font-headline text-accent-pink mb-4">Trend Chase</h2>
                <p className="text-gray-400 mb-8">Fast-paced bluff-detection. Pick the real trending vibe out of fakes. Speed + accuracy win.</p>
                <button className="btn-glass bg-accent-pink text-white text-xl" onClick={startGame}>Quick Match</button>
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
        <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4 text-white p-3 glass-card">
                <div className="text-xl font-bold">Score: <span className="text-brand-gold">{score}</span></div>
                <div className="flex items-center gap-2 text-xl font-bold text-yellow-400">
                    <Zap size={20}/> Streak: {streak}x
                </div>
                <div className="text-xl font-bold">Time: <span className="text-accent-pink">{timeLeft}s</span></div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
                <motion.div
                    key={roundTimeLeft}
                    className="bg-accent-cyan h-2.5 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: ROUND_DURATION, ease: "linear" }}
                />
            </div>

            <div className="relative">
                {loadingNext ? (
                     <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-accent-cyan" size={48} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentPosts.map((post, index) => (
                            <GamePostCard key={post.id || index} post={post} onSelect={() => handleSelectPost(post.isReal)} disabled={!!feedback} feedback={feedback} isReal={post.isReal} />
                        ))}
                    </div>
                )}
                 {feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5}}
                        animate={{ opacity: 1, scale: 1}}
                        className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center pointer-events-none"
                    >
                        {feedback === 'correct' ? <CheckCircle size={96} className="text-green-400 drop-shadow-lg"/> : <XCircle size={96} className="text-red-500 drop-shadow-lg"/>}
                    </motion.div>
                 )}
            </div>
        </div>
    );
}
