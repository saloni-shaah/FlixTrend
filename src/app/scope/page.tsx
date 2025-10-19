
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Gamepad2, TrendingUp, Video } from 'lucide-react';
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
    const [activeView, setActiveView] = useState<'videos' | 'music' | 'games' | 'trending'>('videos');
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

    const hideAppNav = activeView === 'videos' && isScopeVideoPlaying;
    
    useEffect(() => {
        if (activeView === 'videos') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [activeView]);

    if (loading) {
        return <VibeSpaceLoader />;
    }

    const renderHubContent = () => {
        switch(activeView) {
            case 'music': return <MusicDiscovery />;
            case 'games': return <GamesHub />;
            case 'trending': return <Trendboard />;
            case 'videos':
                 return (
                    <div className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden">
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
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className={`w-full h-screen bg-black flex flex-col relative`}>
             <style jsx global>{`
                nav.fixed.bottom-0 {
                    display: ${hideAppNav ? 'none' : 'flex'} !important;
                }
             `}</style>
            
            <ScopeNavBar activeView={activeView} setActiveView={setActiveView} />

            <AnimatePresence mode="wait">
                 <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: activeView === 'videos' ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: activeView === 'videos' ? 0 : -20 }}
                    transition={{ duration: 0.3 }}
                    className={activeView === 'videos' ? 'w-full h-full' : "w-full flex-1 flex flex-col p-4 pt-20 overflow-y-auto"}
                >
                    {renderHubContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
