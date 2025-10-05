"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, RotateCcw, Settings, FastForward } from 'lucide-react';
import { PostCard } from '../PostCard';
import { VideoSuggestions } from './VideoSuggestions';
import { cn } from '@/lib/utils';

export function FlixTrendPlayer({ post, onClose }: { post: any, onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);
    
    // View Modes
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    let controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }, []);
    
    useEffect(() => {
        handleMouseMove(); 
        const container = containerRef.current;
        container?.addEventListener('mousemove', handleMouseMove);
        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [handleMouseMove]);


    const togglePlay = () => setIsPlaying(prev => !prev);
    const toggleMute = () => setIsMuted(prev => !prev);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) video.play().catch(e => console.error("Autoplay failed", e));
        else video.pause();
    }, [isPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = isMuted;
        video.volume = isMuted ? 0 : volume;
    }, [isMuted, volume]);
    
     useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = playbackRate;
    }, [playbackRate]);

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && !isNaN(video.duration)) {
            setProgress((video.currentTime / video.duration) * 100);
            if(video.currentTime === video.duration && video.duration > 0) {
                setVideoEnded(true);
            }
        }
    };
    
    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) setDuration(video.duration);
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || time < 0) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (video) {
            const newTime = (Number(e.target.value) / 100) * video.duration;
            video.currentTime = newTime;
        }
    };

    const handleFullscreenChange = useCallback(() => {
        setIsFullscreen(!!document.fullscreenElement);
    }, []);
    
    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        const handleOrientationChange = () => {
            if (screen.orientation.type.startsWith('landscape') && !isFullscreen) {
                containerRef.current?.requestFullscreen().catch(err => console.error(err));
            } else if (screen.orientation.type.startsWith('portrait') && isFullscreen) {
                document.exitFullscreen().catch(err => console.error(err));
            }
        };

        try {
            screen.orientation.addEventListener('change', handleOrientationChange);
        } catch (error) {
            console.warn("Screen Orientation API not fully supported.");
        }
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
             try {
                screen.orientation.removeEventListener('change', handleOrientationChange);
            } catch (error) {}
        }
    }, [isFullscreen, handleFullscreenChange]);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen().catch(err => console.error("Fullscreen request failed:", err));
        } else {
            document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
        }
    };
    
    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl[0] : post.mediaUrl;

    const playNextVideo = (nextPost: any) => {
        // This function would be more complex in a real app, likely involving updating the parent modal's state
        console.log("Playing next:", nextPost.title);
        // For demonstration, we can just reload with the new video.
        // A better approach would be to have the parent PlayerModal manage the current post state.
        alert(`Next up: ${nextPost.title}`);
        window.location.reload(); // Simple refresh for now
    }

    return (
        <div 
            ref={containerRef}
            className={cn("relative flex items-center justify-center bg-black overflow-hidden group",
                isTheaterMode && !isFullscreen ? "w-full aspect-video" : "w-[600px] h-[400px]",
                isFullscreen && "!w-screen !h-screen"
            )}
        >
            <AnimatePresence>
            {videoEnded && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="absolute inset-0 z-20">
                     <VideoSuggestions currentPost={post} onPlayNext={playNextVideo}/>
                </motion.div>
            )}
            </AnimatePresence>
            <video
                ref={videoRef}
                src={videoUrl}
                poster={post.thumbnailUrl}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />

            <AnimatePresence>
            {showControls && !videoEnded && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none"
                >
                    {/* Top Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">{post.title}</h3>
                            <button onClick={onClose} className="text-white"><X/></button>
                        </div>
                    </div>
                    
                    {/* Like/Share Overlay (vertical for fullscreen mobile) */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden">
                        <PostCard post={post} isShortVibe={true}/>
                    </div>


                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-auto">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleScrub}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-accent-pink"
                        />
                         <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlay}>{isPlaying ? <Pause/> : <Play />}</button>
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleMute}>{isMuted ? <VolumeX/> : <Volume2/>}</button>
                                    {!isMuted && <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-20 h-1 accent-white" />}
                                </div>
                                <span className="text-xs">{formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}</span>
                            </div>
                             <div className="flex items-center gap-4">
                                 <div className="relative">
                                     <button onClick={() => setShowSettings(s => !s)}><Settings/></button>
                                     {showSettings && (
                                         <div className="absolute bottom-full right-0 mb-2 bg-black/80 rounded-lg p-2">
                                             <p className="text-xs font-bold mb-1">Speed</p>
                                             {[0.5, 1, 1.5, 2].map(rate => (
                                                 <button key={rate} onClick={() => { setPlaybackRate(rate); setShowSettings(false); }} className={`block w-full text-left text-xs p-1 rounded ${playbackRate === rate ? 'bg-accent-cyan text-black' : ''}`}>
                                                     {rate}x
                                                 </button>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                                <button onClick={() => setIsTheaterMode(t => !t)} className="hidden md:block">
                                    {isTheaterMode ? <Minimize/> : <Maximize className="rotate-90"/>}
                                </button>
                                <button onClick={toggleFullscreen}>
                                    {isFullscreen ? <Minimize /> : <Maximize />}
                                </button>
                             </div>
                         </div>
                         {/* Like/Share Horizontal (Desktop) */}
                         <div className="hidden md:block mt-4">
                             <PostCard post={post} isShortVibe={true} />
                         </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
