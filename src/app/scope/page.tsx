
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { useAuthState } from "react-firebase-hooks/auth";

const db = getFirestore(app);
const POSTS_PER_PAGE = 3; 

export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsScopeVideoPlaying } = useAppState();
    const [user] = useAuthState(auth);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchMorePosts = useCallback(async () => {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);

      let q;
      if (lastVisible) {
        q = query(collection(db, "posts"), where("isVideo", "==", true), orderBy("publishAt", "desc"), startAfter(lastVisible), limit(POSTS_PER_PAGE));
      } else {
         q = query(collection(db, "posts"), where("isVideo", "==", true), orderBy("publishAt", "desc"), limit(POSTS_PER_PAGE));
      }

      try {
        const documentSnapshots = await getDocs(q);
        const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

        const newIds = new Set(newPosts.map(p => p.id));
        setPosts(prevPosts => [...prevPosts.filter(p => !newIds.has(p.id)), ...newPosts]);
        
        setLastVisible(lastDoc);
        setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);

      } catch (error) {
        console.error("Error fetching more video posts:", error);
      } finally {
        setLoadingMore(false);
        setLoading(false);
      }
    }, [hasMore, loadingMore, lastVisible]);
    
    useEffect(() => {
        if (user && posts.length === 0) {
            fetchMorePosts();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, posts.length, fetchMorePosts]);

    // Pre-fetch when approaching the end
    useEffect(() => {
        if(currentIndex > posts.length - 3 && hasMore && !loadingMore) {
            fetchMorePosts();
        }
    }, [currentIndex, posts.length, hasMore, loadingMore, fetchMorePosts]);

    useEffect(() => {
       setIsScopeVideoPlaying(false);
    }, [setIsScopeVideoPlaying]);

    const scrollToPost = (index: number) => {
        const container = containerRef.current;
        if (container) {
            const postElement = container.children[index] as HTMLElement;
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
    
    const handleNext = () => {
        const nextIndex = Math.min(currentIndex + 1, posts.length - 1);
        setCurrentIndex(nextIndex);
        scrollToPost(nextIndex);
    };

    const handlePrev = () => {
        const prevIndex = Math.max(currentIndex - 1, 0);
        setCurrentIndex(prevIndex);
        scrollToPost(prevIndex);
    };

    if (loading && posts.length === 0) {
        return <VibeSpaceLoader />;
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col relative">
             <style jsx global>{`
                body {
                    overflow-y: hidden;
                }
                main {
                    padding: 0 !important;
                }
             `}</style>

             <div 
                ref={containerRef}
                className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth"
                onScroll={(e) => {
                    const { scrollTop, clientHeight } = e.currentTarget;
                    const newIndex = Math.round(scrollTop / clientHeight);
                    if (newIndex !== currentIndex) {
                        setCurrentIndex(newIndex);
                    }
                }}
            >
                {posts.length > 0 ? (
                    <>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="h-screen w-screen snap-start flex items-center justify-center"
                            >
                                <ShortsPlayer 
                                    post={post} 
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                    onView={() => {}}
                                />
                            </div>
                        ))}
                        {loadingMore && (
                           <div className="h-screen w-screen snap-start flex items-center justify-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-cyan"></div>
                           </div>
                        )}
                    </>
                ) : (
                     <div className="flex flex-col h-full items-center justify-center text-center p-4">
                        <h1 className="text-3xl font-headline font-bold text-accent-cyan">The Scope is Clear</h1>
                        <p className="text-gray-400 mt-2">Follow some creators to see their short vibes here!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
