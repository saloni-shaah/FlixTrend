'use client';
import 'regenerator-runtime/runtime';
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  doc, getDoc, getFirestore, collection, query, orderBy, limit,
  onSnapshot, setDoc, deleteDoc, serverTimestamp, getDocs, where,
} from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import Link from "next/link";
import Image from "next/image";
import { LongFormVideoPlayer } from "@/app/watch/LongFormVideoPlayer";
import { PostActions } from "@/components/PostActions";
import { CommentModal } from "@/components/CommentModal";
import { CommentComponent } from "@/components/CommentModal";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import {
  UserPlus, UserCheck, ChevronDown, ChevronUp, Share2,
  Flag, MoreHorizontal, Eye, Calendar, Clock, Search, Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const db = getFirestore(app);

export function WatchHeader({ 
  currentUserProfile,
}: { 
  currentUserProfile: any; 
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Keep input in sync while mic active
  useEffect(() => {
    if (listening && transcript) setSearchQuery(transcript);
  }, [transcript, listening]);

  // Auto-search when mic stops
  useEffect(() => {
    if (!listening && transcript.trim()) {
      router.push(`/search?q=${encodeURIComponent(transcript.trim())}`);
    }
  }, [listening]);

  const handleMicClick = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setSearchQuery('');
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-50 p-4 border-b border-white/5">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-2xl font-bold text-accent-cyan hover:text-accent-green transition-colors font-logo shrink-0"
        >
          Vibespace
        </Link>

        {currentUserProfile ? (
          <>
            {/* Search Bar */}
            <div className="flex-1 flex justify-center px-4 max-w-2xl">
              <form onSubmit={handleSearch} className={`w-full flex items-center bg-white/5 border rounded-full transition-all ${isSearchFocused ? 'border-accent-cyan/50 ring-2 ring-accent-cyan/20' : 'border-white/10'}`}>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!browserSupportsSpeechRecognition}
                  className={`p-2 pl-4 rounded-full shrink-0 transition-colors ${listening ? 'text-red-500 animate-pulse' : 'text-white/40 hover:text-white/80'}`}
                  aria-label="Voice search"
                >
                  <Mic size={18} />
                </button>
                <div className="w-px h-5 bg-white/10 mx-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder={listening ? 'Listening...' : 'Search videos...'}
                  className="flex-1 bg-transparent py-2 focus:outline-none transition-all min-w-0 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <button
                  type="submit"
                  className="p-2 pr-4 shrink-0 text-white/40 hover:text-accent-cyan transition-colors"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>

            {/* User Profile */}
            <div className="shrink-0">
              <Link href="/squad">
                <div className="w-10 h-10 rounded-full border-2 border-accent-pink overflow-hidden hover:scale-105 transition-transform">
                  <img 
                    src={currentUserProfile.avatar_url || 'https://via.placeholder.com/40'} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="shrink-0">
            <Link href="/login">
              <button className="px-5 py-2 rounded-full bg-accent-cyan text-black font-bold text-sm hover:bg-accent-cyan/90 transition-colors">
                Login
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function fmtViews(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(ts: any) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ""; }
}

function getVideoUrl(mediaUrl: any): string {
  if (!Array.isArray(mediaUrl)) {
    return typeof mediaUrl === 'string' && /\.(mp4|webm)/i.test(mediaUrl) ? mediaUrl : "";
  }
  const url720 = mediaUrl.find((x: string) => typeof x === 'string' && x.includes('720'));
  if (url720) return url720;
  const url1080 = mediaUrl.find((x: string) => typeof x === 'string' && x.includes('1080'));
  if (url1080) return url1080;
  const anyVideo = mediaUrl.find((x: string) => typeof x === 'string' && /\.(mp4|webm)/i.test(x));
  if (anyVideo) return anyVideo;
  return "";
}

function getVideoQualities(mediaUrl: any): { "1080p"?: string; "720p"?: string } | undefined {
    if (!Array.isArray(mediaUrl)) {
        return undefined;
    }
    const qualities: { "1080p"?: string; "720p"?: string } = {};
    const url1080 = mediaUrl.find(url => typeof url === 'string' && url.includes('1080'));
    const url720 = mediaUrl.find(url => typeof url === 'string' && url.includes('720'));
    if (url1080) qualities['1080p'] = url1080;
    if (url720) qualities['720p'] = url720;
    return Object.keys(qualities).length > 0 ? qualities : undefined;
}

function getImageUrl(mediaUrl: any): string {
  const u = Array.isArray(mediaUrl)
    ? mediaUrl.find((x: string) => /\.(jpg|jpeg|png|webp)/i.test(x))
    : "";
  return typeof u === "string" ? u : "";
}

// ─── Recommended card ────────────────────────────────────────────────────────
function RecCard({ post }: { post: any }) {
  const vid = getVideoUrl(post.mediaUrl);
  return (
    <Link
      href={`/watch?v=${post.id}`}
      className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
    >
      <div className="w-40 h-[90px] shrink-0 rounded-lg overflow-hidden bg-black relative">
        <VideoThumbnail src={vid} alt={post.content || "video"} />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-accent-cyan transition-colors">
          {post.content || "Untitled"}
        </p>
        <p className="text-xs text-white/50 mt-1">@{post.username}</p>
        <p className="text-xs text-white/40 mt-0.5">
          {fmtViews(post.viewCount)} views · {fmtDate(post.publishAt || post.createdAt)}
        </p>
      </div>
    </Link>
  );
}

// ─── Author section ──────────────────────────────────────────────────────────
function AuthorRow({
  author, post, currentUser, isFollowing, onFollow,
}: {
  author: any; post: any; currentUser: any; isFollowing: boolean; onFollow: () => void;
}) {
  const router = useRouter();

  const goToProfile = () => {
    if (!post.userId) return;
    router.push(`/squad`);
  };

  if (!author) return null;
  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={goToProfile} className="shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-green">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-white font-bold">
              {author.username?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>
      </button>
      <div className="flex-1 min-w-0" onClick={goToProfile} role="button">
        <p className="font-semibold text-sm text-white cursor-pointer hover:underline truncate">
          @{author.username || "user"}
        </p>
        <p className="text-xs text-white/50">
          {fmtViews(author.Follower_Count || 0)} followers
        </p>
      </div>
      {currentUser && currentUser.uid !== post.userId && (
        <button
          onClick={onFollow}
          className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
            isFollowing
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

// ─── Description box ─────────────────────────────────────────────────────────
function DescriptionBox({ post }: { post: any }) {
  const [expanded, setExpanded] = useState(false);

  const date = post.publishAt || post.createdAt;
  const views = post.viewCount || 0;

  return (
    <div
      className="mt-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors p-4 cursor-pointer"
      onClick={() => setExpanded((p) => !p)}
    >
      <div className="flex items-center gap-4 text-sm text-white/70 font-semibold mb-2">
        <span>{fmtViews(views)} views</span>
        <span>{fmtDate(date)}</span>
      </div>

      <p
        className={`text-sm text-white/80 whitespace-pre-line leading-relaxed transition-all ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        <strong>{post.content || ""}</strong>
        {post.description ? `\n\n${post.description}` : ""}
      </p>

      {post.hashtags?.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 mt-2 ${expanded ? "" : "hidden"}`}>
          {post.hashtags.map((t: string) => (
            <span key={t} className="text-accent-cyan text-xs hover:underline cursor-pointer">
              #{t}
            </span>
          ))}
        </div>
      )}

      <button className="flex items-center gap-1 text-xs text-white/50 mt-2 hover:text-white transition-colors">
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v");

  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showAllComments, setShowAllComments] = useState(false);

  const unsubRefs = useRef<Array<() => void>>([]);

  // Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      setCurrentUser(user);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setCurrentUserProfile({ uid: user.uid, ...snap.data() });
    });
    return () => unsub();
  }, []);

  // Data
  useEffect(() => {
    if (!videoId) { setError("No video ID."); setLoading(false); return; }
    unsubRefs.current.forEach((u) => u());
    unsubRefs.current = [];
    setLoading(true);

    const postRef = doc(db, "posts", videoId);
    const postUnsub = onSnapshot(postRef, async (snap) => {
      if (!snap.exists()) { setError("Video not found."); setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() };
      setPost(data);
      setLoading(false);

      // Author
      if (data.userId) {
        const authorUnsub = onSnapshot(doc(db, "users", data.userId), (aSnap) => {
          if (aSnap.exists()) {
            const aData = aSnap.data();
            setAuthor(aData);
            if (currentUser) {
              const followersCol = collection(db, "users", data.userId, "followers");
              getDoc(doc(followersCol, currentUser.uid)).then((d) =>
                setIsFollowing(d.exists())
              );
            }
          }
        });
        unsubRefs.current.push(authorUnsub);
      }

      // Comments
      const cUnsub = onSnapshot(
        query(collection(db, "posts", videoId, "comments"), orderBy("createdAt", "desc"), limit(5)),
        (s) => setComments(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
      unsubRefs.current.push(cUnsub);

      // Recommended
      const recSnap = await getDocs(
        query(collection(db, "posts"), where("isVideo", "==", true), limit(20))
      );
      setRecommended(
        recSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.id !== videoId && getVideoUrl(p.mediaUrl))
          .slice(0, 12)
      );
    });
    unsubRefs.current.push(postUnsub);

    return () => {
      unsubRefs.current.forEach((u) => u());
      unsubRefs.current = [];
    };
  }, [videoId, currentUser?.uid]);

  const handleFollow = async () => {
    if (!currentUser || !post?.userId) return;
    const followersRef = doc(db, "users", post.userId, "followers", currentUser.uid);
    const followingRef = doc(db, "users", currentUser.uid, "following", post.userId);
    if (isFollowing) {
      await deleteDoc(followersRef);
      await deleteDoc(followingRef);
      setIsFollowing(false);
    } else {
      await setDoc(followersRef, { followedAt: serverTimestamp(), userId: currentUser.uid });
      await setDoc(followingRef, { followedAt: serverTimestamp(), userId: post.userId });
      setIsFollowing(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent-cyan border-t-transparent" />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-white/60">
        {error || "Video not found."}
      </div>
    );
  }

  const videoUrl = getVideoUrl(post.mediaUrl);
  const videoQualities = post.videoQualities as { "1080p"?: string; "720p"?: string } | undefined
    ?? getVideoQualities(post.mediaUrl);
  const thumbUrl = getImageUrl(post.mediaUrl);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WatchHeader currentUserProfile={currentUserProfile} />
      {/* ── Main layout ── */}
      <div className="max-w-[1800px] mx-auto px-2 pt-4 pb-6 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 watch-main">

          {/* ── Left: player + info ── */}
          <div className="flex-1 min-w-0">

            {/* Player */}
            <LongFormVideoPlayer
              videoUrl={videoUrl}
              videoQualities={videoQualities}
              thumbnailUrl={thumbUrl}
              postId={videoId!}
              title={post.content}
              captionsUrl={post.captionsUrl ?? undefined}
            />

            {/* Title */}
            <h1 className="text-lg md:text-xl font-bold text-white mt-4 leading-snug">
              {post.content || "Untitled"}
            </h1>

            {/* Actions row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3">
              <AuthorRow
                author={author}
                post={post}
                currentUser={currentUser}
                isFollowing={isFollowing}
                onFollow={handleFollow}
              />
              <div className="flex items-center gap-2 sm:ml-auto">
                <PostActions post={post} onCommentClick={() => setShowCommentModal(true)} />
              </div>
            </div>

            {/* Description */}
            <DescriptionBox post={post} />

            {/* Comments (inline, YouTube style) */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-base font-bold text-white">
                  {post.commentCount || comments.length} Comments
                </h2>
              </div>

              <div className="flex flex-col divide-y divide-white/5">
                {comments.slice(0, showAllComments ? comments.length : 3).map((c) => (
                  <div key={c.id} className="py-3">
                    <CommentComponent
                      comment={c}
                      postId={videoId!}
                      currentUser={currentUser}
                      collectionName="posts"
                      onEdit={() => {}}
                    />
                  </div>
                ))}
              </div>

              {comments.length > 3 && (
                <button
                  onClick={() => setShowCommentModal(true)}
                  className="mt-4 text-sm text-accent-cyan hover:underline"
                >
                  View all {post.commentCount || comments.length} comments
                </button>
              )}
            </div>
          </div>

          {/* ── Right: recommended ── */}
          <aside className="watch-sidebar lg:w-[380px] xl:w-[420px] shrink-0">
            <p className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">
              Up next
            </p>
            <div className="flex flex-col gap-1">
              {recommended.map((r) => (
                <RecCard key={r.id} post={r} />
              ))}
              {recommended.length === 0 && (
                <p className="text-white/30 text-sm py-8 text-center">No recommendations yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Comment modal */}
      {showCommentModal && currentUser && videoId && (
        <CommentModal
          postId={videoId}
          postAuthorId={post.userId}
          onClose={() => setShowCommentModal(false)}
          post={post}
          collectionName="posts"
          isOpen={showCommentModal}
          isOverlay
        />
      )}
    </div>
  );
}
