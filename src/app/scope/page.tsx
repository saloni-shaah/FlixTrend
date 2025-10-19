"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Gamepad2, Flame } from 'lucide-react';
import { MusicDiscovery } from '@/components/MusicDiscovery';
import { GamesHub } from '@/components/GamesHub';
import { useAppState } from "@/utils/AppStateContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { Trendboard } from "@/components/scope/Trendboard";

const db = getFirestore(app);

const ScopeHub = ({ activeTab, setActiveTab, onBack }: { activeTab: string, setActiveTab: (tab: string) => void, onBack: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-10 bg-black/80 backdrop-blur-lg flex flex-col p-4 pt-12"
        >
            <div className="flex justify-center gap-2 p-1 rounded-full bg-black/30 mb-4">
                <button 
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'foryou' ? 'bg-accent-pink text-white' : 'text-gray-300'}`}
                    onClick={() => setActiveTab('foryou')}
                >
                    <Flame className="inline mr-2" size={16}/> For You
                </button>
                <button 
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'music' ? 'bg-accent-pink text-white' : 'text-gray-300'}`}
                    onClick={() => setActiveTab('music')}
                >
                    <Music className="inline mr-2" size={16}/> Music
                </button>
                 <button 
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'games' ? 'bg-accent-pink text-white' : 'text-gray-300'}`}
                    onClick={() => setActiveTab('games')}
                >
                    <Gamepad2 className="inline mr-2" size={16}/> Games
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'foryou' && <Trendboard />}
                {activeTab === 'music' && <MusicDiscovery />}
                {activeTab === 'games' && <GamesHub />}
            </div>

            <button onClick={onBack} className="btn-glass mt-4 self-center">Back to Videos</button>
        </motion.div>
    )
}


export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHub, setShowHub] = useState(false);
    const [hubActiveTab, setHubActiveTab] = useState('foryou');
    const { setIsScopeVideoPlaying } = useAppState();
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

            const userAndFollowingIds = [...new Set([user.uid, ...followingIds])];
            
            if (userAndFollowingIds.length === 0) {
                 setPosts([]);
                 setLoading(false);
                 return;
            }

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

    const handleDoubleClick = () => {
        setHubActiveTab('foryou'); // Default to 'For You' on double click
        setShowHub(true);
        setIsScopeVideoPlaying(false);
    }
    
    useEffect(() => {
        // When hub is open, App nav should be visible. When closed, video might play, so hide it.
        if (showHub) {
            setIsScopeVideoPlaying(false);
        }
    }, [showHub, setIsScopeVideoPlaying]);


    if (loading) {
        return <VibeSpaceLoader />;
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col relative" onDoubleClick={handleDoubleClick}>
             <style jsx global>{`
                nav.fixed.bottom-0 {
                    display: ${showHub ? 'flex' : 'none'} !important;
                }
             `}</style>
            
            <AnimatePresence>
                {showHub && <ScopeHub activeTab={hubActiveTab} setActiveTab={setHubActiveTab} onBack={() => setShowHub(false)}/>}
            </AnimatePresence>

            {!showHub && (
                 <div className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.id} className="h-screen w-screen snap-start flex items-center justify-center">
                                <ShortsPlayer post={post} />
                            </div>
                        ))
                    ) : (
                         <div className="flex flex-col h-full items-center justify-center text-center p-4">
                            <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Scope is Clear</h1>
                            <p className="text-gray-400 mt-2">Follow some creators to see their short vibes here!</p>
                            <p className="text-gray-500 mt-8 text-sm animate-pulse">Double-tap anywhere to explore music and games.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
