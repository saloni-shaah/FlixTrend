"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OptimizedVideo } from '../OptimizedVideo';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2, Youtube } from 'lucide-react';
import { Watermark } from './Watermark';
import { TheaterModeContainer } from './TheaterModeContainer';
import { OptimizedImage } from '../OptimizedImage';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

function formatTime(seconds: number) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function InFeedVideoPlayer({ mediaUrls, post }: { mediaUrls: string[]; post: any }) {
    const videoUrl = mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'));
    const viewCountedRef = useRef(false);

    if (!videoUrl) {
        if (mediaUrls && mediaUrls.length > 0) {
            return (
                <div className="mt-2 rounded-xl overflow-hidden">
                    <OptimizedImage src={mediaUrls[0]} alt="Post media" />
                </div>
            );
        }
        return null;
    }
    
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const lastTap = useRef(0);

    const incrementViewCount = useCallback(() => {
        if (viewCountedRef.current || !post.id) return;
        viewCountedRef.current = true;
        const postRef = doc(db, 'posts', post.id);
        updateDoc(postRef, {
            viewCount: increment(1)
        }).catch(error => console.error("Error incrementing view count:", error));
    }, [post.id]);
    
    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(console.error);
        } else {
            video.pause();
        }
    }, []);

    const toggleMute = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const video = videoRef.current;
        const progressContainer = progressRef.current;
        if (!video || !progressContainer) return;

        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width);
        video.currentTime = video.duration * percentage;
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            handleDoubleClick();
        } else {
           togglePlay(e);
        }
        lastTap.current = now;
    };
    
    const handleDoubleClick = () => {
        if(document.fullscreenElement) {
             document.exitFullscreen();
        } else {
            containerRef.current?.requestFullscreen();
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        incrementViewCount();
    };
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'm':
                    toggleMute(e as any);
                    break;
                case 'f':
                    handleDoubleClick();
                    break;
                case 't':
                    setIsTheaterMode(t => !t);
                    break;
                case 'arrowright':
                    video.currentTime = Math.min(video.duration, video.currentTime + 5);
                    break;
                case 'arrowleft':
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlay, toggleMute]);

    return (
        <TheaterModeContainer isTheaterMode={isTheaterMode} setIsTheaterMode={setIsTheaterMode}>
            <div
                ref={containerRef}
                className="w-full h-full relative cursor-pointer bg-black"
                onClick={handleContainerClick}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
            >
                <OptimizedVideo
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={handlePlay}
                    onPause={() => setIsPlaying(false)}
                    loop={false}
                />
                <Watermark isAnimated={isPlaying} />

                <AnimatePresence>
                {(showControls || !isPlaying) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3 pointer-events-none"
                    >
                        <div>{/* Top controls spacer */}</div>
                        
                        {!isPlaying && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Play size={64} className="text-white/80 drop-shadow-lg" />
                            </div>
                        )}
                        
                        <div className="pointer-events-auto text-white">
                            <div 
                                className="w-full h-1 group/progress bg-white/20 hover:h-2 transition-all duration-200 cursor-pointer" 
                                ref={progressRef} 
                                onClick={handleSeek}
                            >
                                <div className="h-full bg-accent-pink rounded-full relative" style={{ width: `${progress}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white opacity-0 group-hover/progress:opacity-100" style={{ transform: `translateX(50%)` }}/>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs font-mono">
                                <div className="flex items-center gap-3">
                                    <button onClick={togglePlay}><AnimatePresence mode="wait">{isPlaying ? <Pause size={20}/> : <Play size={20}/>}</AnimatePresence></button>
                                    <div className="flex items-center gap-1 group/volume">
                                        <button onClick={toggleMute}>{isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
                                        <input
                                            type="range"
                                            min="0" max="1" step="0.05"
                                            defaultValue="1"
                                            className="w-0 group-hover/volume:w-16 h-1 transition-all duration-300"
                                            onChange={(e) => {
                                                if (videoRef.current) {
                                                    const volume = parseFloat(e.target.value);
                                                    videoRef.current.volume = volume;
                                                    setIsMuted(volume === 0);
                                                }
                                            }}
                                        />
                                    </div>
                                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsTheaterMode(t => !t)} title="Theater Mode (t)"><Youtube size={20} /></button>
                                    <button onClick={handleDoubleClick} title="Fullscreen (f)"><Maximize size={18}/></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </TheaterModeContainer>
    );
}
