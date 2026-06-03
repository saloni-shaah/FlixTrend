'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter, doc, getDoc, QueryDocumentSnapshot, DocumentData, OrderByDirection } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CommentModal } from "@/components/CommentModal";
import { VideoDescription } from "@/components/flow/VideoDescription";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, ChevronUp, ChevronDown, Info, MessageCircle, X } from "lucide-react";

const db = getFirestore(app);
const POSTS_PER_PAGE = 3;

const timestampMillis = (value: any) => {
    if (!value) return 0;
    if (value.toMillis) return value.toMillis();
    if (value.toDate) return value.toDate().getTime();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export default function FlowVideoPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const scopedUserId = searchParams.get('userId');
    const flowSort = searchParams.get('sort') || 'latest';
    
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsFlowVideoPlaying } = useAppState();
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const playerRefs = useRef<any[]>([]);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [activePost, setActivePost] = useState<any>(null);

    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const isMobile = useIsMobile();
    const isScrolling = useRef(false);
    const isWheeling = useRef(false);
    const lastScrollTimeRef = useRef(0);
    const scrollAccumulatorRef = useRef(0);

    const getFlowOrder = useCallback(() => {
        if (flowSort === 'popular') {
            return { field: 'likesCount', direction: 'desc' as OrderByDirection };
        }

        return {
            field: 'publishAt',
            direction: (flowSort === 'oldest' ? 'asc' : 'desc') as OrderByDirection,
        };
    }, [flowSort]);

    const buildFlowQuery = useCallback((cursor?: QueryDocumentSnapshot<DocumentData> | null) => {
        const { field, direction } = getFlowOrder();
        const constraints: any[] = [
            where("isFlow", "==", true),
            where("isVideo", "==", true),
        ];

        if (scopedUserId) {
            constraints.push(where("userId", "==", scopedUserId));
        }

        constraints.push(orderBy(field, direction));

        if (cursor) {
            constraints.push(startAfter(cursor));
        }

        constraints.push(limit(POSTS_PER_PAGE));
        return query(collection(db, "posts"), ...constraints);
    }, [getFlowOrder, scopedUserId]);

    const sortScopedPosts = useCallback((items: any[]) => {
        return [...items].sort((a, b) => {
            if (flowSort === 'popular') {
                return (b.likesCount || 0) - (a.likesCount || 0);
            }

            const aTime = timestampMillis(a.publishAt || a.createdAt);
            const bTime = timestampMillis(b.publishAt || b.createdAt);
            return flowSort === 'oldest' ? aTime - bTime : bTime - aTime;
        });
    }, [flowSort]);

    const flowUrlFor = useCallback((id: string) => {
        const params = new URLSearchParams();
        if (scopedUserId) params.set('userId', scopedUserId);
        if (flowSort) params.set('sort', flowSort);
        const suffix = params.toString();
        return `/flow/${id}${suffix ? `?${suffix}` : ''}`;
    }, [scopedUserId, flowSort]);

    const fetchMorePosts = useCallback(async () => {
        if (scopedUserId) {
            setHasMore(false);
            return;
        }
        if (!hasMore || loadingMore || posts.length === 0) return;
        setLoadingMore(true);

        if (!lastVisible) {
            setHasMore(false);
            setLoadingMore(false);
            return;
        }

        const q = buildFlowQuery(lastVisible);

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
            setLastVisible(snapshots.docs[snapshots.docs.length - 1] || lastVisible);
            setHasMore(snapshots.docs.length === POSTS_PER_PAGE);
        } catch (error) {
            console.error(`Error fetching more posts:`, error);
        } finally {
            setLoadingMore(false);
        }
    }, [scopedUserId, hasMore, loadingMore, posts.length, lastVisible, buildFlowQuery]);

    const scrollToPost = useCallback((index: number) => {
        if (index < 0 || index >= posts.length || isScrolling.current) return;
        
        isScrolling.current = true;
        setCurrentIndex(index);
        const newVideoId = posts[index]?.id;
        if (newVideoId) {
            window.history.replaceState(null, '', flowUrlFor(newVideoId));
        }
        
        const element = document.getElementById(`post-${posts[index].id}`);
        element?.scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => { isScrolling.current = false; }, 800);
        if (index >= posts.length - 2 && hasMore && !loadingMore) {
            fetchMorePosts();
        }
    }, [posts, hasMore, loadingMore, fetchMorePosts, flowUrlFor]);

    const loadScopedFlowPosts = useCallback(async (initialPost: any) => {
        if (!scopedUserId) return false;

        const scopedSnap = await getDocs(query(
            collection(db, "posts"),
            where("userId", "==", scopedUserId),
            limit(120)
        ));

        const scopedPosts = scopedSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((post: any) => post.isFlow && post.isVideo);

        const byId = new Map<string, any>();
        [...scopedPosts, initialPost].forEach(post => {
            if (post?.id && post.userId === scopedUserId && post.isFlow && post.isVideo) {
                byId.set(post.id, post);
            }
        });

        const sortedPosts = sortScopedPosts(Array.from(byId.values()));
        const nextIndex = Math.max(0, sortedPosts.findIndex(post => post.id === initialPost.id));

        setPosts(sortedPosts);
        setCurrentIndex(nextIndex);
        setLastVisible(null);
        setHasMore(false);
        return sortedPosts.length > 0;
    }, [scopedUserId, sortScopedPosts]);

    const handleCommentClick = (e: React.MouseEvent, post: any) => {
        e.stopPropagation();
        setActivePost(post);
        if (isMobile) {
            setShowCommentModal(true);
        } else {
            setIsDescriptionOpen(true);
        }
    };

    const handleDescriptionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDescriptionOpen(prev => !prev);
    };

    const closeDescription = () => {
        setIsDescriptionOpen(false);
    };

    const navigateToIndex = useCallback((index: number) => {
        if (index < 0 || index >= posts.length || index === currentIndex) return;
        
        setCurrentIndex(index);
        const newVideoId = posts[index]?.id;
        if (newVideoId) {
            window.history.replaceState(null, '', flowUrlFor(newVideoId));
        }
        if (index >= posts.length - 2 && hasMore && !loadingMore) {
            fetchMorePosts();
        }
    }, [posts, currentIndex, hasMore, loadingMore, fetchMorePosts, flowUrlFor]);

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
                if (
                    postSnap.exists() &&
                    postSnap.data().isFlow &&
                    (!scopedUserId || postSnap.data().userId === scopedUserId)
                ) {
                    const initialPostData = { id: postSnap.id, ...postSnap.data() };
                    if (scopedUserId) {
                        const loaded = await loadScopedFlowPosts(initialPostData);
                        if (!loaded) router.replace('/flow');
                        return;
                    }

                    const q = buildFlowQuery(postSnap);
                    const subsequentSnapshots = await getDocs(q);
                    const subsequentPosts = subsequentSnapshots.docs.map(d => ({ id: d.id, ...d.data() }));
                    setPosts([initialPostData, ...subsequentPosts]);
                    setCurrentIndex(0);
                    setLastVisible(subsequentSnapshots.docs[subsequentSnapshots.docs.length - 1] || postSnap);
                    setHasMore(subsequentPosts.length === POSTS_PER_PAGE);
                } else {
                    router.replace('/flow');
                }
            } catch (error) {
                console.error("Error loading flow video:", error);
                if (!scopedUserId) router.replace('/flow');
            } finally {
                setLoading(false);
            }
        };
        syncStateToUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId, router, scopedUserId, buildFlowQuery, loadScopedFlowPosts]);

    useEffect(() => {
        const wheelHandler = (e: WheelEvent) => {
            if (isScrolling.current) return;
            
            const scrollThreshold = 150;
            scrollAccumulatorRef.current += Math.abs(e.deltaY);
            
            if (scrollAccumulatorRef.current >= scrollThreshold) {
                scrollAccumulatorRef.current = 0;
                if (e.deltaY > 0) {
                    scrollToPost(currentIndex + 1);
                } else {
                    scrollToPost(currentIndex - 1);
                }
            }
        };
        
        const mobileScrollHandler = () => {
            if (!containerRef.current || isScrolling.current) return;
            const now = Date.now();
            const { scrollTop, clientHeight } = containerRef.current;
            const newIndex = Math.round(scrollTop / clientHeight);
            
            if (Math.abs(newIndex - currentIndex) === 1 && now - lastScrollTimeRef.current > 1500) {
                lastScrollTimeRef.current = now;
                scrollToPost(newIndex);
            }
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
    }, [isMobile, currentIndex, scrollToPost]);

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
            
            if (e.key === "j" || e.key === "J") {
                e.preventDefault();
                navigateToIndex(currentIndex + 1);
            }
            if (e.key === "k" || e.key === "K") {
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
                
                {/* Top-left Back Button */}
                <div className="absolute top-4 left-4 z-40">
                    <button 
                        onClick={() => router.push('/vibespace')}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* Desktop Next/Prev Buttons - Left Side Only */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30 pointer-events-none">
                    <motion.button 
                        onClick={() => scrollToPost(currentIndex - 1)}
                        disabled={currentIndex === 0}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="pointer-events-auto bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed text-white p-3 rounded-full backdrop-blur-md transition-all"
                    >
                        <ChevronUp size={28} />
                    </motion.button>
                    <motion.button 
                        onClick={() => scrollToPost(currentIndex + 1)}
                        disabled={currentIndex >= posts.length - 1 && !hasMore}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="pointer-events-auto bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed text-white p-3 rounded-full backdrop-blur-md transition-all"
                    >
                        <ChevronDown size={28} />
                    </motion.button>
                </div>

                {/* Center Video Player */}
                <div 
                    className="h-full flex-1 flex items-center justify-center relative" 
                    style={{maxWidth: '100%'}}
                >
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
                            className="h-full bg-gray-900/50 backdrop-blur-xl border-l border-gray-700 z-30 overflow-hidden flex flex-col"
                            onWheel={(e) => e.stopPropagation()}
                            onScroll={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={closeDescription}
                                className="absolute top-4 right-4 text-white/60 hover:text-white z-40"
                            >
                                <X size={24} />
                            </button>
                            <div className="p-4 h-full flex flex-col overflow-hidden">
                               {activePostForView && (
                                   <div className="overflow-y-auto flex-shrink-0 mb-4 pr-2">
                                       <VideoDescription post={activePostForView} onClose={closeDescription} isOpen={true} isOverlay={false} />
                                   </div>
                               )}
                               <div className="flex-grow overflow-y-auto min-h-0 border-t border-gray-700 pt-4">
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

    // Mobile view
    return (
        <div className="w-full h-screen bg-black flex flex-col relative">
            <style jsx global>{` body { overflow-y: hidden; } main { padding: 0 !important; } `}</style>
            
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-40">
                <button 
                    onClick={() => router.push('/vibespace')}
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth"
            >
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        id={`post-${post.id}`}
                        className="h-screen w-screen snap-start flex items-center justify-center relative"
                    >
                        <ShortsPlayer
                            ref={(el) => { playerRefs.current[index] = el; }}
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