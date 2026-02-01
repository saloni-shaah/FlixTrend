
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

const db = getFirestore(app);

export const ShortsPlayer = forwardRef(({ post, isActive }:{ post: any, isActive: boolean }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsFlowVideoPlaying } = useAppState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const viewCountedRef = useRef(false);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);

    const safePlay = useCallback((video: HTMLVideoElement) => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error("Video play failed", error);
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
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'AbortError') return;
                    if (error.name === 'NotAllowedError' && !video.muted) {
                        setIsMuted(true);
                    } else {
                        console.error("Autoplay error:", error);
                    }
                });
            }

            if (!viewCountedRef.current) {
                incrementViewCount();
            }
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isActive, incrementViewCount]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.muted = isMuted;
            if (isActive && video.paused && isMuted) {
                safePlay(video);
            }
        }
    }, [isMuted, isActive, safePlay]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    useEffect(() => {
        setIsFlowVideoPlaying(isPlaying);
    }, [isPlaying, setIsFlowVideoPlaying]);

    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                safePlay(video);
            } else {
                video.pause();
            }
        }
    }, [safePlay]);

    useImperativeHandle(ref, () => ({
        togglePlayPause,
    }));

    const handleManualMuteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if(video){
            const newMutedState = !video.muted;
            setIsMuted(newMutedState);
            video.muted = newMutedState;
        }
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
        const video = videoRef.current;
        if (video) {
            if (isMuted) {
                setIsMuted(false);
                video.muted = false;
            } else {
                togglePlayPause();
            }
        }
    };

    const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
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
                loop
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
                <button onClick={handleManualMuteToggle} className="bg-black/40 p-2 rounded-full text-white hover:bg-black/70 transition-colors">
                    {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                </button>
            </div>
            <div className="absolute inset-0 w-full h-full p-4 flex items-end justify-between pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <div className="flex-1 flex flex-col gap-2 self-end text-white drop-shadow-lg max-w-[calc(100%-80px)]">
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
                <div className="flex flex-col gap-4 self-end pointer-events-auto">
                    <PostActions post={post} isShortVibe={true} onCommentClick={(e) => {e.stopPropagation()}} />
                </div>
            </div>
        </div>
    );
});
