
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc, Timestamp, updateDoc, increment } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useParams } from 'next/navigation';
import { CommentModal } from "@/components/CommentModal";
import { VideoDescription } from "@/components/flow/VideoDescription";
import { useIsMobile } from "@/hooks/use-mobile";

const db = getFirestore(app);
const POSTS_PER_PAGE = 3;

export default function FlowVideoPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    const router = useRouter();

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsFlowVideoPlaying } = useAppState();
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const playerRefs = useRef<any[]>([]);
    const viewedVideosRef = useRef<Set<string>>(new Set());

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [activePost, setActivePost] = useState<any>(null);

    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const isMobile = useIsMobile();

    const handleCommentClick = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setActivePost(post);
        if (isMobile) {
            setShowCommentModal(true);
        } else {
            // On desktop, toggle the description view to show comments
            setIsDescriptionOpen(prev => !prev);
        }
    };

    const handleDescriptionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDescriptionOpen(prev => !prev);
    };

    const closeDescription = () => {
        setIsDescriptionOpen(false);
    };

    const incrementViewCount = useCallback(async (postId: string) => {
        if (viewedVideosRef.current.has(postId) || !postId) return;
        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, { viewCount: increment(1) });
            viewedVideosRef.current.add(postId);
        } catch (error) {
            console.error("Error incrementing view count:", error);
        }
    }, []);

     useEffect(() => {
        const syncStateToUrl = async () => {
            if (!videoId) return;

            const postIndexInState = posts.findIndex(p => p.id === videoId);

            if (postIndexInState !== -1) {
                if (postIndexInState !== currentIndex) {
                    setCurrentIndex(postIndexInState);
                }
                incrementViewCount(videoId);
                setLoading(false);
                return; 
            }

            setLoading(true);
            try {
                const postRef = doc(db, 'posts', videoId);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists() && postSnap.data().isFlow) {
                    const initialPostData = { id: postSnap.id, ...postSnap.data() };
                    incrementViewCount(videoId);

                    const q = query(
                        collection(db, "posts"),
                        where("isFlow", "==", true),
                        where("isVideo", "==", true),
                        orderBy("publishAt", "desc"),
                        startAfter(initialPostData.publishAt || Timestamp.now()),
                        limit(POSTS_PER_PAGE)
                    );

                    const subsequentSnapshots = await getDocs(q);
                    const subsequentPosts = subsequentSnapshots.docs.map(d => ({ id: d.id, ...d.data() }));

                    setPosts([initialPostData, ...subsequentPosts]);
                    setCurrentIndex(0);
                    setHasMore(subsequentPosts.length === POSTS_PER_PAGE);
                } else {
                    console.warn(`Post ${videoId} not found or not a flow video. Redirecting.`);
                    router.replace('/flow');
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                router.replace('/flow');
            } finally {
                setLoading(false);
            }
        };

        syncStateToUrl();
    }, [videoId, router]); // Keep router here for initial load redirect, but it won't cause scroll-refresh.


    const fetchMorePosts = useCallback(async () => {
        if (!hasMore || loadingMore || posts.length === 0) return;
        setLoadingMore(true);

        const lastPostInState = posts[posts.length - 1];
        if (!lastPostInState || !lastPostInState.publishAt) {
            setHasMore(false);
            setLoadingMore(false);
            return;
        }

        const q = query(
            collection(db, "posts"),
            where("isFlow", "==", true),
            where("isVideo", "==", true),
            orderBy("publishAt", "desc"),
            startAfter(lastPostInState.publishAt),
            limit(POSTS_PER_PAGE)
        );

        try {
            const snapshots = await getDocs(q);
            const newPosts = snapshots.docs.map(d => ({ id: d.id, ...d.data() }));

            if (newPosts.length > 0) {
                 setPosts(prev => {
                    const currentIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = newPosts.filter(p => !currentIds.has(p.id));
                    return [...prev, ...uniqueNewPosts];
                });
            }

            setHasMore(snapshots.docs.length === POSTS_PER_PAGE);
        } catch (error) {
            console.error(`Error fetching more posts:`, error);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, posts]);

    useEffect(() => {
        const handleScroll = () => {
            if (isMobile === false || !containerRef.current) return;
            const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
            const newIndex = Math.round(scrollTop / clientHeight);

            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
                const newVideoId = posts[newIndex]?.id;
                if (newVideoId && newVideoId !== videoId) {
                    // This is the fix: use history.replaceState to avoid re-triggering Next.js router
                    window.history.replaceState(null, '', `/flow/${newVideoId}`);
                    incrementViewCount(newVideoId);
                }
            }

            if (scrollHeight - scrollTop - clientHeight < clientHeight * 1.5 && hasMore && !loadingMore) {
                fetchMorePosts();
            }
        };

        const el = containerRef.current;
        el?.addEventListener('scroll', handleScroll, { passive: true });
        return () => el?.removeEventListener('scroll', handleScroll);
    }, [currentIndex, posts, hasMore, loadingMore, isMobile, videoId, fetchMorePosts, incrementViewCount]);

    useEffect(() => {
        setIsFlowVideoPlaying(true);
        return () => setIsFlowVideoPlaying(false);
    }, [setIsFlowVideoPlaying]);

    const activePostForView = posts[currentIndex];
    
    if (loading || isMobile === undefined) {
        return <VibeSpaceLoader />;
    }

    if (!isMobile) {
        return (
            <div className="w-full h-screen bg-black flex relative overflow-hidden">
                 <style jsx global>{` body { overflow-y: hidden; } main { padding: 0 !important; } `}</style>
                <AnimatePresence>
                    {isDescriptionOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "40%", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="h-full bg-black border-r border-gray-800 z-30 overflow-hidden"
                        >
                            <div className="p-8 h-full overflow-y-auto">
                               {activePostForView && <VideoDescription post={activePostForView} onClose={closeDescription} isOpen={true} isOverlay={false} />}
                                {activePostForView && (
                                    <CommentModal 
                                        post={activePostForView} 
                                        postId={activePostForView.id} 
                                        postAuthorId={activePostForView.userId} 
                                        collectionName="posts" 
                                        isOpen={true} 
                                        isOverlay={false} 
                                        onClose={closeDescription} 
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex-1 h-full flex items-center justify-center relative">
                    <div className="aspect-[9/16] h-full">
                        {activePostForView && (
                             <ShortsPlayer
                                key={activePostForView.id}
                                post={activePostForView}
                                isActive={true}
                                onCommentClick={(e) => handleCommentClick(e, activePostForView)}
                                onDescriptionClick={handleDescriptionClick}
                            />
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col relative">
            <style jsx global>{` body { overflow-y: hidden; } main { padding: 0 !important; } `}</style>
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth"
            >
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        className="h-screen w-screen snap-start flex items-center justify-center relative"
                    >
                        <ShortsPlayer
                            ref={el => playerRefs.current[index] = el}
                            post={post}
                            isActive={index === currentIndex}
                            onCommentClick={(e) => handleCommentClick(e, post)}
                            onDescriptionClick={handleDescriptionClick}
                        />
                    </motion.div>
                ))}
                {loadingMore && (
                    <div className="h-screen w-screen snap-start flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showCommentModal && activePost && (
                    <CommentModal 
                        postId={activePost.id} 
                        postAuthorId={activePost.userId} 
                        onClose={() => setShowCommentModal(false)} 
                        post={activePost}
                        collectionName="posts"
                        isOpen={showCommentModal}
                        isOverlay={true}
                    />
                )}
            </AnimatePresence>
            
            {activePostForView && <VideoDescription post={activePostForView} isOpen={isDescriptionOpen} onClose={closeDescription} isOverlay={true} />}
        </div>
    );
}
