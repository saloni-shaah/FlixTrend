'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, runTransaction, serverTimestamp, arrayUnion, arrayRemove, writeBatch, getDoc, FieldValue } from "firebase/firestore";
import { Star, Share, MessageCircle, ListPlus } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUserLikes } from '@/context/UserLikesContext';

const db = getFirestore(app);

export function PostActions({ post, onCommentClick, isShortVibe = false }: { post: any; onCommentClick: (e: React.MouseEvent) => void; isShortVibe?: boolean }) {
    const [likes, setLikes] = React.useState(post.likesCount || 0);
    const { likedPosts: currentYearLikes, loading: likesLoading } = useUserLikes();
    const [isLiked, setIsLiked] = useState(false);
    const [isLoadingLike, setIsLoadingLike] = useState(true);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showSignalShare, setShowSignalShare] = React.useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
    const [shareCount, setShareCount] = React.useState(post.shareCount || 0);
    const currentUser = auth.currentUser;

    const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
    const postYear = postDate.getFullYear();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        if (!currentUser || likesLoading) {
            setIsLoadingLike(true);
            return;
        }

        setIsLoadingLike(true);

        const checkLikeStatus = async () => {
            if (postYear === currentYear) {
                setIsLiked(currentYearLikes.includes(post.id));
                setIsLoadingLike(false);
            } else {
                const yearlyLikesDocRef = doc(db, 'users', currentUser.uid, 'likedPosts', postYear.toString());
                try {
                    const docSnap = await getDoc(yearlyLikesDocRef);
                    setIsLiked(docSnap.exists() && docSnap.data().postIds?.includes(post.id));
                } catch (error) {
                    console.error(`Error fetching like status for year ${postYear}:`, error);
                    setIsLiked(false);
                }
                setIsLoadingLike(false);
            }
        };

        checkLikeStatus();

    }, [post.id, currentUser, currentYearLikes, likesLoading, postYear, currentYear]);

    React.useEffect(() => {
        if (!post.id) return;

        const postRef = doc(db, "posts", post.id);
        const unsubPost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setLikes(doc.data().likesCount || 0);
            }
        });

        return () => {
            unsubPost();
        };
    }, [post.id]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        const optimisticLikeState = !isLiked;
        setIsLiked(optimisticLikeState);
        setLikes(likes + (optimisticLikeState ? 1 : -1));

        try {
            const batch = writeBatch(db);
            const postLikeRef = doc(db, "posts", post.id, 'likes', currentUser.uid);
            const yearlyLikesDocRef = doc(db, 'users', currentUser.uid, 'likedPosts', postYear.toString());

            if (optimisticLikeState) {
                batch.set(postLikeRef, { userId: currentUser.uid, createdAt: serverTimestamp() });
                batch.set(yearlyLikesDocRef, { postIds: arrayUnion(post.id) }, { merge: true });
            } else {
                batch.delete(postLikeRef);
                batch.update(yearlyLikesDocRef, { postIds: arrayRemove(post.id) });
            }

            await batch.commit();

        } catch (error) {
            console.error('Error updating like status:', error);
            setIsLiked(!optimisticLikeState);
            setLikes(likes); 
        }
    };

    const handleCommentButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCommentClick(e);
    }

    const textClass = isShortVibe ? 'text-white' : 'text-muted-foreground';
    const iconSize = isShortVibe ? 30 : 20;

    if (isShortVibe) {
        return (
            <>
                <div className='flex flex-col items-center gap-5'>
                    <button className={cn('flex flex-col items-center gap-1.5 font-bold text-white transition-all', 'hover:text-brand-gold')} onClick={handleCommentButtonClick}>
                        <MessageCircle size={iconSize} />
                        <span className="text-sm font-semibold">{post.commentCount || 0}</span>
                    </button>
                    <button data-like-button="true" disabled={isLoadingLike} className={cn('flex flex-col items-center gap-1.5 font-bold transition-all', isLiked ? 'text-yellow-400' : 'text-white', 'hover:text-yellow-400')} onClick={handleLike}>
                        <Star size={iconSize} fill={isLiked ? "currentColor" : "none"} />
                         <span className="text-sm font-semibold">{likes}</span>
                    </button>
                    <button className={cn('flex flex-col items-center font-bold text-white transition-all', 'hover:text-accent-cyan')} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                        <Share size={iconSize} />
                    </button>
                </div>
                {showShareModal && <ShareModal url={`${window.location.origin}/post/${post.id}`} title={post.content} isVideo={post.isVideo} onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }} onClose={() => setShowShareModal(false)} />}
                {showSignalShare && <SignalShareModal post={post} onClose={() => setShowSignalShare(false)} />}
            </>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border">
                <div className="flex items-center justify-start gap-6">
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-brand-gold')} onClick={handleCommentButtonClick}>
                        <MessageCircle size={iconSize} />
                        <span>{post.commentCount || 0}</span>
                    </button>
                    <button data-like-button="true" disabled={isLoadingLike} className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', isLiked ? 'text-yellow-400' : textClass, 'hover:text-yellow-400')} onClick={handleLike}>
                        <Star size={iconSize} fill={isLiked ? "currentColor" : "none"} />
                         <span>{likes}</span>
                    </button>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-cyan')} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                        <Share size={iconSize} />
                        <span>{shareCount > 0 ? shareCount : ''}</span>
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-purple')} onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}>
                        <ListPlus size={20} />
                    </button>
                </div>
            </div>
            {showShareModal && (
                <ShareModal 
                    url={`${window.location.origin}/post/${post.id}`}
                    title={post.content}
                    isVideo={post.type === 'media' && post.mediaUrl && (Array.isArray(post.mediaUrl) ? post.mediaUrl.some((url: string) => url.includes('.mp4')) : post.mediaUrl.includes('.mp4'))}
                    onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }}
                    onClose={() => setShowShareModal(false)}
                />
            )}
             {showSignalShare && (
                <SignalShareModal post={post} onClose={() => setShowSignalShare(false)} />
             )}
             {showPlaylistModal && (
                <AddToPlaylistModal post={post} onClose={() => setShowPlaylistModal(false)} />
             )}
        </>
    );
}
