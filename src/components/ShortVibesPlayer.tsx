"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MoreVertical, Play, Pause } from 'lucide-react';
import Link from 'next/link';

function LikeCommentMore({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  // These would ideally come from live data, but for now we use post props
  const [likeCount, setLikeCount] = useState(post.starCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  
  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button 
        className={`flex flex-col items-center gap-1 text-lg font-bold transition-all ${liked ? "text-red-500" : "text-white hover:text-red-400"}`} 
        onClick={handleLike} 
        aria-label="Like"
      >
        <Heart fill={liked ? 'currentColor' : 'none'} size={32} /> 
        <span className="text-sm font-semibold">{likeCount}</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-lg font-bold text-white hover:text-accent-cyan transition-all" aria-label="Comment">
        <MessageCircle size={32} /> 
        <span className="text-sm font-semibold">{commentCount}</span>
      </button>
    </div>
  );
}


export function ShortVibesPlayer({ shortVibes }: { shortVibes: any[] }) {
    const router = useRouter();
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    useEffect(() => {
        // Ensure the active video plays when the index changes
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeShortIndex) {
                    video.play();
                    setIsPlaying(true);
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, [activeShortIndex]);

    const handleVideoClick = (index: number) => {
        const video = videoRefs.current[index];
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

    const scrollUp = () => {
        setActiveShortIndex(i => Math.max(0, i - 1));
    };
    
    const scrollDown = () => {
        setActiveShortIndex(i => Math.min(shortVibes.length - 1, i + 1));
    };

    return (
        <div className="w-full flex flex-col items-center py-4 h-[calc(100vh-8rem)]">
            <h2 className="text-2xl font-headline text-accent-cyan mb-4 font-bold">Short Vibes</h2>
            <div className="w-full max-w-xs sm:max-w-sm h-full flex flex-col items-center relative glass-card overflow-hidden">
                {shortVibes.length === 0 ? (
                    <div className="text-gray-400 text-center m-auto">
                        <div className="text-6xl mb-2">🎬</div>
                        <div className="text-lg font-semibold">No Short Vibes Yet</div>
                        <p className="text-sm">Be the first to create one!</p>
                    </div>
                ) : (
                    shortVibes.map((short, idx) => (
                        <motion.div
                            key={short.id}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ 
                                pointerEvents: idx === activeShortIndex ? "auto" : "none",
                                zIndex: shortVibes.length - Math.abs(activeShortIndex - idx),
                            }}
                            initial={{ y: (idx > activeShortIndex ? '100%' : '-100%'), opacity: 0, scale: 0.8 }}
                            animate={{ 
                                y: 0, 
                                opacity: idx === activeShortIndex ? 1 : 0,
                                scale: 1,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    ref={el => { videoRefs.current[idx] = el; }}
                                    src={short.mediaUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay={idx === 0}
                                    loop
                                    muted
                                    playsInline
                                    onClick={() => handleVideoClick(idx)}
                                />
                                {!isPlaying && activeShortIndex === idx && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                        <Play size={64} className="text-white/70" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end">
                                    <div className="flex flex-col gap-2 max-w-[70%]">
                                        <Link href={`/squad/${short.userId}`} className="flex items-center gap-2 cursor-pointer group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-base overflow-hidden border-2 border-accent-pink group-hover:scale-110 transition-transform">
                                                {short.avatar_url ? <img src={short.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : short.displayName?.[0] || 'U'}
                                            </div>
                                            <span className="font-headline text-accent-cyan text-sm font-bold group-hover:underline">@{short.username || "user"}</span>
                                        </Link>
                                        <p className="text-white text-base font-body line-clamp-2 text-left" style={{ textShadow: "0 1px 4px #000" }}>
                                            {short.content || short.caption}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <LikeCommentMore post={short} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
                {/* Scroll buttons */}
                {activeShortIndex > 0 && (
                  <button className="absolute top-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollUp}>&uarr;</button>
                )}
                {activeShortIndex < shortVibes.length - 1 && (
                  <button className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 btn-glass-icon w-24 h-10" onClick={scrollDown}>&darr;</button>
                )}
            </div>
        </div>
    );
}
