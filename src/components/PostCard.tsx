
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import { FaPlay, FaRegComment, FaExclamationTriangle, FaVolumeMute, FaUserSlash, FaLink, FaMusic } from "react-icons/fa";
import { Repeat2, Star, Share, MessageCircle, Bookmark, MapPin, Smile, Download, X, MoreVertical, Check, ChevronRight, Circle, ThumbsUp, ThumbsDown } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { OptimizedImage } from './OptimizedImage';
import { FlixTrendLogo } from './FlixTrendLogo';
import { trackInteraction } from '@/vibe-engine/interactionTracker';
import { savePostForOffline, isPostDownloaded, removeDownloadedPost } from '@/utils/offline-db';
import { getFunctions, httpsCallable } from "firebase/functions";
import { CheckCircle, Award, Mic, Crown, Zap, Rocket, Search, Pin, Phone, Mail, Folder } from "lucide-react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"
import AdModal from './AdModal';
import { PlayerModal } from './video/PlayerModal';
import { ShortsPlayer } from './ShortsPlayer';
import { OptimizedVideo } from './OptimizedVideo';


// START: Copied DropdownMenu components
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName
// END: Copied DropdownMenu components


const db = getFirestore(app);
const functions = getFunctions(app);

const Watermark = ({ isAnimated = false }: { isAnimated?: boolean }) => (
    <div
      className={`absolute flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10 ${
        isAnimated ? 'animate-[float-watermark_10s_ease-in-out_infinite]' : 'bottom-2 right-2'
      }`}
    >
        <FlixTrendLogo size={16} />
        <span className="font-bold">FlixTrend</span>
    </div>
);


