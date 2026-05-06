'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc, Timestamp } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useParams } from 'next/navigation';
import { CommentModal } from "@/components/CommentModal";
import { VideoDescription } from "@/components/flow/VideoDescription";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackView } from "@/lib/viewProcessor";
import { ChevronUp, ChevronDown } from "lucide-react";

const db = getFirestore(app);
const POSTS_PER_PAGE = 3;

export default function FlowVideoPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
        return () => unsubscribe();
    }, []);

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsFlowVideoPlaying } = useAppState();
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const playerRefs = useRef<any[]>([]);
    
    const viewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [activePost, setActivePost] = useState<any>(null);

    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const isMobile = useIsMobile();
    const isWheeling = useRef(false);

    const handleCommentClick = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setActivePost(post);
        if (isMobile) {
            setShowCommentModal(true);
        } else {
            setIsDescriptionOpen(true); // Always open the side panel on desktop
        }
    };

    const handleDescriptionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDescriptionOpen(prev => !prev);
    };

    const closeDescription = () => {
        setIsDescriptionOpen(false);
    };

    useEffect(() => {
        if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);

        const activePostId = posts[currentIndex]?.id;
        if (activePostId) {
            viewTimeoutRef.current = setTimeout(() => {
                trackView(activePostId, currentUser?.uid);
            }, 7000);
        }

        return () => {
            if (viewTimeoutRef.current) clearTimeout(viewTimeoutRef.current);
        };
    }, [currentIndex, posts, currentUser]);

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

    const navigateToIndex = useCallback((index: number) => {
        if (index < 0 || index >= posts.length || index === currentIndex) return;
        setCurrentIndex(index);
        const newVideoId = posts[index]?.id;
        if (newVideoId) {
             window.history.replaceState(null, '', `/flow/${newVideoId}`);
        }
        if (index >= posts.length - 2 && hasMore && !loadingMore) {
            fetchMorePosts();
        }
    }, [posts, currentIndex, hasMore, loadingMore, fetchMorePosts]);

    useEffect(() => {
        const syncStateToUrl = async () => {
            if (!videoId) return;
            const postIndexInState = posts.findIndex(p => p.id === videoId);
            if (postIndexInState !== -1) {
                if (postIndexInState !== currentIndex) setCurrentIndex(postIndexInState);
                setLoading(false);
                return; 
            }
            setLoading(true);
            try {
                const postRef = doc(db, 'posts', videoId);
                const postSnap = await getDoc(postRef);
                if (postSnap.exists() && postSnap.data().isFlow) {
                    const initialPostData = { id: postSnap.id, ...postSnap.data() };
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
                    router.replace('/flow');
                }
            } catch (error) {
                router.replace('/flow');
            } finally {
                setLoading(false);
            }
        };
        syncStateToUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId, router]);

    useEffect(() => {
        const wheelHandler = (e: WheelEvent) => {
            if (isWheeling.current) return;
    
            isWheeling.current = true;
            if (e.deltaY > 0) {
                navigateToIndex(currentIndex + 1);
            } else {
                navigateToIndex(currentIndex - 1);
            }
    
            setTimeout(() => {
                isWheeling.current = false;
            }, 1000); // 1 second cooldown
        };
    
        const mobileScrollHandler = () => {
            if (!containerRef.current) return;
            const { scrollTop, clientHeight } = containerRef.current;
            const newIndex = Math.round(scrollTop / clientHeight);
            navigateToIndex(newIndex);
        };
    
        if (isMobile === true) {
            containerRef.current?.addEventListener('scroll', mobileScrollHandler, { passive: true });
        } else if (isMobile === false) {
            window.addEventListener('wheel', wheelHandler);
        }
    
        return () => {
            if (isMobile === true) {
                containerRef.current?.removeEventListener('scroll', mobileScrollHandler);
            } else if (isMobile === false) {
                window.removeEventListener('wheel', wheelHandler);
            }
        };
    }, [isMobile, currentIndex, navigateToIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isMobile) return;
            if (["TEXTAREA", "INPUT"].includes((e.target as HTMLElement)?.tagName)) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                navigateToIndex(currentIndex + 1);
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                navigateToIndex(currentIndex - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, currentIndex, navigateToIndex]);

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
            <div className="w-full h-screen bg-black flex justify-center items-center relative overflow-hidden">
                <style jsx global>{` body { overflow-y: hidden; } main { padding: 0 !important; } `}</style>
                
                {/* Navigation Buttons */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                    <button 
                        onClick={() => navigateToIndex(currentIndex - 1)} 
                        disabled={currentIndex === 0}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full backdrop-blur-md"
                    >
                        <ChevronUp size={24} />
                    </button>
                    <button 
                        onClick={() => navigateToIndex(currentIndex + 1)} 
                        disabled={currentIndex >= posts.length - 1 && !hasMore}
                        className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-full backdrop-blur-md"
                    >
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Video Player */}
                <div className="h-full w-auto flex items-center justify-center" style={{aspectRatio: '9/16'}}>
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

                {/* Right Panel for Comments/Description */}
                <AnimatePresence>
                    {isDescriptionOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 400, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="h-full bg-gray-900/50 backdrop-blur-xl border-l border-gray-700 z-30 overflow-hidden"
                        >
                            <div className="p-4 h-full flex flex-col">
                               {activePostForView && <VideoDescription post={activePostForView} onClose={closeDescription} isOpen={true} isOverlay={false} />}
                               <div className="flex-grow overflow-y-auto mt-4">
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // Mobile view remains unchanged
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