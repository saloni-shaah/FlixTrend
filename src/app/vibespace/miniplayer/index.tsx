"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Volume2, VolumeX, Maximize2, SkipForward } from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MiniPlayerState {
  postId: string;
  videoUrl: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
  isFlow?: boolean;
  queue?: MiniPlayerState[]; // optional up-next queue
}

interface MiniPlayerCtx {
  open: (state: MiniPlayerState) => void;
  close: () => void;
  current: MiniPlayerState | null;
}

const MiniPlayerContext = createContext<MiniPlayerCtx>({
  open: () => {},
  close: () => {},
  current: null,
});

export function useMiniPlayer() {
  return useContext(MiniPlayerContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function MiniPlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<MiniPlayerState | null>(null);
  const open = useCallback((state: MiniPlayerState) => setCurrent(state), []);
  const close = useCallback(() => setCurrent(null), []);

  return (
    <MiniPlayerContext.Provider value={{ open, close, current }}>
      {children}
      <AnimatePresence mode="wait">
        {current && <MiniPlayerUI key={current.postId} state={current} onClose={close} onNext={(next) => setCurrent(next)} />}
      </AnimatePresence>
    </MiniPlayerContext.Provider>
  );
}

// ─── UI ──────────────────────────────────────────────────────────────────────
function MiniPlayerUI({
  state,
  onClose,
  onNext,
}: {
  state: MiniPlayerState;
  onClose: () => void;
  onNext: (next: MiniPlayerState) => void;
}) {
  const router = useRouter();
  const isMobile = useRef(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    videoRef, isPlaying, isMuted, currentTime, duration,
    togglePlay, toggleMute, videoEvents,
  } = useVideoPlayer({ postId: state.postId, variant: "mini" });

  // Detect mobile
  useEffect(() => {
    isMobile.current = window.innerWidth < 768;
  }, []);

  // Auto-play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, [videoRef]);

  // Drag — only on desktop
  const onPointerDown = (e: React.PointerEvent) => {
    if (isMobile.current) return;
    setIsDragging(true);
    dragOrigin.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = dragOrigin.current.ox + (e.clientX - dragOrigin.current.px);
    const newY = dragOrigin.current.oy + (e.clientY - dragOrigin.current.py);
    // Clamp within viewport
    const el = containerRef.current;
    if (!el) { setPos({ x: newX, y: newY }); return; }
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth  - rect.width  - 16;
    const maxY = window.innerHeight - rect.height - 16;
    setPos({
      x: Math.max(-rect.left + 16, Math.min(newX, maxX - rect.left + 16)),
      y: Math.max(-rect.top  + 16, Math.min(newY, maxY - rect.top  + 16)),
    });
  };

  const onPointerUp = () => setIsDragging(false);

  const handleExpand = () => {
    onClose();
    router.push(state.isFlow ? `/flow/${state.postId}` : `/watch?v=${state.postId}`);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasNext = state.queue && state.queue.length > 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{ x: pos.x, y: pos.y }}
      className={[
        "fixed z-[9999] shadow-2xl",
        // Mobile: full-width strip at bottom
        "bottom-20 left-2 right-2 rounded-2xl",
        // Desktop: fixed-size card at bottom-right
        "md:bottom-6 md:right-5 md:left-auto md:w-[300px]",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)]">

        {/* ── Mobile: horizontal strip layout ── */}
        <div className="flex md:hidden items-center gap-3 p-2 pr-2">
          {/* Small thumbnail */}
          <div className="w-14 h-10 rounded-lg overflow-hidden bg-black shrink-0 relative">
            <OptimizedVideo
              ref={videoRef}
              src={state.videoUrl}
              className="w-full h-full object-cover"
              playsInline loop preload="auto"
              muted={isMuted}
              controlsList="nodownload"
              style={{ pointerEvents: "none" }}
              {...videoEvents}
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play size={14} fill="white" className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{state.title || "Now Playing"}</p>
            {state.username && <p className="text-white/40 text-[10px] truncate">@{state.username}</p>}
          </div>

          {/* Controls */}
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-1.5 text-white hover:text-white/70 transition">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleExpand(); }} className="p-1.5 text-white/60 hover:text-white transition">
            <Maximize2 size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 text-white/40 hover:text-white/80 transition">
            <X size={16} />
          </button>
        </div>

        {/* ── Desktop: card layout ── */}
        <div className="hidden md:block">
          {/* Video */}
          <div
            className="relative w-full aspect-video bg-black cursor-pointer"
            onClick={togglePlay}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <OptimizedVideo
              ref={videoRef}
              src={state.videoUrl}
              className="w-full h-full object-cover"
              playsInline loop preload="auto"
              muted={isMuted}
              controlsList="nodownload"
              style={{ pointerEvents: "none" }}
              {...videoEvents}
            />
            {/* Play overlay */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play size={24} fill="white" className="text-white ml-0.5" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expand + close overlays */}
            <button
              onClick={(e) => { e.stopPropagation(); handleExpand(); }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 transition"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/40 hover:text-white hover:bg-black/60 transition"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-white/10 relative">
            <motion.div
              className="h-full bg-purple-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: "linear" }}
            />
          </div>

          {/* Controls bar */}
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Avatar */}
            {state.avatarUrl ? (
              <img src={state.avatarUrl} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shrink-0" />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-tight">{state.title || "Now Playing"}</p>
              {state.username && <p className="text-white/40 text-[10px] truncate">@{state.username}</p>}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
              >
                {isPlaying
                  ? <Pause size={18} fill="currentColor" />
                  : <Play  size={18} fill="currentColor" />}
              </button>
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNext(state.queue![0]); }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition"
                  title="Next"
                >
                  <SkipForward size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile progress bar at very bottom */}
        <div className="md:hidden h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-purple-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}