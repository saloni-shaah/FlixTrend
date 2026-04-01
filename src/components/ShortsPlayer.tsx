
"use client";
import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { OptimizedVideo } from './OptimizedVideo';
import { Play, Pause, Volume2, VolumeX, Heart } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostActions } from './PostActions';
import Link from 'next/link';
import { FaMusic } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from './video/ProgressBar';

const db = getFirestore(app);

export const ShortsPlayer = forwardRef(({ post, isActive, onCommentClick }: { post: any, isActive: boolean, onCommentClick: (e: React.MouseEvent) => void }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const { setIsFlowVideoPlaying } = useAppState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const viewCountedRef = useRef(false);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);

    const safePlay = useCallback((video: HTMLVideoElement) => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name === 'AbortError') return;
                console.error("Video play failed:", error);
                if (error.name === 'NotAllowedError') {
                    console.log("Autoplay was prevented. Muting video and trying again.");
                    setIsMuted(true);
                    if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.play().catch(e => console.error("Second play attempt failed", e));
                    }
                }
            });
        }
    }, []);

    const incrementViewCount = useCallback(() => {
        if (viewCountedRef.current || !post.id) return;
        viewCountedRef.current = true;
        const postRef = doc(db, 'posts', post.id);
        updateDoc(postRef, { viewCount: increment(1) }).catch(error => console.error("Error incrementing view count:", error));
    }, [post.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            safePlay(video);
            if (!viewCountedRef.current) {
                incrementViewCount();
            }
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isActive, incrementViewCount, safePlay]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) video.muted = isMuted;
    }, [isMuted]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => {
            if (!isScrubbing && video.duration > 0) {
                setProgress((video.currentTime / video.duration) * 100);
                setCurrentTime(video.currentTime);
            }
        };
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', () => {
            video.currentTime = 0;
            video.play();
        });


        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [isScrubbing]);

    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) safePlay(video);
            else video.pause();
        }
    }, [safePlay]);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            const newMutedState = !video.muted;
            setIsMuted(newMutedState);
        }
    }, []);

    const handleScrubStart = () => {
        setIsScrubbing(true);
        videoRef.current?.pause();
    };

    const handleScrubEnd = () => {
        setIsScrubbing(false);
        if (isActive) {
            videoRef.current?.play().catch(() => {});
        }
    };

    const handleScrub = (newProgress: number) => {
        const video = videoRef.current;
        if (video && video.duration) {
            const newTime = (newProgress / 100) * video.duration;
            video.currentTime = newTime;
            setProgress(newProgress);
            setCurrentTime(newTime);
        }
    };
    
    useEffect(() => {
        if (!isActive) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (['TEXTAREA', 'INPUT', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
            if (event.code === 'Space') {
                event.preventDefault();
                togglePlayPause();
            }
            if (event.code === 'KeyM') {
                event.preventDefault();
                toggleMute();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, togglePlayPause, toggleMute]);

    useImperativeHandle(ref, () => ({
        togglePlayPause,
        toggleMute,
    }));

    const handleManualMuteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleMute();
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        const likeButton = containerRef.current?.querySelector('[data-like-button="true"]');
        if (likeButton instanceof HTMLElement && !likeButton.dataset.liked) {
            likeButton.click();
        }
    };

    const handleSingleTap = () => {
        togglePlayPause();
    };

    const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (
            (actionsRef.current && actionsRef.current.contains(event.target as Node))
        ) {
            return;
        }

        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
            handleDoubleTap();
        } else {
            tapTimeout.current = setTimeout(() => {
                handleSingleTap();
                tapTimeout.current = null;
            }, 250);
        }
    };

    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl.find(url => /\.(mp4|webm|ogg)$/i.test(url)) : post.mediaUrl;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black flex items-center justify-center"
            onClick={handleContainerClick}
        >
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                playsInline
                preload="auto"
            />
            <AnimatePresence>
                {showHeart && (
                    <motion.div
                        key="heart"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <Heart fill="red" stroke="white" strokeWidth={2} size={100} />
                    </motion.div>
                )}
                {!isPlaying && (
                    <motion.div
                        key="play-icon"
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-black/50 rounded-full p-4">
                            <Play size={60} className="text-white drop-shadow-lg" fill="white" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute top-4 right-4 z-10">
                <button onClick={handleManualMuteToggle} className="bg-black/40 p-2 rounded-full text-white hover:bg-black/70 transition-colors pointer-events-auto">
                    {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                </button>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                <div className="flex-1 flex items-end justify-between">
                    <div className="flex flex-col gap-2 text-white drop-shadow-lg max-w-[calc(100%-80px)]">
                        <Link href={`/squad/${post.userId}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 group cursor-pointer w-fit pointer-events-auto">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                                {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{post.displayName?.[0] || 'U'}</span>}
                            </div>
                            <span className="font-headline text-white text-base group-hover:underline">@{post.username || "user"}</span>
                        </Link>
                        <p className="text-white text-sm font-body line-clamp-3">{post.content}</p>
                        {post.song && (
                            <div className="flex items-center gap-2 text-white text-sm">
                                <FaMusic /> <span>Original Audio</span>
                            </div>
                         )}
                    </div>
                    <div ref={actionsRef} className="flex flex-col gap-4 self-end pointer-events-auto">
                        <PostActions post={post} isShortVibe={true} onCommentClick={onCommentClick} />
                    </div>
                </div>
                <ProgressBar 
                    progress={progress} 
                    onScrub={handleScrub} 
                    onScrubStart={handleScrubStart}
                    onScrubEnd={handleScrubEnd}
                    variant="flow" 
                    currentTime={currentTime} 
                    duration={duration} 
                />
            </div>
        </div>
    );
});
