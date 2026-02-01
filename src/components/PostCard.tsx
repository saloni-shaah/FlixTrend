
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, collection, query, onSnapshot, doc as fsDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { FaMusic } from "react-icons/fa";
import { Repeat2, MapPin, Smile, MoreVertical, Edit, Trash, Eye, Sparkles, Zap } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import Link from "next/link";
import { motion } from "framer-motion";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InFeedVideoPlayer } from './video/InFeedVideoPlayer';
import { PostActions } from './PostActions';
import { StreamViewer } from './StreamViewer';
import { EditPostModal } from './squad/EditPostModal';
import { CommentModal } from './CommentModal';

const db = getFirestore(app);
const functions = getFunctions(app);

const timeAgo = (timestamp: any): string => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) {
        return "Just now";
    }
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    const days = seconds / 86400;
    if (days < 2) return "Yesterday";
    if (days <= 7) return `${Math.floor(days)}d ago`;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
};

export function PostCard({ post, isShortVibe = false, collectionName = 'posts' }: { post: any; isShortVibe?: boolean, collectionName?: string }) {
  const [showComments, setShowComments] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [pollVotes, setPollVotes] = React.useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
  const [userPollVote, setUserPollVote] = React.useState<number | null>(null);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);

  const currentUser = auth.currentUser;
  const deletePostCallable = httpsCallable(functions, 'deletePost');

  const { totalVotes, maxVotes, maxVoteIndex } = useMemo(() => {
    if (post.type !== 'poll') return { totalVotes: 0, maxVotes: 0, maxVoteIndex: -1 };
    const voteCounts = Object.values(pollVotes).map(v => v.count);
    const total = voteCounts.reduce((sum, count) => sum + count, 0);
    const max = Math.max(0, ...voteCounts);
    const maxIndex = max > 0 ? voteCounts.indexOf(max) : -1;
    return { totalVotes: total, maxVotes: max, maxVoteIndex: maxIndex };
  }, [pollVotes, post.type]);
  
  React.useEffect(() => {
    if (!currentUser || post.type !== "poll" || !post.pollOptions) return;
    
    const unsubPollVotes = onSnapshot(collection(db, collectionName, post.id, "pollVotes"), (snap) => {
      const votes: { [optionIdx: number]: { count: number, voters: string[] } } = {};
      post.pollOptions.forEach((_:any, index:number) => {
          votes[index] = { count: 0, voters: [] };
      });

      let userVote: number | null = null;
      snap.forEach(doc => {
        const { optionIdx, userId } = doc.data();
        if (votes[optionIdx] !== undefined) {
            votes[optionIdx].count++;
            votes[optionIdx].voters.push(userId);
        }
        if (userId === currentUser.uid) userVote = optionIdx;
      });
      setPollVotes(votes);
      setUserPollVote(userVote);
    });

    return () => unsubPollVotes();
  }, [post.id, currentUser, post.type, post.pollOptions, collectionName]);

  useEffect(() => {
    const postRef = fsDoc(db, collectionName, post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
        if (doc.exists()) {
            setViewCount(doc.data().viewCount || 0);
        }
    });
    return () => unsubscribe();
  }, [post.id, collectionName]);

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
    await setDoc(fsDoc(db, collectionName, post.id, "pollVotes", currentUser.uid), { userId: currentUser.uid, optionIdx, createdAt: serverTimestamp() });
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
                    <span>{timeAgo(contentPost.createdAt)}</span>
                    {(contentPost.isVideo || contentPost.type === 'live') && (
                        <span className="flex items-center gap-1">
                            <Eye size={14} /> {viewCount.toLocaleString()}
                        </span>
                    )}
                    {currentUser?.uid === contentPost.userId && !isShortVibe && collectionName === 'posts' && (
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

            {contentPost.type === 'drop' && (
                <div className="text-xs text-accent-cyan font-bold mb-2 flex items-center gap-2 p-2 bg-accent-cyan/10 rounded-lg">
                <Sparkles size={16} />
                <span>DROP IN RESPONSE TO: "{contentPost.promptText}"</span>
                </div>
            )}

            {contentPost.type === "live" && contentPost.livekitRoom && contentPost.status === 'live' && (
                <div className="w-full aspect-video rounded-xl overflow-hidden mt-2">
                    <StreamViewer streamPost={contentPost} />
                </div>
            )}

            {contentPost.content && (
                 <div className={`whitespace-pre-line mb-2 px-4 py-3 rounded-xl ${isShortVibe ? 'text-white text-base line-clamp-2 text-left' : 'text-[1.15rem]'} ${contentPost.fontStyle || 'font-body'}`} style={{ backgroundColor: contentPost.backgroundColor && !isShortVibe ? contentPost.backgroundColor : 'transparent', color: contentPost.backgroundColor && contentPost.backgroundColor !== '#ffffff' && !isShortVibe ? 'hsl(var(--foreground))' : 'inherit', textShadow: isShortVibe ? "0 1px 4px #000" : "none" }}>
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

            {(contentPost.type === "media" || collectionName === "drops") && mediaUrls.length > 0 && !isShortVibe && (
                 <InFeedVideoPlayer 
                    mediaUrls={mediaUrls} 
                    post={contentPost}
                    navigatesToWatchPage={true}
                 />
            )}

            {contentPost.type === "poll" && contentPost.pollOptions && (
                <div className="flex flex-col gap-2.5 p-4">
                    <div className="font-bold text-brand-gold mb-3 text-lg">{contentPost.question}</div>
                    <motion.div className="flex flex-col gap-3">
                        {contentPost.pollOptions.map((opt: any, idx: number) => {
                            const voteData = pollVotes[idx] || { count: 0 };
                            const percent = totalVotes > 0 ? Math.round((voteData.count / totalVotes) * 100) : 0;
                            const hasVoted = userPollVote !== null;
                            const isQuiz = contentPost.correctAnswerIndex !== null && contentPost.correctAnswerIndex !== undefined;
                            
                            const isUserChoice = userPollVote === idx;
                            const isCorrectAnswer = isQuiz && contentPost.correctAnswerIndex === idx;
                            const isMostVoted = !isQuiz && idx === maxVoteIndex;

                            let barColor = "";
                            if (hasVoted) {
                                if(isQuiz) {
                                    barColor = isCorrectAnswer ? "bg-green-500" : (isUserChoice ? "bg-red-500" : "bg-gray-600/70");
                                } else {
                                    barColor = isMostVoted ? "bg-purple-500" : "bg-green-500/80";
                                }
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    className={`w-full p-3 rounded-xl font-bold transition-shadow relative overflow-hidden border-2`}
                                    onClick={() => handlePollVote(idx)}
                                    disabled={hasVoted}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 + 0.2 }}
                                    style={{
                                        borderColor: hasVoted && isUserChoice ? (isQuiz ? (isCorrectAnswer ? '#22c55e' : '#ef4444') : 'transparent') : 'transparent',
                                    }}
                                >
                                    {hasVoted &&
                                        <motion.div
                                            className={`absolute left-0 top-0 h-full ${barColor} opacity-40`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                        />
                                    }
                                    <div className="relative flex justify-between items-center z-10 px-2">
                                        <span className={`transition-colors ${hasVoted && isCorrectAnswer ? 'text-green-300' : ''}`}>{opt.text}</span>
                                        {hasVoted && <span className="text-sm text-gray-300 font-medium">{percent}% ({voteData.count})</span>}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
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
                <p className={`text-white text-sm line-clamp-3 ${post.fontStyle || 'font-body'}`}>{post.content || post.question}</p>
                 {post.song && (
                    <div className="flex items-center gap-2 text-white text-sm">
                        <FaMusic /> <span>{post.song.name} - {post.song.artists.join(", ")}</span>
                    </div>
                 )}
            </div>
            <div className="flex flex-col gap-4 self-end pointer-events-auto">
                <PostActions post={post} collectionName={collectionName} isShortVibe={true} onCommentClick={() => setShowComments(true)} />
            </div>
            {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} collectionName={collectionName} />}
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

      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )}

      {renderPostContent(post)}
      <PostActions post={post} onCommentClick={() => setShowComments(true)} collectionName={collectionName} />
      
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} collectionName={collectionName} />}

    </motion.div>
    </>
  );
}
