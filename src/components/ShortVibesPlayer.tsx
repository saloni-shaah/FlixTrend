
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Share, Play, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { ShareModal } from './ShareModal';
import { PostCard } from './PostCard';

export function ShortVibesPlayer({ shortVibes }: { shortVibes: any[] }) {
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const playerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartY = useRef<number | null>(null);
    
    const scrollToNext = useCallback(() => {
        setActiveShortIndex(i => Math.min(shortVibes.length - 1, i + 1));
    }, [shortVibes.length]);

    const scrollToPrev = useCallback(() => {
        setActiveShortIndex(i => Math.max(0, i - 1));
    }, []);

    useEffect(() => {
        // Ensure the active video plays when the index changes
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeShortIndex) {
                    video.play().catch(() => {}); // Autoplay might be blocked
                    setIsPlaying(true);
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, [activeShortIndex, shortVibes]);

    const handleVideoClick = (index: number) => {
        const video = videoRefs.current[index];
        if (video) {
            if (video.paused) {
                video.play().catch(() => {});
                setIsPlaying(true);
            } else {
                video.pause();
                setIsPlaying(false);
            }
        }
    };
    
    const handleDoubleClick = (index: number) => {
        const video = videoRefs.current[index];
        if (video) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                playerRef.current?.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    };
    
    useEffect(() => {
        const currentRef = playerRef.current;
        if (!currentRef) return;
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
            }

            if (event.key === 'ArrowDown') {
                scrollToNext();
            } else if (event.key === 'ArrowUp') {
                scrollToPrev();
            } else if (event.key.toLowerCase() === 'm') {
                setIsMuted(prev => !prev);
            }
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            if (scrollTimeoutRef.current) return;
            
            if (event.deltaY > 0) {
                scrollToNext();
            } else if (event.deltaY < 0) {
                scrollToPrev();
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                scrollTimeoutRef.current = null;
            }, 500);
        };
        
        // Touch controls for swipe navigation
        const handleTouchStart = (event: TouchEvent) => {
            touchStartY.current = event.touches[0].clientY;
        };

        const handleTouchEnd = (event: TouchEvent) => {
            if (touchStartY.current === null) return;
            const touchEndY = event.changedTouches[0].clientY;
            const deltaY = touchStartY.current - touchEndY;
            
            if (Math.abs(deltaY) > 50) { // Threshold for swipe
                if (deltaY > 0) {
                    scrollToNext();
                } else {
                    scrollToPrev();
                }
            }
            touchStartY.current = null;
        };


        window.addEventListener('keydown', handleKeyDown);
        currentRef.addEventListener('wheel', handleWheel, { passive: false });
        currentRef.addEventListener('touchstart', handleTouchStart, { passive: true });
        currentRef.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (currentRef) {
                currentRef.removeEventListener('wheel', handleWheel);
                currentRef.removeEventListener('touchstart', handleTouchStart);
                currentRef.removeEventListener('touchend', handleTouchEnd);
            }
             if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [scrollToNext, scrollToPrev]);

    return (
        <div ref={playerRef} className="w-full h-full flex flex-col items-center relative glass-card overflow-hidden bg-black focus:outline-none" tabIndex={0}>
            {shortVibes.length === 0 ? (
                <div className="text-gray-400 text-center m-auto">
                    <div className="text-6xl mb-2">🎬</div>
                    <div className="text-lg font-semibold">No Short Vibes Yet</div>
                    <p className="text-sm">Be the first to create one!</p>
                </div>
            ) : (
                shortVibes.map((short, idx) => (
                    <div
                        key={short.id || idx}
                        className="absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out"
                        style={{ 
                            transform: `translateY(${(idx - activeShortIndex) * 100}%)`,
                            zIndex: shortVibes.length - Math.abs(activeShortIndex - idx),
                        }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <video
                                ref={el => { videoRefs.current[idx] = el; }}
                                src={short.mediaUrl}
                                className="w-full h-full object-cover"
                                autoPlay={idx === 0}
                                loop
                                muted={isMuted}
                                playsInline
                                onClick={() => handleVideoClick(idx)}
                                onDoubleClick={() => handleDoubleClick(idx)}
                            />
                            {!isPlaying && activeShortIndex === idx && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                    <Play size={64} className="text-white/70" />
                                </div>
                            )}
                            <PostCard post={short} isShortVibe={true} />
                        </div>
                    </div>
                ))
            )}
            
            {/* Mute Button */}
            <button className="absolute top-4 right-4 z-50 p-2 bg-black/40 rounded-full text-white" onClick={() => setIsMuted(prev => !prev)}>
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20} />}
            </button>
        </div>
    );
}
