"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    getFirestore, collection, getDocs, doc, getDoc,
    query, where, orderBy, limit,
} from 'firebase/firestore';
import { auth, app } from '@/utils/firebaseClient';
import { FollowButton } from '@/components/FollowButton';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';

const db = getFirestore(app);

export default function ExploreCreatorsPage() {
    const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const currentUser = auth.currentUser;

    useEffect(() => {
        async function fetchRecommendations() {
            if (!currentUser) { setLoading(false); return; }
            setLoading(true);

            try {
                // ── 1. CURRENT USER ──────────────────────────────────────
                const currentUserSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (!currentUserSnap.exists()) { setLoading(false); return; }

                const me = currentUserSnap.data() as any;
                const myFollowing: string[] = Array.isArray(me.following) ? me.following : [];
                const myInterests: string[] = Array.isArray(me.interests) ? me.interests : [];
                const myFollowingSet = new Set(myFollowing);

                const isColdStart = myFollowing.length === 0 && myInterests.length === 0;

                // ── 2. FETCH CANDIDATES (minimised reads) ─────────────────
                // Cold start: fetch 60 trending + 40 new = 100 reads max
                // Warm:       30 interest + 25 trending + 20 new = 75 reads max
                const [interestSnap, trendingSnap, newSnap] = await Promise.all([
                    myInterests.length > 0
                        ? getDocs(query(
                            collection(db, "users"),
                            where("interests", "array-contains-any", myInterests.slice(0, 10)),
                            limit(30)
                        ))
                        : Promise.resolve({ docs: [] } as any),

                    getDocs(query(
                        collection(db, "users"),
                        orderBy("followersCount", "desc"),
                        limit(isColdStart ? 60 : 25)
                    )),

                    getDocs(query(
                        collection(db, "users"),
                        orderBy("createdAt", "desc"),
                        limit(isColdStart ? 40 : 20)
                    )),
                ]);

                // ── 3. BUILD POOL (deduplicated) ──────────────────────────
                const pool = new Map<string, any>();
                [...interestSnap.docs, ...trendingSnap.docs, ...newSnap.docs].forEach(d => {
                    if (!pool.has(d.id)) pool.set(d.id, { uid: d.id, ...d.data() });
                });

                // ── 4. SCORE ──────────────────────────────────────────────
                const ranked = Array.from(pool.values())
                    .map((user: any) => {
                        // Hard filters — no score needed
                        if (user.uid === currentUser.uid) return null;
                        if (myFollowingSet.has(user.uid)) return null;

                        let score = 0;
                        const followersCount: number = user.followersCount || 0;
                        const followingCount: number = user.followingCount || 0;
                        const userInterests: string[] = Array.isArray(user.interests) ? user.interests : [];

                        // Shared interests  (+12 each, capped)
                        const shared = userInterests.filter(i => myInterests.includes(i));
                        score += Math.min(shared.length * 12, 60);

                        // Mutual followers boost — only if we have following data
                        // Uses already-fetched `user.followers` array (no extra read)
                        if (myFollowing.length > 0 && Array.isArray(user.followers)) {
                            const mutuals = user.followers.filter((id: string) => myFollowingSet.has(id));
                            score += Math.min(mutuals.length * 5, 25);
                        }

                        // Popularity boost (soft cap at 25)
                        score += Math.min(followersCount * 0.05, 25);

                        // Verified
                        if (user.verified === true) score += 15;

                        // New creator (<14 days)
                        if (user.createdAt?.toDate) {
                            const daysOld = (Date.now() - user.createdAt.toDate().getTime()) / 86_400_000;
                            if (daysOld <= 14) score += 10;
                        }

                        // Profile quality
                        if (user.avatar_url) score += 3;
                        if (user.bio?.length > 20) score += 3;
                        if (shared.length > 0) score += 5;

                        // Spam penalty
                        if (followingCount > followersCount * 5 && followingCount > 200) {
                            score -= 40;
                        }

                        return score > 0 ? { ...user, _score: score } : null;
                    })
                    .filter(Boolean) as any[];

                ranked.sort((a, b) => b._score - a._score);

                // ── 5. DIVERSITY INJECTION ────────────────────────────────
                const top = ranked.slice(0, 30);
                const smallCreators = ranked
                    .filter(u => (u.followersCount || 0) < 1000)
                    .slice(0, 8);

                const final = Array.from(
                    new Map([...top, ...smallCreators].map(u => [u.uid, u])).values()
                ).slice(0, 40);

                setRecommendedUsers(final);

            } catch (err) {
                console.error("Recommendation error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [currentUser]);

    // ── SEARCH (memoised, no re-fetch) ────────────────────────────────────
    const displayedUsers = useMemo(() => {
        if (!searchTerm.trim()) return recommendedUsers;
        const q = searchTerm.toLowerCase();
        return recommendedUsers.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        );
    }, [recommendedUsers, searchTerm]);

    return (
        <div className="flex flex-col w-full pb-24">
            <div className="w-full max-w-5xl mx-auto">

                <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="text-accent-pink w-5 h-5" />
                    <h1 className="text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-cyan bg-clip-text text-transparent">
                        Suggested For You
                    </h1>
                    <Sparkles className="text-accent-cyan w-5 h-5" />
                </div>

                <div className="relative mb-8 w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        className="input-glass w-full pl-12 pr-4 py-3"
                        placeholder="Search creators..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold pointer-events-none">
                        <Search size={18} />
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-3 mt-12">
                        <div className="w-8 h-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
                        <p className="text-accent-cyan text-sm animate-pulse">Finding creators for you...</p>
                    </div>
                ) : displayedUsers.length === 0 ? (
                    <p className="text-center text-gray-400 mt-8">
                        {searchTerm ? `No creators matching "${searchTerm}"` : "No recommendations yet."}
                    </p>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {displayedUsers.map((user: any, i: number) => (
                            <Link key={user.uid} href={`/squad/${user.username}`} className="block">
                                <motion.div
                                    className="glass-card p-5 flex flex-col items-center gap-4 hover:border-accent-cyan transition-all h-full"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.25 }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                >
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white text-4xl font-bold">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.name?.[0] || user.username?.[0] || "U"}</span>
                                            )}
                                        </div>
                                        {user.verified && (
                                            <span className="absolute bottom-0 right-0 bg-accent-cyan rounded-full text-xs px-1">✓</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center flex-1">
                                        <div className="font-headline text-accent-cyan text-lg leading-tight">{user.name}</div>
                                        <div className="text-sm text-gray-400">@{user.username}</div>
                                        {user.bio && (
                                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{user.bio}</p>
                                        )}
                                        {(user.followersCount || 0) > 0 && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {user.followersCount >= 1000
                                                    ? `${(user.followersCount / 1000).toFixed(1)}k`
                                                    : user.followersCount} followers
                                            </p>
                                        )}
                                    </div>

                                    <FollowButton profileUser={user} currentUser={currentUser} />
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}