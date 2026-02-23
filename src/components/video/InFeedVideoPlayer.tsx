
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedVideo } from '../OptimizedVideo';
import { AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Youtube } from 'lucide-react';
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

export function InFeedVideoPlayer({ mediaUrls, post, navigatesToWatchPage = false }: { mediaUrls: string[]; post: any; navigatesToWatchPage?: boolean }) {
    const router = useRouter();
    const videoUrl = mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'));
    const viewCountedRef = useRef(false);

    const handleNavigation = () => {
        if (!post.id) return;
        const targetUrl = post.isFlow ? `/flow/${post.id}` : `/watch?v=${post.id}`;
        router.push(targetUrl);
    };

    if (!videoUrl) {
        const imageUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null;
        return (
            <div className="mt-2 rounded-xl overflow-hidden cursor-pointer" onClick={handleNavigation}>
                {imageUrl ? <OptimizedImage src={imageUrl} alt="Post media" /> : null}
            </div>
        );
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const lastTap = useRef(0);

    const incrementViewCount = useCallback(() => {
        if (viewCountedRef.current || !post.id) return;
        viewCountedRef.current = true;
        const postRef = doc(db, 'posts', post.id);
        updateDoc(postRef, { viewCount: increment(1) }).catch(error => console.error("Error incrementing view count:", error));
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
        setIsMuted(m => !m);
    }, []);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const video = videoRef.current;
        const progressContainer = progressRef.current;
        if (!video || !progressContainer || !video.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width);
        video.currentTime = video.duration * percentage;
    };

    const handleContainerClick = () => {
        if (navigatesToWatchPage || post.isFlow) {
            handleNavigation();
            return;
        }

        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            handleDoubleClick();
        } else {
            togglePlay();
        }
        lastTap.current = now;
    };

    const handleDoubleClick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (containerRef.current) {
            containerRef.current.requestFullscreen();
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        if (navigatesToWatchPage) {
            incrementViewCount();
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || navigatesToWatchPage || post.isFlow) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            switch (e.key.toLowerCase()) {
                case ' ': e.preventDefault(); togglePlay(); break;
                case 'm': toggleMute(e as any); break;
                case 'f': handleDoubleClick(); break;
                case 't': setIsTheaterMode(t => !t); break;
                case 'arrowright': video.currentTime = Math.min(video.duration, video.currentTime + 5); break;
                case 'arrowleft': video.currentTime = Math.max(0, video.currentTime - 5); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleMute, navigatesToWatchPage, post.isFlow]);

    if (navigatesToWatchPage || post.isFlow) {
        return (
            <div className="w-full h-full relative cursor-pointer bg-black mt-2 rounded-xl overflow-hidden" onClick={handleNavigation}>
                <OptimizedVideo
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    muted
                    loop
                    playsInline
                    onPlay={handlePlay}
                />
                <Watermark />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                    <Play size={64} className="text-white/80 drop-shadow-lg" />
                </div>
            </div>
        );
    }

    return (
        <TheaterModeContainer isTheaterMode={isTheaterMode} setIsTheaterMode={setIsTheaterMode}>
            <div
                ref={containerRef}
                className="w-full h-full relative cursor-pointer bg-black"
                onClick={handleContainerClick}
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
                    autoPlay
                    muted
                />
                <Watermark isAnimated={isPlaying} />

                {!isPlaying && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="bg-black/50 rounded-full p-4">
                           <Play size={64} className="text-white/80 drop-shadow-lg" fill="white" />
                        </div>
                    </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                    <div
                        className="w-full h-1.5 group/progress bg-white/30 hover:h-2 transition-all duration-200 cursor-pointer"
                        ref={progressRef}
                        onClick={handleSeek}
                    >
                        <div className="h-full bg-accent-pink rounded-full relative" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity" style={{ transform: `translateX(50%)` }} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-white text-xs font-mono">
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="w-6 h-6 flex items-center justify-center"><AnimatePresence mode="wait">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</AnimatePresence></button>
                            <div className="flex items-center gap-1 group/volume">
                                <button onClick={toggleMute}>{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                                <input type="range" min="0" max="1" step="0.05" defaultValue="1" className="w-0 group-hover/volume:w-16 h-1 transition-all duration-300" onChange={(e) => { if (videoRef.current) { const volume = parseFloat(e.target.value); videoRef.current.volume = volume; setIsMuted(volume === 0); } }} />
                            </div>
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsTheaterMode(t => !t)} title="Theater Mode (t)"><Youtube size={20} /></button>
                            <button onClick={handleDoubleClick} title="Fullscreen (f)"><Maximize size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </TheaterModeContainer>
    );
}
