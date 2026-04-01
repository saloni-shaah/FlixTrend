
"use client";
import React, { useState, useRef, useEffect, useCallback, TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { OptimizedVideo } from '../OptimizedVideo';
import { AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Youtube, ExternalLink, Loader } from 'lucide-react';
import { Watermark } from './Watermark';
import { TheaterModeContainer } from './TheaterModeContainer';
import { OptimizedImage } from '../OptimizedImage';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { FullScreenImageViewer } from '../FullScreenImageViewer';
import { useVideoContext } from './VideoContext';

const db = getFirestore(app);

function formatTime(seconds: number) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function InFeedVideoPlayer({ mediaUrls, post, navigatesToWatchPage = false }: { mediaUrls: string[]; post: any; navigatesToWatchPage?: boolean; }) {
    const router = useRouter();
    const { setActivePlayer } = useVideoContext();

    const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);
    const videoUrl = post.mediaType === 'video' ? mediaUrls.find(url => url) : undefined;

    const handleNavigation = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!post.id) return;
        const targetUrl = post.isFlow ? `/flow/${post.id}` : `/watch?v=${post.id}`;
        router.push(targetUrl);
    };

    if (!videoUrl) {
        const imageUrl = mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null;
        return (
            <>
                <div className="mt-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => imageUrl && setFullScreenImageUrl(imageUrl)}>
                    {imageUrl ? <OptimizedImage src={imageUrl} alt="Post media" /> : <div className="w-full h-full bg-black flex items-center justify-center text-white">No Media</div>}
                </div>
                <FullScreenImageViewer imageUrl={fullScreenImageUrl} onClose={() => setFullScreenImageUrl(null)} />
            </>
        );
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const viewCountedRef = useRef(false);

    const incrementViewCount = useCallback(() => {
        if (!post.id || viewCountedRef.current) return;
        try {
            const viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '[]');
            if (viewedPosts.includes(post.id)) return;
            
            viewCountedRef.current = true;
            const postRef = doc(db, 'posts', post.id);
            updateDoc(postRef, { viewCount: increment(1) }).then(() => {
                localStorage.setItem('viewedPosts', JSON.stringify([...viewedPosts, post.id]));
            }).catch(error => {
                console.error("Error incrementing view count:", error);
                viewCountedRef.current = false;
            });
        } catch (e) { console.error(e) }
    }, [post.id]);

    const playVideo = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setActivePlayer(video);
        video.play().catch(() => setIsPlaying(false));
    }, [setActivePlayer]);

    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            playVideo();
        } else {
            video.pause();
        }
    }, [playVideo]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                playVideo();
            } else {
                video.pause();
            }
        }, { threshold: 0.7 });

        observer.observe(video);
        return () => observer.disconnect();
    }, [playVideo]);

    const toggleMute = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        setVolume(newMuted ? 0 : 1);
    }, [isMuted]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = volume;
        }
    }, [isMuted, volume]);

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        const currentProgress = (video.currentTime / video.duration);
        setProgress(currentProgress * 100);
        setCurrentTime(video.currentTime);
        if (currentProgress >= 0.8) incrementViewCount();
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const video = videoRef.current;
        const progressContainer = progressRef.current;
        if (!video || !progressContainer || !video.duration) return;

        const rect = progressContainer.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const percentage = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        video.currentTime = video.duration * percentage;
    };

    const handleFullscreen = () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.error(e));
        } else {
            containerRef.current.requestFullscreen?.().catch(() => {});
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isFocused) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            e.preventDefault();
            switch (e.key.toLowerCase()) {
                case ' ': togglePlay(); break;
                case 'm': toggleMute(e as any); break;
                case 'f': handleFullscreen(); break;
                case 't': setIsTheaterMode(t => !t); break;
                case 'arrowright': video.currentTime = Math.min(video.duration, video.currentTime + 5); break;
                case 'arrowleft': video.currentTime = Math.max(0, video.currentTime - 5); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocused, togglePlay, toggleMute]);


    const MainPlayerComponent = (
         <div
            ref={containerRef}
            tabIndex={0}
            className={`w-full h-full relative cursor-pointer bg-black ${navigatesToWatchPage ? 'mt-2 rounded-xl' : ''} overflow-hidden`}
            onClick={togglePlay}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onError={() => setHasError(true)}
                loop={false}
                muted={isMuted}
                playsInline
                preload="metadata"
            />

            {hasError && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">Video unavailable.</div>}
            {isBuffering && <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none"><Loader className="animate-spin text-white" size={48} /></div>}

            {!isPlaying && !isBuffering && !hasError && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="bg-black/50 rounded-full p-4">
                        <Play size={64} className="text-white/80 drop-shadow-lg" fill="white" />
                    </div>
                </div>
            )}
            
             <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-10">
                 <div
                    className="w-full h-1.5 group/progress bg-white/30 hover:h-2 transition-all duration-200 cursor-pointer"
                    ref={progressRef}
                    onClick={handleSeek}
                    onTouchStart={handleSeek}
                >
                    <div className="h-full bg-accent-pink rounded-full relative" style={{ width: `${progress}%` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/progress:opacity-100" style={{ transform: `translateX(50%)` }} />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-white text-xs font-mono">
                    <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="w-6 h-6 flex items-center justify-center"><AnimatePresence mode="wait">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</AnimatePresence></button>
                        <div className="flex items-center gap-1 group/volume">
                            <button onClick={toggleMute}>{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                            <input type="range" min="0" max="1" step="0.05" value={volume} className="w-0 group-hover/volume:w-16 h-1 transition-all duration-300" onChange={(e) => { e.stopPropagation(); const vol = parseFloat(e.target.value); setVolume(vol); setIsMuted(vol === 0); }} />
                        </div>
                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {navigatesToWatchPage && <button onClick={handleNavigation} title="Go to video page"><ExternalLink size={20} /></button>}
                        {!navigatesToWatchPage && <button onClick={(e) => { e.stopPropagation(); setIsTheaterMode(t => !t);}} title="Theater Mode (t)"><Youtube size={20} /></button>}
                        <button onClick={(e) => { e.stopPropagation(); handleFullscreen();}} title="Fullscreen (f)"><Maximize size={18} /></button>
                    </div>
                </div>
            </div>

            <Watermark isAnimated={isPlaying} />
        </div>
    )

    return navigatesToWatchPage ? MainPlayerComponent : (
        <TheaterModeContainer isTheaterMode={isTheaterMode} setIsTheaterMode={setIsTheaterMode}>
            {MainPlayerComponent}
        </TheaterModeContainer>
    );
}
