"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { useRouter } from "next/navigation";

// ─── Context ────────────────────────────────────────────────────────────────
interface MiniPlayerState {
  postId: string;
  videoUrl: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
  isFlow?: boolean;
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
      <AnimatePresence>{current && <MiniPlayerUI state={current} onClose={close} />}</AnimatePresence>
    </MiniPlayerContext.Provider>
  );
}

// ─── UI ──────────────────────────────────────────────────────────────────────
function MiniPlayerUI({ state, onClose }: { state: MiniPlayerState; onClose: () => void }) {
  const router = useRouter();
  const dragRef = useRef({ x: 0, y: 0, dragging: false });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const { videoRef, isPlaying, isMuted, togglePlay, toggleMute, videoEvents } =
    useVideoPlayer({ postId: state.postId, variant: "mini" });

  // auto-play on mount
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.play().catch(() => {});
  }, []);

  const handleExpand = () => {
    onClose();
    router.push(state.isFlow ? `/flow/${state.postId}` : `/watch?v=${state.postId}`);
  };

  // drag
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => { dragRef.current.dragging = false; };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 40 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{ x: pos.x, y: pos.y }}
      className="fixed bottom-28 md:bottom-8 right-4 z-[9999] w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Video */}
      <div className="relative w-full aspect-video bg-black cursor-pointer" onClick={togglePlay}>
        <OptimizedVideo
          ref={videoRef}
          src={state.videoUrl}
          className="w-full h-full object-cover"
          playsInline
          loop
          preload="auto"
          muted={isMuted}
          controlsList="nodownload"
          style={{ pointerEvents: "none" }}
          {...videoEvents}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play size={32} fill="white" className="text-white" />
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/90 backdrop-blur-md">
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{state.title || "Now Playing"}</p>
          {state.username && (
            <p className="text-white/50 text-[10px] truncate">@{state.username}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleExpand(); }}
          className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}