"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { ProgressBar } from "@/components/video/ProgressBar";
import { useVideoPlayer, setGlobalActiveVideo } from "@/hooks/useVideoPlayer";

export function PlayerModal({ post, onClose }: { post: any; onClose: () => void }) {
  const videoUrl = Array.isArray(post.mediaUrl)
    ? post.mediaUrl.find((u: string) => /\.(mp4|webm)(\?.*)?$/i.test(u))
    : post.mediaUrl;

  const {
    videoRef, isPlaying, isMuted, progress, currentTime, duration,
    togglePlay, toggleMute, seek, setIsSeeking, videoEvents,
  } = useVideoPlayer({ postId: post?.id, variant: "watch" });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setGlobalActiveVideo(video);
    video.play().catch(() => {});
    return () => { video.pause(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "KeyM") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, togglePlay, toggleMute]);

  if (!videoUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-4xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video */}
          <div
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden"
            onClick={togglePlay}
          >
            <OptimizedVideo
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
              preload="auto"
              muted={isMuted}
              controlsList="nodownload"
              style={{ pointerEvents: "none" }}
              {...videoEvents}
            />

            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
                >
                  <div className="bg-black/60 rounded-full p-5">
                    <Play size={52} fill="white" className="text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mute button */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="absolute bottom-14 right-4 z-10 bg-black/60 p-2.5 rounded-full text-white hover:bg-black/80 transition"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Progress */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3 bg-gradient-to-t from-black/70 to-transparent">
              <ProgressBar
                progress={progress}
                currentTime={currentTime}
                duration={duration}
                variant="watch"
                onScrub={seek}
                onScrubStart={() => setIsSeeking(true)}
                onScrubEnd={() => setIsSeeking(false)}
              />
            </div>
          </div>

          {/* Post info */}
          <div className="mt-3 px-1">
            <p className="text-white font-semibold truncate">{post.title || post.content}</p>
            <p className="text-white/50 text-sm mt-0.5">@{post.username}</p>
          </div>
        </motion.div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
        >
          <X size={22} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}