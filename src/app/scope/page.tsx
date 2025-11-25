
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { auth, app } from "@/utils/firebaseClient";
import { VibeSpaceLoader } from "@/components/VibeSpaceLoader";
import { ShortsPlayer } from "@/components/ShortsPlayer";
import { useAppState } from "@/utils/AppStateContext";
import { useAuthState } from "react-firebase-hooks/auth";

const db = getFirestore(app);
const POSTS_PER_PAGE = 3; // Fetch in batches of 3 for a good balance of pre-loading.

export default function ScopePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsScopeVideoPlaying } = useAppState();
    const [user] = useAuthState(auth);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver>();
    const prefetchTriggerRef = useRef<HTMLDivElement>(null);

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
    
    // Initial fetch trigger
    useEffect(() => {
        if (user && posts.length === 0) {
            fetchMorePosts();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, posts.length, fetchMorePosts]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMorePosts();
                }
            },
            { threshold: 0.8 } // Start fetching when the trigger is 80% visible
        );

        const currentPrefetchTrigger = prefetchTriggerRef.current;
        if (currentPrefetchTrigger) {
            observer.current.observe(currentPrefetchTrigger);
        }

        return () => {
            if (currentPrefetchTrigger) {
                observer.current?.unobserve(currentPrefetchTrigger);
            }
        };
    }, [fetchMorePosts, hasMore, loading, loadingMore, posts]); // Re-attach observer when posts change
    
    useEffect(() => {
       setIsScopeVideoPlaying(false);
    }, [setIsScopeVideoPlaying]);


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

             <div className="absolute inset-0 w-full h-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth">
                {posts.length > 0 ? (
                    <>
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                ref={index === posts.length - 2 ? prefetchTriggerRef : null} // Attach ref to the second to last item
                                className="h-screen w-screen snap-start flex items-center justify-center"
                            >
                                <ShortsPlayer 
                                    post={post} 
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
