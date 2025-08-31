
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Share, Play } from 'lucide-react';
import Link from 'next/link';
import { ShareModal } from './ShareModal';
import { PostCard } from './PostCard';

export function ShortVibesPlayer({ shortVibes }: { shortVibes: any[] }) {
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    
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
                video.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                event.preventDefault(); // Prevent default browser behavior for Ctrl key
                const video = videoRefs.current[activeShortIndex];
                if (video) {
                     if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        video.requestFullscreen().catch(err => {
                            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                        });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeShortIndex]);


    const scrollUp = () => {
        setActiveShortIndex(i => Math.max(0, i - 1));
    };
    
    const scrollDown = () => {
        setActiveShortIndex(i => Math.min(shortVibes.length - 1, i + 1));
    };

    return (
        <div className="w-full h-full flex flex-col items-center relative glass-card overflow-hidden bg-black">
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
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ 
                            pointerEvents: idx === activeShortIndex ? "auto" : "none",
                            zIndex: shortVibes.length - Math.abs(activeShortIndex - idx),
                            opacity: idx === activeShortIndex ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out',
                        }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleVideoClick(idx)} onDoubleClick={() => handleDoubleClick(idx)}>
                            <video
                                ref={el => { videoRefs.current[idx] = el; }}
                                src={short.mediaUrl}
                                className="w-full h-full object-contain pointer-events-none" // Use object-contain and disable pointer events on video
                                autoPlay={idx === 0}
                                loop
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
            {/* Scroll buttons */}
            {activeShortIndex > 0 && (
              <button className="absolute top-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollUp}>&uarr;</button>
            )}
            {activeShortIndex < shortVibes.length - 1 && (
              <button className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollDown}>&darr;</button>
            )}
        </div>
    );
}
