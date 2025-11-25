
"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OptimizedVideo } from './OptimizedVideo';
import { Play, Pause, Volume2, VolumeX, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostActions } from './PostActions';
import Link from 'next/link';
import { FaMusic } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const db = getFirestore(app);

export function ShortsPlayer({ post, onNext, onPrev, onView }: { post: any, onNext: () => void, onPrev: () => void, onView: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsScopeVideoPlaying } = useAppState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const viewCountedRef = useRef(false);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);
    const lastTap = useRef(0);

    const incrementViewCount = useCallback(() => {
        if (viewCountedRef.current || !post.id) return;
        viewCountedRef.current = true;
        const postRef = doc(db, 'posts', post.id);
        updateDoc(postRef, {
            viewCount: increment(1)
        }).catch(error => console.error("Error incrementing view count:", error));
        onView();
    }, [post.id, onView]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(error => {
                        console.error("Autoplay failed:", error);
                    });
                    incrementViewCount();
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            },
            { threshold: 0.7 }
        );

        observer.observe(video);
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => setIsMuted(video.muted);
        
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('volumechange', handleVolumeChange);

        return () => {
            if (video) {
                observer.unobserve(video);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('volumechange', handleVolumeChange);
            }
            setIsScopeVideoPlaying(false);
        };
    }, [setIsScopeVideoPlaying, incrementViewCount]);

    useEffect(() => {
        setIsScopeVideoPlaying(isPlaying);
    }, [isPlaying, setIsScopeVideoPlaying]);
    
    const handleLongPressStart = () => {
        if (videoRef.current) videoRef.current.playbackRate = 2.0;
    };
    const handleLongPressEnd = () => {
        if (videoRef.current) videoRef.current.playbackRate = 1.0;
    };

    const longPressEvents = {
        onMouseDown: handleLongPressStart,
        onMouseUp: handleLongPressEnd,
        onTouchStart: handleLongPressStart,
        onTouchEnd: handleLongPressEnd,
    };

    const handleSingleTap = () => {
        const video = videoRef.current;
        if (video) {
            if(video.paused) video.play();
            else video.pause();
        }
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
        // Find the like button inside PostActions and click it programmatically
        const likeButton = containerRef.current?.querySelector('[data-like-button="true"]');
        if (likeButton instanceof HTMLElement) {
            likeButton.click();
        }
    }
    
    const handleContainerClick = () => {
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
            handleDoubleTap();
        } else {
            tapTimeout.current = setTimeout(() => {
                handleSingleTap();
                tapTimeout.current = null;
            }, 250); // A 250ms delay to distinguish single from double tap
        }
    };
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            video.muted = !video.muted;
            setIsMuted(video.muted);
        }
    };

    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl.find(url => /\.(mp4|webm|ogg)$/i.test(url)) : post.mediaUrl;

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer" 
            onClick={handleContainerClick}
        >
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                {...longPressEvents}
            />
            
            <AnimatePresence>
            {showHeart && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <Heart fill="red" stroke="white" strokeWidth={2} size={100} />
                </motion.div>
            )}
            </AnimatePresence>
            
            <div className="absolute inset-0 w-full h-full p-4 pr-8 flex items-end justify-between pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                 {/* Left side info */}
                <div className="flex-1 flex flex-col gap-2 self-end text-white drop-shadow-lg max-w-[calc(100%-80px)] pointer-events-auto">
                    <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer w-fit">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                            {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{post.displayName?.[0] || 'U'}</span>}
                        </div>
                        <span className="font-headline text-white text-base group-hover:underline">@{post.username || "user"}</span>
                    </Link>
                    <p className="text-white text-sm font-body line-clamp-3">{post.content}</p>
                    {post.song && (
                        <div className="flex items-center gap-2 text-white text-sm">
                            <FaMusic /> <span>{post.song.name} - {post.song.artists.join(", ")}</span>
                        </div>
                     )}
                </div>

                 {/* Right side actions */}
                <div className="flex flex-col gap-4 self-end pointer-events-auto">
                    <button onClick={toggleMute} className="p-2 bg-black/50 rounded-full text-white">
                        {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                    <PostActions post={post} isShortVibe={true} onCommentClick={() => setShowComments(true)} />
                </div>
            </div>
            
             <div className="hidden md:flex flex-col gap-4 absolute top-1/2 -translate-y-1/2 right-4">
                <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="p-3 bg-black/40 rounded-full text-white hover:bg-black/70">
                    <ChevronUp />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="p-3 bg-black/40 rounded-full text-white hover:bg-black/70">
                    <ChevronDown />
                </button>
            </div>
        </div>
    );
}
