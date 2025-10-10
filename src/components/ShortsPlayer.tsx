
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { PostCard } from './PostCard';
import { FlixTrendLogo } from './FlixTrendLogo';
import { OptimizedVideo } from './OptimizedVideo';

const Watermark = ({ isAnimated = false }: { isAnimated?: boolean }) => (
    <div
      className={`absolute flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10 ${
        isAnimated ? 'animate-[float-watermark_10s_ease-in-out_infinite]' : 'bottom-2 right-2'
      }`}
    >
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);

const getVideoUrl = (post: any) => {
    if (!post?.mediaUrl) return null;
    if (Array.isArray(post.mediaUrl)) {
        return post.mediaUrl.find((url: string) => /\.(mp4|webm|ogg)$/i.test(url)) || null;
    }
    return /\.(mp4|webm|ogg)$/i.test(post.mediaUrl) ? post.mediaUrl : null;
};

export function ShortsPlayer({ initialPosts = [], onEndReached, hasMore }: { initialPosts?: any[], onEndReached: () => void, hasMore: boolean }) {
    const [shortVibes, setShortVibes] = useState<any[]>(initialPosts);
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const playerRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef<number | null>(null);

     useEffect(() => {
        setShortVibes(initialPosts);
        if (initialPosts.length > 0) {
            setActiveShortIndex(0);
        }
    }, [initialPosts]);

    const scrollToNext = useCallback(() => {
        setActiveShortIndex(current => {
            if (current < shortVibes.length - 1) {
                return current + 1;
            }
            return current;
        });
    }, [shortVibes.length]);

    const scrollToPrev = useCallback(() => {
        setActiveShortIndex(current => {
            if (current > 0) {
                return current - 1;
            }
            return current;
        });
    }, []);

    useEffect(() => {
        if (hasMore && shortVibes.length > 0 && activeShortIndex >= shortVibes.length - 3) {
            onEndReached();
        }
    }, [activeShortIndex, hasMore, onEndReached, shortVibes.length]);

    useEffect(() => {
        const activeVideo = videoRefs.current[activeShortIndex];
        
        videoRefs.current.forEach((video, idx) => {
            if (video && idx !== activeShortIndex) {
                video.pause();
                if(video.currentTime !== 0) video.currentTime = 0;
            }
        });
        
        if (activeVideo) {
            activeVideo.muted = isMuted;
            if (isPlaying) {
                activeVideo.play().catch(e => console.error("Video play error:", e));
            } else {
                activeVideo.pause();
            }
        }
    }, [activeShortIndex, isPlaying, isMuted, shortVibes]);

    const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, a')) {
            return;
        }
        setIsPlaying(prev => !prev);
    };
    
    useEffect(() => {
        const currentRef = playerRef.current;
        if (!currentRef) return;
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') event.preventDefault();
            if (event.key === 'ArrowDown') scrollToNext();
            else if (event.key === 'ArrowUp') scrollToPrev();
            else if (event.key.toLowerCase() === 'm') setIsMuted(prev => !prev);
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            if (Math.abs(event.deltaY) < 10) return;
            if (event.deltaY > 0) scrollToNext();
            else if (event.deltaY < 0) scrollToPrev();
        };
        
        const handleTouchStart = (event: TouchEvent) => { touchStartY.current = event.touches[0].clientY; };
        const handleTouchEnd = (event: TouchEvent) => {
            if (touchStartY.current === null) return;
            const deltaY = touchStartY.current - event.changedTouches[0].clientY;
            if (Math.abs(deltaY) > 50) {
                if (deltaY > 0) scrollToNext();
                else scrollToPrev();
            }
            touchStartY.current = null;
        };

        window.addEventListener('keydown', handleKeyDown);
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                currentRef.addEventListener('wheel', handleWheel, { passive: false });
                currentRef.addEventListener('touchstart', handleTouchStart, { passive: true });
                currentRef.addEventListener('touchend', handleTouchEnd, { passive: true });
            } else {
                 currentRef.removeEventListener('wheel', handleWheel);
                currentRef.removeEventListener('touchstart', handleTouchStart);
                currentRef.removeEventListener('touchend', handleTouchEnd);
            }
        });
        observer.observe(currentRef);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (currentRef) {
                observer.unobserve(currentRef);
                currentRef.removeEventListener('wheel', handleWheel);
                currentRef.removeEventListener('touchstart', handleTouchStart);
                currentRef.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [scrollToNext, scrollToPrev]);

    return (
        <div ref={playerRef} className="w-full h-full flex flex-col items-center relative bg-black focus:outline-none overflow-hidden" tabIndex={0}>
            {shortVibes.length === 0 ? (
                <div className="text-gray-400 text-center m-auto">
                    <div className="text-6xl mb-2">🎬</div>
                    <div className="text-lg font-semibold">No Short Vibes Yet</div>
                    <p className="text-sm">Be the first to create one!</p>
                </div>
            ) : (
                <div
                    className="w-full h-full"
                    style={{
                        transform: `translateY(${-activeShortIndex * 100}%)`,
                        transition: 'transform 0.5s ease-in-out',
                    }}
                >
                    {shortVibes.map((short, idx) => {
                        const videoUrl = getVideoUrl(short);
                        if (!videoUrl) return <div key={`${short.id}-${idx}-error`} className="w-full h-full flex items-center justify-center text-red-500">Video not found for this post.</div>;

                        const shouldLoad = Math.abs(idx - activeShortIndex) <= 2;

                        return (
                            <div key={`${short.id}-${idx}`} className="w-full h-full">
                                <div className="relative w-full h-full flex items-center justify-center" onClick={handleVideoClick}>
                                    <OptimizedVideo
                                        ref={el => { videoRefs.current[idx] = el; }}
                                        src={shouldLoad ? videoUrl : ""}
                                        className="w-full h-full object-contain"
                                        preload={shouldLoad ? "auto" : "none"}
                                    />
                                    <Watermark isAnimated={true} />
                                    {!isPlaying && activeShortIndex === idx && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                            <Play size={64} className="text-white/70" />
                                        </div>
                                    )}
                                    <PostCard post={short} isShortVibe={true} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <button className="absolute top-24 right-4 z-50 p-2 bg-black/40 rounded-full text-white" onClick={() => setIsMuted(prev => !prev)}>
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20} />}
            </button>
        </div>
    );
}
