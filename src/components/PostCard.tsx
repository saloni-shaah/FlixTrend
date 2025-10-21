
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
  const [editContent, setEditContent] = React.useState(post.content || "");
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoc(fsDoc(db, "posts", post.id), { content: editContent });
    setShowEdit(false);
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
                    {contentPost.isVideo && (
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
            <div className="flex flex-col gap-2 max-w-[calc(100%-80px)] self-end pointer-events-auto mb-4">
                <div className="flex items-center gap-2">
                    <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer w-fit">
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
                <PostActions post={post} isShortVibe={true} onCommentClick={() => setShowComments(true)} />
            </div>
            {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />}
        </div>
    );
  }

  return (
    <>
    <div className="glass-card p-5 flex flex-col gap-3 relative">
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
      <PostActions post={post} onCommentClick={() => setShowComments(true)} />
      
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} />}

    </div>
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

function Comment({ comment, onReply }: { comment: any; onReply: () => void; }) {
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchUserData() {
      if (comment.username && comment.avatar_url) {
        setUserData({ username: comment.username, avatar_url: comment.avatar_url, displayName: comment.displayName });
      } else if (comment.userId) {
        const userDoc = await getDoc(fsDoc(db, "users", comment.userId));
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

function CommentForm({ postId, postAuthorId, parentId, onCommentPosted, isReply = false, post }: { postId: string; postAuthorId: string; parentId: string | null; onCommentPosted: () => void; isReply?: boolean, post: any; }) {
  const [newComment, setNewComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const user = auth.currentUser;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    const userDoc = await getDoc(fsDoc(db, "users", user.uid));
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
    
    // Only notify if not replying to own comment or own post
    if (postAuthorId !== user.uid) {
        const notifRef = collection(db, "users", postAuthorId, "notifications");
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
