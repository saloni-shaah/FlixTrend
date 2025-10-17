
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Gamepad2, TrendingUp } from 'lucide-react';
import { MusicDiscovery } from '@/components/MusicDiscovery';
import { GamesHub } from '@/components/GamesHub';
import { ScopeNavBar } from "@/components/scope/ScopeNavBar";
import { Trendboard } from "@/components/scope/Trendboard";
import { useAppState } from "@/utils/AppStateContext";
import { useAuthState } from "react-firebase-hooks/auth";

const db = getFirestore(app);

export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'videos' | 'hub'>('videos');
    const [activeTab, setActiveTab] = useState('music');
    const { isScopeVideoPlaying } = useAppState();
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchFollowingAndPosts = async () => {
            setLoading(true);
            const followingRef = collection(db, "users", user.uid, "following");
            const followingSnap = await getDocs(followingRef);
            const followingIds = followingSnap.docs.map(doc => doc.id);

            // Include user's own posts in the scope feed
            const userAndFollowingIds = [...new Set([user.uid, ...followingIds])];
            
            if (userAndFollowingIds.length === 0) {
                 setPosts([]);
                 setLoading(false);
                 return;
            }

            // Firestore 'in' query is limited to 30 items in the array. 
            // For a real app with many followed users, you'd need a more complex data model or multiple queries.
            const q = query(
                collection(db, "posts"),
                where("isVideo", "==", true),
                where("userId", "in", userAndFollowingIds.slice(0, 30)),
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

            return unsub;
        };
        
        let unsubscribe: (() => void) | undefined;
        fetchFollowingAndPosts().then(unsub => {
            if (unsub) {
                unsubscribe = unsub;
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };

    }, [user]);

    const handleDoubleClick = useCallback(() => {
        setViewMode(current => (current === 'videos' ? 'hub' : 'videos'));
    }, []);

    const hideAppNav = viewMode === 'videos' && isScopeVideoPlaying;
    
    useEffect(() => {
        // This is a bit of a hack to control body scroll from a component
        if (viewMode === 'videos') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [viewMode]);

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
        <div className={`w-full h-screen bg-black flex flex-col relative`} onDoubleClick={handleDoubleClick}>
             {/* This style tag will dynamically add/remove the class to hide the nav */}
             <style jsx global>{`
                nav.fixed.bottom-0 {
                    display: ${hideAppNav ? 'none' : 'flex'} !important;
                }
             `}</style>
            
            <AnimatePresence mode="wait">
                {viewMode === 'videos' ? (
                    <motion.div
                        key="videos"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden"
                    >
                        <ScopeNavBar onDoubleClick={handleDoubleClick} />
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="h-screen w-screen snap-start flex items-center justify-center">
                                    <ShortsPlayer post={post} />
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col h-full items-center justify-center text-center">
                                <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Scope is Clear</h1>
                                <p className="text-gray-400 mt-2">Follow some creators to see their short vibes here!</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="hub"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full flex-1 flex flex-col p-4 pt-20 overflow-y-auto"
                    >
                         <ScopeNavBar onDoubleClick={handleDoubleClick} />
                        <div className="flex justify-center gap-2 mb-4 p-1 rounded-full bg-black/30">
                            <button onClick={() => setActiveTab('music')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'music' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}><Music size={16}/> Music</button>
                            <button onClick={() => setActiveTab('games')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'games' ? 'bg-green-500 text-white' : 'text-gray-400'}`}><Gamepad2 size={16}/> Games</button>
                            <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 transition-colors ${activeTab === 'trending' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}><TrendingUp size={16}/> Trending</button>
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
