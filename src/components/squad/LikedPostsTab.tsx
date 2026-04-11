'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { Loader2, Heart } from 'lucide-react';

const db = getFirestore(app);
const POSTS_PER_PAGE = 5;

export default function LikedPostsTab({ userId }: { userId: string }) {
    const [allLikedPostIds, setAllLikedPostIds] = useState<string[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoadingInitial(false);
            return;
        }

        const fetchAllLikedPostIds = async () => {
            setLoadingInitial(true);
            try {
                const currentYear = new Date().getFullYear();
                const years = [];
                for (let year = currentYear; year >= 2023; year--) {
                    years.push(year.toString());
                }

                const yearlyDocsPromises = years.map(year => getDoc(doc(db, 'users', userId, 'likedPosts', year)));
                const yearlyDocsSnapshots = await Promise.all(yearlyDocsPromises);

                const allIds = yearlyDocsSnapshots.flatMap(docSnap => {
                    if (docSnap.exists()) {
                        return (docSnap.data().postIds || []).reverse();
                    }
                    return [];
                });

                setAllLikedPostIds(allIds);
                if (allIds.length === 0) {
                    setHasMore(false);
                }

            } catch (error) {
                console.error("Error fetching all liked post IDs:", error);
            } finally {
                setLoadingInitial(false);
            }
        };

        fetchAllLikedPostIds();
        setPosts([]);
        setPage(0);
        setHasMore(true);

    }, [userId]);

    const fetchMorePosts = useCallback(async () => {
        if (loadingMore || !hasMore || allLikedPostIds.length === 0) return;

        setLoadingMore(true);

        try {
            const start = page * POSTS_PER_PAGE;
            const end = start + POSTS_PER_PAGE;
            const postIdsToFetch = allLikedPostIds.slice(start, end);

            if (postIdsToFetch.length === 0) {
                setHasMore(false);
                setLoadingMore(false);
                return;
            }

            const postPromises = postIdsToFetch.map(postId => getDoc(doc(db, 'posts', postId)));
            const postDocs = await Promise.all(postPromises);

            const newPosts = postDocs
                .filter(postDoc => postDoc.exists())
                .map(postDoc => ({ id: postDoc.id, ...postDoc.data() }));

            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setPage(prevPage => prevPage + 1);

            if (end >= allLikedPostIds.length) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching more liked posts:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [page, allLikedPostIds, loadingMore, hasMore]);

    useEffect(() => {
        if (!loadingInitial && allLikedPostIds.length > 0 && page === 0) {
            fetchMorePosts();
        }
    }, [loadingInitial, allLikedPostIds, page, fetchMorePosts]);

    const lastPostElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMorePosts();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, fetchMorePosts]);

    if (loadingInitial) {
        return (
            <div className="flex justify-center my-4">
                <Loader2 className="animate-spin text-accent-cyan" />
            </div>
        );
    }

    if (posts.length === 0 && !hasMore) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Heart /></div>
                <div className="text-lg font-semibold">No liked posts</div>
                <div className="text-sm">Your liked posts will appear here.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {posts.map((post, index) => {
                if (posts.length === index + 1) {
                    return (
                        <div ref={lastPostElementRef} key={post.id}>
                            <PostCard post={post} collectionName="posts" />
                        </div>
                    );
                }
                return <PostCard key={post.id} post={post} collectionName="posts" />;
            })}
            {loadingMore &&
                <div className="flex justify-center my-4">
                    <Loader2 className="animate-spin text-accent-cyan" />
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
