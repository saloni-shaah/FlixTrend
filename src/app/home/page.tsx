"use client";
import React, { useState, useEffect } from "react";
import CreatePostModal from "./CreatePostModal";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc, setDoc, getDoc, doc } from "firebase/firestore";
import { FaSearch, FaPlay, FaBell } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa";
// Star Like Logo SVG
function StarLogo({ filled = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,3 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" fill={filled ? '#FFDF00' : 'none'} stroke="#FFDF00" strokeWidth="2" />
    </svg>
  );
}
// Custom Like Logo SVG
function LikeLogo({ filled = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="24" height="12" rx="6" fill={filled ? '#00F0FF' : 'none'} stroke="#00F0FF" strokeWidth="2" />
      <circle cx="16" cy="12" r="6" fill={filled ? '#FF3CAC' : 'none'} stroke="#FF3CAC" strokeWidth="2" />
      <circle cx="10" cy="10" r="2" fill="#00F0FF" />
      <circle cx="22" cy="10" r="2" fill="#00F0FF" />
    </svg>
  );
}
import { auth } from "@/utils/firebaseClient";
import Link from "next/link";

const db = getFirestore();

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlash, setSelectedFlash] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlmighty, setShowAlmighty] = useState(false);
  const [chat, setChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hey! I'm Almighty AI. Ask me anything about FlixTrend, or just say hi!" }
  ]);
  const [input, setInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "flashes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFlashes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Filtered posts for search
  const filteredPosts = searchTerm.trim()
    ? posts.filter(
        (post) =>
          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.hashtags && post.hashtags.some((h: string) => h.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : posts;

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 bg-white transition-colors">
      {/* Centered, prominent search bar */}
      <div className="flex justify-center items-center mb-6 w-full">
        <div className="relative w-full max-w-2xl bg-pink-100 rounded-2xl shadow-lg py-2">
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 rounded-full border border-accent-cyan/30 focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-white/90 dark:bg-card/90 text-gray-900 dark:text-white text-lg shadow font-body"
            placeholder="Search posts or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus={false}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-accent-cyan dark:text-accent-cyan pointer-events-none">
            <FaSearch />
          </span>
          {searchTerm && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-cyan text-xl"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {/* Flashes/Stories Section */}
      <section className="mb-6 bg-yellow-100 rounded-2xl shadow-lg p-4">
        <h2 className="text-lg font-headline bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-400 bg-clip-text text-transparent mb-2">Flashes</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {flashes.length === 0 && (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-3xl text-white opacity-60 border-4 border-accent-cyan/40 animate-bounce-slow">
              +
            </div>
          )}
          {flashes.map((flash) => (
            <button
              key={flash.id}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan border-4 border-accent-cyan/40 flex items-center justify-center overflow-hidden focus:outline-none"
              onClick={() => setSelectedFlash(flash)}
              title={flash.caption || "Flash"}
            >
              {flash.mediaUrl ? (
                flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={flash.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={flash.mediaUrl} alt="flash" className="w-full h-full object-cover" />
                )
              ) : (
                <span className="text-2xl text-white">⚡</span>
              )}
            </button>
          ))}
        </div>
      </section>
      {/* Feed Section */}
      <section className="flex-1 flex flex-col items-center bg-blue-100 rounded-2xl shadow-lg p-4 mt-4">
        {filteredPosts.length === 0 ? (
          <div className="text-gray-400 text-center mt-16 animate-fade-in">
            <div className="text-4xl mb-2">🪐</div>
            <div className="text-lg font-semibold">No posts yet</div>
            <div className="text-sm">When users join, their photos, videos, and vibes will appear here!</div>
          </div>
        ) : (
          <div className="w-full max-w-xl flex flex-col gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
      
      {/* Top Right FABs */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          className="rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-5 shadow-fab-glow hover:scale-105 transition-all duration-200 focus:outline-none glass"
          title="Notifications"
          onClick={() => setShowNotifications(true)}
          aria-label="Notifications"
        >
          <FaBell className="text-2xl text-white" />
        </button>
        <button
          className="rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan p-5 shadow-fab-glow hover:scale-105 transition-all duration-200 focus:outline-none glass"
          title="Create Post"
          onClick={() => setShowModal(true)}
          aria-label="Create Post"
        >
          <span className="text-2xl text-white">➕</span>
        </button>
      </div>

      <div className="fixed inset-0 z-50" style={{ pointerEvents: showModal || selectedFlash || showNotifications ? 'auto' : 'none' }}>
        {showModal && <div className="absolute inset-0 bg-orange-200/80" />}
        <CreatePostModal open={showModal} onClose={() => setShowModal(false)} />
        
        {selectedFlash && <div className="absolute inset-0 bg-orange-200/80" />}
        {selectedFlash && <FlashModal flash={selectedFlash} onClose={() => setSelectedFlash(null)} />}
        
        {showNotifications && <div className="absolute inset-0 bg-black/30" />}
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>
      
      {/* Almighty AI FAB (bottom right) */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-purple-400 text-white p-5 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200 animate-bounce-slow"
        aria-label="Almighty AI"
        onClick={() => setShowAlmighty(true)}
      >
        <span className="text-3xl">🤖</span>
      </button>

      {/* Almighty AI Chat Modal */}
      {showAlmighty && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-xs sm:max-w-sm bg-gradient-to-br from-secondary via-primary to-accent-cyan/30 rounded-2xl shadow-fab-glow border-2 border-accent-cyan/40 p-4 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline text-accent-pink text-lg">Almighty AI</span>
              <button onClick={() => setShowAlmighty(false)} className="text-accent-cyan hover:text-accent-pink text-xl font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-60 mb-2 space-y-2 scrollbar-hide">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] ${msg.sender === "ai" ? "bg-accent-cyan/10 text-accent-cyan" : "bg-accent-pink/20 text-accent-pink"}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!input.trim()) return;
                setChat([...chat, { sender: "user", text: input }]);
                setInput("");
                setTimeout(() => {
                  setChat(c => [...c, { sender: "ai", text: getAlmightyResponse(input) }]);
                }, 500);
              }}
              className="flex gap-2 mt-2"
            >
              <input
                className="flex-1 rounded-full px-4 py-2 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-white dark:bg-card text-black dark:text-white"
                placeholder="Ask Almighty..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all"
                disabled={!input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const currentUser = auth.currentUser;
  const [pollVotes, setPollVotes] = useState<{ [optionIdx: number]: number }>({});
  const [userPollVote, setUserPollVote] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);


  useEffect(() => {
    if (!currentUser) return;
    const likeDocRef = fsDoc(db, "posts", post.id, "likes", currentUser.uid);
    const unsubLike = onSnapshot(likeDocRef, (docSnap) => setLiked(docSnap.exists()));
    const likesColRef = collection(db, "posts", post.id, "likes");
    const unsubCount = onSnapshot(likesColRef, (snap) => setLikeCount(snap.size));
    const commentsColRef = collection(db, "posts", post.id, "comments");
    const unsubCommentCount = onSnapshot(commentsColRef, (snap) => setCommentCount(snap.size));

    if (post.type === "poll" && post.pollOptions) {
      const pollVotesCol = collection(db, "posts", post.id, "pollVotes");
      const unsubPollVotes = onSnapshot(pollVotesCol, (snap) => {
        const votes: { [optionIdx: number]: number } = {};
        let userVote: number | null = null;
        snap.docs.forEach(doc => {
          const { optionIdx, userId } = doc.data();
          votes[optionIdx] = (votes[optionIdx] || 0) + 1;
          if (userId === currentUser.uid) userVote = optionIdx;
        });
        setPollVotes(votes);
        setUserPollVote(userVote);
      });
      return () => unsubPollVotes();
    }
    return () => {
      unsubLike();
      unsubCount();
      unsubCommentCount();
    };
  }, [post.id, currentUser, post.type, post.pollOptions]);

  const handleLike = async () => {
    if (!currentUser) return;
    const likeDocRef = fsDoc(db, "posts", post.id, "likes", currentUser.uid);
    if (liked) {
      await deleteDoc(likeDocRef);
    } else {
      await setDoc(likeDocRef, { userId: currentUser.uid, createdAt: serverTimestamp() });
      if (post.userId !== currentUser.uid) {
        const notifRef = collection(db, "notifications", post.userId, "user_notifications");
        await addDoc(notifRef, {
          type: 'like',
          fromUserId: currentUser.uid,
          fromUsername: currentUser.displayName,
          fromAvatarUrl: currentUser.photoURL,
          postId: post.id,
          postContent: post.content.substring(0, 50),
          createdAt: serverTimestamp(),
          read: false,
        });
      }
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


  const initials = post.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || post.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="bg-cyan-100 dark:bg-card rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-accent-cyan/20 flex flex-col gap-3 animate-pop transition-all relative">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-accent-cyan group-hover:scale-105 transition-transform">
            {post.avatar_url ? <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <span className="font-headline text-accent-cyan text-sm group-hover:underline">@{post.username || "user"}</span>
        </Link>
        <span className="ml-auto text-xs text-gray-400">{post.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</span>
      </div>

      {currentUser?.uid === post.userId && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button className="text-xs px-2 py-1 rounded bg-accent-cyan/20 text-accent-cyan font-bold hover:bg-accent-cyan/40" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="text-xs px-2 py-1 rounded bg-accent-pink/20 text-accent-pink font-bold hover:bg-accent-pink/40" onClick={handleDelete}>Delete</button>
        </div>
      )}
      
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleEdit} className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative">
            <h3 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Edit Post</h3>
            <textarea
              className="w-full rounded-xl p-3 bg-black/60 text-[#E0E0E0] border-2 border-accent-cyan"
              value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required
            />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-black/40 text-gray-700 dark:text-white font-bold" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-accent-cyan text-primary font-bold">Save</button>
            </div>
          </form>
        </div>
      )}

      {post.content && (post.type !== 'poll' || (post.type === 'poll' && !post.pollOptions)) && (
        <div className="post-text-bg text-[1.15rem] font-body whitespace-pre-line mb-2 px-4 py-3 rounded-xl" style={{ backgroundColor: post.backgroundColor || 'transparent', color: post.backgroundColor && post.backgroundColor !== '#ffffff' ? '#000000' : 'inherit' }}>
          {post.content}
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag:string) => <Link href={`/tags/${tag}`} key={tag} className="text-accent-cyan font-bold text-sm hover:underline">#{tag}</Link>)}
          </div>
      )}
      
      {post.type === "media" && post.mediaUrl && (
        <div className="w-full rounded-xl overflow-hidden relative">
          {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <>
              <video ref={videoRef} src={post.mediaUrl} controls={isPlaying} className="w-full rounded-xl" onEnded={() => setIsPlaying(false)} />
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer" onClick={handlePlayVideo}>
                    {post.thumbnailUrl && <img src={post.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover"/>}
                    <div className="absolute">
                        <FaPlay className="text-white text-6xl opacity-80"/>
                    </div>
                </div>
              )}
            </>
          ) : (
            <img src={post.mediaUrl} alt="media" className="w-full rounded-xl" />
          )}
        </div>
      )}
      
      {post.type === "poll" && post.pollOptions && (
        <div className="flex flex-col gap-2 animate-fade-in bg-black/70 rounded-xl p-4">
          <div className="font-bold text-accent-cyan mb-3">{post.content}</div>
          {post.pollOptions.map((opt: string, idx: number) => {
            const votes = pollVotes[idx] || 0;
            const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            return (
              <button key={idx} className={`w-full px-4 py-2 rounded-full font-bold transition-all relative overflow-hidden ${userPollVote !== null ? 'cursor-default' : 'hover:bg-accent-cyan/40'}`}
                onClick={() => handlePollVote(idx)} disabled={userPollVote !== null}>
                {userPollVote !== null && <div className="absolute left-0 top-0 h-full bg-accent-cyan/50" style={{width: `${percent}%`}}/>}
                <div className="relative flex justify-between z-10">
                  <span>{opt}</span>
                  {userPollVote !== null && <span>{percent}% ({votes})</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-6 mt-2">
        <button className={`flex items-center gap-1 text-lg font-bold transition-all ${liked ? "text-red-400" : "text-gray-400 hover:text-red-400"}`} onClick={handleLike}>
          <StarLogo filled={liked} size={24} /> <span>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1 text-lg font-bold text-gray-400 hover:text-red-400 transition-all" onClick={() => setShowComments(true)}>
          <FaRegComment /> <span>{commentCount}</span>
        </button>
      </div>
      {showComments && <CommentModal postId={post.id} postAuthorId={post.userId} onClose={() => setShowComments(false)} />}
    </div>
  );
}

function CommentModal({ postId, postAuthorId, onClose }: { postId: string; postAuthorId: string; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null); // State to track which comment is being replied to

  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-accent-cyan/20">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h3 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Comments</h3>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4 p-2">
          {comments.length === 0 ? (
            <div className="text-gray-400 text-center">No comments yet. Be the first!</div>
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
        <div className="ml-8 border-l-2 border-accent-cyan/20 pl-4 flex flex-col gap-3">
          {comment.replies.map((reply: any) => (
            <CommentThread key={reply.id} comment={reply} postId={postId} postAuthorId={postAuthorId} replyTo={replyTo} setReplyTo={setReplyTo} />
          ))}
        </div>
      )}
    </div>
  );
}

function Comment({ comment, onReply }: { comment: any; onReply: () => void }) {
  const initials = comment.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || comment.username?.slice(0, 2).toUpperCase() || "U";
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
          {comment.avatar_url ? <img src={comment.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="flex-1">
        <div className="bg-black/60 rounded-xl px-3 py-2 text-[#E0E0E0] font-body">
          <div className="flex items-center gap-2">
            <Link href={`/squad/${comment.userId}`} className="font-bold text-accent-cyan text-sm hover:underline">@{comment.username || 'user'}</Link>
            <span className="text-xs text-gray-400">{comment.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
          </div>
          <p className="text-base">{comment.text}</p>
        </div>
        <button onClick={onReply} className="text-xs text-accent-cyan font-bold mt-1 hover:underline">Reply</button>
      </div>
    </div>
  );
}

function CommentForm({ postId, postAuthorId, parentId, onCommentPosted, isReply = false }: { postId: string; postAuthorId: string; parentId: string | null; onCommentPosted: () => void; isReply?: boolean }) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    
    let displayName = user.displayName || "";
    let username = "";
    let avatar_url = user.photoURL || "";
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        displayName = profileData.name || displayName;
        username = profileData.username || "";
        avatar_url = profileData.avatar_url || avatar_url;
    }

    const commentData: any = {
      text: newComment,
      userId: user.uid,
      displayName,
      username,
      avatar_url,
      createdAt: serverTimestamp(),
      parentId: parentId,
    };

    await addDoc(collection(db, "posts", postId, "comments"), commentData);

    if (postAuthorId !== user.uid) {
      const notifRef = collection(db, "notifications", postAuthorId, "user_notifications");
      await addDoc(notifRef, {
        type: 'comment',
        fromUserId: user.uid,
        fromUsername: user.displayName,
        fromAvatarUrl: user.photoURL,
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
        className="flex-1 rounded-full px-4 py-2 border border-accent-cyan bg-white dark:bg-card text-black dark:text-white"
        placeholder={isReply ? "Add a reply..." : "Add a comment..."}
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold disabled:opacity-60"
        disabled={loading || !newComment.trim()}
      >
        Post
      </button>
    </form>
  )
}


function FlashModal({ flash, onClose }: { flash: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        {flash.mediaUrl ? (
          flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={flash.mediaUrl} controls autoPlay className="w-full rounded-xl mb-4" />
          ) : (
            <img src={flash.mediaUrl} alt="flash" className="w-full rounded-xl mb-4" />
          )
        ) : null}
        {flash.caption && <div className="text-[#E0E0E0] font-semibold mb-2 whitespace-pre-line px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)' }}>{flash.caption}</div>}
        <div className="text-xs text-gray-400">Expires: {flash.expiresAt?.toDate?.().toLocaleString?.() || "in 24h"}</div>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications", currentUser.uid, "user_notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const getNotificationMessage = (notif: any) => {
    switch (notif.type) {
      case 'like':
        return <><span className="font-bold">{notif.fromUsername}</span> liked your post: "{notif.postContent}"</>;
      case 'comment':
        return <><span className="font-bold">{notif.fromUsername}</span> commented on your post: "{notif.postContent}"</>;
      case 'follow':
        return <><span className="font-bold">{notif.fromUsername}</span> started following you.</>;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-card shadow-lg animate-slide-in-right border-l border-accent-cyan/20">
      <div className="flex items-center justify-between p-4 border-b border-accent-cyan/20">
        <h3 className="text-xl font-headline font-bold text-accent-cyan">Notifications</h3>
        <button onClick={onClose} className="text-accent-pink text-2xl">&times;</button>
      </div>
      <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="text-gray-400 text-center mt-16">No new notifications.</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/60 hover:bg-accent-cyan/10 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan overflow-hidden">
                {notif.fromAvatarUrl && <img src={notif.fromAvatarUrl} alt="avatar" className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1 text-sm text-[#E0E0E0]">
                {getNotificationMessage(notif)}
                <div className="text-xs text-gray-400 mt-1">{notif.createdAt?.toDate().toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


function getAlmightyResponse(message: string): string {
  const msg = message.toLowerCase();
  if (["hi", "hello", "hey", "yo"].some((greet) => msg.includes(greet))) {
    return "Heyyy 👋! Welcome to FlixTrend, where the vibes are always trending!";
  }
  if (msg.includes("explain") && msg.includes("app")) {
    return "FlixTrend is a Gen-Z social app for sharing flashes (stories), vibing with posts, exploring trends, and chatting with Almighty AI. Create, connect, and vibe in style!";
  }
  if (msg.includes("joke") || msg.includes("laugh")) {
    const jokes = [
      "Why did the influencer go broke? Because they lost their followers! 😆",
      "Why don't secrets last on FlixTrend? Because the vibes are always trending!",
      "Why did the phone go to therapy? Too many toxic notifications!",
      "Why did the Gen-Z bring a ladder to the app? To reach the next level of hype!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  return "I'm Almighty AI 🤖 – your hype assistant! Ask me anything, or just vibe ✨.";
}
