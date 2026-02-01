
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { AnimatePresence, motion } from "framer-motion";

const db = getFirestore(app);
const POSTS_PER_PAGE = 5;

export default function FlowPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsFlowVideoPlaying } = useAppState();
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const playerRefs = useRef<any[]>([]);

    // Memoize fetchMorePosts to prevent re-creation on every render
    const fetchMorePosts = useCallback(async (isInitial = false) => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        if (isInitial) setLoading(true);

        const queryConstraints = [
            where("isVideo", "==", true),
            orderBy("publishAt", "desc"),
            limit(POSTS_PER_PAGE)
        ];

        // Use the lastVisible state from the previous fetch
        if (!isInitial && lastVisible) {
            queryConstraints.splice(2, 0, startAfter(lastVisible));
        }

        const q = query(collection(db, "posts"), ...queryConstraints);

        try {
            const documentSnapshots = await getDocs(q);
            const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

            setPosts(prev => {
                const currentPosts = isInitial ? [] : prev;
                const postIds = new Set(currentPosts.map(p => p.id));
                const uniqueNewPosts = newPosts.filter(p => !postIds.has(p.id));
                return [...currentPosts, ...uniqueNewPosts];
            });

            setLastVisible(lastDoc);
            setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
        } catch (error) {
            console.error(`Error fetching posts:`, error);
        } finally {
            setLoadingMore(false);
            if (isInitial) setLoading(false);
        }
    }, [hasMore, loadingMore, lastVisible]);

    // Initial fetch - runs only once
    useEffect(() => {
        fetchMorePosts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (currentIndex < posts.length - 1) {
                    const newIndex = currentIndex + 1;
                    setCurrentIndex(newIndex);
                    containerRef.current?.scrollTo({
                        top: newIndex * window.innerHeight,
                        behavior: 'smooth'
                    });
                }
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (currentIndex > 0) {
                    const newIndex = currentIndex - 1;
                    setCurrentIndex(newIndex);
                    containerRef.current?.scrollTo({
                        top: newIndex * window.innerHeight,
                        behavior: 'smooth'
                    });
                }
            } else if (event.key === ' ') { // Spacebar
                event.preventDefault();
                if (playerRefs.current[currentIndex]) {
                    playerRefs.current[currentIndex].togglePlayPause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, posts.length]);

    // Fetch more posts when nearing the end
    useEffect(() => {
        if (currentIndex > posts.length - 3 && hasMore && !loadingMore) {
            fetchMorePosts();
        }
    }, [currentIndex, posts.length, hasMore, loadingMore, fetchMorePosts]);

    useEffect(() => {
        setIsFlowVideoPlaying(true);
        return () => setIsFlowVideoPlaying(false);
    }, [setIsFlowVideoPlaying]);

    if (loading && posts.length === 0) {
        return <VibeSpaceLoader />;
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col relative">
            <style jsx global>{` body { overflow-y: hidden; } main { padding: 0 !important; } `}</style>
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth"
                onScroll={(e) => {
                    const { scrollTop, clientHeight } = e.currentTarget;
                    if (clientHeight === 0) return;
                    const newIndex = Math.round(scrollTop / clientHeight);
                    if (newIndex !== currentIndex) {
                        setCurrentIndex(newIndex);
                    }
                }}
            >
                <AnimatePresence>
                    {posts.length > 0 ? (
                        <>
                            {posts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    className="h-screen w-screen snap-start flex items-center justify-center relative"
                                >
                                    <ShortsPlayer
                                        ref={el => playerRefs.current[index] = el}
                                        post={post}
                                        isActive={index === currentIndex}
                                    />
                                </motion.div>
                            ))}
                            {loadingMore && (
                                <div className="h-screen w-screen snap-start flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col h-full items-center justify-center text-center p-4">
                            <h1 className="text-3xl font-headline font-bold text-accent-cyan">No Videos Yet</h1>
                            <p className="text-gray-400 mt-2">Be the first to create a vibe!</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
