"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MoreVertical } from 'lucide-react';

function LikeCommentMore({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.starCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  
  React.useEffect(() => {
    setLikeCount(post.starCount || 0);
    setCommentCount(post.commentCount || 0);
  }, [post.starCount, post.commentCount]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button className={`flex flex-col items-center gap-1 text-lg font-bold transition-all ${liked ? "text-red-500" : "text-white hover:text-red-400"}`} onClick={() => setLiked(l => !l)} aria-label="Like">
        <Heart /> <span className="text-sm">{likeCount}</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-lg font-bold text-white hover:text-accent-cyan transition-all" aria-label="Comment">
        <MessageCircle /> <span className="text-sm">{commentCount}</span>
      </button>
      <div className="relative">
        <button className="flex items-center text-white hover:text-accent-cyan" onClick={() => setShowMenu(m => !m)} aria-label="More">
          <MoreVertical />
        </button>
        {showMenu && (
          <div className="absolute right-0 bottom-full mb-2 w-32 glass-card p-1 z-50">
            <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-white/10 rounded-lg" onClick={() => { setShowMenu(false); alert('Reported!'); }}>Report</button>
            <button className="w-full px-4 py-2 text-left hover:bg-white/10 rounded-lg" onClick={() => setShowMenu(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}


export function ShortVibesPlayer({ shortVibes }: { shortVibes: any[] }) {
    const router = useRouter();
    const [activeShortIndex, setActiveShortIndex] = useState(0);
    const videoRefs = useRef<any[]>([]);

    const handleVideoClick = (index: number) => {
        const video = videoRefs.current[index];
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    };

    return (
        <div className="w-full flex flex-col items-center py-8 min-h-[80vh]">
            <h2 className="text-2xl font-headline text-accent-cyan mb-4">🎥 Short Vibes</h2>
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-center relative" style={{ height: '70vh' }}>
                {shortVibes.length === 0 ? (
                <div className="text-gray-400 text-center mt-16">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="text-lg font-semibold">No shorts yet</div>
                </div>
                ) : (
                shortVibes.map((short, idx) => (
                    <motion.div
                    key={short.id}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ pointerEvents: idx === activeShortIndex ? "auto" : "none" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: idx === activeShortIndex ? 1 : 0, y: idx === activeShortIndex ? 0 : 20 }}
                    transition={{ duration: 0.3 }}
                    >
                    <div className="relative w-full h-full flex flex-col items-center justify-end">
                        <video
                        ref={el => { videoRefs.current[idx] = el || undefined; }}
                        src={short.mediaUrl}
                        className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-accent-cyan/50"
                        autoPlay={idx === 0}
                        loop
                        muted
                        playsInline
                        onClick={() => handleVideoClick(idx)}
                        style={{ maxHeight: "70vh" }}
                        />
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-b-2xl flex justify-between items-end">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/squad/${short.userId}`)}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-base overflow-hidden">
                                {short.avatar_url ? <img src={short.avatar_url} alt="avatar"/> : short.displayName?.[0] || 'U'}
                            </div>
                            <span className="font-headline text-accent-cyan text-sm">@{short.username || "user"}</span>
                            </div>
                            <p className="text-white text-base font-body line-clamp-2" style={{ textShadow: "0 2px 8px #000" }}>{short.content || short.caption}</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <LikeCommentMore post={short} />
                        </div>
                        </div>
                    </div>
                    {/* Scroll buttons */}
                    <button className="absolute top-1/2 -translate-y-1/2 -left-12 btn-glass-icon" onClick={() => setActiveShortIndex(i => Math.max(0, i-1))} disabled={idx === 0}>&uarr;</button>
                    <button className="absolute top-1/2 -translate-y-1/2 -right-12 btn-glass-icon" onClick={() => setActiveShortIndex(i => Math.min(shortVibes.length - 1, i+1))} disabled={idx === shortVibes.length - 1}>&darr;</button>
                    </motion.div>
                ))
                )}
            </div>
        </div>
    );
}
