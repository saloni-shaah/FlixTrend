'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFirestore, collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { Loader2 } from 'lucide-react';

const db = getFirestore(app);
const POSTS_PER_PAGE = 5;

export default function UserPostsTab({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // State to ensure initial fetch happens only once
    const [initialFetchDone, setInitialFetchDone] = useState(false);

    const fetchPosts = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            let postsQuery = query(
                collection(db, "posts"),
                where("userId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(POSTS_PER_PAGE)
            );

            if (lastVisible) {
                postsQuery = query(postsQuery, startAfter(lastVisible));
            }

            const documentSnapshots = await getDocs(postsQuery);

            const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setLastVisible(lastDoc);

            if (documentSnapshots.docs.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setLoading(false);
            setInitialFetchDone(true);
        }
    }, [userId, loading, hasMore, lastVisible]);


    const lastPostElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchPosts();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchPosts]);

    useEffect(() => {
        // Reset state when userId changes
        setPosts([]);
        setLastVisible(null);
        setHasMore(true);
        setInitialFetchDone(false);
    }, [userId]);

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {posts.map((post, index) => (
                 <PostCard key={post.id} post={post} collectionName="posts" />
            ))}

            {/* This ref is on a trigger element at the bottom */}
            <div ref={lastPostElementRef} />

            {/* Show skeleton or loader on initial load */}
            {loading && (
                <div className="flex justify-center my-4">
                    <Loader2 className="animate-spin text-accent-cyan" />
                </div>
            )}

            {!initialFetchDone && !loading && posts.length === 0 && hasMore && (
                // This is a placeholder to ensure the trigger is visible for the first fetch
                <div className="h-10"></div>
            )}

            {initialFetchDone && !hasMore && posts.length === 0 && (
                 <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2">🪐</div>
                    <div className="text-lg font-semibold">No posts yet.</div>
                </div>
            )}

             {hasMore && !loading && initialFetchDone && posts.length > 0 &&
                <div className="text-center text-gray-500 text-sm mt-4">
                    Scroll down to load more...
                </div>
             }

             {!hasMore && posts.length > 0 &&
                 <div className="text-center text-gray-500 text-sm mt-4">
                     You've reached the end!
                 </div>
             }
        </div>
    );
}
