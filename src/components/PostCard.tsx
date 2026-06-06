"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getFirestore, onSnapshot, doc as fsDoc, serverTimestamp, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { FaMusic } from "react-icons/fa";
import { Repeat2, MapPin, Smile, MoreVertical, Edit, Trash, Eye, Sparkles, Zap, PlayCircle, Radio, Check } from "lucide-react";
import { auth, app } from '@/utils/firebaseClient';
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InFeedVideoPlayer } from '../components/InFeedVideoPlayer';
import { PostActions, pollColors, normalizePollData, setCachedPollVote } from './PostActions';
import { StreamViewer } from './StreamViewer';
import { EditPostModal } from './squad/EditPostModal';
import { CommentModal } from './CommentModal';
import { FullScreenImageViewer } from './FullScreenImageViewer';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

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

export function PostCard({ post, isShortVibe = false, collectionName = 'posts', allPosts, postIndex }: { post: any; isShortVibe?: boolean, collectionName?: string, allPosts?: any[], postIndex?: number }) {
  const [showComments, setShowComments] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [optimisticUserVote, setOptimisticUserVote] = React.useState<number | null>(null);
  const [livePostData, setLivePostData] = useState<any>(post);
  const [viewCount, setViewCount] = useState(post.viewCount || 0);
  const [playVideo, setPlayVideo] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [originalPost, setOriginalPost] = useState<any>(post.originalPost || null);
  const [originalPostLoading, setOriginalPostLoading] = useState(post.type === 'relay' && !post.originalPost);
  const currentUser = auth.currentUser;
  const activePost = post.type === 'relay' ? originalPost : livePostData;
  const activePollPostId = post.type === 'relay'
    ? (originalPost?.id || post.originalPostId || post.id)
    : post.id;
  const pollCollectionName = post.type === 'relay' ? 'posts' : collectionName;
  const pollModel = useMemo(
    () => normalizePollData(activePost, currentUser?.uid ?? null, optimisticUserVote),
    [activePost, currentUser?.uid, optimisticUserVote]
  );
  const router = useRouter();

  const handleProfileClick = async (e: React.MouseEvent, uid: string) => {
    e.preventDefault();
    if (!uid) return;

    const target = e.currentTarget as HTMLElement;
    const originalCursor = target.style.cursor;
    target.style.cursor = 'wait';

    try {
        const userDocRef = fsDoc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const currentUsername = userDocSnap.data().username;
            if (currentUsername) {
                router.push(`/squad/${currentUsername}`);
            } else {
                alert("This user does not have a profile page.");
            }
        } else {
            alert("User not found.");
        }
    } catch (error) {
        console.error("Error navigating to profile:", error);
        alert("Could not navigate to profile.");
    } finally {
        target.style.cursor = originalCursor;
    }
  };
  
  const author = useMemo(() => ({
      uid: post.userId,
      displayName: post.displayName,
      username: post.username,
      avatar_url: post.avatar_url,
  }), [post.userId, post.displayName, post.username, post.avatar_url]);

  const pollOptions = pollModel.options;
  const pollVoteCounts = useMemo(() => pollModel.options.map((option) => option.votes), [pollModel.options]);
  const pollPercentages = pollModel.percentages;
  const userPollVote = pollModel.userVote;
  const totalVotes = pollModel.totalVotes;

  useEffect(() => {
    setOptimisticUserVote(null);
  }, [activePollPostId, currentUser?.uid]);

  useEffect(() => {
    setLivePostData(post);
  }, [post]);

  useEffect(() => {
    const postRef = fsDoc(db, collectionName, post.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
        if (doc.exists()) {
            const data = { id: doc.id, ...(doc.data() as any) };
            setLivePostData(data);
            setViewCount(data.viewCount || 0);
        }
    });
    return () => unsubscribe();
  }, [post.id, collectionName]);

  useEffect(() => {
    if (post.type !== 'relay' || !post.originalPostId) {
      setOriginalPost(null);
      setOriginalPostLoading(false);
      return;
    }

    setOriginalPostLoading(true);
    const originalRef = fsDoc(db, 'posts', post.originalPostId);
    const unsubscribe = onSnapshot(originalRef, (snapshot) => {
      if (snapshot.exists()) {
        setOriginalPost({ id: snapshot.id, ...snapshot.data() });
      } else {
        setOriginalPost(null);
      }
      setOriginalPostLoading(false);
    }, (error) => {
      console.error('Error fetching relayed post:', error);
      setOriginalPost(null);
      setOriginalPostLoading(false);
    });

    return () => unsubscribe();
  }, [post.type, post.originalPostId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this post and all its interactions? This cannot be undone.")) {
      try {
        await deleteDoc(fsDoc(db, collectionName, post.id));
        alert(`Post has been successfully deleted.`);
      } catch (error: any) {
         alert(`Failed to delete post: ${(error as any).message}`);
      }
    }
  };

  const handlePollVote = async (optionIdx: number) => {
    if (!currentUser || userPollVote !== null || !activePollPostId || !activePost) return;

    const postRef = fsDoc(db, pollCollectionName, activePollPostId);
    const voteRef = fsDoc(db, pollCollectionName, activePollPostId, "pollVotes", currentUser.uid);
    const optimisticPreviousVote = optimisticUserVote;
    const optimisticPreviousPost = activePost;
    setOptimisticUserVote(optionIdx);

    try {
      const batch = writeBatch(db);
      let optimisticNextPost = activePost;

      if (Array.isArray(activePost.options) && activePost.options.length > 0) {
        const updatedOptions = activePost.options.map((option: any, idx: number) => (
          idx === optionIdx
            ? { ...option, votes: (Number(option?.votes ?? 0) || 0) + 1 }
            : option
        ));
        optimisticNextPost = { ...activePost, options: updatedOptions };
        batch.update(postRef, { options: updatedOptions });
      } else if (Array.isArray(activePost.pollOptions)) {
        optimisticNextPost = {
          ...activePost,
          pollVotes: {
            ...(activePost.pollVotes || {}),
            [currentUser.uid]: optionIdx,
          },
        };
        batch.update(postRef, { [`pollVotes.${currentUser.uid}`]: optionIdx });
      }

      if (post.type === 'relay') {
        setOriginalPost(optimisticNextPost);
      } else {
        setLivePostData(optimisticNextPost);
      }

      batch.set(voteRef, {
        userId: currentUser.uid,
        optionIdx,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setCachedPollVote(activePollPostId, currentUser.uid, optionIdx);
    } catch (error) {
      console.error('Error submitting poll vote:', error);
      setOptimisticUserVote(optimisticPreviousVote);
      if (post.type === 'relay') {
        setOriginalPost(optimisticPreviousPost);
      } else {
        setLivePostData(optimisticPreviousPost);
      }
      alert('Could not save your vote. Please try again.');
    }
  };
  
  const renderPostContent = (p: any) => {
    const isRelay = p.type === 'relay';
    const contentPost = isRelay ? originalPost : p;
    
    if (originalPostLoading) {
      return (
        <div className="text-muted-foreground p-4 border border-dashed border-gray-600 rounded-lg">
          Loading relayed post...
        </div>
      );
    }

    if (!contentPost) {
      return (
        <div className="text-muted-foreground p-4 border border-dashed border-gray-600 rounded-lg">
          This relayed content is no longer available. It may have been deleted by the original poster.
        </div>
      );
    }

    const contentAuthor = {
      uid: contentPost.userId,
      displayName: contentPost.displayName,
      username: contentPost.username,
      avatar_url: contentPost.avatar_url,
    };
    const initials = contentAuthor.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || contentAuthor.username?.slice(0, 2).toUpperCase() || "U";
    const mediaUrls = Array.isArray(contentPost.mediaUrl) ? contentPost.mediaUrl : (contentPost.mediaUrl ? [contentPost.mediaUrl] : []);
    const mediaContent = contentPost.type === "media" && mediaUrls.length > 0 && !isShortVibe;
    const defaultFontStyle = (contentPost.type === 'media' || contentPost.type === 'video') ? 'font-courgette' : 'font-body';
    const displayText = contentPost.type === 'poll' ? '' : contentPost.content;
    const pollQuestion = pollModel.question || 'Poll';
    const hasVoted = userPollVote !== null;
    const canVote = Boolean(currentUser) && !hasVoted && pollOptions.length > 0;

    return (
        <>
            <div className="flex items-center gap-3 mb-2">
                <a onClick={(e) => handleProfileClick(e, contentAuthor.uid)} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                        {contentAuthor.avatar_url ? <img src={contentAuthor.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{initials}</span>}
                    </div>
                    <span className="font-headline text-accent-green text-sm group-hover:underline">{contentAuthor.displayName || `@${contentAuthor.username || "user"}`}</span>
                </a>
                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{timeAgo(contentPost.createdAt)}</span>
                    {(contentPost.isVideo || contentPost.type === 'live') && (
                        <span className="flex items-center gap-1">
                            <Eye size={14} /> {(isRelay ? contentPost.viewCount || 0 : viewCount).toLocaleString()}
                        </span>
                    )}
                    {!isRelay && currentUser?.uid === contentPost.userId && !isShortVibe && collectionName === 'posts' && (
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

            {contentPost.type === "live" && (
                <Link href={`/live/${contentPost.livekitRoomName}`}>
                    <div className="w-full aspect-video rounded-xl overflow-hidden mt-2 relative group">
                        <img src={contentPost.thumbnailUrl} alt={contentPost.content} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                             <Radio className="text-red-500 animate-pulse" size={48} />
                        </div>
                         <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            LIVE
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                            <Sparkles className="inline-block mr-1" size={16} /> Premium
                        </div>
                    </div>
                </Link>
            )}

            {displayText && (
                 <div className={`whitespace-pre-line mb-2 px-4 py-3 rounded-xl ${isShortVibe ? 'text-white text-base line-clamp-2 text-left' : 'text-[1.15rem]'} ${contentPost.fontStyle || defaultFontStyle}`} style={{ backgroundColor: contentPost.backgroundColor && !isShortVibe ? contentPost.backgroundColor : 'transparent', color: contentPost.backgroundColor && contentPost.backgroundColor !== '#ffffff' && !isShortVibe ? 'hsl(var(--foreground))' : 'inherit', textShadow: isShortVibe ? "0 1px 4px #000" : "none" }}>
                    {displayText}
                </div>
            )}
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 my-2">
                {contentPost.location && <span className="flex items-center gap-1.5"><MapPin size={14}/> {contentPost.location}</span>}
                {contentPost.mood && <span className="flex items-center gap-1.5"><Smile size={14}/> Feeling {contentPost.mood}</span>}
            </div>

            {contentPost.hashtags && contentPost.hashtags.length > 0 && !isShortVibe && (
                <div className="flex flex-wrap gap-2">
                    {contentPost.hashtags.map((tag: string) => <Link href={`/search?q=%23${tag}`} key={tag} className="text-brand-gold font-bold text-sm hover:underline">#{tag}</Link>)}
                </div>
            )}

            {mediaContent ? (
                contentPost.isVideo ? (
                    contentPost.thumbnailUrl && !playVideo ? (
                    <div className="cursor-pointer relative rounded-xl overflow-hidden group" onClick={() => setPlayVideo(true)}>
                        <img src={contentPost.thumbnailUrl} alt={displayText || 'post thumbnail'} className="w-full h-auto object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/20">
                        <PlayCircle size={64} className="text-white/80 group-hover:text-white" />
                        </div>
                    </div>
                    ) : (
                        contentPost.isFlow ? (
                            <Link href={`/flow/${contentPost.id}`}>
                                <div className="cursor-pointer">
                                    <InFeedVideoPlayer
                                        mediaUrls={mediaUrls}
                                        post={contentPost}
                                        navigatesToWatchPage={false}
                                        startPlaying={playVideo}
                                    />
                                </div>
                            </Link>
                        ) : (
                            <InFeedVideoPlayer
                                mediaUrls={mediaUrls}
                                post={contentPost}
                                navigatesToWatchPage={true}
                                startPlaying={playVideo}
                            />
                        )
                    )
                ) : (
                    <div className={`mt-2 rounded-xl overflow-hidden w-full h-auto grid ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                        {mediaUrls.map((url: string, index: number) => (
                        <div key={index} className="group relative w-full h-full aspect-square overflow-hidden rounded-lg cursor-pointer" onClick={() => setFullScreenImage(url)}>
                            <img src={url} alt={`post image ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                             <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}></div>
                        </div>
                        ))}
                    </div>
                )
            ) : null}

            {contentPost.type === "poll" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-800/60 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-md">
                    <div className="mb-4">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-accent-cyan/70">Poll</div>
                        <div className="mt-2 text-lg font-bold text-white leading-snug">
                            {pollQuestion}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {pollOptions.length > 0 ? (
                            pollOptions.map((opt: any, idx: number) => {
                                const count = pollVoteCounts[idx] || 0;
                                const percent = pollPercentages[idx] || 0;
                                const isSelected = userPollVote === idx;
                                const isQuiz = pollModel.correctAnswerIndex !== null && pollModel.correctAnswerIndex !== undefined;
                                const isCorrectAnswer = isQuiz && pollModel.correctAnswerIndex === idx;
                                const color = pollColors[idx % pollColors.length];
                                const textColor = isSelected ? 'text-white' : 'text-slate-100';
                                const optionBorder = isSelected ? `${color}80` : 'rgba(255,255,255,0.08)';
                                const optionBackground = isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';

                                return (
                                    <motion.button
                                        key={`${idx}-${opt.text}`}
                                        type="button"
                                        onClick={() => canVote && handlePollVote(idx)}
                                        disabled={!canVote}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.06, duration: 0.35 }}
                                        whileHover={canVote ? { y: -1, scale: 1.01 } : undefined}
                                        className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${canVote ? 'cursor-pointer' : 'cursor-default'} ${isSelected ? 'shadow-lg' : 'hover:border-white/20'}`}
                                        style={{
                                            borderColor: optionBorder,
                                            backgroundColor: optionBackground,
                                            boxShadow: isSelected ? `0 0 0 1px ${color}33, 0 18px 30px rgba(0,0,0,0.16)` : 'none',
                                        }}
                                    >
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-2xl opacity-25"
                                            initial={false}
                                            animate={{ width: `${percent}%`, backgroundColor: color }}
                                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                                        />
                                        <div className="relative z-10 flex items-start gap-3">
                                            <div
                                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                    isSelected ? 'border-transparent text-black' : 'border-white/15 text-white/50'
                                                }`}
                                                style={{ backgroundColor: isSelected ? color : 'rgba(255,255,255,0.03)' }}
                                            >
                                                {isSelected ? <Check size={14} strokeWidth={3} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className={`break-words text-base font-semibold leading-snug ${textColor} ${isCorrectAnswer ? 'text-green-300' : ''}`}>
                                                        {opt.text}
                                                    </span>
                                                    <span className="shrink-0 text-sm font-bold text-white/80">
                                                        {percent}%
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        initial={false}
                                                        animate={{ width: `${percent}%`, backgroundColor: color }}
                                                        transition={{ duration: 0.7, ease: 'easeInOut' }}
                                                    />
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-xs text-white/55">
                                                    <span>{count.toLocaleString()} {count === 1 ? 'vote' : 'votes'}</span>
                                                    {isSelected && <span className="font-medium text-white/70">Your choice</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                                This poll does not have any options to display yet.
                            </div>
                        )}
                    </div>
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
                <a onClick={(e) => handleProfileClick(e, author.uid)} className="flex items-center gap-2 group cursor-pointer w-fit">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform">
                        {author.avatar_url ? <img src={author.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-white">{author.displayName?.[0] || 'U'}</span>}
                    </div>
                    <span className="font-headline text-white text-base group-hover:underline">{author.displayName || `@${author.username || "user"}`}</span>
                </a>
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
                <Repeat2 size={14}/> Relayed by <a onClick={(e) => handleProfileClick(e, author.uid)} className="text-accent-cyan hover:underline cursor-pointer">{author.displayName || `@${author.username}`}</a>
            </div>
        )}

      {post.type === 'relay' && post.content && (
        <div className="whitespace-pre-line rounded-xl bg-accent-green/10 border border-accent-green/20 px-4 py-3 text-[1.05rem] font-body">
          {post.content}
        </div>
      )}

      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )}

      <div className={post.type === 'relay' ? 'rounded-2xl border border-glass-border bg-black/20 p-4' : ''}>
        {renderPostContent(post)}
      </div>
      <PostActions post={post} onCommentClick={() => setShowComments(true)} collectionName={collectionName} />
      
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} post={post} collectionName={collectionName} />}

    </motion.div>
    <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
  </>
  );
}
