
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX, X } from 'lucide-react';
import { PostCard } from './PostCard';
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter, where } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { FlixTrendLogo } from './FlixTrendLogo';
import AdBanner from './AdBanner';

const db = getFirestore(app);
const VIBES_PER_PAGE = 5;
const AD_INTERVAL = 7;

function AdView({ onSkip }: { onSkip: () => void }) {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);
    
    return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
            <div className="absolute top-4 right-4 z-10">
                {countdown > 0 ? (
                    <span className="text-white bg-black/50 rounded-full px-3 py-1 text-sm">Skip in {countdown}</span>
                ) : (
                    <button onClick={onSkip} className="text-white bg-black/50 rounded-full px-4 py-2 text-sm flex items-center gap-2">
                        Skip Ad <X size={16} />
                    </button>
                )}
            </div>
            <div className="w-full max-w-sm">
                <AdBanner />
            </div>
             <p className="text-xs text-gray-500 absolute bottom-4">This is a sponsored message.</p>
        </div>
    )
}

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

export function ShortsPlayer({ onClose }: { onClose: () => void }) {
    const [shortVibes, setShortVibes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [showAd, setShowAd] = useState(false);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const playerRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef<number | null>(null);

    const fetchVibes = useCallback(async () => {
        setLoading(true);
        const first = query(
            collection(db, "posts"),
            where("type", "==", "media"),
            orderBy("createdAt", "desc"),
            limit(VIBES_PER_PAGE * 2) 
        );

        const documentSnapshots = await getDocs(first);
        const firstBatch = documentSnapshots.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => {
            const mediaUrl = post.mediaUrl;
            if (!mediaUrl) return false;
            const urls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
            return urls.some((url: string) => /\.(mp4|webm|ogg)$/i.test(url));
          });
        
        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setShortVibes(firstBatch);
        setLastVisible(lastDoc);
        setLoading(false);
        setHasMore(!!lastDoc);
    }, []);

    const fetchMoreVibes = useCallback(async () => {
        if (!lastVisible || !hasMore || loadingMore) return;
        setLoadingMore(true);

        const next = query(
            collection(db, "posts"),
            where("type", "==", "media"),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(VIBES_PER_PAGE * 2)
        );
        
        const documentSnapshots = await getDocs(next);
        const nextBatch = documentSnapshots.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post => {
                const mediaUrl = post.mediaUrl;
                if (!mediaUrl) return false;
                const urls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
                return urls.some((url: string) => /\.(mp4|webm|ogg)$/i.test(url));
            });

        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

        setShortVibes(prevVibes => [...prevVibes, ...nextBatch]);
        setLastVisible(lastDoc);
        setLoadingMore(false);
        setHasMore(!!lastDoc);

    }, [lastVisible, hasMore, loadingMore]);

    useEffect(() => {
        fetchVibes();
    }, [fetchVibes]);

    const scrollToNext = useCallback(() => {
        if ((activeShortIndex + 1) % AD_INTERVAL === 0) {
            setShowAd(true);
            return;
        }

        setActiveShortIndex(current => {
            if (current < shortVibes.length - 1) {
                return current + 1;
            }
            return current;
        });
    }, [activeShortIndex, shortVibes.length]);

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
            fetchMoreVibes();
        }
    }, [activeShortIndex, hasMore, fetchMoreVibes, shortVibes.length]);


    useEffect(() => {
        if (showAd) {
            const activeVideo = videoRefs.current[activeShortIndex];
            if (activeVideo) activeVideo.pause();
            return;
        }

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
    }, [activeShortIndex, isPlaying, isMuted, shortVibes, showAd]);

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
            if (showAd) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') event.preventDefault();
            if (event.key === 'ArrowDown') scrollToNext();
            else if (event.key === 'ArrowUp') scrollToPrev();
            else if (event.key.toLowerCase() === 'm') setIsMuted(prev => !prev);
        };

        const handleWheel = (event: WheelEvent) => {
            if (showAd) return;
            event.preventDefault();
            if (Math.abs(event.deltaY) < 10) return;
            if (event.deltaY > 0) scrollToNext();
            else if (event.deltaY < 0) scrollToPrev();
        };
        
        const handleTouchStart = (event: TouchEvent) => { if (!showAd) touchStartY.current = event.touches[0].clientY; };
        const handleTouchEnd = (event: TouchEvent) => {
            if (touchStartY.current === null || showAd) return;
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
    }, [scrollToNext, scrollToPrev, showAd]);

    const getVideoUrl = (post: any) => {
        if (!post.mediaUrl) return null;
        if (Array.isArray(post.mediaUrl)) {
            return post.mediaUrl.find((url: string) => /\.(mp4|webm|ogg)$/i.test(url)) || null;
        }
        return /\.(mp4|webm|ogg)$/i.test(post.mediaUrl) ? post.mediaUrl : null;
    }
    
    const handleAdSkip = () => {
        setShowAd(false);
        setActiveShortIndex(current => {
            if (current < shortVibes.length - 1) {
                return current + 1;
            }
            return current;
        });
    }

    if (showAd) {
        return (
             <div className="fixed inset-0 z-[100] w-full h-full flex flex-col items-center bg-black focus:outline-none overflow-hidden">
                 <AdView onSkip={handleAdSkip} />
             </div>
        );
    }

    return (
        <div ref={playerRef} className="fixed inset-0 z-[100] w-full h-full flex flex-col items-center bg-black focus:outline-none overflow-hidden" tabIndex={0}>
            <button onClick={onClose} className="absolute top-4 left-4 z-50 text-white bg-black/40 rounded-full p-2">
                <X size={24} />
            </button>
            {loading ? (
                <div className="text-gray-400 text-center m-auto">
                    <div className="text-6xl mb-2 animate-pulse">🎬</div>
                    <div className="text-lg font-semibold">Loading Shorts...</div>
                </div>
            ) : shortVibes.length === 0 ? (
                 <div className="text-gray-400 text-center m-auto">
                    <div className="text-6xl mb-2">🎬</div>
                    <div className="text-lg font-semibold">No Shorts Yet</div>
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
                        if (!videoUrl) return null;

                        const shouldLoad = Math.abs(idx - activeShortIndex) <= 2;

                        return (
                            <div key={`${short.id}-${idx}`} className="w-full h-full">
                                <div className="relative w-full h-full flex items-center justify-center" onClick={handleVideoClick}>
                                    <video
                                        ref={el => { videoRefs.current[idx] = el; }}
                                        src={shouldLoad ? videoUrl : undefined}
                                        className="w-full h-full object-contain"
                                        autoPlay={idx === activeShortIndex && isPlaying}
                                        loop
                                        muted={isMuted}
                                        playsInline
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
