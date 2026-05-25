'use client';
import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { Watermark } from "@/components/video/Watermark";
import { TheaterModeContainer } from "@/components/video/TheaterModeContainer";
import { ProgressBar } from "@/components/video/ProgressBar";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Loader2, AlertTriangle, Youtube, PictureInPicture2,
  Subtitles, RotateCcw, RotateCw,
} from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useMiniPlayer } from "@/app/vibespace/miniplayer";

interface Props {
  videoUrl: string;
  videoQualities?: { [key: string]: string };
  thumbnailUrl?: string;
  postId: string;
  title?: string;
  captionsUrl?: string; // optional .vtt file URL
  isPortrait?: boolean;
}

export function LongFormVideoPlayer({
  videoUrl, videoQualities, thumbnailUrl, postId, title, captionsUrl, isPortrait = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambientFrameRef = useRef<number>(0);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  const [showControls, setShowControls] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<"left" | "right" | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [isLooping, setIsLooping] = useState(false);

  const {
    videoRef, isPlaying, isMuted, volume, progress, currentTime, duration,
    buffered, isLoading, isSeeking, error, playbackRate,
    togglePlay, toggleMute, setVolume, seek, seekSeconds, setIsSeeking,
    setPlaybackRate, videoEvents,
  } = useVideoPlayer({ postId, variant: "watch", title, videoUrl, thumbnailUrl });

  const router = useRouter();
  const { open: openMiniPlayer } = useMiniPlayer();
  const autoQuality = useNetworkQuality();

  // ── Persist volume ────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("ft-volume");
    if (saved !== null) setVolume(parseFloat(saved));
  }, []); // eslint-disable-line

  useEffect(() => {
    localStorage.setItem("ft-volume", String(volume));
  }, [volume]);

  // ── Quality ───────────────────────────────────────────────────────────────
  const availableQualities = useMemo(() => {
    if (!videoQualities) return [];
    const qualities = Object.keys(videoQualities);
    qualities.sort((a, b) => parseInt(b.replace('p', '')) - parseInt(a.replace('p', '')));
    return ["auto", ...qualities];
  }, [videoQualities]);

  const autoQualitySrc = useMemo(() => {
    if (!videoQualities || Object.keys(videoQualities).length === 0) return videoUrl;
    const sortedAvailable = Object.keys(videoQualities).sort((a, b) => parseInt(b.replace('p', '')) - parseInt(a.replace('p', '')));
    const idealQualityNum = parseInt(autoQuality.replace('p', ''));
    for (const q of sortedAvailable) {
      const qNum = parseInt(q.replace('p', ''));
      if (qNum <= idealQualityNum) return videoQualities[q];
    }
    return videoQualities[sortedAvailable[sortedAvailable.length - 1]];
  }, [autoQuality, videoQualities, videoUrl]);

  const activeSrc = useMemo(() => {
    return selectedQuality === "auto"
      ? autoQualitySrc
      : videoQualities?.[selectedQuality] ?? videoUrl;
  }, [selectedQuality, autoQualitySrc, videoQualities, videoUrl]);

  const activeQualityLabel = useMemo(() => {
    if (selectedQuality !== "auto") return selectedQuality;
    if (!videoQualities) return "auto";
    const match = Object.entries(videoQualities).find(([, v]) => v === autoQualitySrc);
    return match ? match[0] : autoQuality;
  }, [selectedQuality, autoQualitySrc, videoQualities, autoQuality]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.src === activeSrc) return;
    const savedTime = video.currentTime;
    const wasPlaying = !video.paused;
    video.src = activeSrc;
    const onLoaded = () => {
      video.currentTime = savedTime;
      if (wasPlaying) video.play().catch(() => {});
      video.removeEventListener("loadedmetadata", onLoaded);
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.load();
  }, [activeSrc, videoRef]);

  // ── Loop ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.loop = isLooping;
  }, [isLooping, videoRef]);

  // ── Captions ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !captionsUrl) return;
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.src = captionsUrl;
    track.label = "English";
    track.srclang = "en";
    video.appendChild(track);
    return () => { try { video.removeChild(track); } catch {} };
  }, [captionsUrl, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.textTracks).forEach((t) => {
      t.mode = captionsEnabled ? "showing" : "hidden";
    });
  }, [captionsEnabled, videoRef]);

  // ── Ambient mode ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!ambientMode || !canvas || !video) {
      cancelAnimationFrame(ambientFrameRef.current);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      ambientFrameRef.current = requestAnimationFrame(draw);
    };
    ambientFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(ambientFrameRef.current);
  }, [ambientMode, videoRef]);

  // ── Picture-in-Picture ────────────────────────────────────────────────────
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, [videoRef]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const lockLandscapeIfUseful = useCallback(async () => {
    if (isPortrait) return;
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary") => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {}
  }, [isPortrait]);

  const toggleFullScreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen().catch(() => {});
      await lockLandscapeIfUseful();
    } else {
      document.exitFullscreen();
    }
  }, [lockLandscapeIfUseful]);

  useEffect(() => {
    const h = () => {
      const fullScreen = !!document.fullscreenElement;
      setIsFullScreen(fullScreen);
      if (!fullScreen) {
        try { screen.orientation.unlock?.(); } catch {}
      }
    };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  }, [videoRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const hide = () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      setShowControls(false);
    };
    el.addEventListener("mousemove", resetControlsTimer);
    el.addEventListener("mouseleave", hide);
    return () => {
      el.removeEventListener("mousemove", resetControlsTimer);
      el.removeEventListener("mouseleave", hide);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      const validKeys = [" ","k","m","f","t","c","arrowleft","arrowright","arrowup","arrowdown","j","l","0","1","2","3","4","5","6","7","8","9"];
      if (!validKeys.includes(k)) return;
      e.preventDefault();
      switch (k) {
        case " ": case "k": togglePlay(); break;
        case "m": toggleMute(); break;
        case "f": toggleFullScreen(); break;
        case "t": setIsTheaterMode(p => !p); break;
        case "c": if (captionsUrl) setCaptionsEnabled(p => !p); break;
        case "arrowright": case "l": seekSeconds(5); flashSeek("right"); break;
        case "arrowleft":  case "j": seekSeconds(-5); flashSeek("left"); break;
        case "arrowup":   setVolume(Math.min(1, volume + 0.1)); break;
        case "arrowdown": setVolume(Math.max(0, volume - 0.1)); break;
        default:
          if (/^[0-9]$/.test(k) && duration) {
            const video = videoRef.current;
            if (video) video.currentTime = duration * (parseInt(k) / 10);
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleMute, seekSeconds, toggleFullScreen, duration, videoRef, volume, setVolume, captionsUrl]);

  // ── Settings outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!showSettings) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".settings-panel")) setShowSettings(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showSettings]);

  // ── Seek flash indicator ──────────────────────────────────────────────────
  const flashSeek = (dir: "left" | "right") => {
    setSeekIndicator(dir);
    setTimeout(() => setSeekIndicator(null), 700);
  };

  // ── Touch: double-tap seek, single tap show controls ─────────────────────
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const elapsed = now - lastTapRef.current.time;
    if (elapsed < 300) {
      const x = touch.clientX - rect.left;
      if (x < rect.width / 3) { seekSeconds(-10); flashSeek("left"); }
      else if (x > (rect.width * 2) / 3) { seekSeconds(10); flashSeek("right"); }
      else togglePlay();
    } else {
      resetControlsTimer();
    }
    lastTapRef.current = { time: now, x: touch.clientX };
  }, [seekSeconds, togglePlay, resetControlsTimer]);

  const effectiveVolume = isMuted ? 0 : volume;
  const visible = showControls || !isPlaying || showSettings;
  const mobileFrameClass = isPortrait ? "h-[72svh]" : "h-[33svh]";

  return (
    <TheaterModeContainer isTheaterMode={isTheaterMode}>
      <style jsx global>{`
        .video-player input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px; height: 13px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(168,85,247,0.6);
        }
        .video-player input[type="range"]::-moz-range-thumb {
          width: 13px; height: 13px;
          border-radius: 50%;
          background: #a855f7;
          border: none;
          cursor: pointer;
        }
        .seek-flash { animation: seekFlash 0.6s ease-out forwards; }
        @keyframes seekFlash {
          0%   { opacity: 1; transform: scale(1); }
          60%  { opacity: 0.8; transform: scale(1.15); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>

      {/* Ambient canvas sits OUTSIDE overflow-hidden so glow bleeds out */}
      <div ref={wrapperRef} className="relative">
        {ambientMode && (
          <canvas
            ref={canvasRef}
            width={160} height={90}
            className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] -z-10 opacity-70 pointer-events-none"
            style={{ filter: "blur(36px)", transform: "scale(1.05)" }}
          />
        )}

        <div
          ref={containerRef}
          className={`video-player relative w-full ${mobileFrameClass} md:h-auto md:aspect-video bg-black overflow-hidden select-none ${!visible ? "cursor-none" : "cursor-default"}`}
          onDoubleClick={toggleFullScreen}
          onTouchEnd={handleTouchEnd}
        >
          {/* Loading */}
          {(isLoading || isSeeking) && !error && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-900 text-white gap-2">
              <AlertTriangle className="text-yellow-500" size={40} />
              <p className="text-sm">Video failed to load</p>
              <button onClick={() => window.location.reload()} className="text-xs underline opacity-60 hover:opacity-100">
                Try again
              </button>
            </div>
          )}

          <OptimizedVideo
            ref={videoRef}
            src={activeSrc}
            poster={thumbnailUrl}
            className="w-full h-full object-contain"
            playsInline preload="metadata" controlsList="nodownload"
            {...videoEvents}
          />
          <Watermark isAnimated={isPlaying} />

          {/* Seek flash indicators */}
          {seekIndicator === "left" && (
            <div className="seek-flash absolute left-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 pointer-events-none">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => <RotateCcw key={i} size={i===1?28:20} className="text-white/80" />)}
              </div>
              <span className="text-white text-xs font-semibold">-10s</span>
            </div>
          )}
          {seekIndicator === "right" && (
            <div className="seek-flash absolute right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 pointer-events-none">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => <RotateCw key={i} size={i===1?28:20} className="text-white/80" />)}
              </div>
              <span className="text-white text-xs font-semibold">+10s</span>
            </div>
          )}

          {/* Click-to-play overlay (desktop only — touch handled by onTouchEnd) */}
          <div className="absolute inset-0 z-10 hidden md:block" onClick={togglePlay} />

          {/* ── Controls overlay ── */}
          <div
            className={`absolute inset-0 z-20 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          >
            {/* Top-left: Play + Volume */}
            <div className="p-2 md:p-3 flex items-start justify-between pointer-events-auto">
              <div
                className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button onClick={togglePlay} className="text-white/80 hover:text-white transition">
                  {isPlaying
                    ? <Pause size={18} className="md:w-5 md:h-5" fill="currentColor" />
                    : <Play  size={18} className="md:w-5 md:h-5" fill="currentColor" />}
                </button>

                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="text-white/80 hover:text-white transition">
                    {effectiveVolume === 0
                      ? <VolumeX size={16} className="md:w-[18px] md:h-[18px]" />
                      : <Volume2 size={16} className="md:w-[18px] md:h-[18px]" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={effectiveVolume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-0 group-hover/vol:w-16 md:group-hover/vol:w-20 h-1 transition-all duration-300 appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.85) ${effectiveVolume*100}%, rgba(255,255,255,0.15) ${effectiveVolume*100}%)`
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Quality badge top-right */}
                {availableQualities.length > 1 && (
                  <div className="hidden sm:block px-2 py-1 rounded-md bg-black/30 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-semibold">
                    {activeQualityLabel.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom */}
            <div
              className="bg-gradient-to-t from-black/75 via-black/30 to-transparent pt-8 md:pt-12 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Progress */}
              <div className="px-3 md:px-4 mb-1.5 md:mb-2">
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

              {/* Bottom row */}
              <div className="flex items-center justify-end px-3 md:px-4 pb-2 md:pb-3 gap-2 md:gap-3 text-white/80">
                {/* Theater */}
                <button
                  onClick={() => setIsTheaterMode(p => !p)}
                  className={`hidden md:flex p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${isTheaterMode ? "text-purple-400" : ""}`}
                  title="Theater mode (T)"
                >
                  <Youtube size={17} />
                </button>

                {/* PiP */}
                {"pictureInPictureEnabled" in document && (
                  <button
                    onClick={togglePiP}
                    className={`hidden md:flex p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${isPiP ? "text-purple-400" : ""}`}
                    title="Picture in picture"
                  >
                    <PictureInPicture2 size={17} />
                  </button>
                )}

                {/* Mini player */}
                <button
                  onClick={() => openMiniPlayer({ postId, videoUrl, title, isFlow: false })}
                  className="hidden sm:flex p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
                  title="Mini Player"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <rect x="12" y="10" width="9" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.5"/>
                  </svg>
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullScreen}
                  className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
                  title="Fullscreen (F)"
                >
                  {isFullScreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>

                {/* Settings */}
                <div className="relative settings-panel">
                  <button
                    onClick={() => setShowSettings(p => !p)}
                    className={`p-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${showSettings ? "text-purple-400 rotate-45" : "text-white/80"} duration-300`}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Settings size={17} />
                  </button>

                  {showSettings && (
                    <div
                      className="fixed md:absolute inset-x-3 bottom-4 md:inset-x-auto md:bottom-10 md:right-0 w-auto md:w-56 max-h-[68svh] overflow-y-auto rounded-2xl bg-black/90 md:bg-black/70 backdrop-blur-2xl border border-white/10 text-white/90 text-sm p-4 flex flex-col gap-4 shadow-2xl z-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {/* Quality */}
                      {availableQualities.length > 1 && (
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Quality</p>
                          <div className="flex flex-wrap gap-1.5">
                            {availableQualities.map((q) => (
                              <button
                                key={q}
                                onClick={() => setSelectedQuality(q)}
                                className={`px-2.5 py-1 rounded-full text-xs transition ${selectedQuality === q ? "bg-purple-500/80 text-white" : "bg-white/10 hover:bg-white/20"}`}
                              >
                                {q === "auto" ? `Auto · ${activeQualityLabel}` : q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Speed */}
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Speed</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                            <button
                              key={r}
                              onClick={() => setPlaybackRate(r)}
                              className={`px-2.5 py-1 rounded-full text-xs transition ${playbackRate === r ? "bg-purple-500/80 text-white" : "bg-white/10 hover:bg-white/20"}`}
                            >
                              {r === 1 ? "Normal" : `${r}×`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-col gap-2.5 border-t border-white/10 pt-3">
                        {/* Loop */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Loop</span>
                          <button
                            onClick={() => setIsLooping(p => !p)}
                            className={`w-9 h-5 rounded-full transition-colors relative ${isLooping ? "bg-purple-500" : "bg-white/20"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isLooping ? "left-4" : "left-0.5"}`} />
                          </button>
                        </div>

                        {/* Ambient */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Ambient Mode</span>
                          <button
                            onClick={() => setAmbientMode(p => !p)}
                            className={`w-9 h-5 rounded-full transition-colors relative ${ambientMode ? "bg-purple-500" : "bg-white/20"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${ambientMode ? "left-4" : "left-0.5"}`} />
                          </button>
                        </div>

                        {/* Captions — only show if a .vtt was passed */}
                        {captionsUrl && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs">
                              <Subtitles size={13} />
                              Captions
                              <kbd className="text-[9px] bg-white/10 px-1 rounded">C</kbd>
                            </span>
                            <button
                              onClick={() => setCaptionsEnabled(p => !p)}
                              className={`w-9 h-5 rounded-full transition-colors relative ${captionsEnabled ? "bg-purple-500" : "bg-white/20"}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${captionsEnabled ? "left-4" : "left-0.5"}`} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TheaterModeContainer>
  );
}
