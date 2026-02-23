
"use client";
import React from 'react';
import { getFirestore, collection, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { Repeat2, Star, Share, MessageCircle, Bookmark, Download } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { savePostForOffline, isPostDownloaded, removeDownloadedPost } from '@/utils/offline-db';
import { cn } from "@/lib/utils";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const db = getFirestore(app);

export function PostActions({ post, onCommentClick, isShortVibe = false, collectionName = 'posts' }: { post: any; onCommentClick: (e: React.MouseEvent) => void; isShortVibe?: boolean, collectionName?: string }) {
    const [likes, setLikes] = React.useState(post.likes ? Object.values(post.likes).filter(v => v === true).length : 0);
    const [userHasLiked, setUserHasLiked] = React.useState(false);
    const [relays, setRelays] = React.useState(0);
    const [userHasRelayed, setUserHasRelayed] = React.useState(false);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showSignalShare, setShowSignalShare] = React.useState(false);
    const [showCollectionModal, setShowCollectionModal] = React.useState(false);
    const [isDownloaded, setIsDownloaded] = React.useState(false);
    const [shareCount, setShareCount] = React.useState(post.shareCount || 0);
    const currentUser = auth.currentUser;

    React.useEffect(() => {
        if (!post.id) return;
        if (currentUser) {
            setUserHasLiked(post.likes && post.likes[currentUser.uid]);
        }
    }, [post.likes, currentUser]);

    React.useEffect(() => {
        if (!post.id) return;
        const unsubRelays = onSnapshot(collection(db, collectionName, post.id, "relays"), (snap) => setRelays(snap.size));
        isPostDownloaded(post.id).then(setIsDownloaded);

        return () => {
            unsubRelays();
        };
    }, [post.id, collectionName]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        const postRef = doc(db, collectionName, post.id);
        const userId = currentUser.uid;

        const dataToUpdate = {
            [`likes.${userId}`]: !userHasLiked
        };

        setUserHasLiked(!userHasLiked);
        setLikes(l => userHasLiked ? l - 1 : l + 1);

        updateDoc(postRef, dataToUpdate)
          .catch(async (serverError) => {
            setUserHasLiked(userHasLiked);
            setLikes(l => userHasLiked ? l + 1 : l - 1);
            const permissionError = new FirestorePermissionError({
              path: postRef.path,
              operation: 'update',
              requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    };
    
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
                <div className='flex flex-col items-center gap-5'>
                    <button className={cn('flex flex-col items-center gap-1.5 font-bold text-white transition-all', 'hover:text-brand-gold')} onClick={handleCommentButtonClick}>
                        <MessageCircle size={iconSize} />
                        <span className="text-sm font-semibold">{post.commentCount || 0}</span>
                    </button>
                    {collectionName !== 'drops' && (
                        <button className={cn('flex flex-col items-center font-bold transition-all', userHasRelayed ? 'text-green-400' : 'text-white', 'hover:text-green-400')} onClick={handleRelay} >
                            <Repeat2 size={iconSize} />
                        </button>
                    )}
                    <button data-like-button="true" className={cn('flex flex-col items-center gap-1.5 font-bold transition-all', userHasLiked ? 'text-yellow-400' : 'text-white', 'hover:text-yellow-400')} onClick={handleLike}>
                        <Star size={iconSize} fill={userHasLiked ? "currentColor" : "none"} />
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
                    <button data-like-button="true" className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', userHasLiked ? 'text-yellow-400' : textClass, 'hover:text-yellow-400')} onClick={handleLike}>
                        <Star size={iconSize} fill={userHasLiked ? "currentColor" : "none"} />
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
