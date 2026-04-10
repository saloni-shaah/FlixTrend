"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const db = getFirestore(app);

const timeAgo = (timestamp: any): string => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) {
        return "Just now";
    }
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    const days = seconds / 86400;
    if (days < 2) return "Yesterday";
    if (days <= 7) return `${Math.floor(days)}d ago`;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
};

export function DropPollCard({ poll }: { poll: any }) {
    const [votes, setVotes] = useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
    const [userVote, setUserVote] = useState<number | null>(null);
    const currentUser = auth.currentUser;

    const { totalVotes, maxVotes, maxVoteIndex } = useMemo(() => {
        const voteCounts = Object.values(votes).map(v => v.count);
        const total = voteCounts.reduce((sum, count) => sum + count, 0);
        const max = Math.max(0, ...voteCounts);
        const maxIndex = max > 0 ? voteCounts.indexOf(max) : -1;
        return { totalVotes: total, maxVotes: max, maxVoteIndex: maxIndex };
    }, [votes]);

    useEffect(() => {
        if (!poll.id) return;
        const unsub = onSnapshot(collection(db, "drop_polls", poll.id, "votes"), (snap) => {
            const newVotes: { [optionIdx: number]: { count: number, voters: string[] } } = {};
            poll.options.forEach((_: any, index: number) => {
                newVotes[index] = { count: 0, voters: [] };
            });

            let foundUserVote: number | null = null;
            snap.forEach(doc => {
                const { optionIdx, userId } = doc.data();
                if (newVotes[optionIdx]) {
                    newVotes[optionIdx].count++;
                    newVotes[optionIdx].voters.push(userId);
                }
                if (currentUser && userId === currentUser.uid) {
                    foundUserVote = optionIdx;
                }
            });
            setVotes(newVotes);
            setUserVote(foundUserVote);
        });
        return () => unsub();
    }, [poll.id, poll.options, currentUser]);

    const handleVote = async (optionIdx: number) => {
        if (!currentUser || userVote !== null) return;
        await setDoc(doc(db, "drop_polls", poll.id, "votes", currentUser.uid), {
            userId: currentUser.uid,
            optionIdx,
            createdAt: serverTimestamp()
        });
    };

    return (
        <motion.div
            className="glass-card p-5 flex flex-col gap-3 relative"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="flex items-center gap-3 mb-2">
                <p className="text-sm text-gray-400">
                    Poll by <Link href={`/squad/${poll.userId}`} className="text-accent-cyan hover:underline">@{poll.username}</Link> · {timeAgo(poll.createdAt)}
                </p>
            </div>

            <h3 className="font-bold text-lg text-white mb-3">{poll.question}</h3>

            <div className="flex flex-col gap-3">
                {poll.options.map((option: any, idx: number) => {
                    const voteData = votes[idx] || { count: 0 };
                    const percent = totalVotes > 0 ? Math.round((voteData.count / totalVotes) * 100) : 0;
                    const hasVoted = userVote !== null;
                    const isUserChoice = userVote === idx;
                    const isMostVoted = idx === maxVoteIndex;

                    return (
                        <motion.button
                            key={idx}
                            className={`w-full p-3 rounded-xl font-semibold transition-shadow relative overflow-hidden border-2`}
                            onClick={() => handleVote(idx)}
                            disabled={hasVoted}
                            style={{ borderColor: hasVoted && isUserChoice ? '#34d399' : 'transparent' }}
                        >
                            {hasVoted &&
                                <motion.div
                                    className={`absolute left-0 top-0 h-full ${isMostVoted ? "bg-accent-green" : "bg-gray-600/70"} opacity-40`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 0.8, ease: "easeInOut" }}
                                />
                            }
                            <div className="relative flex justify-between items-center z-10 px-2">
                                <span className={`transition-colors ${hasVoted && isMostVoted ? 'text-white' : 'text-gray-300'}`}>{option.text}</span>
                                {hasVoted && <span className="text-sm text-gray-200 font-medium">{percent}%</span>}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
            {totalVotes > 0 && <p className="text-xs text-center text-gray-500 mt-2">{totalVotes} votes</p>}
        </motion.div>
    );
}