export function PostCard({ post, isShortVibe = false }: { post: any; isShortVibe?: boolean }) {
  const [isStarred, setIsStarred] = React.useState(false);
  const [starCount, setStarCount] = React.useState(post.starCount || 0);
  const [isRelayed, setIsRelayed] = React.useState(false);
  const [relayCount, setRelayCount] = React.useState(post.relayCount || 0);
  const [commentCount, setCommentCount] = React.useState(post.commentCount || 0);
  const [showComments, setShowComments] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [editContent, setEditContent] = React.useState(post.content || "");
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showSignalShare, setShowSignalShare] = React.useState(false);
  const [showCollectionModal, setShowCollectionModal] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);
  const currentUser = auth.currentUser;
  const [pollVotes, setPollVotes] = React.useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
  const [userPollVote, setUserPollVote] = React.useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const deletePostCallable = httpsCallable(functions, 'deletePost');
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  
  const [showPlayer, setShowPlayer] = useState<'long' | 'short' | null>(null);

  React.useEffect(() => {
    if (!currentUser) return;

    const unsubscribes: (() => void)[] = [];

    // Starred post check
    const starredDocRef = fsDoc(db, "users", currentUser.uid, "starredPosts", post.id);
    const unsubStarred = onSnapshot(starredDocRef, (docSnap) => {
        setIsStarred(docSnap.exists());
    });
    unsubscribes.push(unsubStarred);

    // Saved post check - this is a quick check, doesn't tell us *which* collection
    const savedQuery = query(collection(db, "collections"), where("ownerId", "==", currentUser.uid), where("postIds", "array-contains", post.id));
    const unsubSaved = onSnapshot(savedQuery, (snap) => {
      const wasSaved = !snap.empty;
      if (isSaved !== wasSaved) {
        setIsSaved(wasSaved);
        if (wasSaved) {
            trackInteraction(currentUser.uid, post.category, 'save');
        }
      }
    });
    unsubscribes.push(unsubSaved);
    
    // Relayed post check
    const relayedDocRef = fsDoc(db, "posts", post.id, "relays", currentUser.uid);
    const unsubRelayed = onSnapshot(relayedDocRef, (docSnap) => {
        setIsRelayed(docSnap.exists());
    });
    unsubscribes.push(unsubRelayed);


    // Counts
    const unsubStars = onSnapshot(collection(db, "posts", post.id, "stars"), (snap) => setStarCount(snap.size));
    unsubscribes.push(unsubStars);
    const unsubRelays = onSnapshot(collection(db, "posts", post.id, "relays"), (snap) => setRelayCount(snap.size));
    unsubscribes.push(unsubRelays);
    const unsubComments = onSnapshot(collection(db, "posts", post.id, "comments"), (snap) => setCommentCount(snap.size));
    unsubscribes.push(unsubComments);

    // Polls
    if (post.type === "poll" && post.pollOptions) {
      const unsubPollVotes = onSnapshot(collection(db, "posts", post.id, "pollVotes"), (snap) => {
        const votes: { [optionIdx: number]: { count: number, voters: string[] } } = {};
        post.pollOptions.forEach((_:any, index:number) => {
            votes[index] = { count: 0, voters: [] };
        });

        let userVote: number | null = null;
        snap.forEach(doc => {
          const { optionIdx, userId } = doc.data();
          if (votes[optionIdx]) {
              votes[optionIdx].count++;
              votes[optionIdx].voters.push(userId);
          }
          if (userId === currentUser.uid) userVote = optionIdx;
        });
        setPollVotes(votes);
        setUserPollVote(userVote);
      });
      unsubscribes.push(unsubPollVotes);
    }

    // Check if post is downloaded
    isPostDownloaded(post.id).then(setIsDownloaded);
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [post.id, currentUser, post.type, post.pollOptions, isSaved]);

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
        
        // Track interaction for VibeEngine
        trackInteraction(currentUser.uid, post.category, 'like');

        // Create notification for post author
        if (post.userId !== currentUser.uid) {
            const notifRef = collection(db, "notifications", post.userId, "user_notifications");
            await addDoc(notifRef, {
                type: 'like',
                fromUserId: currentUser.uid,
                fromUsername: currentUser.displayName,
                fromAvatarUrl: currentUser.photoURL,
                postId: post.id,
                postContent: (post.content || "").substring(0, 50),
                createdAt: serverTimestamp(),
                read: false,
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

            if (relaySnap.exists()) {
                console.log("Already relayed");
                return;
            }

            const newPostRef = doc(collection(db, "posts"));
            transaction.set(newPostRef, {
                type: 'relay',
                originalPost: post,
                originalPostId: post.id,
                userId: currentUser.uid,
                displayName: userData.name || currentUser.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url,
                createdAt: serverTimestamp(),
                publishAt: serverTimestamp(),
                category: post.category, // Carry over the category
            });
            
            transaction.set(relayRef, {
                userId: currentUser.uid,
                relayedAt: serverTimestamp(),
            });
            
            trackInteraction(currentUser.uid, post.category, 'relay');

            if (post.userId !== currentUser.uid) {
                const notifRef = doc(collection(db, "notifications", post.userId, "user_notifications"));
                transaction.set(notifRef, {
                    type: 'relay',
                    fromUserId: currentUser.uid,
                    fromUsername: currentUser.displayName,
                    fromAvatarUrl: currentUser.photoURL,
                    postId: post.id,
                    postContent: (post.content || "").substring(0, 50),
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }
        });

    } catch (error) {
        console.error("Error relaying post:", error);
        alert("Could not relay post.");
    }
  };

  const handleDownload = async () => {
    try {
      if (isDownloaded) {
        await removeDownloadedPost(post.id);
        setIsDownloaded(false);
      } else {
        await savePostForOffline(post);
        setIsDownloaded(true);
      }
    } catch (error) {
      console.error("Failed to save post for offline:", error);
      alert("Could not download post.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this post and all its interactions? This cannot be undone.")) {
      try {
        await deletePostCallable({ postId: post.id });
      } catch (error: any) {
        alert(`Failed to delete post: ${(error as any).message}`);
      }
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoc(fsDoc(db, "posts", post.id), { content: editContent });
    setShowEdit(false);
  };

  const handlePollVote = async (optionIdx: number) => {
    if (!currentUser || userPollVote !== null) return;
    await setDoc(fsDoc(db, "posts", post.id, "pollVotes", currentUser.uid), { userId: currentUser.uid, optionIdx, createdAt: serverTimestamp() });
    trackInteraction(currentUser.uid, post.category, 'comment'); // Treat poll vote as a form of comment
  };
  
  React.useEffect(() => {
    if (post.song && post.song.preview_url) {
        const audio = new Audio(post.song.preview_url);
        audioRef.current = audio;
    }
    return () => {
        audioRef.current?.pause();
    }
  }, [post.song]);
  
  const handleRecommendationFeedback = (type: 'show_more' | 'show_less') => {
      if (!currentUser) return;
      trackInteraction(currentUser.uid, post.category, type);
      alert(`Thank you! We'll ${type === 'show_more' ? 'show you more' : 'show you less'} posts like this.`);
  };

  const MediaGrid = ({ mediaUrls }: { mediaUrls: string[] }) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const lastTap = useRef(0);

    const handleMediaClick = (e: React.MouseEvent) => {
        const isShortVideo = post.videoDuration >= 3 && post.videoDuration <= 180 && post.isPortrait;
        
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // Double tap
            if (isShortVideo) {
                setShowPlayer('short');
            } else {
                handleStar(); // Double tap to like non-reels
            }
        } else {
            // Single tap
            const firstVideoUrl = mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
            if (firstVideoUrl) {
                if(isShortVideo) {
                     setShowPlayer('short');
                } else {
                     setShowPlayer('long');
                }
            } else {
                setIsFullScreen(true);
            }
        }
        lastTap.current = now;
    };
    
    const renderMedia = (url: string, isVideo: boolean, isSingle: boolean) => {
        if (isVideo) {
            return (
                <div className="relative group w-full h-full cursor-pointer bg-black flex items-center justify-center">
                    <OptimizedVideo src={url} className="w-full h-full object-contain" preload="metadata" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaPlay className="text-white text-5xl" />
                    </div>
                    <Watermark isAnimated={true} />
                </div>
            );
        }
        return (
            <div className="relative group w-full h-full">
                <OptimizedImage src={url} alt="media" className="w-full h-full object-cover" />
                <Watermark isAnimated={isSingle} />
            </div>
        );
    }
    
    if (mediaUrls.length === 1) {
        const url = mediaUrls[0];
        const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
        return (
            <div 
                className="w-full rounded-xl overflow-hidden mt-2 relative" 
                onClick={handleMediaClick}
                style={{
                    aspectRatio: post.isPortrait ? '9 / 16' : '16 / 9',
                    maxHeight: '70vh', 
                }}
            >
                {renderMedia(url, !!isVideo, true)}
            </div>
        );
    }

    // Grid view for multiple media items
    return (
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl overflow-hidden" onClick={() => setIsFullScreen(true)}>
            {mediaUrls.slice(0, 4).map((url, index) => {
                 const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
                return (
                    <div key={index} className="relative aspect-square cursor-pointer">
                        {renderMedia(url, !!isVideo, false)}
                        {index === 3 && mediaUrls.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    );
};


  const renderPostContent = (p: any) => {
    const contentPost = p.type === 'relay' ? p.originalPost : p;
    const initials = contentPost.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || contentPost.username?.slice(0, 2).toUpperCase() || "U";
    
    return (
        <>
            <div className="flex items-center gap-3 mb-2">
                <Link href={`/squad/${contentPost.userId}`} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                        {contentPost.avatar_url ? <img src={contentPost.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{initials}</span>}
                    </div>
                    <span className="font-headline text-accent-green text-sm group-hover:underline">@{contentPost.username || "user"}</span>
                </Link>
                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{contentPost.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</span>
                </div>
            </div>

            {contentPost.content && (contentPost.type !== 'poll' || (contentPost.type === 'poll' && !contentPost.pollOptions)) && (
                <div className={`whitespace-pre-line mb-2 px-4 py-3 rounded-xl ${isShortVibe ? 'text-white text-base font-body line-clamp-2 text-left' : 'text-[1.15rem] font-body'}`} style={{ backgroundColor: contentPost.backgroundColor && !isShortVibe ? contentPost.backgroundColor : 'transparent', color: contentPost.backgroundColor && contentPost.backgroundColor !== '#ffffff' && !isShortVibe ? 'hsl(var(--foreground))' : 'inherit', textShadow: isShortVibe ? "0 1px 4px #000" : "none" }}>
                    {contentPost.content}
                </div>
            )}
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 my-2">
                {contentPost.location && <span className="flex items-center gap-1.5"><MapPin size={14}/> {contentPost.location}</span>}
                {contentPost.mood && <span className="flex items-center gap-1.5"><Smile size={14}/> Feeling {contentPost.mood}</span>}
            </div>

            {contentPost.hashtags && contentPost.hashtags.length > 0 && !isShortVibe && (
                <div className="flex flex-wrap gap-2">
                    {contentPost.hashtags.map((tag: string) => <Link href={`/tags/${tag}`} key={tag} className="text-brand-gold font-bold text-sm hover:underline">#{tag}</Link>)}
                </div>
            )}

            {contentPost.type === "media" && contentPost.mediaUrl && !isShortVibe && (
                <MediaGrid mediaUrls={Array.isArray(contentPost.mediaUrl) ? contentPost.mediaUrl : [contentPost.mediaUrl]} />
            )}

            {contentPost.type === "poll" && contentPost.pollOptions && (
                <div className="flex flex-col gap-2 p-4">
                    <div className="font-bold text-brand-gold mb-3">{contentPost.content}</div>
                    {contentPost.pollOptions.map((opt: string, idx: number) => {
                        const voteData = pollVotes[idx] || { count: 0, voters: [] };
                        const totalVotes = Object.values(pollVotes).reduce((sum, current) => sum + current.count, 0);
                        const percent = totalVotes > 0 ? Math.round((voteData.count / totalVotes) * 100) : 0;
                        return (
                            <button key={idx} className={`w-full p-2 rounded-full font-bold transition-all relative overflow-hidden btn-glass`}
                                onClick={() => handlePollVote(idx)} disabled={userPollVote !== null}>
                                {userPollVote !== null && <div className="absolute left-0 top-0 h-full bg-brand-gold/50" style={{ width: `${percent}%` }} />}
                                <div className="relative flex justify-between z-10 px-2">
                                    <span>{opt}</span>
                                    {userPollVote !== null && <span>{percent}% ({voteData.count})</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            
            {contentPost.song && (
                 <div className="mt-2 p-3 rounded-xl bg-black/20 flex items-center gap-4 border border-glass-border">
                    <img src={contentPost.song.albumArt} alt={contentPost.song.album} className="w-12 h-12 rounded-lg"/>
                    <div className="flex-1">
                        <div className="font-bold text-brand-gold text-base line-clamp-1">{contentPost.song.name}</div>
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{contentPost.song.artists.join(", ")}</div>
                    </div>
                     <Link href={`/create?type=flash&songId=${contentPost.song.id}`} className="p-2 rounded-full bg-accent-pink/20 text-accent-pink hover:bg-accent-pink/40 hover:text-white transition-colors">
                        <FaMusic /> <span className="ml-2 font-bold text-xs">Use this sound</span>
                    </Link>
                </div>
            )}
        </>
    )
  }
  
  const ActionButtons = () => {
    const isVideo = post.type === 'media' && post.mediaUrl && (Array.isArray(post.mediaUrl) ? post.mediaUrl.some((url: string) => url.includes('.mp4')) : post.mediaUrl.includes('.mp4'));

    return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 }}
          }}
          className={`flex items-center justify-between mt-2 pt-2 ${isShortVibe ? 'flex-col gap-4' : 'border-t border-glass-border'}`}>
            <div className={isShortVibe ? 'flex flex-col items-center gap-4' : 'flex items-center justify-start gap-6'}>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isShortVibe ? 'flex-col text-white animate-pop' : 'text-lg text-muted-foreground hover:text-brand-gold'}`} onClick={() => setShowComments(true)}>
                <MessageCircle size={isShortVibe ? 32 : 20} /> <span className="text-sm">{commentCount}</span>
              </motion.button>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isStarred ? "text-yellow-400" : isShortVibe ? 'text-white' : "text-lg text-muted-foreground hover:text-yellow-400"}`} onClick={handleStar}>
                <Star size={isShortVibe ? 32 : 20} fill={isStarred ? "currentColor" : "none"} /> <span className="text-sm">{starCount}</span>
              </motion.button>
              <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isShortVibe ? 'flex-col text-white' : 'text-lg text-muted-foreground hover:text-accent-cyan'}`} onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}>
                <Share size={isShortVibe ? 32 : 20} />
              </motion.button>
            </div>
            <div className={isShortVibe ? 'flex flex-col items-center gap-4 mt-4' : 'flex items-center gap-4'}>
                 <motion.button variants={{hidden: {opacity:0, y:10}, visible: {opacity:1, y:0}}} className={`flex items-center gap-1.5 font-bold transition-all ${isShortVibe ? 'flex-col text-white' : 'text-lg text-muted-foreground hover:text-accent-purple'}`} onClick={() => setShowCollectionModal(true)}>
                    <Bookmark size={isShortVibe ? 32 : 20} fill={isSaved ? "currentColor" : "none"}/>
                </motion.button>
            </div>
        </motion.div>
    )
  };


  if (isShortVibe) {
    return (
        <div className="absolute inset-0 w-full h-full p-4 flex justify-between items-end pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="flex flex-col gap-2 max-w-[calc(100%-80px)] self-end pointer-events-auto mb-4">
                <div className="flex items-center gap-2">
                    <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                            {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{post.displayName?.[0] || 'U'}</span>}
                        </div>
                        <span className="font-headline text-white text-base group-hover:underline drop-shadow-lg">@{post.username || "user"}</span>
                    </Link>
                </div>
                <p className="text-white text-sm font-body line-clamp-3 drop-shadow-lg">{post.content}</p>
                 {post.song && (
                    <div className="flex items-center gap-2 text-white text-sm drop-shadow-lg">
                        <FaMusic /> <span>{post.song.name} - {post.song.artists.join(", ")}</span>
                    </div>
                 )}
            </div>
            <div className="flex flex-col gap-4 self-end mb-4 pointer-events-auto">
                <ActionButtons />
            </div>
            {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />}
            {showShareModal && <ShareModal isVideo={post.type === 'media'} url={`${window.location.origin}/post/${post.id}`} title={post.content} onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }} onClose={() => setShowShareModal(false)} />}
            {showSignalShare && <SignalShareModal post={post} onClose={() => setShowSignalShare(false)}/>}
            {showCollectionModal && <AddToCollectionModal post={post} onClose={() => setShowCollectionModal(false)} />}
        </div>
    );
  }

  return (
    <>
    {showPlayer === 'long' && <PlayerModal post={post} onClose={() => setShowPlayer(null)} />}
    {showPlayer === 'short' && <ShortsPlayer initialPost={post} onClose={() => setShowPlayer(null)} />}
    <motion.div 
      className="glass-card p-5 flex flex-col gap-3 relative animate-fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {post.type === 'relay' && (
          <div className="text-xs text-muted-foreground font-bold mb-2 flex items-center gap-2">
              <Repeat2 size={14}/> Relayed by <Link href={`/squad/${post.userId}`} className="text-accent-cyan hover:underline">@{post.username}</Link>
          </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEdit} className="glass-card p-6 w-full max-w-md relative">
            <h3 className="text-xl font-headline font-bold mb-2 text-brand-gold">Edit Post</h3>
            <textarea
              className="w-full rounded-xl p-3 bg-black/60 text-foreground border-2 border-brand-gold"
              value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required
            />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="btn-glass" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn-glass bg-brand-gold text-background">Save</button>
            </div>
          </form>
        </div>
      )}

      {renderPostContent(post)}
      <ActionButtons />
      
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />}
      
      {showShareModal && (
        <ShareModal 
            url={`${window.location.origin}/post/${post.id}`}
            title={post.content}
            isVideo={post.type === 'media' && post.mediaUrl && (Array.isArray(post.mediaUrl) ? post.mediaUrl.some((url: string) => url.includes('.mp4')) : post.mediaUrl.includes('.mp4'))}
            onSignalShare={() => { setShowShareModal(false); setShowSignalShare(true); }}
            onClose={() => setShowShareModal(false)}
        />
      )}
      {showSignalShare && <SignalShareModal post={post} onClose={() => setShowSignalShare(false)}/>}
      {showCollectionModal && (
        <AddToCollectionModal 
            post={post}
            onClose={() => setShowCollectionModal(false)}
        />
      )}
    </motion.div>
    {isFullScreen && post.mediaUrl && !Array.isArray(post.mediaUrl) && (
        <div 
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setIsFullScreen(false)}
        >
            <button onClick={() => setIsFullScreen(false)} className="absolute top-4 right-4 text-white z-10">
                <X size={32} />
            </button>
            <motion.div 
                layoutId={`postcard-media-${post.id}`}
                className="relative w-full h-full"
            >
                <OptimizedImage 
                    src={post.mediaUrl}
                    alt={post.content || 'Full screen image'}
                    className="w-full h-full object-contain"
                />
                 <Watermark isAnimated={true} />
            </motion.div>
        </div>
    )}
    </>
  );
}

function CommentModal({ postId, postAuthorId, onClose, post }: { postId: string; postAuthorId: string; onClose: () => void; post: any }) {
  const [comments, setComments] = React.useState<any[]>([]);
  const [replyTo, setReplyTo] = React.useState<string | null>(null); // State to track which comment is being replied to

  React.useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const allComments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const threadedComments = allComments.filter(c => !c.parentId);
      threadedComments.forEach(p => {
        p.replies = allComments.filter(r => r.parentId === p.id);
      });
      setComments(threadedComments);
    });
    return () => unsub();
  }, [postId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-md relative flex flex-col">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h3 className="text-xl font-headline font-bold mb-4 text-brand-gold">Comments</h3>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 p-2">
          {comments.length === 0 ? (
            <div className="text-muted-foreground text-center">No comments yet. Be the first!</div>
          ) : (
            comments.map((comment) => (
              <CommentThread key={comment.id} comment={comment} postId={postId} postAuthorId={postAuthorId} replyTo={replyTo} setReplyTo={setReplyTo} />
            ))
          )}
        </div>
        <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={null} onCommentPosted={() => setReplyTo(null)} post={post} />
      </div>
    </div>
  );
}

function CommentThread({ comment, postId, postAuthorId, replyTo, setReplyTo }: { comment: any; postId: string; postAuthorId: string; replyTo: string | null; setReplyTo: (id: string | null) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <Comment comment={comment} onReply={() => setReplyTo(comment.id)} />
      {replyTo === comment.id && (
        <div className="ml-8">
          <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={comment.id} onCommentPosted={() => setReplyTo(null)} isReply post={comment} />
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 border-l-2 border-brand-gold/20 pl-4 flex flex-col gap-3">
          {comment.replies.map((reply: any) => (
            <CommentThread key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} replyTo={replyTo} setReplyTo={setReplyTo} />
          ))}
        </div>
      )}
    </div>
  );
}

function Comment({ comment, onReply }: { comment: any; onReply: () => void }) {
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchUserData() {
      if (comment.username && comment.avatar_url) {
        setUserData({ username: comment.username, avatar_url: comment.avatar_url, displayName: comment.displayName });
      } else if (comment.userId) {
        const userDoc = await getDoc(doc(db, "users", comment.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            username: data.username,
            avatar_url: data.avatar_url,
            displayName: data.name,
          });
        }
      }
    }
    fetchUserData();
  }, [comment.userId, comment.username, comment.avatar_url, comment.displayName]);

  const initials = userData?.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || userData?.username?.slice(0, 2).toUpperCase() || "U";
  
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
          {userData?.avatar_url ? <img src={userData.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{initials}</span>}
      </div>
      <div className="flex-1">
        <div className="bg-black/20 rounded-xl px-3 py-2 font-body">
          <div className="flex items-center gap-2">
            <Link href={`/squad/${comment.userId}`} className="font-bold text-brand-gold text-sm hover:underline">@{userData?.username || 'user'}</Link>
            <span className="text-xs text-muted-foreground">{comment.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
          </div>
          <p className="text-base">{comment.text}</p>
        </div>
        <button onClick={onReply} className="text-xs text-brand-gold font-bold mt-1 hover:underline">Reply</button>
      </div>
    </div>
  );
}

function CommentForm({ postId, postAuthorId, parentId, onCommentPosted, isReply = false, post }: { postId: string; postAuthorId: string; parentId: string | null; onCommentPosted: () => void; isReply?: boolean, post: any }) {
  const [newComment, setNewComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const user = auth.currentUser;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() || { name: user.displayName, username: user.displayName, avatar_url: user.photoURL };

    const commentData: any = {
      text: newComment,
      userId: user.uid,
      displayName: userData.name || user.displayName,
      username: userData.username || user.displayName,
      avatar_url: userData.avatar_url || user.photoURL,
      createdAt: serverTimestamp(),
      parentId: parentId,
    };

    await addDoc(collection(db, "posts", postId, "comments"), commentData);
    
    trackInteraction(user.uid, post.category, 'comment');

    if (postAuthorId !== user.uid) {
      const notifRef = collection(db, "notifications", postAuthorId, "user_notifications");
      await addDoc(notifRef, {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: userData.username || user.displayName,
        fromAvatarUrl: userData.avatar_url || user.photoURL,
        postId: postId,
        postContent: newComment.substring(0, 50),
        createdAt: serverTimestamp(),
        read: false,
      });
    }

    setNewComment("");
    setLoading(false);
    onCommentPosted();
  };
  
  return (
    <form onSubmit={handleAddComment} className="flex gap-2">
      <input
        type="text"
        className="input-glass flex-1"
        placeholder={isReply ? "Add a reply..." : "Add a comment..."}
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className="btn-glass px-4"
        disabled={loading || !newComment.trim()}
      >
        Post
      </button>
    </form>
  )
}
