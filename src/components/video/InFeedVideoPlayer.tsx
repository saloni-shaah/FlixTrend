"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OptimizedVideo } from '../OptimizedVideo';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Watermark } from './Watermark';

export function InFeedVideoPlayer({ mediaUrls, post }: { mediaUrls: string[]; post: any }) {
    const videoUrl = mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'));

    if (!videoUrl) {
        return (
             <div className="mt-2 rounded-xl overflow-hidden">
                <OptimizedImage src={mediaUrls[0]} alt="Post media" />
             </div>
        );
    }
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const lastTap = useRef(0);
    
    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(console.error);
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
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
    
    const enterFullscreen = useCallback(() => {
        const elem = videoRef.current;
        if (!elem) return;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) { /* Firefox */
            (elem as any).mozRequestFullScreen();
        } else if ((elem as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) { /* IE/Edge */
            (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
    }, []);
    
    const exitFullscreen = useCallback(() => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
    }, []);
    
     useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);


    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };
    
     const handleContainerClick = (e: React.MouseEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            handleDoubleClick(e);
        } else {
           togglePlay(e);
        }
        lastTap.current = now;
    };

    return (
        <div
            className="mt-2 w-full rounded-xl overflow-hidden relative cursor-pointer bg-black"
            style={{
                aspectRatio: post.isPortrait ? '9 / 16' : '16 / 9',
                maxHeight: '70vh',
            }}
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
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <Watermark isAnimated={isPlaying} />

             <AnimatePresence>
             {(showControls || !isPlaying) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex flex-col justify-between p-2 pointer-events-none"
                >
                    {/* Top controls if needed */}
                    <div></div>
                    
                    {/* Center play button */}
                    {!isPlaying && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                           <Play size={64} className="text-white/80 drop-shadow-lg" />
                        </div>
                    )}
                    
                    {/* Bottom controls */}
                    <div className="pointer-events-auto">
                        <div className="w-full h-2 bg-white/20 rounded-full mb-1 cursor-pointer" ref={progressRef} onClick={handleSeek}>
                            <div className="h-full bg-accent-pink rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <button onClick={togglePlay}><AnimatePresence mode="wait">{isPlaying ? <Pause/> : <Play/>}</AnimatePresence></button>
                                <button onClick={toggleMute}>{isMuted ? <VolumeX/> : <Volume2/>}</button>
                            </div>
                            <button onClick={() => isFullscreen ? exitFullscreen() : enterFullscreen()}>
                               {isFullscreen ? <Minimize/> : <Maximize />}
                            </button>
                        </div>
                    </div>
                </motion.div>
             )}
             </AnimatePresence>
        </div>
    );
}
