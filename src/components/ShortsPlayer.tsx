
"use client";
import React, { useRef, useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import { OptimizedVideo } from './OptimizedVideo';

export function ShortsPlayer({ post }: { post: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log("Autoplay was prevented"));
                    setIsPlaying(true);
                } else {
                    video.pause();
                    video.currentTime = 0; // Reset video on scroll away
                    setIsPlaying(false);
                }
            },
            { threshold: 0.7 } // Start playing when 70% of the video is visible
        );

        observer.observe(video);

        return () => {
            if (video) {
                observer.unobserve(video);
            }
        };
    }, []);

    const handleVideoClick = () => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                video.play();
                setIsPlaying(true);
            } else {
                video.pause();
                setIsPlaying(false);
            }
        }
    };
    
    // The videoUrl is now guaranteed to be a single URL string for media posts.
    const videoUrl = post.mediaUrl;

    return (
        <div ref={containerRef} className="relative w-full h-full max-h-[85vh] max-w-sm rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <OptimizedVideo
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted // Muted by default for autoplay policies
                onClick={handleVideoClick}
            />
            {/* The PostCard here is used as an overlay for interactions */}
            <PostCard post={post} isShortVibe={true} />
        </div>
    );
}
