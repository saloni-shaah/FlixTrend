
"use client";
import React from 'react';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc, setDoc, runTransaction, deleteField } from "firebase/firestore";
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

export function PostActions({ post, onCommentClick, isShortVibe = false }: { post: any; onCommentClick: () => void; isShortVibe?: boolean }) {
    const [likes, setLikes] = React.useState(0);
    const [userHasLiked, setUserHasLiked] = React.useState(false);
    const [relays, setRelays] = React.useState(0);
    const [userHasRelayed, setUserHasRelayed] = React.useState(false);
    const [commentsCount, setCommentsCount] = React.useState(0);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showSignalShare, setShowSignalShare] = React.useState(false);
    const [showCollectionModal, setShowCollectionModal] = React.useState(false);
    const [isDownloaded, setIsDownloaded] = React.useState(false);
    const currentUser = auth.currentUser;

    React.useEffect(() => {
        if (!post.id) return;

        const postRef = doc(db, "posts", post.id);
        const unsubPost = onSnapshot(postRef, (doc) => {
            const data = doc.data();
            if (data && data.likes) {
                const likesMap = data.likes;
                setLikes(Object.values(likesMap).filter(v => v === true).length);
                if (currentUser) {
                    setUserHasLiked(!!likesMap[currentUser.uid]);
                }
            } else {
                setLikes(0);
                setUserHasLiked(false);
            }
        });

        const unsubRelays = onSnapshot(collection(db, "posts", post.id, "relays"), (snap) => setRelays(snap.size));
        const unsubComments = onSnapshot(collection(db, "posts", post.id, "comments"), (snap) => setCommentsCount(snap.size));
        
        isPostDownloaded(post.id).then(setIsDownloaded);

        return () => {
            unsubPost();
            unsubRelays();
            unsubComments();
        };
    }, [post.id, currentUser]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        const postRef = doc(db, "posts", post.id);
        const userId = currentUser.uid;

        const dataToUpdate = {
            [`likes.${userId}`]: !userHasLiked
        };

        // Optimistically update the UI
        setUserHasLiked(!userHasLiked);
        setLikes(l => userHasLiked ? l - 1 : l + 1);

        updateDoc(postRef, dataToUpdate)
          .catch(async (serverError) => {
            // Revert optimistic update on error
            setUserHasLiked(userHasLiked);
            setLikes(l => userHasLiked ? l + 1 : l - 1);
            const permissionError = new FirestorePermissionError({
              path: postRef.path,
              operation: 'update',
              requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
          });


        if (!userHasLiked && post.userId !== currentUser.uid) {
            const notifRef = collection(db, "users", post.userId, "notifications");
            const notifData = {
                type: 'like',
                fromUserId: currentUser.uid,
                fromUsername: currentUser.displayName,
                fromAvatarUrl: currentUser.photoURL,
                postId: post.id,
                postContent: post.content?.substring(0, 50) || 'your post',
                createdAt: serverTimestamp(),
                read: false,
            };
            addDoc(notifRef, notifData).catch(e => {
                console.error("Error sending notification:", e);
                const permissionError = new FirestorePermissionError({
                    path: notifRef.path,
                    operation: 'create',
                    requestResourceData: notifData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
    };
    
    const handleRelay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        runTransaction(db, async (transaction) => {
            const userRelayRef = doc(db, 'users', currentUser.uid, 'relayedPosts', post.id);
            const postRelayRef = doc(db, 'posts', post.id, 'relays', currentUser.uid);
            
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

    const textClass = isShortVibe ? 'text-white' : 'text-muted-foreground';

    return (
        <>
            <div className={cn("flex items-center", isShortVibe ? 'flex-col gap-4' : 'justify-between mt-2 pt-2 border-t border-glass-border')}>
                <div className={cn('flex items-center justify-start', isShortVibe ? 'flex-col gap-4' : 'gap-6')}>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-brand-gold')} onClick={(e) => { e.stopPropagation(); onCommentClick(); }}>
                        <MessageCircle size={20} />
                        {!isShortVibe && <span>{commentsCount}</span>}
                    </button>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', userHasRelayed ? 'text-green-400' : textClass, 'hover:text-green-400')} onClick={handleRelay} >
                        <Repeat2 size={20} />
                        {!isShortVibe && <span>{relays}</span>}
                    </button>
                    <button data-like-button="true" className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', userHasLiked ? 'text-yellow-400' : textClass, 'hover:text-yellow-400')} onClick={handleLike}>
                        <Star size={20} fill={userHasLiked ? "currentColor" : "none"} />
                         {!isShortVibe && <span>{likes}</span>}
                    </button>
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-cyan')} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                        <Share size={20} />
                    </button>
                </div>
                {!isShortVibe && (
                    <div className="flex items-center gap-4">
                        <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, isDownloaded ? 'text-blue-400' : 'hover:text-blue-400')} onClick={handleDownload} title="Save for Offline">
                            <Download size={20} />
                        </button>
                        <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', textClass, 'hover:text-accent-purple')} onClick={(e) => { e.stopPropagation(); setShowCollectionModal(true); }}>
                            <Bookmark size={20} />
                        </button>
                    </div>
                )}
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
