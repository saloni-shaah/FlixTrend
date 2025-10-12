
"use client";
import React, { useRef, useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { OptimizedVideo } from './OptimizedVideo';
import { Play } from 'lucide-react';
import { useAppState } from '@/utils/AppStateContext';

export function ShortsPlayer({ post }: { post: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setIsScopeVideoPlaying } = useAppState();
    const [isInternallyPlaying, setIsInternallyPlaying] = useState(false);

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
        };
        const handlePause = () => {
            setIsInternallyPlaying(false);
            setIsScopeVideoPlaying(false);
        };
        
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            if (video) {
                observer.unobserve(video);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
            }
            // When component unmounts, assume video is not playing
            setIsScopeVideoPlaying(false);
        };
    }, [setIsScopeVideoPlaying]);

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
    
    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl.find(url => /\.(mp4|webm|ogg)$/i.test(url)) : post.mediaUrl;

    return (
        <div ref={containerRef} className="relative w-screen h-screen bg-black flex items-center justify-center">
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted // Muted by default for autoplay policies
                onClick={handleVideoClick}
            />
            
            <PostCard post={post} isShortVibe={true} />
            
            {!isInternallyPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Play size={64} className="text-white/70 drop-shadow-lg" />
                </div>
            )}
        </div>
    );
}
