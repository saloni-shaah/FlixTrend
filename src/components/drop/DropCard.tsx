
"use client";

import React, { useState } from 'react';
import { Eye, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DropActions } from './DropActions';
import { CommentModal } from '../CommentModal';
import { ReactionSummary } from './ReactionSummary';
import { MediaViewer } from './MediaViewer';

const timeAgo = (timestamp: any): string => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) {
        return "Just now";
    }
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    const days = seconds / 86400;
    if (days < 2) return "Yesterday";
    if (days <= 7) return `${Math.floor(days)}d ago`;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
};

const MediaItem = ({ url, ...props }: { url: string, [key: string]: any }) => {
    const isVideo = (url: string) => {
        try {
            const pathname = new URL(url).pathname.toLowerCase();
            return pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.mov');
        } catch (error) {
            const lowercasedUrl = url.toLowerCase();
            return lowercasedUrl.includes('.mp4') || lowercasedUrl.includes('.webm') || lowercasedUrl.includes('.mov');
        }
    }

    return (
        <div {...props}>
            <div className="absolute inset-0 bg-black/40 rounded-lg overflow-hidden">
                {isVideo(url) ? (
                    <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                ) : (
                    <img src={url} alt="Drop media" className="w-full h-full object-cover" />
                )}
            </div>
        </div>
    );
};


export function DropCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const initials = post.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || post.username?.slice(0, 2).toUpperCase() || "U";
  const mediaUrls = Array.isArray(post.mediaUrl) ? post.mediaUrl : (post.mediaUrl ? [post.mediaUrl] : []);

  const renderMediaCollage = () => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    // Single item
    if (mediaUrls.length === 1) {
        return <div className="mt-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => { setSelectedIndex(0); setViewerOpen(true); }}><MediaItem url={mediaUrls[0]} className="relative pt-[100%]" /></div>;
    }

    // 2 items
    if (mediaUrls.length === 2) {
        return (
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(0); setViewerOpen(true); }}><MediaItem url={mediaUrls[0]} className="relative pt-[100%]" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(1); setViewerOpen(true); }}><MediaItem url={mediaUrls[1]} className="relative pt-[100%]" /></div>
            </div>
        );
    }

    // 3 items
    if (mediaUrls.length === 3) {
        return (
            <div className="mt-2 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-square">
                <div className="row-span-2 cursor-pointer" onClick={() => { setSelectedIndex(0); setViewerOpen(true); }}><MediaItem url={mediaUrls[0]} className="relative h-full" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(1); setViewerOpen(true); }}><MediaItem url={mediaUrls[1]} className="relative pt-[100%]" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(2); setViewerOpen(true); }}><MediaItem url={mediaUrls[2]} className="relative pt-[100%]" /></div>
            </div>
        );
    }

    // 4 items
    if (mediaUrls.length === 4) {
        return (
            <div className="mt-2 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-square">
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(0); setViewerOpen(true); }}><MediaItem url={mediaUrls[0]} className="relative pt-[100%]" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(1); setViewerOpen(true); }}><MediaItem url={mediaUrls[1]} className="relative pt-[100%]" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(2); setViewerOpen(true); }}><MediaItem url={mediaUrls[2]} className="relative pt-[100%]" /></div>
                <div className="cursor-pointer" onClick={() => { setSelectedIndex(3); setViewerOpen(true); }}><MediaItem url={mediaUrls[3]} className="relative pt-[100%]" /></div>
            </div>
        );
    }

    // 5+ items
    return (
        <div className="mt-2 grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-square">
            <div className="cursor-pointer" onClick={() => { setSelectedIndex(0); setViewerOpen(true); }}><MediaItem url={mediaUrls[0]} className="relative pt-[100%]" /></div>
            <div className='cursor-pointer' onClick={() => { setSelectedIndex(1); setViewerOpen(true); }}><MediaItem url={mediaUrls[1]} className="relative pt-[100%]" /></div>
            <div className='cursor-pointer' onClick={() => { setSelectedIndex(2); setViewerOpen(true); }}><MediaItem url={mediaUrls[2]} className="relative pt-[100%]" /></div>
            <div className="relative bg-black/50 cursor-pointer" onClick={() => { setSelectedIndex(3); setViewerOpen(true); }}>
                <MediaItem url={mediaUrls[3]} className="relative pt-[100%]" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <motion.div 
      className="glass-card p-5 flex flex-col gap-3 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
        <div className="flex items-center gap-3 mb-2">
            <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                    {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{initials}</span>}
                </div>
                <span className="font-headline text-accent-green text-sm group-hover:underline">@{post.username || "user"}</span>
            </Link>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span>{timeAgo(post.createdAt)}</span>
                <span className="flex items-center gap-1">
                    <Eye size={14} /> {viewCount.toLocaleString()}
                </span>
            </div>
        </div>

        <div className="text-xs text-accent-cyan font-bold mb-2 flex items-center gap-2 p-2 bg-accent-cyan/10 rounded-lg">
            <Sparkles size={16} />
            <span>DROP IN RESPONSE TO: "{post.promptText}"</span>
        </div>

        {post.content && (
             <div className={`whitespace-pre-line mb-2 px-4 py-3 rounded-xl text-[1.15rem] font-body`} style={{ backgroundColor: 'transparent', color: 'inherit' }}>
                {post.content}
            </div>
        )}

        {renderMediaCollage()}

        <div className="mt-3 mb-1">
            <ReactionSummary postId={post.id} collectionName="drops" />
        </div>

        <DropActions post={post} onCommentClick={() => setShowComments(true)} />
      
        {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} collectionName="drops" />}

        {viewerOpen && (
            <MediaViewer
                post={post}
                media={mediaUrls}
                initialIndex={selectedIndex}
                onClose={() => setViewerOpen(false)}
            />
        )}

    </motion.div>
  );
}
