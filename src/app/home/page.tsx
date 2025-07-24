"use client";
import React, { useState, useEffect } from "react";
import CreatePostModal from "./CreatePostModal";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, doc as fsDoc } from "firebase/firestore";
import { FaSearch } from "react-icons/fa";
import { FaRegHeart, FaRegComment } from "react-icons/fa";
import { auth } from "@/utils/firebaseClient";
import Link from "next/link";

const db = getFirestore();

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [flashes, setFlashes] = useState<any[]>([]);
  const [selectedFlash, setSelectedFlash] = useState<any | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAlmighty, setShowAlmighty] = useState(false);
  const [chat, setChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hey! I'm Almighty AI. Ask me anything about FlixTrend, or just say hi!" }
  ]);
  const [input, setInput] = useState("");

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
          (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (post.username && post.username.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : posts;

  return (
    <div className="flex flex-col min-h-screen pt-6 pb-24 px-2 md:px-8 bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#f1f5f9] dark:from-primary dark:via-secondary dark:to-accent-cyan transition-colors">
      {/* Centered, prominent search bar */}
      <div className="flex justify-center items-center mb-6 w-full">
        <div className="relative w-full max-w-2xl">
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
      <section className="mb-6">
        <h2 className="text-lg font-headline text-accent-cyan mb-2">Flashes</h2>
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
      <section className="flex-1 flex flex-col items-center">
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
      {/* Single Create Post FAB (top right) */}
      <button
        className="fixed top-4 right-4 z-50 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan p-5 shadow-fab-glow hover:scale-105 transition-all duration-200 focus:outline-none"
        title="Create Post"
        onClick={() => setShowModal(true)}
        aria-label="Create Post"
      >
        <span className="text-2xl">➕</span>
      </button>
      <CreatePostModal open={showModal} onClose={() => setShowModal(false)} />
      {selectedFlash && (
        <FlashModal flash={selectedFlash} onClose={() => setSelectedFlash(null)} />
      )}
      {/* Almighty AI FAB (bottom right) */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-tr from-accent-pink to-accent-cyan text-white p-5 rounded-full shadow-fab-glow hover:scale-110 transition-all duration-200 animate-bounce-slow"
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

  const handleLike = () => {
    setLiked((prev: boolean) => !prev);
    setLikeCount((prev: number) => (liked ? prev - 1 : prev + 1));
    // TODO: Add backend logic for like
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    await deleteDoc(fsDoc(db, "posts", post.id));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDoc(fsDoc(db, "posts", post.id), { content: editContent });
    setShowEdit(false);
  };

  // Use displayName or username for avatar initials
  const initials = post.displayName
    ? post.displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : post.username
    ? post.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-accent-cyan/20 flex flex-col gap-3 animate-pop transition-all relative">
      {/* Author avatar and username */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/squad/${post.userId}`} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accentPink to-accentCyan flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-accent-cyan group-hover:scale-105 transition-transform">
            {post.avatar_url ? (
              <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials
            )}
          </div>
          <span className="font-headline text-accent-cyan text-sm group-hover:underline">@{post.username || (post.displayName ? post.displayName.replace(/\s+/g, "").toLowerCase() : "user")}</span>
        </Link>
        <span className="ml-auto text-xs text-gray-400">{post.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</span>
      </div>
      {/* Edit/Delete menu for post owner */}
      {currentUser?.uid === post.userId && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button className="text-xs px-2 py-1 rounded bg-accent-cyan/20 text-accent-cyan font-bold hover:bg-accent-cyan/40" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="text-xs px-2 py-1 rounded bg-accent-pink/20 text-accent-pink font-bold hover:bg-accent-pink/40" onClick={handleDelete}>Delete</button>
        </div>
      )}
      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleEdit} className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-accent-cyan/20 flex flex-col gap-4">
            <h3 className="text-xl font-headline font-bold mb-2 text-accent-cyan">Edit Post</h3>
            <textarea
              className="w-full rounded-xl p-3 bg-black/60 text-[#E0E0E0] border-2 border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-pink font-semibold"
              style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)', fontFamily: 'Inter, Poppins, Roboto, sans-serif' }}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              required
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-black/40 text-gray-700 dark:text-white font-bold" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all">Save</button>
            </div>
          </form>
        </div>
      )}
      {/* Always show text content if present, with high contrast and better background */}
      {post.content && (
        <div className="post-text-bg text-[1.15rem] font-body animate-fade-in whitespace-pre-line mb-2 px-4 py-3 leading-relaxed tracking-wide font-semibold" style={{ color: '#E0E0E0', textShadow: '1px 1px 4px rgba(0,0,0,0.7)', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', fontFamily: 'Inter, Poppins, Roboto, sans-serif' }}>
          {post.content}
        </div>
      )}
      {post.type === "media" && post.mediaUrl && (
        <div className="w-full rounded-xl overflow-hidden animate-fade-in">
          {post.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={post.mediaUrl} controls className="w-full rounded-xl" />
          ) : (
            <img src={post.mediaUrl} alt="media" className="w-full rounded-xl" />
          )}
        </div>
      )}
      {post.type === "poll" && post.pollOptions && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="font-bold text-accent-cyan mb-1">{post.content}</div>
          {post.pollOptions.map((opt: string, idx: number) => (
            <button key={idx} className="w-full px-4 py-2 rounded-full bg-accent-cyan/10 text-accent-cyan font-bold hover:bg-accent-cyan/30 transition-all">
              {opt}
            </button>
          ))}
        </div>
      )}
      {/* Like & Comment Actions */}
      <div className="flex items-center gap-6 mt-2">
        <button
          className={`flex items-center gap-1 text-lg font-bold transition-all ${liked ? "text-accent-pink" : "text-gray-400 hover:text-accent-pink"}`}
          onClick={handleLike}
          aria-label="Like"
        >
          <FaRegHeart />
          <span>{likeCount}</span>
        </button>
        <button
          className="flex items-center gap-1 text-lg font-bold text-gray-400 hover:text-accent-cyan transition-all"
          onClick={handleComment}
          aria-label="Comment"
        >
          <FaRegComment />
          <span>{commentCount}</span>
        </button>
      </div>
      {showComments && <CommentModal postId={post.id} onClose={() => setShowComments(false)} />}
    </div>
  );
}

function CommentModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch comments in real-time
  React.useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-accent-cyan/20">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        <h3 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Comments</h3>
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto mb-4">
          {comments.length === 0 ? (
            <div className="text-gray-400 text-center">No comments yet. Be the first!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-black/60 rounded-xl px-3 py-2 text-[#E0E0E0] font-body" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
                {c.text}
                <div className="text-xs text-gray-400 mt-1">{c.createdAt?.toDate?.().toLocaleString?.() || "Just now"}</div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-full px-4 py-2 border border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan bg-white dark:bg-card text-black dark:text-white"
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-accent-cyan text-primary font-bold hover:bg-accent-pink hover:text-white transition-all disabled:opacity-60"
            disabled={loading || !newComment.trim()}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

function FlashModal({ flash, onClose }: { flash: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-card rounded-2xl p-6 w-full max-w-md relative animate-pop shadow-xl border border-gray-100 dark:border-accent-cyan/20 flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-accent-pink text-2xl">&times;</button>
        {flash.mediaUrl ? (
          flash.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={flash.mediaUrl} controls className="w-full rounded-xl mb-4" />
          ) : (
            <img src={flash.mediaUrl} alt="flash" className="w-full rounded-xl mb-4" />
          )
        ) : null}
        {/* Always show caption/text for flash, with high contrast */}
        {flash.caption && <div className="text-[#E0E0E0] font-semibold mb-2 whitespace-pre-line px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', textShadow: '1px 1px 4px rgba(0,0,0,0.7)', fontFamily: 'Inter, Poppins, Roboto, sans-serif' }}>{flash.caption}</div>}
        <div className="text-xs text-gray-400">Expires: {flash.expiresAt?.toDate?.().toLocaleString?.() || "in 24h"}</div>
      </div>
    </div>
  );
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