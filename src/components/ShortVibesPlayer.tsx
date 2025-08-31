
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
        
        window.addEventListener('keydown', handleKeyDown);
        currentRef.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (currentRef) {
                currentRef.removeEventListener('wheel', handleWheel);
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
                        <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleVideoClick(idx)} onDoubleClick={() => handleDoubleClick(idx)}>
                            <video
                                ref={el => { videoRefs.current[idx] = el; }}
                                src={short.mediaUrl}
                                className="w-full h-full object-contain pointer-events-none"
                                autoPlay={idx === 0}
                                loop
                                muted={isMuted}
                                playsInline
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

            {/* Scroll buttons for touch devices */}
            <div className="md:hidden">
                {activeShortIndex > 0 && (
                  <button className="absolute top-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollToPrev}>&uarr;</button>
                )}
                {activeShortIndex < shortVibes.length - 1 && (
                  <button className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollToNext}>&darr;</button>
                )}
            </div>
        </div>
    );
}
