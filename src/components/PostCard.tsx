"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import { FaPlay, FaRegComment, FaExclamationTriangle, FaVolumeMute, FaUserSlash, FaLink, FaMusic } from "react-icons/fa";
import { Repeat2, Star, Share, MessageCircle, Bookmark, MapPin, Smile, Download, X, MoreVertical, Check, ChevronRight, Circle, ThumbsUp, ThumbsDown, Edit, Trash, Eye } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShareModal } from './ShareModal';
import { SignalShareModal } from './SignalShareModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { OptimizedImage } from './OptimizedImage';
import { FlixTrendLogo } from './FlixTrendLogo';
import { savePostForOffline, isPostDownloaded, removeDownloadedPost } from '@/utils/offline-db';
import { getFunctions, httpsCallable } from "firebase/functions";
import { CheckCircle, Award, Mic, Crown, Zap, Rocket, Search, Pin, Phone, Mail, Folder } from "lucide-react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"
import { InFeedVideoPlayer } from './video/InFeedVideoPlayer';
import { PostActions } from './PostActions';
import { StreamViewer } from './StreamViewer';
// import { EditPostModal } from './squad/EditPostModal'; // Corrected Path


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
        "glass-card" /* Custom class for glassmorphism */,
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
  const [showComments, setShowComments] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [pollVotes, setPollVotes] = React.useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
  const [userPollVote, setUserPollVote] = React.useState<number | null>(null);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);

  const currentUser = auth.currentUser;
  const deletePostCallable = httpsCallable(functions, 'deletePost');
  
  React.useEffect(() => {
    if (!currentUser || post.type !== "poll" || !post.pollOptions) return;
    
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

    return () => unsubPollVotes();
  }, [post.id, currentUser, post.type, post.pollOptions]);

  // Real-time listener for viewCount
  useEffect(() => {
    const postRef = fsDoc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
        if (doc.exists()) {
            setViewCount(doc.data().viewCount || 0);
        }
    });
    return () => unsubscribe();
  }, [post.id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this post and all its interactions? This cannot be undone.")) {
      try {
        await deletePostCallable({ postId: post.id });
        alert(`Post ${post.id} has been successfully deleted.`);
      } catch (error: any) {
         alert(`Failed to delete post: ${(error as any).message}`);
      }
    }
  };

  const handlePollVote = async (optionIdx: number) => {
    if (!currentUser || userPollVote !== null) return;
    await setDoc(fsDoc(db, "posts", post.id, "pollVotes", currentUser.uid), { userId: currentUser.uid, optionIdx, createdAt: serverTimestamp() });
  };
  
  const renderPostContent = (p: any) => {
    const contentPost = p.type === 'relay' ? p.originalPost : p;
    const initials = contentPost.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || contentPost.username?.slice(0, 2).toUpperCase() || "U";
    const mediaUrls = Array.isArray(contentPost.mediaUrl) ? contentPost.mediaUrl : (contentPost.mediaUrl ? [contentPost.mediaUrl] : []);
    
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
                    {(contentPost.isVideo || contentPost.type === 'live') && (
                        <span className="flex items-center gap-1">
                            <Eye size={14} /> {viewCount.toLocaleString()}
                        </span>
                    )}
                    {currentUser?.uid === contentPost.userId && !isShortVibe && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-full hover:bg-white/10"><MoreVertical size={16}/></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="glass-card">
                                <DropdownMenuItem onClick={() => setShowEdit(true)}><Edit/> Edit Post</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:bg-red-500/20 focus:text-red-300"><Trash/> Delete Post</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {contentPost.type === "live" && contentPost.livekitRoom && contentPost.status === 'live' && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mt-2">
                    <StreamViewer streamPost={contentPost} />
                </div>
            )}

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

            {contentPost.type === "media" && mediaUrls.length > 0 && !isShortVibe && (
                 <InFeedVideoPlayer 
                    mediaUrls={mediaUrls} 
                    post={contentPost}
                 />
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
                        <Zap size={14}/>
                    </Link>
                </div>
            )}
        </>
    )
  }

  if (isShortVibe) {
    return (
        <div className="absolute inset-0 w-full h-full p-4 pr-8 flex items-end justify-between pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="flex-1 flex flex-col gap-2 self-end text-white drop-shadow-lg max-w-[calc(100%-80px)] pointer-events-auto">
                <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer w-fit">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                        {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{post.displayName?.[0] || 'U'}</span>}
                    </div>
                    <span className="font-headline text-white text-base group-hover:underline">@{post.username || "user"}</span>
                </Link>
                <p className="text-white text-sm font-body line-clamp-3">{post.content}</p>
                 {post.song && (
                    <div className="flex items-center gap-2 text-white text-sm">
                        <FaMusic /> <span>{post.song.name} - {post.song.artists.join(", ")}</span>
                    </div>
                 )}
            </div>
            <div className="flex flex-col gap-4 self-end pointer-events-auto">
                <PostActions post={post} isShortVibe={true} onCommentClick={() => setShowComments(true)} />
            </div>
            {/* {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />} */}
        </div>
    );
  }

  return (
    <>
    <motion.div 
      className="glass-card p-5 flex flex-col gap-3 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {post.type === 'relay' && (
          <div className="text-xs text-muted-foreground font-bold mb-2 flex items-center gap-2">
              <Repeat2 size={14}/> Relayed by <Link href={`/squad/${post.userId}`} className="text-accent-cyan hover:underline">@{post.username}</Link>
          </div>
      )}

      {/* {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )} */}

      {renderPostContent(post)}
      <PostActions post={post} onCommentClick={() => setShowComments(true)} />
      
      {/* {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />} */}

    </motion.div>
    </>
  );
}

// ... (rest of the file remains the same, omitting for brevity)
