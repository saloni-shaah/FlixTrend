"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { Share, MessageCircle } from "lucide-react";
import { app } from '@/utils/firebaseClient';
import { ShareModal } from '../ShareModal';
import { SignalShareModal } from '../SignalShareModal';
import { cn } from "@/lib/utils";
import { ReactionButton } from './ReactionButton';

const db = getFirestore(app);

export function DropActions({ post, onCommentClick }: { post: any; onCommentClick: (e: React.MouseEvent) => void; }) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [showSignalShare, setShowSignalShare] = useState(false);
    const [shareCount, setShareCount] = useState(post.shareCount || 0);

    useEffect(() => {
        if (!post.id) return;
        const postRef = doc(db, "drops", post.id);
        const unsubPost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setShareCount(doc.data().shareCount || 0);
            }
        });
        return () => unsubPost();
    }, [post.id]);

    const handleCommentButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCommentClick(e);
    };

    const textClass = 'text-muted-foreground';
    const iconSize = 20;

    return (
        <>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border">
                <div className="flex items-center justify-start gap-6">
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-brand-gold')} onClick={handleCommentButtonClick}>
                        <MessageCircle size={iconSize} />
                        <span>{post.commentCount || 0}</span>
                    </button>
                    
                    <ReactionButton postId={post.id} collectionName="drops" />

                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-cyan')} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                        <Share size={iconSize} />
                        <span>{shareCount > 0 ? shareCount : ''}</span>
                    </button>
                </div>
            </div>
            {showShareModal && (
                <ShareModal 
                    url={`${window.location.origin}/drop/${post.id}`}
                    title={post.content}
                    isVideo={post.isVideo}
                    onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }}
                    onClose={() => setShowShareModal(false)}
                />
            )}
            {showSignalShare && (
                <SignalShareModal post={post} onClose={() => setShowSignalShare(false)} />
            )}
        </>
    );
}
