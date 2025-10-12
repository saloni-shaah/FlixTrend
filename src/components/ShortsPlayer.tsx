
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCard } from './PostCard';
import { Loader } from 'lucide-react';
import { InFeedVideoPlayer } from './video/InFeedVideoPlayer';

function SingleShort({ post, isActive }: { post: any; isActive: boolean }) {
    const mediaUrls = Array.isArray(post.mediaUrl) ? post.mediaUrl : (post.mediaUrl ? [post.mediaUrl] : []);
    const videoUrl = mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));

    if (!videoUrl) {
         // This is a failsafe, but parent component should filter for video posts
        return (
            <div className="w-full h-full flex items-center justify-center bg-black text-white">
                Video not found for this post.
            </div>
        );
    }

    return (
        <div className="relative w-full h-full snap-start flex-shrink-0">
            {isActive ? (
                <InFeedVideoPlayer mediaUrls={[videoUrl]} post={post} />
            ) : (
                <div className="w-full h-full bg-black">
                     {post.thumbnailUrl && <img src={post.thumbnailUrl} alt="thumbnail" className="w-full h-full object-contain opacity-50"/>}
                </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <PostCard post={post} isShortVibe={true} />
            </div>
        </div>
    );
}

export function ShortsPlayer({ initialPosts, loadMorePosts, hasMore }: { initialPosts: any[]; loadMorePosts: () => void; hasMore: boolean; }) {
    const [posts, setPosts] = useState(initialPosts);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, clientHeight, scrollHeight } = container;
        const newIndex = Math.round(scrollTop / clientHeight);
        
        if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }

        // Load more when user is near the end
        if (hasMore && scrollHeight - scrollTop - clientHeight < clientHeight * 2) {
            loadMorePosts();
        }
    }, [activeIndex, hasMore, loadMorePosts]);

    return (
        <div 
            ref={containerRef}
            className="w-full h-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll no-scrollbar rounded-xl bg-black"
            onScroll={handleScroll}
        >
            {posts.map((post, index) => (
                <SingleShort key={post.id} post={post} isActive={index === activeIndex} />
            ))}
            {hasMore && (
                <div className="w-full h-full snap-start flex-shrink-0 flex items-center justify-center text-white">
                    <Loader className="animate-spin" />
                </div>
            )}
        </div>
    );
}
