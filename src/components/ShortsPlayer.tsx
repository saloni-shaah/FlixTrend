
"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OptimizedVideo } from './OptimizedVideo';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostActions } from './PostActions';
import Link from 'next/link';
import { FaMusic } from 'react-icons/fa';

const db = getFirestore(app);

export function ShortsPlayer({ post }: { post: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsScopeVideoPlaying } = useAppState();
    const [isPlaying, setIsPlaying] = useState(false);
    // Start unmuted by default as requested
    const [isMuted, setIsMuted] = useState(false); 
    const [showComments, setShowComments] = useState(false);
    const viewCountedRef = useRef(false);
    const lastTap = useRef(0);

    const incrementViewCount = useCallback(() => {
        if (viewCountedRef.current || !post.id) return;
        viewCountedRef.current = true;
        const postRef = doc(db, 'posts', post.id);
        updateDoc(postRef, {
            viewCount: increment(1)
        }).catch(error => console.error("Error incrementing view count:", error));
    }, [post.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Try to play unmuted first, if it fails, mute and try again
        video.play().catch(error => {
            if (error.name === "NotAllowedError") {
                console.log("Autoplay with sound was prevented by the browser. Setting to muted.");
                setIsMuted(true);
                video.muted = true;
                video.play();
            }
        });

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log("Autoplay was prevented. User must interact first."));
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            },
            { threshold: 0.7 }
        );

        observer.observe(video);
        
        const handlePlay = () => {
            setIsPlaying(true);
            setIsScopeVideoPlaying(true);
            incrementViewCount();
        };
        const handlePause = () => {
            setIsPlaying(false);
            setIsScopeVideoPlaying(false);
        };
        
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        const handleVolumeChange = () => setIsMuted(video.muted);
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

    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // This is a double tap, you can add a like animation here if desired
        } else {
           const video = videoRef.current;
            if (video) {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            }
        }
        lastTap.current = now;
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
        <div ref={containerRef} className="relative w-screen h-screen bg-black flex items-center justify-center" onClick={handleVideoClick}>
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted} // Controlled by state
                autoPlay
            />
            
            {/* Overlay for UI elements */}
            <div className="absolute inset-0 w-full h-full p-4 pr-8 flex items-end justify-between pointer-events-none">
                {/* Main content on the left */}
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

                {/* Vertical action buttons on the right */}
                <div className="flex flex-col gap-4 self-end pointer-events-auto">
                    <button onClick={toggleMute} className="p-2 bg-black/50 rounded-full text-white">
                        {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                    <PostActions post={post} isShortVibe={true} onCommentClick={() => setShowComments(true)} />
                </div>
            </div>

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Play size={64} className="text-white/70 drop-shadow-lg" />
                </div>
            )}
        </div>
    );
}
