"use client";
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
  Flag, MoreHorizontal, Eye, Calendar, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const db = getFirestore(app);

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
  const u = Array.isArray(mediaUrl)
    ? mediaUrl.find((x: string) => /\.(mp4|webm)/i.test(x))
    : mediaUrl;
  return typeof u === "string" ? u : "";
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
        <VideoThumbnail src={vid} alt={post.title || "video"} />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-accent-cyan transition-colors">
          {post.title || post.content || "Untitled"}
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

  const goToProfile = async () => {
    if (!post.userId) return;
    try {
      const snap = await getDoc(doc(db, "users", post.userId));
      if (snap.exists() && snap.data().username) {
        router.push(`/squad/${snap.data().username}`);
      }
    } catch {}
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
        {post.content || "No description."}
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
        query(collection(db, "posts"), where("isVideo", "===", true), limit(20))
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
  const thumbUrl = getImageUrl(post.mediaUrl);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Main layout ── */}
      <div className="max-w-[1800px] mx-auto px-4 pt-4 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 watch-main">

          {/* ── Left: player + info ── */}
          <div className="flex-1 min-w-0">

            {/* Player */}
            <LongFormVideoPlayer
              videoUrl={videoUrl}
              thumbnailUrl={thumbUrl}
              postId={videoId!}
              title={post.title}
            />

            {/* Title */}
            <h1 className="text-lg md:text-xl font-bold text-white mt-4 leading-snug">
              {post.title || "Untitled"}
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