"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Gamepad2, TrendingUp } from 'lucide-react';
import { MusicDiscovery } from '@/components/MusicDiscovery';
import { GamesHub } from '@/components/GamesHub';
import { ScopeNavBar } from "@/components/scope/ScopeNavBar";

const db = getFirestore(app);

function Trendboard() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <TrendingUp size={64} className="mb-4 text-accent-purple"/>
            <h3 className="text-xl font-bold">Trending Board</h3>
            <p>This feature is coming soon!</p>
        </div>
    )
}

export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'videos' | 'hub'>('videos');
    const [activeTab, setActiveTab] = useState('music');

    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            where("isVideo", "==", true),
            orderBy("publishAt", "desc"),
            limit(50)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const videoPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(videoPosts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching video posts:", error);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleDoubleClick = useCallback(() => {
        setViewMode(current => (current === 'videos' ? 'hub' : 'videos'));
    }, []);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    const renderHubContent = () => {
        switch(activeTab) {
            case 'music': return <MusicDiscovery />;
            case 'games': return <GamesHub />;
            case 'trending': return <Trendboard />;
            default: return null;
        }
    };

    return (
        <div className="w-full h-[calc(100vh-var(--nav-height,80px))] bg-black flex flex-col" onDoubleClick={handleDoubleClick}>
            <ScopeNavBar onDoubleClick={handleDoubleClick} />
            <AnimatePresence mode="wait">
                {viewMode === 'videos' ? (
                    <motion.div
                        key="videos"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full flex-1 snap-y snap-mandatory overflow-y-scroll overflow-x-hidden"
                    >
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="h-full w-full snap-start flex items-center justify-center">
                                    <ShortsPlayer post={post} />
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col h-full items-center justify-center text-center">
                                <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Scope is Clear</h1>
                                <p className="text-gray-400 mt-2">No short vibes have been posted yet. Be the first!</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="hub"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full flex-1 flex flex-col p-4"
                    >
                        <div className="flex justify-center gap-2 mb-4 p-1 rounded-full bg-black/30">
                            <button onClick={() => setActiveTab('music')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'music' ? 'bg-accent-pink text-white' : 'text-gray-400'}`}><Music size={16}/> Music</button>
                            <button onClick={() => setActiveTab('games')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'games' ? 'bg-accent-green text-black' : 'text-gray-400'}`}><Gamepad2 size={16}/> Games</button>
                            <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'trending' ? 'bg-accent-purple text-white' : 'text-gray-400'}`}><TrendingUp size={16}/> Trending</button>
                        </div>
                        <div className="flex-1 glass-card p-4 overflow-y-auto">
                            {renderHubContent()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
