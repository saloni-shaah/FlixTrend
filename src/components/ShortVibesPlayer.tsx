
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
    const [isMuted, setIsMuted] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const playerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartY = useRef<number | null>(null);

    // *** NEW: Centralized audio controller ***
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const scrollToNext = useCallback(() => {
        setActiveShortIndex(i => Math.min(shortVibes.length - 1, i + 1));
    }, [shortVibes.length]);

    const scrollToPrev = useCallback(() => {
        setActiveShortIndex(i => Math.max(0, i - 1));
    }, []);
    
    // Create the single audio element when the component mounts
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        }
    }, []);

    // *** NEW: Overhauled playback logic ***
    useEffect(() => {
        const activeVideo = videoRefs.current[activeShortIndex];
        const audio = audioRef.current;
        
        if (!activeVideo || !audio) return;
        
        // Pause and reset all other videos
        videoRefs.current.forEach((video, idx) => {
            if (video && idx !== activeShortIndex) {
                video.pause();
                video.currentTime = 0;
            }
        });
        
        // Sync audio to the new active video
        const handleSyncPlay = () => {
            audio.src = activeVideo.src;
            audio.currentTime = activeVideo.currentTime;
            audio.muted = isMuted;
            
            const playPromise = audio.play();
            if(playPromise !== undefined) {
                playPromise.then(_ => {
                     // If video is not already playing, play it.
                    if (activeVideo.paused) {
                        activeVideo.play().catch(e => console.error("Video play failed", e));
                    }
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Audio play failed", error);
                    setIsPlaying(false);
                });
            }
        };

        handleSyncPlay();

    }, [activeShortIndex, shortVibes]);
    
    // Effect to control the central audio mute state
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const handleVideoClick = () => {
        const video = videoRefs.current[activeShortIndex];
        const audio = audioRef.current;
        if (video && audio) {
            if (video.paused) {
                video.play();
                audio.play();
                setIsPlaying(true);
            } else {
                video.pause();
                audio.pause();
                setIsPlaying(false);
            }
        }
    };
    
    const handleDoubleClick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            playerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
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
            if (scrollTimeoutRef.current) return;
            if (event.deltaY > 0) scrollToNext();
            else if (event.deltaY < 0) scrollToPrev();
            scrollTimeoutRef.current = setTimeout(() => { scrollTimeoutRef.current = null; }, 500);
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
             if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
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
                                muted // *** Videos are ALWAYS muted now ***
                                playsInline
                                onClick={handleVideoClick}
                                onDoubleClick={handleDoubleClick}
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
            
            <button className="absolute top-4 right-4 z-50 p-2 bg-black/40 rounded-full text-white" onClick={() => setIsMuted(prev => !prev)}>
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20} />}
            </button>
        </div>
    );
}
