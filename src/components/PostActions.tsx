
"use client";
import React from 'react';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, runTransaction } from "firebase/firestore";
import { Repeat2, Star, Share, MessageCircle, Bookmark } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import { motion } from "framer-motion";
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';

const db = getFirestore(app);

export function PostActions({ post, isShortVibe = false, onCommentClick }: { post: any; isShortVibe?: boolean; onCommentClick: () => void; }) {
  const [isStarred, setIsStarred] = React.useState(false);
  const [starCount, setStarCount] = React.useState(post.starCount || 0);
  const [isRelayed, setIsRelayed] = React.useState(false);
  const [relayCount, setRelayCount] = React.useState(post.relayCount || 0);
  const [commentCount, setCommentCount] = React.useState(post.commentCount || 0);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showSignalShare, setShowSignalShare] = React.useState(false);
  const [showCollectionModal, setShowCollectionModal] = React.useState(false);
  
  const currentUser = auth.currentUser;

  React.useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(onSnapshot(fsDoc(db, "users", currentUser.uid, "starredPosts", post.id), (doc) => setIsStarred(doc.exists())));
    unsubscribes.push(onSnapshot(collection(db, "posts", post.id, "stars"), (snap) => setStarCount(snap.size)));
    unsubscribes.push(onSnapshot(fsDoc(db, "posts", post.id, "relays", currentUser.uid), (doc) => setIsRelayed(doc.exists())));
    unsubscribes.push(onSnapshot(collection(db, "posts", post.id, "relays"), (snap) => setRelayCount(snap.size)));
    unsubscribes.push(onSnapshot(collection(db, "posts", post.id, "comments"), (snap) => setCommentCount(snap.size)));
    unsubscribes.push(onSnapshot(collection(db, "collections"), (snap) => {
        const anyCollection = snap.docs.some(doc => doc.data().ownerId === currentUser.uid && doc.data().postIds?.includes(post.id));
        setIsSaved(anyCollection);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [post.id, currentUser]);


  const handleStar = async () => {
    if (!currentUser) return;
    const starredDocRef = fsDoc(db, "users", currentUser.uid, "starredPosts", post.id);
    const postStarRef = fsDoc(db, "posts", post.id, "stars", currentUser.uid);
    if (isStarred) {
        await deleteDoc(starredDocRef);
        await deleteDoc(postStarRef);
    } else {
        await setDoc(starredDocRef, { ...post, starredAt: serverTimestamp() });
        await setDoc(postStarRef, { userId: currentUser.uid, starredAt: serverTimestamp() });
        if (post.userId !== currentUser.uid) {
            // Create a notification for the post author
            const notifRef = collection(db, "users", post.userId, "notifications");
            await addDoc(notifRef, {
                type: 'like',
                fromUserId: currentUser.uid,
                fromUsername: currentUser.displayName,
                fromAvatarUrl: currentUser.photoURL,
                postId: post.id,
                postContent: (post.content || "").substring(0, 50),
                createdAt: serverTimestamp(),
                read: false
            });
        }
    }
  };

  const handleRelay = async () => {
    if (!currentUser) return;
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(fsDoc(db, "users", currentUser.uid));
            if (!userDoc.exists()) throw new Error("User profile not found");
            const userData = userDoc.data();
            const relayRef = fsDoc(db, "posts", post.id, "relays", currentUser.uid);
            const relaySnap = await transaction.get(relayRef);
            if (relaySnap.exists()) { console.log("Already relayed"); return; }

            const newPostRef = doc(collection(db, "posts"));
            transaction.set(newPostRef, {
                type: 'relay', originalPost: post, originalPostId: post.id,
                userId: currentUser.uid, displayName: userData.name || currentUser.displayName,
                username: userData.username, avatar_url: userData.avatar_url,
                createdAt: serverTimestamp(), publishAt: serverTimestamp(),
                category: post.category,
            });
            transaction.set(relayRef, { userId: currentUser.uid, relayedAt: serverTimestamp() });
        });
    } catch (error) { console.error("Error relaying post:", error); }
  };

  return (
    <>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 }}
          }}
          className={`flex items-center justify-between mt-2 pt-2 ${isShortVibe ? 'flex-col gap-4' : 'border-t border-glass-border'}`}>
            <div className={isShortVibe ? 'flex flex-col items-center gap-4' : 'flex items-center justify-start gap-6'}>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isShortVibe ? 'flex-col text-white animate-pop' : 'text-lg text-muted-foreground hover:text-brand-gold'}`} onClick={onCommentClick}>
                <MessageCircle size={isShortVibe ? 32 : 20} /> <span className="text-sm">{commentCount}</span>
              </motion.button>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isRelayed ? 'text-green-400' : isShortVibe ? 'text-white' : 'text-lg text-muted-foreground hover:text-green-400'}`} onClick={handleRelay} >
                <Repeat2 size={isShortVibe ? 32 : 20} /> <span className="text-sm">{relayCount}</span>
              </motion.button>
              <motion.button 
                whileTap={{ scale: 1.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} 
                className={`flex items-center gap-1.5 font-bold transition-all ${isStarred ? "text-yellow-400" : isShortVibe ? 'text-white' : "text-lg text-muted-foreground hover:text-yellow-400"}`} onClick={handleStar}>
                <Star size={isShortVibe ? 32 : 20} fill={isStarred ? "currentColor" : "none"} className={`${isStarred ? "drop-shadow-[0_0_8px_#FBBF24]" : ""}`} /> <span className="text-sm">{starCount}</span>
              </motion.button>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isShortVibe ? 'flex-col text-white' : 'text-lg text-muted-foreground hover:text-accent-cyan'}`} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                <Share size={isShortVibe ? 32 : 20} />
              </motion.button>
            </div>
            <div className={isShortVibe ? 'flex flex-col items-center gap-4 mt-4' : 'flex items-center gap-4'}>
                 <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isSaved ? 'text-accent-purple' : isShortVibe ? 'text-white' : 'text-lg text-muted-foreground hover:text-accent-purple'}`} onClick={() => setShowCollectionModal(true)}>
                    <Bookmark size={isShortVibe ? 32 : 20} fill={isSaved ? "currentColor" : "none"}/>
                </motion.button>
            </div>
        </motion.div>

        {showShareModal && (
            <ShareModal 
                url={`${window.location.origin}/post/${post.id}`}
                title={post.content}
                isVideo={post.type === 'media'}
                onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }}
                onClose={() => setShowShareModal(false)}
            />
        )}
        {showSignalShare && <SignalShareModal post={post} onClose={() => setShowSignalShare(false)}/>}
        {showCollectionModal && <AddToCollectionModal post={post} onClose={() => setShowCollectionModal(false)} />}
    </>
  );
}
