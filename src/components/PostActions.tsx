"use client";
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, runTransaction, serverTimestamp, arrayUnion, arrayRemove, writeBatch, getDoc, FieldValue } from "firebase/firestore";
import { Repeat2, Star, Share, MessageCircle, Bookmark, Download } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { savePostForOffline, isPostDownloaded, removeDownloadedPost } from '@/utils/offline-db';
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUserLikes } from '@/context/UserLikesContext';

const db = getFirestore(app);

export function PostActions({ post, onCommentClick, isShortVibe = false, collectionName = 'posts' }: { post: any; onCommentClick: (e: React.MouseEvent) => void; isShortVibe?: boolean, collectionName?: string }) {
    const [likes, setLikes] = React.useState(post.likesCount || 0);

    // --- New Like Logic State ---
    const { likedPosts: currentYearLikes, loading: likesLoading } = useUserLikes();
    const [isLiked, setIsLiked] = useState(false);
    const [isLoadingLike, setIsLoadingLike] = useState(true);
    // --- End New Like Logic State ---

    const [relays, setRelays] = React.useState(0);
    const [userHasRelayed, setUserHasRelayed] = React.useState(false);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showSignalShare, setShowSignalShare] = React.useState(false);
    const [showCollectionModal, setShowCollectionModal] = React.useState(false);
    const [isDownloaded, setIsDownloaded] = React.useState(false);
    const [shareCount, setShareCount] = React.useState(post.shareCount || 0);
    const currentUser = auth.currentUser;

    // --- New Like Logic Effect ---
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
                // For current year posts, the context is the source of truth.
                setIsLiked(currentYearLikes.includes(post.id));
                setIsLoadingLike(false);
            } else {
                // For posts from previous years, do a specific document read.
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
    // --- End New Like Logic Effect ---

    React.useEffect(() => {
        if (!post.id) return;

        const postRef = doc(db, collectionName, post.id);
        const unsubPost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setLikes(doc.data().likesCount || 0);
            }
        });

        const unsubRelays = onSnapshot(collection(db, collectionName, post.id, "relays"), (snap) => setRelays(snap.size));
        isPostDownloaded(post.id).then(setIsDownloaded);

        return () => {
            unsubPost();
            unsubRelays();
        };
    }, [post.id, collectionName]);

    // --- UPDATED Handle Like Function ---
    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        const optimisticLikeState = !isLiked;
        setIsLiked(optimisticLikeState);
        // Optimistically update the like count for immediate UI feedback.
        // The backend function provides the final source of truth via the onSnapshot listener.
        setLikes(likes + (optimisticLikeState ? 1 : -1));

        try {
            const batch = writeBatch(db);

            // Ref to trigger the Cloud Function (increment/decrement likesCount)
            const postLikeRef = doc(db, collectionName, post.id, 'likes', currentUser.uid);

            // Ref for the user's personal list of liked posts
            const yearlyLikesDocRef = doc(db, 'users', currentUser.uid, 'likedPosts', postYear.toString());

            if (optimisticLikeState) {
                // Create a doc in the `likes` subcollection to trigger the increment function.
                batch.set(postLikeRef, {
                    userId: currentUser.uid,
                    createdAt: serverTimestamp()
                });
                // Add the post to the user's aggregated list of likes.
                batch.set(yearlyLikesDocRef, {
                    postIds: arrayUnion(post.id)
                }, { merge: true });
            } else {
                // Delete the doc in the `likes` subcollection to trigger the decrement function.
                batch.delete(postLikeRef);
                // Remove the post from the user's aggregated list of likes.
                batch.update(yearlyLikesDocRef, {
                    postIds: arrayRemove(post.id)
                });
            }

            await batch.commit();

        } catch (error) {
            console.error('Error updating like status:', error);
            // Revert optimistic UI updates on failure
            setIsLiked(!optimisticLikeState);
            setLikes(likes); // Revert to the original count from the listener
        }
    };
    // --- End UPDATED Handle Like Function ---

    const handleRelay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        runTransaction(db, async (transaction) => {
            const userRelayRef = doc(db, 'users', currentUser.uid, 'relayedPosts', post.id);
            const postRelayRef = doc(db, collectionName, post.id, 'relays', currentUser.uid);
            
            const userRelayDoc = await transaction.get(userRelayRef);

            if (userRelayDoc.exists()) {
                return;
            }

            const newRelayPost = {
                type: 'relay',
                originalPostId: post.id,
                originalPost: post, 
                userId: currentUser.uid,
                username: currentUser.displayName,
                avatar_url: currentUser.photoURL,
                createdAt: serverTimestamp(),
                publishAt: serverTimestamp()
            };
            transaction.set(doc(collection(db, 'posts')), newRelayPost);
            
            transaction.set(userRelayRef, { relayedAt: serverTimestamp() });
            
            transaction.set(postRelayRef, {
                userId: currentUser.uid,
                username: currentUser.displayName,
                createdAt: serverTimestamp(),
            });
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: post.id,
              operation: 'write',
              requestResourceData: { relay: true },
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (isDownloaded) {
                await removeDownloadedPost(post.id);
                setIsDownloaded(false);
            } else {
                await savePostForOffline(post);
                setIsDownloaded(true);
            }
        } catch (error) {
            console.error("Offline action failed:", error);
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
                <div class='flex flex-col items-center gap-5'>
                    <button className={cn('flex flex-col items-center gap-1.5 font-bold text-white transition-all', 'hover:text-brand-gold')} onClick={handleCommentButtonClick}>
                        <MessageCircle size={iconSize} />
                        <span className="text-sm font-semibold">{post.commentCount || 0}</span>
                    </button>
                    {collectionName !== 'drops' && (
                        <button className={cn('flex flex-col items-center font-bold transition-all', userHasRelayed ? 'text-green-400' : 'text-white', 'hover:text-green-400')} onClick={handleRelay} >
                            <Repeat2 size={iconSize} />
                        </button>
                    )}
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
                    {collectionName !== 'drops' && (
                        <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', userHasRelayed ? 'text-green-400' : textClass, 'hover:text-green-400')} onClick={handleRelay} >
                            <Repeat2 size={iconSize} />
                            <span>{relays}</span>
                        </button>
                    )}
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
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, isDownloaded ? 'text-blue-400' : 'hover:text-blue-400')} onClick={handleDownload} title="Save for Offline">
                        <Download size={20} />
                    </button>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-purple')} onClick={(e) => { e.stopPropagation(); setShowCollectionModal(true); }}>
                        <Bookmark size={20} />
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
             {showCollectionModal && (
                <AddToCollectionModal post={post} onClose={() => setShowCollectionModal(false)} />
             )}
        </>
    );
}
