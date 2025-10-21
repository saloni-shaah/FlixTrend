"use client";
import React from 'react';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, runTransaction } from "firebase/firestore";
import { Repeat2, Star, Share, MessageCircle, Bookmark, Download } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { savePostForOffline, isPostDownloaded, removeDownloadedPost } from '@/utils/offline-db';
import { cn } from "@/lib/utils";

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
        if (post.id) {
            const unsubLikes = onSnapshot(collection(db, "posts", post.id, "stars"), (snap) => {
                setLikes(snap.size);
                if (currentUser) {
                    setUserHasLiked(snap.docs.some(doc => doc.id === currentUser.uid));
                }
            });
            const unsubRelays = onSnapshot(collection(db, "posts", post.id, "relays"), (snap) => setRelays(snap.size));
            const unsubComments = onSnapshot(collection(db, "posts", post.id, "comments"), (snap) => setCommentsCount(snap.size));
            
            isPostDownloaded(post.id).then(setIsDownloaded);

            return () => {
                unsubLikes();
                unsubRelays();
                unsubComments();
            };
        }
    }, [post.id, currentUser]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        const likeRef = fsDoc(db, "posts", post.id, "stars", currentUser.uid);
        if (userHasLiked) {
            await deleteDoc(likeRef);
        } else {
            await setDoc(likeRef, {
                userId: currentUser.uid,
                username: currentUser.displayName,
                createdAt: serverTimestamp(),
            });

            // Send notification if not the post owner
            if (post.userId !== currentUser.uid) {
                const notifRef = collection(db, "users", post.userId, "notifications");
                await addDoc(notifRef, {
                    type: 'like',
                    fromUserId: currentUser.uid,
                    fromUsername: currentUser.displayName,
                    fromAvatarUrl: currentUser.photoURL,
                    postId: post.id,
                    postContent: post.content?.substring(0, 50) || 'your post',
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }
        }
    };
    
    const handleRelay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        
        await runTransaction(db, async (transaction) => {
            const userRelayRef = fsDoc(db, 'users', currentUser.uid, 'relayedPosts', post.id);
            const postRelayRef = fsDoc(db, 'posts', post.id, 'relays', currentUser.uid);
            
            const userRelayDoc = await transaction.get(userRelayRef);

            if (userRelayDoc.exists()) {
                // To un-relay, just delete the records. We won't support un-relaying for now.
                return;
            }

            // 1. Create a new "relay" post
            const newRelayPost = {
                type: 'relay',
                originalPostId: post.id,
                originalPost: post, // embed original post data
                userId: currentUser.uid,
                username: currentUser.displayName,
                avatar_url: currentUser.photoURL,
                createdAt: serverTimestamp(),
                publishAt: serverTimestamp()
            };
            transaction.set(doc(collection(db, 'posts')), newRelayPost);
            
            // 2. Mark that user has relayed this post
            transaction.set(userRelayRef, { relayedAt: serverTimestamp() });
            
            // 3. Increment relay count on original post
            transaction.set(postRelayRef, {
                userId: currentUser.uid,
                username: currentUser.displayName,
                createdAt: serverTimestamp(),
            });
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
                    <button className={cn('flex items-center gap-1.5 font-bold transition-all text-lg', userHasLiked ? 'text-yellow-400' : textClass, 'hover:text-yellow-400')} onClick={handleLike}>
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
