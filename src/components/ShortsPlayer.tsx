
"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PostCard } from './PostCard';
import { OptimizedVideo } from './OptimizedVideo';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);

export function ShortsPlayer({ post }: { post: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsScopeVideoPlaying } = useAppState();
    const [isInternallyPlaying, setIsInternallyPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const viewCountedRef = useRef(false);

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
            setIsInternallyPlaying(true);
            setIsScopeVideoPlaying(true);
            incrementViewCount();
        };
        const handlePause = () => {
            setIsInternallyPlaying(false);
            setIsScopeVideoPlaying(false);
        };
        
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        // Sync local mute state with video's actual muted property
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
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            video.muted = !video.muted;
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
                muted // Start muted for autoplay
            />
            
            <PostCard post={post} isShortVibe={true} />
            
            <div className="absolute top-4 right-4 z-20">
                <button onClick={toggleMute} className="p-2 bg-black/50 rounded-full text-white">
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </button>
            </div>

            {!isInternallyPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Play size={64} className="text-white/70 drop-shadow-lg" />
                </div>
            )}
        </div>
    );
}
