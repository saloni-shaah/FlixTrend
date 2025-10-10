"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { PostCard } from '../PostCard';
import { OptimizedVideo } from '../OptimizedVideo';

export function PlayerModal({ post, onClose }: { post: any; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(true);

    const handleVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };
    
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

    const videoUrl = Array.isArray(post.mediaUrl) ? post.mediaUrl.find(url => url.includes('.mp4')) : post.mediaUrl;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/90 flex flex-col items-center justify-center"
                onClick={onClose}
            >
                 <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 text-white bg-black/50 rounded-full">
                    <X size={24} />
                </button>
                <div className="w-full max-w-3xl h-full flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                    <div className="relative w-full aspect-video" onClick={handleVideoClick}>
                        {videoUrl && (
                             <OptimizedVideo 
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full h-full object-contain" 
                                autoPlay
                                controls={false} // Hide default controls
                            />
                        )}
                        {!isPlaying && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                                <Play size={64} className="text-white/80" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
