
"use client";

import React from 'react';
import { getFirestore } from "firebase/firestore";
import { Repeat2, Star, Share, MessageCircle, Bookmark } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShareModal } from './ShareModal';
import { app } from '@/utils/firebaseClient';
import { OptimizedImage } from './OptimizedImage';
import { FlixTrendLogo } from './FlixTrendLogo';
import { FaMusic, FaPlay } from "react-icons/fa";
import { OptimizedVideo } from './OptimizedVideo';
import { PlayerModal } from './video/PlayerModal';


const db = getFirestore(app);

const Watermark = ({ isAnimated = false }: { isAnimated?: boolean }) => (
    <div
      className={`absolute flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10 ${
        isAnimated ? 'animate-[float-watermark_10s_ease-in-out_infinite]' : 'bottom-2 right-2'
      }`}
    >
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);


export function GuestPostCard({ post }: { post: any }) {
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);
  const [showPlayer, setShowPlayer] = React.useState(false);

  const handleInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLoginPrompt(true);
  };
  
  const handlePlayVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPlayer(true);
  };


  const LoginPrompt = () => (
    <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowLoginPrompt(false)}>
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 w-full max-w-sm text-center flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}
        >
            <h3 className="text-2xl font-headline font-bold text-accent-cyan">Join the Conversation!</h3>
            <p className="text-gray-300">You need to be logged in to like, comment, or share posts.</p>
            <div className="flex gap-4 mt-4">
                <Link href="/login" className="btn-glass bg-accent-cyan text-black">Log In</Link>
                <Link href="/signup" className="btn-glass bg-accent-pink text-white">Sign Up</Link>
            </div>
        </motion.div>
    </div>
  );


  const renderPostContent = (p: any) => {
    const contentPost = p.type === 'relay' ? p.originalPost : p;
    const initials = contentPost.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || contentPost.username?.slice(0, 2).toUpperCase() || "U";
    
    return (
        <>
            {showPlayer && contentPost.type === 'media' && <PlayerModal post={contentPost} onClose={() => setShowPlayer(false)} />}
            <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleInteraction}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                        {contentPost.avatar_url ? <img src={contentPost.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{initials}</span>}
                    </div>
                    <span className="font-headline text-accent-green text-sm group-hover:underline">@{contentPost.username || "user"}</span>
                </div>
                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{contentPost.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</span>
                </div>
            </div>

            {contentPost.content && (
                <div className={'whitespace-pre-line mb-2 px-4 py-3 rounded-xl text-[1.15rem] font-body'} style={{ backgroundColor: contentPost.backgroundColor ? contentPost.backgroundColor : 'transparent', color: contentPost.backgroundColor && contentPost.backgroundColor !== '#ffffff' ? 'hsl(var(--foreground))' : 'inherit' }}>
                    {contentPost.content}
                </div>
            )}

            {contentPost.hashtags && contentPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {contentPost.hashtags.map((tag: string) => <span key={tag} className="text-brand-gold font-bold text-sm">#{tag}</span>)}
                </div>
            )}

            {contentPost.type === "media" && contentPost.mediaUrl && (
                 <div className="w-full rounded-xl overflow-hidden mt-2 relative">
                     {(() => {
                        const mediaUrls = Array.isArray(contentPost.mediaUrl) ? contentPost.mediaUrl : [contentPost.mediaUrl];
                        
                        if (mediaUrls.length === 1) {
                            const url = mediaUrls[0];
                            const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
                            if (isVideo) {
                                return (
                                    <div 
                                        className="relative group w-full cursor-pointer bg-black flex items-center justify-center" 
                                        onClick={handlePlayVideo}
                                        style={{
                                            aspectRatio: post.isPortrait ? '9 / 16' : '16 / 9',
                                            maxHeight: '70vh',
                                        }}
                                    >
                                        <OptimizedVideo src={url} className="w-full h-full object-contain" preload="metadata" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <FaPlay className="text-white text-5xl" />
                                        </div>
                                        <Watermark isAnimated={true} />
                                    </div>
                                );
                            }
                            return (
                                <div className="relative">
                                    <OptimizedImage src={url} alt="media" className="w-full rounded-xl" />
                                    <Watermark isAnimated={true} />
                                </div>
                            );
                        }
                        
                        return (
                            <div className="grid grid-cols-2 gap-1">
                                {mediaUrls.slice(0, 4).map((url: string, index: number) => {
                                    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
                                    return (
                                        <div key={index} className="relative aspect-square">
                                            {isVideo ? <video src={url} controls className="w-full h-full object-cover" /> : <OptimizedImage src={url} alt="media" className="w-full h-full object-cover" />}
                                            <Watermark isAnimated={isVideo} />
                                            {index === 3 && mediaUrls.length > 4 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    })()}
                </div>
            )}

            {contentPost.song && (
                 <div className="mt-2 p-3 rounded-xl bg-black/20 flex items-center gap-4 border border-glass-border">
                    <img src={contentPost.song.albumArt} alt={contentPost.song.album} className="w-12 h-12 rounded-lg"/>
                    <div className="flex-1">
                        <div className="font-bold text-brand-gold text-base line-clamp-1">{contentPost.song.name}</div>
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{contentPost.song.artists.join(", ")}</div>
                    </div>
                </div>
            )}
        </>
    )
  }
  
  const ActionButtons = () => (
    <div className={`flex items-center justify-between mt-2 pt-2 border-t border-glass-border`}>
        <div className={'flex items-center justify-start gap-6'}>
          <button className={`flex items-center gap-1.5 font-bold transition-all text-lg text-muted-foreground hover:text-brand-gold`} onClick={handleInteraction}>
            <MessageCircle size={20} />
          </button>
          <button className={`flex items-center gap-1.5 font-bold transition-all text-lg text-muted-foreground hover:text-green-400`} onClick={handleInteraction} >
            <Repeat2 size={20} />
          </button>
          <button className={`flex items-center gap-1.5 font-bold transition-all text-lg text-muted-foreground hover:text-yellow-400`} onClick={handleInteraction}>
            <Star size={20} fill={"none"} />
          </button>
          <button className={`flex items-center gap-1.5 font-bold transition-all text-lg text-muted-foreground hover:text-accent-cyan`} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
            <Share size={20} />
          </button>
        </div>
        <button className={`flex items-center gap-1.5 font-bold transition-all text-lg text-muted-foreground hover:text-accent-purple`} onClick={handleInteraction}>
            <Bookmark size={20} fill={"none"}/>
        </button>
    </div>
  );

  return (
    <motion.div 
      className="glass-card p-5 flex flex-col gap-3 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {post.type === 'relay' && (
          <div className="text-xs text-muted-foreground font-bold mb-2 flex items-center gap-2">
              <Repeat2 size={14}/> Relayed by <span className="text-accent-cyan">@{post.username}</span>
          </div>
      )}

      {renderPostContent(post)}
      <ActionButtons />
      
      {showShareModal && (
        <ShareModal 
            url={`${window.location.origin}/post/${post.id}`}
            title={post.content}
            isVideo={post.type === 'media'}
            onSignalShare={() => { setShowShareModal(false); setShowLoginPrompt(true); }}
            onClose={() => setShowShareModal(false)}
        />
      )}
      {showLoginPrompt && <LoginPrompt />}
    </motion.div>
  );
}
