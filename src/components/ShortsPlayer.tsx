'use client';
import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { Play, Pause, Volume2, VolumeX, Star } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/utils/firebaseClient";
import { PostActions } from "@/components/PostActions";
import Link from "next/link";
import { FaMusic } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/video/ProgressBar";
import { useVideoPlayer, setGlobalActiveVideo } from "@/hooks/useVideoPlayer";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const db = getFirestore(app);

export const ShortsPlayer = forwardRef(
  (
    {
      post,
      isActive,
      onCommentClick,
      onDescriptionClick,
    }: {
      post: any;
      isActive: boolean;
      onCommentClick: (e: React.MouseEvent) => void;
      onDescriptionClick: (e: React.MouseEvent) => void;
    },
    ref
  ) => {
    const router = useRouter();
    const actionsRef = useRef<HTMLDivElement>(null);
    const { setIsFlowVideoPlaying } = useAppState();
    const [showStar, setShowStar] = React.useState(false);
    const isMobile = useIsMobile();

    const videoUrl = Array.isArray(post.mediaUrl)
      ? post.mediaUrl.find((u: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(u))
      : post.mediaUrl;

    const {
      videoRef,
      isPlaying,
      isMuted,
      progress,
      currentTime,
      duration,
      togglePlay,
      toggleMute,
      seek,
      setIsSeeking,
      handleTap,
      videoEvents,
      play,
    } = useVideoPlayer({ postId: post?.id, variant: "flow" });

    // Active control
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isActive) {
        setGlobalActiveVideo(video);
        play();
        setIsFlowVideoPlaying(true);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }, [isActive, play, setIsFlowVideoPlaying]);

    // Keyboard shortcuts
    useEffect(() => {
      if (!isActive) return;
      const onKey = (e: KeyboardEvent) => {
        if (["TEXTAREA", "INPUT"].includes((e.target as HTMLElement)?.tagName)) return;
        if (e.code === "Space") { e.preventDefault(); togglePlay(); }
        if (e.code === "KeyM") { e.preventDefault(); toggleMute(); }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [isActive, togglePlay, toggleMute]);

    useImperativeHandle(ref, () => ({ togglePlay, toggleMute }));

    const handleDoubleTap = () => {
      const likeBtn = document.querySelector<HTMLElement>('[data-like-button="true"]');
      if (likeBtn && !likeBtn.classList.contains("text-yellow-400")) {
        setShowStar(true);
        setTimeout(() => setShowStar(false), 1000);
        likeBtn.click();
      }
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (actionsRef.current?.contains(e.target as Node)) return;
      handleTap(togglePlay, handleDoubleTap)(e);
    };

    const handleProfileClick = async (e: React.MouseEvent, uid: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists() && snap.data().username) {
          router.push(`/squad/${snap.data().username}`);
        }
      } catch {}
    };

    return (
      <div
        className="relative w-full h-full bg-black flex items-center justify-center select-none"
        onClick={handleContainerClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        <OptimizedVideo
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
          preload="auto"
          loop
          controlsList="nodownload"
          {...videoEvents}
        />

        <AnimatePresence>
          {showStar && (
            <motion.div
              key="star"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * (2 * Math.PI);
                return (
                  <motion.div
                    key={i}
                    className="absolute bg-yellow-400 rounded-full"
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ x: Math.cos(angle) * 80, y: Math.sin(angle) * 80, scale: [0.5, 1, 0] }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ width: 20, height: 20 }}
                  />
                );
              })}
              <motion.div
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: [0, 1.4, 1.2], rotate: [-15, 10, 0] }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.6, ease: "backOut" }}
              >
                <Star className="text-yellow-400" fill="currentColor" stroke="white" strokeWidth={1} size={100} />
              </motion.div>
            </motion.div>
          )}

          {!isPlaying && (
            <motion.div
              key="play-icon"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/50 rounded-full p-4">
                <Play size={60} className="text-white drop-shadow-lg" fill="white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Top-right Mute Button (Both Desktop and Mobile) */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="absolute top-4 right-4 z-30 bg-black/40 p-2 rounded-full text-white hover:bg-black/70 transition pointer-events-auto"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* MOBILE LAYOUT */}
        {isMobile && (
          <>
            {/* Bottom overlay - Content and progress bar */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10 flex flex-col">
              {/* Content overlaid at bottom */}
              <div className="flex-1 flex items-end p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                <div className="flex items-end w-full gap-2 justify-between">
                  <div className="flex flex-col gap-2 text-white drop-shadow-lg flex-1 min-w-0 pointer-events-auto">
                    <p
                      onClick={onDescriptionClick}
                      className="text-white text-xs font-body line-clamp-2 cursor-pointer break-words"
                    >
                      {post.content}
                    </p>
                    {post.song && (
                      <div className="flex items-center gap-2 text-white/70 text-xs">
                        <FaMusic />
                        <span className="truncate max-w-[160px]">Original Audio</span>
                      </div>
                    )}
                  </div>

                  {/* Avatar and Actions on right side */}
                  <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    {/* Avatar - just above the comment button */}
                    <a
                      onClick={(e) => handleProfileClick(e, post.userId)}
                      className="flex items-center justify-center group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform flex-shrink-0">
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white">{post.displayName?.[0] || "U"}</span>
                        )}
                      </div>
                    </a>

                    {/* Actions/Comments */}
                    <div ref={actionsRef} className="flex flex-col gap-1">
                      <PostActions post={post} isShortVibe={true} onCommentClick={onCommentClick} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar at very bottom - centered, no padding */}
              <div className="pointer-events-auto w-full bg-gradient-to-t from-black/90 to-black/60 py-2 px-0">
                <div className="px-4">
                  <ProgressBar
                    progress={progress}
                    currentTime={currentTime}
                    duration={duration}
                    variant="flow"
                    onScrub={seek}
                    onScrubStart={() => setIsSeeking(true)}
                    onScrubEnd={() => setIsSeeking(false)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* DESKTOP LAYOUT */}
        {!isMobile && (
          <>
            {/* Bottom-left Panel - Avatar, Username, Description */}
            <div className="absolute left-0 bottom-0 p-6 max-w-sm pointer-events-none z-20">
              <div className="flex flex-col gap-4">
                {/* User Info */}
                <a
                  onClick={(e) => handleProfileClick(e, post.userId)}
                  className="flex items-center gap-3 group cursor-pointer pointer-events-auto"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-accent-green group-hover:scale-105 transition-transform flex-shrink-0">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white">{post.displayName?.[0] || "U"}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 pointer-events-auto">
                    <span className="font-headline text-white text-sm group-hover:underline">
                      @{post.username || "user"}
                    </span>
                    <span className="text-white/70 text-xs">{post.displayName || "User"}</span>
                  </div>
                </a>

                {/* Content/Description */}
                <div className="flex flex-col gap-2">
                  <p
                    onClick={onDescriptionClick}
                    className="text-white text-sm font-body cursor-pointer pointer-events-auto line-clamp-4 leading-relaxed drop-shadow-lg"
                  >
                    {post.content}
                  </p>
                  {post.song && (
                    <div className="flex items-center gap-2 text-white/70 text-xs pointer-events-auto">
                      <FaMusic />
                      <span className="truncate">Original Audio</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Actions only */}
            <div className="absolute right-0 bottom-0 p-6 flex flex-col items-center gap-4 pointer-events-none z-20">
              {/* Actions */}
              <div ref={actionsRef} className="flex flex-col gap-4 pointer-events-auto">
                <PostActions post={post} isShortVibe={true} onCommentClick={onCommentClick} />
              </div>
            </div>

            {/* Progress Bar at bottom - inside video space only */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-auto z-20 bg-gradient-to-t from-black/70 via-transparent to-transparent pb-1 px-0">
              <div className="px-4">
                <ProgressBar
                  progress={progress}
                  currentTime={currentTime}
                  duration={duration}
                  variant="flow"
                  onScrub={seek}
                  onScrubStart={() => setIsSeeking(true)}
                  onScrubEnd={() => setIsSeeking(false)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

ShortsPlayer.displayName = "ShortsPlayer";