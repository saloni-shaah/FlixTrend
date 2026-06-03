
"use client";

import React from 'react';
import { X, Heart, Eye, Calendar, Clock } from 'lucide-react';

const formatDate = (timestamp: any): string => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) {
        return "";
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const VideoDescription = ({ post, onClose, isOpen, isOverlay }: { post: any, onClose: () => void, isOpen: boolean, isOverlay: boolean }) => {
    if (!isOpen) return null;

    const formatDuration = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const content = (
        <div className="relative w-full h-full bg-black rounded-xl p-4 md:p-6 overflow-y-auto text-white">
             <button onClick={onClose} className="absolute top-2 right-2 text-white/60 hover:text-white">
                <X size={20} />
            </button>
            <h2 className="text-lg md:text-2xl font-bold mb-4 text-white pr-8">Details</h2>

            {post.content && <h3 className="text-base md:text-xl font-semibold mb-2 text-white line-break">{post.content}</h3>}
            {post.description && <p className="text-white/80 mb-3 text-xs md:text-sm">{post.description}</p>}

            {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
                    {post.hashtags.map((tag: string) => (
                        <span key={tag} className="text-accent-cyan text-xs md:text-sm hover:underline cursor-pointer">#{tag}</span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-white/80 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                    <Heart size={14} />
                    <span className="text-xs md:text-sm">{post.likesCount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Eye size={14} />
                    <span className="text-xs md:text-sm">{post.viewCount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-xs md:text-sm">{formatDate(post.createdAt)}</span>
                </div>
                {post.duration && (
                     <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span className="text-xs md:text-sm">{formatDuration(post.duration)}</span>
                    </div>
                )}
            </div>
        </div>
    )

    if (isOverlay) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="relative w-[90%] max-w-lg bg-white/10 rounded-xl" onClick={(e) => e.stopPropagation()}>
                   {content}
                </div>
            </div>
        );
    }

    return content;
};
