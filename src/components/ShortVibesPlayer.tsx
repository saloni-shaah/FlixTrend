
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Share, Play } from 'lucide-react';
import Link from 'next/link';
import { ShareModal } from './ShareModal';

function LikeCommentShare({ post, onCommentClick, onShareClick }: { post: any; onCommentClick: () => void; onShareClick: () => void; }) {
  const [liked, setLiked] = useState(false);
  // These would ideally come from live data, but for now we use post props
  const [likeCount, setLikeCount] = useState(post.starCount || 0);
  
  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button 
        className={`flex flex-col items-center gap-1 text-lg font-bold transition-all ${liked ? "text-yellow-400" : "text-white hover:text-yellow-300"}`} 
        onClick={handleLike} 
        aria-label="Like"
      >
        <Star fill={liked ? 'currentColor' : 'none'} size={32} /> 
        <span className="text-sm font-semibold">{likeCount}</span>
      </button>
      <button onClick={onCommentClick} className="flex flex-col items-center gap-1 text-lg font-bold text-white hover:text-accent-cyan transition-all" aria-label="Comment">
        <MessageCircle size={32} /> 
        <span className="text-sm font-semibold">{post.commentCount || 0}</span>
      </button>
       <button onClick={onShareClick} className="flex flex-col items-center gap-1 text-lg font-bold text-white hover:text-accent-green transition-all" aria-label="Share">
        <Share size={32} />
      </button>
    </div>
  );
}


export function ShortVibesPlayer({ shortVibes }: { shortVibes: any[] }) {
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

    useEffect(() => {
        // Ensure the active video plays when the index changes
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeShortIndex) {
                    video.play().catch(() => {}); // Autoplay might be blocked
                    setIsPlaying(true);
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, [activeShortIndex, shortVibes]);

    const handleVideoClick = (index: number) => {
        const video = videoRefs.current[index];
        if (video) {
            if (video.paused) {
                video.play().catch(() => {});
                setIsPlaying(true);
            } else {
                video.pause();
                setIsPlaying(false);
            }
        }
    };

    const handleCommentClick = () => {
        alert("Commenting feature is coming soon!");
    }
    
    const handleShareClick = () => {
        setSelectedPostForShare(shortVibes[activeShortIndex]);
        setShowShareModal(true);
    }

    const scrollUp = () => {
        setActiveShortIndex(i => Math.max(0, i - 1));
    };
    
    const scrollDown = () => {
        setActiveShortIndex(i => Math.min(shortVibes.length - 1, i + 1));
    };

    return (
        <>
        <div className="w-full h-full flex flex-col items-center relative glass-card overflow-hidden bg-black">
            {shortVibes.length === 0 ? (
                <div className="text-gray-400 text-center m-auto">
                    <div className="text-6xl mb-2">🎬</div>
                    <div className="text-lg font-semibold">No Short Vibes Yet</div>
                    <p className="text-sm">Be the first to create one!</p>
                </div>
            ) : (
                shortVibes.map((short, idx) => (
                    <div
                        key={short.id || idx}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ 
                            pointerEvents: idx === activeShortIndex ? "auto" : "none",
                            zIndex: shortVibes.length - Math.abs(activeShortIndex - idx),
                            opacity: idx === activeShortIndex ? 1 : 0,
                            transition: 'opacity 0.3s ease-in-out',
                        }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={() => handleVideoClick(idx)}>
                            <video
                                ref={el => { videoRefs.current[idx] = el; }}
                                src={short.mediaUrl}
                                className="w-full h-full object-contain pointer-events-none" // Use object-contain and disable pointer events on video
                                autoPlay={idx === 0}
                                loop
                                playsInline
                            />
                            {!isPlaying && activeShortIndex === idx && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                    <Play size={64} className="text-white/70" />
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end pointer-events-none">
                                <div className="flex flex-col gap-2 max-w-[70%]">
                                    <Link href={`/squad/${short.userId}`} className="flex items-center gap-2 group pointer-events-auto">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-base overflow-hidden border-2 border-accent-pink group-hover:scale-110 transition-transform">
                                            {short.avatar_url ? <img src={short.avatar_url} alt="avatar" className="w-full h--full object-cover"/> : short.displayName?.[0] || 'U'}
                                        </div>
                                        <span className="font-headline text-accent-cyan text-sm font-bold group-hover:underline">@{short.username || "user"}</span>
                                    </Link>
                                    <p className="text-white text-base font-body line-clamp-2 text-left" style={{ textShadow: "0 1px 4px #000" }}>
                                        {short.content || short.caption}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4 pointer-events-auto">
                                    <LikeCommentShare post={short} onCommentClick={handleCommentClick} onShareClick={handleShareClick} />
                                </div>
                            </div>
                        </div>
                    </div>
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
        {showShareModal && selectedPostForShare && (
            <ShareModal 
                url={`${window.location.origin}/post/${selectedPostForShare.id}`}
                onClose={() => setShowShareModal(false)}
            />
        )}
        </>
    );
}
