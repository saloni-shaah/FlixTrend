'use client';
import React, { useState, useEffect } from 'react';
import { getFirestore, onSnapshot, doc, serverTimestamp, arrayUnion, arrayRemove, writeBatch, getDoc, increment } from "firebase/firestore";
import { Star, Share2, MessageCircle, ListPlus, Repeat2, X } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUserLikes } from '@/context/UserLikesContext';

const db = getFirestore(app);

const relayFallbackLines = [
    "Lowkey needed this on the timeline.",
    "This one deserves a little extra reach.",
    "Had to pass this along.",
    "Putting the squad onto this.",
    "No notes, just vibes."
];

export function PostActions({ post, onCommentClick, isShortVibe = false, collectionName = 'posts' }: { post: any; onCommentClick: (e: React.MouseEvent) => void; isShortVibe?: boolean; collectionName?: string }) {
    const [likes, setLikes] = React.useState(post.likesCount || 0);
    const { likedPosts: currentYearLikes, loading: likesLoading } = useUserLikes();
    const [isLiked, setIsLiked] = useState(false);
    const [isLoadingLike, setIsLoadingLike] = useState(true);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showSignalShare, setShowSignalShare] = React.useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
    const [showRelayModal, setShowRelayModal] = React.useState(false);
    const [relayOpinion, setRelayOpinion] = React.useState('');
    const [isRelaying, setIsRelaying] = React.useState(false);
    const [relayCount, setRelayCount] = React.useState(post.relayCount || 0);
    const [shareCount, setShareCount] = React.useState(post.shareCount || 0);
    const currentUser = auth.currentUser;
    const originalPostId = post.type === 'relay' && post.originalPostId ? post.originalPostId : post.id;

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

    React.useEffect(() => {
        if (!originalPostId || collectionName !== 'posts') return;

        const originalPostRef = doc(db, 'posts', originalPostId);
        const unsubscribe = onSnapshot(originalPostRef, (snapshot) => {
            if (snapshot.exists()) {
                setRelayCount(snapshot.data().relayCount || 0);
            }
        }, (error) => {
            console.error('Error listening to relay count:', error);
        });

        return () => unsubscribe();
    }, [originalPostId, collectionName]);

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

    const handleRelayButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser || collectionName !== 'posts') return;
        setShowRelayModal(true);
    };

    const handleRelay = async () => {
        if (!currentUser || isRelaying || !originalPostId || collectionName !== 'posts') return;

        setIsRelaying(true);

        try {
            const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            const opinion = relayOpinion.trim() || relayFallbackLines[Math.floor(Math.random() * relayFallbackLines.length)];

            const batch = writeBatch(db);
            const relayRef = doc(db, 'posts', `${currentUser.uid}_${originalPostId}`);
            const originalPostRef = doc(db, 'posts', originalPostId);
            const existingRelay = await getDoc(relayRef);

            if (existingRelay.exists()) {
                alert('You already relayed this post.');
                setShowRelayModal(false);
                return;
            }

            batch.set(relayRef, {
                userId: currentUser.uid,
                displayName: userData.name || currentUser.displayName || 'FlixTrend User',
                username: userData.username || currentUser.displayName || currentUser.uid,
                avatar_url: userData.avatar_url || currentUser.photoURL || null,
                type: 'relay',
                content: opinion,
                originalPostId,
                originalAuthorId: post.type === 'relay' ? post.originalAuthorId || post.userId : post.userId,
                originalType: post.type === 'relay' ? post.originalType || null : post.type || null,
                createdAt: serverTimestamp(),
                publishAt: serverTimestamp(),
                viewCount: 0,
                commentCount: 0,
                likesCount: 0,
                shareCount: 0,
            });
            batch.update(originalPostRef, { relayCount: increment(1) });

            await batch.commit();

            setRelayOpinion('');
            setShowRelayModal(false);
        } catch (error) {
            console.error('Error creating relay:', error);
            alert('Could not relay this post. Please try again.');
        } finally {
            setIsRelaying(false);
        }
    };

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
                        <Share2 size={iconSize} />
                    </button>
                    <button className={cn('flex flex-col items-center gap-1.5 font-bold text-white transition-all', 'hover:text-green-400')} onClick={handleRelayButtonClick}>
                        <Repeat2 size={iconSize} />
                        <span className="text-sm font-semibold">{relayCount > 0 ? relayCount : ''}</span>
                    </button>
                </div>
                {showRelayModal && (
                    <RelayModal
                        value={relayOpinion}
                        onChange={setRelayOpinion}
                        onClose={() => setShowRelayModal(false)}
                        onRelay={handleRelay}
                        isRelaying={isRelaying}
                    />
                )}
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
                        <Share2 size={iconSize} />
                        <span>{shareCount > 0 ? shareCount : ''}</span>
                    </button>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-green-400')} onClick={handleRelayButtonClick}>
                        <Repeat2 size={iconSize} />
                        <span>{relayCount > 0 ? relayCount : ''}</span>
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
             {showRelayModal && (
                <RelayModal
                    value={relayOpinion}
                    onChange={setRelayOpinion}
                    onClose={() => setShowRelayModal(false)}
                    onRelay={handleRelay}
                    isRelaying={isRelaying}
                />
             )}
        </>
    );
}

function RelayModal({
    value,
    onChange,
    onClose,
    onRelay,
    isRelaying,
}: {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    onRelay: () => void;
    isRelaying: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="glass-card w-full max-w-md p-5 relative" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    aria-label="Close relay composer"
                    onClick={onClose}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex items-center gap-2 text-accent-green font-headline text-xl mb-3">
                    <Repeat2 size={22} />
                    Relay this post
                </div>
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    maxLength={220}
                    placeholder="Add your opinion, or leave it blank and FlixTrend will add a quick line."
                    className="w-full min-h-32 rounded-xl border border-glass-border bg-black/30 p-3 text-white outline-none focus:border-accent-green resize-none"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{value.length}/220</span>
                    <button
                        type="button"
                        disabled={isRelaying}
                        onClick={onRelay}
                        className="btn-glass bg-accent-green text-black disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isRelaying ? 'Relaying...' : 'Relay'}
                    </button>
                </div>
            </div>
        </div>
    );
}
