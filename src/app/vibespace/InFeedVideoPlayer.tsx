"use client";
import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OptimizedVideo } from "../../components/OptimizedVideo";
import { Watermark } from "../../components/video/Watermark";
import {
  Play,
  ExternalLink,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ProgressBar } from "../../components/video/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";

let activeVideo: HTMLVideoElement | null = null;

const setActiveVideo = (video: HTMLVideoElement | null) => {
  if (activeVideo && activeVideo !== video) {
    activeVideo.pause();
  }
  activeVideo = video;
};

export function InFeedVideoPlayer({
  mediaUrls,
  post,
}: {
  mediaUrls: string[];
  post: any;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("volume_muted") === "true";
    }
    return true;
  });
  const [isVertical, setIsVertical] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const videoUrl = mediaUrls.find((url) =>
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
  );

  // preload
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.preload = "auto";
  }, []);

  // detect orientation
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsVertical(video.videoHeight > video.videoWidth);
  };

  // autoplay when visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveVideo(video);

          video.muted = isMuted;

          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              video.muted = true;
              setIsMuted(true);
              localStorage.setItem("volume_muted", "true");
              video.play().catch(() => {});
            });
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      if (activeVideo === video) activeVideo = null;
    };
  }, [isMuted]);

  // progress
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  // 🔥 PERFECT TAP SYSTEM
  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;

      // ❤️ DOUBLE TAP = LIKE
     setShowHeart(true);
     setTimeout(()=>setShowHeart(false),800);

      return;
    }

    tapTimeout.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        setActiveVideo(video);
        video.play();
      } else {
        video.pause();
      }

      tapTimeout.current = null;
    }, 250);
  };

  // 🔗 navigation (ONLY BUTTON)
  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!post?.id) return;

    const target = post.isFlow
      ? `/flow/${post.id}`
      : `/watch?v=${post.id}`;

    router.push(target);
  };

  // 🔊 mute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    localStorage.setItem("volume_muted", String(newMuted));
  };

  if (!videoUrl) return null;

  return (
    <div
      onClick={handleTap}
      onContextMenu={(e) => e.preventDefault()} // Prevent right-click
      className="w-full h-[75vh] relative bg-black mt-2 rounded-xl overflow-hidden"
    >
      <OptimizedVideo
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full ${
          isVertical ? "object-cover" : "object-contain"
        } transition-transform duration-300 ${
          isPlaying ? "scale-[1.01]" : "scale-1"
        }`}
        style={{ pointerEvents: "none" }} // 🔥 CRITICAL FIX
        playsInline
        preload="auto"
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        controlsList="nodownload" // Prevent download option in controls
      />

      {/* ❤️ DOUBLE TAP LIKE */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            key="heart"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
          >
            <Heart fill="red" stroke="white" strokeWidth={2} size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <Watermark />

      {/* ▶ PLAY OVERLAY */}
      {!isPlaying && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
          <Play size={60} className="text-white opacity-80" />
        </div>
      )}

      {/* 🔊 MUTE BUTTON */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-20 bg-black/60 p-3 rounded-full text-white backdrop-blur-md hover:bg-black/80 transition"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* 📊 PROGRESS */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <ProgressBar progress={progress} variant="feed" />
      </div>

      {/* 🔗 NAV BUTTON */}
      <button
        onClick={handleNavigate}
        className="absolute top-2 right-2 z-20 bg-black/60 p-2 rounded-full text-white hover:bg-black/90"
      >
        <ExternalLink size={18} />
      </button>
    </div>
  );
}
