
"use client";

import React from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, getDoc, doc, runTransaction } from "firebase/firestore";
import { FaPlay, FaRegComment, FaExclamationTriangle, FaVolumeMute, FaUserSlash, FaLink, FaEllipsisV, FaMusic } from "react-icons/fa";
import { Repeat2, Star, Share, MessageCircle } from "lucide-react";
import { auth } from "@/utils/firebaseClient";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShareModal } from './ShareModal';

const db = getFirestore();

export function PostCard({ post }: { post: any }) {
  const [isStarred, setIsStarred] = React.useState(false);
  const [starCount, setStarCount] = React.useState(post.starCount || 0);
  const [isRelayed, setIsRelayed] = React.useState(false);
  const [relayCount, setRelayCount] = React.useState(post.relayCount || 0);
  const [commentCount, setCommentCount] = React.useState(post.commentCount || 0);
  const [showComments, setShowComments] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [editContent, setEditContent] = React.useState(post.content || "");
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const currentUser = auth.currentUser;
  const [pollVotes, setPollVotes] = React.useState<{ [optionIdx: number]: { count: number, voters: string[] } }>({});
  const [userPollVote, setUserPollVote] = React.useState<number | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);


  React.useEffect(() => {
    if (!currentUser) return;

    const unsubscribes: (() => void)[] = [];

    // Starred post check
    const starredDocRef = fsDoc(db, "users", currentUser.uid, "starredPosts", post.id);
    const unsubStarred = onSnapshot(starredDocRef, (docSnap) => {
        setIsStarred(docSnap.exists());
    });
    unsubscribes.push(unsubStarred);
    
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
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [post.id, currentUser, post.type, post.pollOptions]);

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
        // We'll run this as a transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(fsDoc(db, "users", currentUser.uid));
            if (!userDoc.exists()) throw new Error("User profile not found");
            const userData = userDoc.data();

            const relayRef = fsDoc(db, "posts", post.id, "relays", currentUser.uid);
            const relaySnap = await transaction.get(relayRef);

            if (relaySnap.exists()) {
                // User has already relayed, so we should "un-relay"
                // This is a bit more complex, would need to find the relayed post and delete it.
                // For now, we'll just prevent duplicate relays.
                console.log("Already relayed");
                return;
            }

            // Create a new post of type 'relay'
            const newPostRef = doc(collection(db, "posts"));
            transaction.set(newPostRef, {
                type: 'relay',
                originalPost: post, // Embed original post data
                originalPostId: post.id,
                userId: currentUser.uid,
                displayName: userData.name || currentUser.displayName,
                username: userData.username,
                avatar_url: userData.avatar_url,
                createdAt: serverTimestamp(),
            });
            
            // Mark that this user has relayed this post
            transaction.set(relayRef, {
                userId: currentUser.uid,
                relayedAt: serverTimestamp(),
            });

            // Notify original poster if not relaying own post
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

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) await deleteDoc(fsDoc(db, "posts", post.id));
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
  
  const handlePlayVideo = () => {
      if (videoRef.current) {
          setIsPlaying(true);
          videoRef.current.play();
      }
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
  
  const toggleSong = () => {
      if (audioRef.current) {
          if (audioRef.current.paused) {
              audioRef.current.play();
          } else {
              audioRef.current.pause();
          }
      }
  }

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
                <div className="text-[1.15rem] font-body whitespace-pre-line mb-2 px-4 py-3 rounded-xl" style={{ backgroundColor: contentPost.backgroundColor || 'transparent', color: contentPost.backgroundColor && contentPost.backgroundColor !== '#ffffff' ? 'hsl(var(--foreground))' : 'inherit' }}>
                    {contentPost.content}
                </div>
            )}

            {contentPost.hashtags && contentPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {contentPost.hashtags.map((tag: string) => <Link href={`/tags/${tag}`} key={tag} className="text-brand-gold font-bold text-sm hover:underline">#{tag}</Link>)}
                </div>
            )}

            {(contentPost.type === "media" || contentPost.type === "audio") && contentPost.mediaUrl && (
                <div className="w-full rounded-xl overflow-hidden relative">
                    {contentPost.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                        <>
                            <video ref={videoRef} src={contentPost.mediaUrl} controls={isPlaying} className="w-full rounded-xl" onEnded={() => setIsPlaying(false)} />
                            {!isPlaying && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer" onClick={handlePlayVideo}>
                                    {contentPost.thumbnailUrl && <img src={contentPost.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />}
                                    <div className="absolute">
                                        <FaPlay className="text-white text-6xl opacity-80" />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : contentPost.mediaUrl.match(/\.(mp3|wav|oga|m4a)$/i) || contentPost.type === 'audio' ? (
                        <audio src={contentPost.mediaUrl} controls className="w-full" />
                    ) : (
                        <img src={contentPost.mediaUrl} alt="media" className="w-full rounded-xl" />
                    )}
                </div>
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
                    <button onClick={toggleSong} className="p-3 rounded-full bg-brand-gold text-background shadow-lg hover:scale-110 transition-transform">
                        <FaMusic />
                    </button>
                </div>
            )}
        </>
    )
  }

  return (
    <motion.div 
      className="glass-card p-5 flex flex-col gap-3 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {post.type === 'relay' && (
          <div className="text-xs text-muted-foreground font-bold mb-2 flex items-center gap-2">
              <Repeat2 size={14}/> Relayed by <Link href={`/squad/${post.userId}`} className="text-accent-cyan hover:underline">@{post.username}</Link>
          </div>
      )}

      <div className="relative">
        {currentUser?.uid === post.userId && post.type !== 'relay' && (
            <div className="absolute top-0 right-0 flex gap-2 z-10">
                <button className="text-xs px-2 py-1 rounded bg-white/10 text-white font-bold hover:bg-white/20" onClick={() => setShowEdit(true)}>Edit</button>
                <button className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-bold hover:bg-red-500/40" onClick={handleDelete}>Delete</button>
            </div>
        )}
      </div>
      
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


      <div className="flex items-center justify-start gap-6 mt-2 pt-2 border-t border-glass-border">
        <button className="flex items-center gap-1.5 text-lg font-bold text-muted-foreground hover:text-brand-gold transition-all" onClick={() => setShowComments(true)}>
          <MessageCircle size={20} /> <span className="text-sm">{commentCount}</span>
        </button>
        <button className={`flex items-center gap-1.5 text-lg font-bold transition-all ${isRelayed ? "text-green-400" : "text-muted-foreground hover:text-green-400"}`} onClick={handleRelay} >
          <Repeat2 size={20} /> <span className="text-sm">{relayCount}</span>
        </button>
        <button className={`flex items-center gap-1.5 text-lg font-bold transition-all ${isStarred ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} onClick={handleStar}>
          <Star size={20} fill={isStarred ? "currentColor" : "none"} /> <span className="text-sm">{starCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-lg font-bold text-muted-foreground hover:text-accent-cyan transition-all" onClick={() => setShowShareModal(true)}>
          <Share size={20} />
        </button>
      </div>
      
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} />}
      
      {showShareModal && (
        <ShareModal 
            url={`${window.location.origin}/post/${post.id}`}
            onClose={() => setShowShareModal(false)}
        />
      )}
    </motion.div>
  );
}

function CommentModal({ postId, postAuthorId, onClose }: { postId: string; postAuthorId: string; onClose: () => void }) {
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
        <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={null} onCommentPosted={() => setReplyTo(null)} />
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
          <CommentForm postId={postId} postAuthorId={postAuthorId} parentId={comment.id} onCommentPosted={() => setReplyTo(null)} isReply />
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

function CommentForm({ postId, postAuthorId, parentId, onCommentPosted, isReply = false }: { postId: string; postAuthorId: string; parentId: string | null; onCommentPosted: () => void; isReply?: boolean }) {
  const [newComment, setNewComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const user = auth.currentUser;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setLoading(true);

    // Fetch full user profile to embed in comment
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
