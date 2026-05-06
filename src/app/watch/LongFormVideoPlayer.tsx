"use client";
import React, { useRef, useEffect } from "react";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { Watermark } from "@/components/video/Watermark";
import { TheaterModeContainer } from "@/components/video/TheaterModeContainer";
import { ProgressBar } from "@/components/video/ProgressBar";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Loader2, AlertTriangle, Youtube,
} from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useState } from "react";

const fmt = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

interface Props {
  videoUrl: string;
  thumbnailUrl?: string;
  postId: string;
  title?: string;
}

export function LongFormVideoPlayer({ videoUrl, thumbnailUrl, postId, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const {
    videoRef, isPlaying, isMuted, volume, progress, currentTime, duration,
    buffered, isLoading, isSeeking, error, playbackRate,
    togglePlay, toggleMute, setVolume, seek, seekSeconds, setIsSeeking,
    cyclePlaybackRate, videoEvents,
  } = useVideoPlayer({ postId, variant: "watch", title, videoUrl, thumbnailUrl });

  // Controls auto-hide
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const show = () => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (isPlaying) controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    };
    const hide = () => setShowControls(false);
    el.addEventListener("mousemove", show);
    el.addEventListener("mouseleave", hide);
    return () => {
      el.removeEventListener("mousemove", show);
      el.removeEventListener("mouseleave", hide);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (![" ", "k", "m", "f", "t", "arrowleft", "arrowright", "j", "l", "0","1","2","3","4","5","6","7","8","9"].includes(k)) return;
      e.preventDefault();
      switch (k) {
        case " ": case "k": togglePlay(); break;
        case "m": toggleMute(); break;
        case "f": toggleFullScreen(); break;
        case "t": setIsTheaterMode(p => !p); break;
        case "arrowright": case "l": seekSeconds(5); break;
        case "arrowleft": case "j": seekSeconds(-5); break;
        default:
          if (/^[0-9]$/.test(k) && duration) {
            const video = videoRef.current;
            if (video) video.currentTime = duration * (parseInt(k) / 10);
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleMute, seekSeconds, duration]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  const visible = showControls || !isPlaying;

  return (
    <TheaterModeContainer isTheaterMode={isTheaterMode}>
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-black overflow-hidden select-none ${!visible ? "cursor-none" : "cursor-default"}`}
        onDoubleClick={toggleFullScreen}
      >
        {(isLoading || isSeeking) && !error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-900 text-white">
            <AlertTriangle className="text-yellow-500 mb-2" size={40} />
            <p>Video failed to load</p>
            <button onClick={() => window.location.reload()} className="mt-3 text-sm underline opacity-70 hover:opacity-100">
              Try again
            </button>
          </div>
        )}

        <OptimizedVideo
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
          controlsList="nodownload"
          {...videoEvents}
        />
        <Watermark isAnimated={isPlaying} />

        {/* Click-to-play overlay */}
        <div className="absolute inset-0 z-10" onClick={togglePlay} />

        {/* Controls */}
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="px-4 mb-2" onMouseDown={(e) => e.stopPropagation()}>
            <ProgressBar
              progress={progress}
              buffered={buffered}
              currentTime={currentTime}
              duration={duration}
              variant="watch"
              onScrub={seek}
              onScrubStart={() => setIsSeeking(true)}
              onScrubEnd={() => setIsSeeking(false)}
            />
          </div>

          <div
            className="flex items-center justify-between px-4 pb-3 gap-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-accent-cyan transition text-white">
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-accent-cyan transition">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-cyan-500"
                />
              </div>

              <span className="text-white/70 text-sm font-mono">
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-white">
              <button
                onClick={cyclePlaybackRate}
                className="text-sm font-bold w-10 text-center hover:text-accent-cyan transition"
              >
                {playbackRate === 1 ? "1×" : `${playbackRate}×`}
              </button>
              <button onClick={() => setIsTheaterMode((p) => !p)} className={`hover:text-accent-cyan transition ${isTheaterMode ? "text-accent-cyan" : ""}`}>
                <Youtube size={20} />
              </button>
              <button onClick={toggleFullScreen} className="hover:scale-110 transition">
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <button className="hover:rotate-45 transition opacity-50 cursor-not-allowed">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TheaterModeContainer>
  );
}