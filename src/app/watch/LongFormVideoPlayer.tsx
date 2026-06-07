'use client';
import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { OptimizedVideo } from "@/components/OptimizedVideo";
import { Watermark } from "@/components/video/Watermark";
import { TheaterModeContainer } from "@/components/video/TheaterModeContainer";
import { ProgressBar } from "@/components/video/ProgressBar";
import { WatchSettingsPanel } from "@/app/watch/WatchSettingsPanel";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Loader2, AlertTriangle, Youtube, PictureInPicture2,
  RotateCcw, RotateCw,
} from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useNetworkQuality } from "@/hooks/useNetworkQuality";
import { useMiniPlayer } from "@/app/vibespace/miniplayer";
import { useStableVolume } from "@/hooks/useStableVolume";
import type { StableVolumeStrength } from "@/lib/audio/stableVolume";

interface Props {
  videoUrl: string;
  videoQualities?: { [key: string]: string };
  thumbnailUrl?: string;
  postId: string;
  title?: string;
  captionsUrl?: string;
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
  const gestureRef = useRef<{
    active: boolean;
    mode: "seek" | "volume" | "brightness" | null;
    startX: number;
    startY: number;
    startTime: number;
    startVolume: number;
    startBrightness: number;
    startPosition: number;
  }>({
    active: false,
    mode: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    startVolume: 0,
    startBrightness: 0,
    startPosition: 0,
  });

  const [showControls, setShowControls] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<"left" | "right" | null>(null);
  const [gestureOverlay, setGestureOverlay] = useState<null | {
    type: "seek" | "volume" | "brightness";
    label: string;
    value: string;
  }>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [isLooping, setIsLooping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [playerHeight, setPlayerHeight] = useState(0);
  const [brightnessLevel, setBrightnessLevel] = useState(0.88);
  const [stableVolumeEnabled, setStableVolumeEnabled] = useState(false);
  const [stableVolumeStrength, setStableVolumeStrength] = useState<StableVolumeStrength>("medium");

  const {
    videoRef, isPlaying, isMuted, volume, progress, currentTime, duration,
    buffered, isLoading, isSeeking, error, playbackRate,
    togglePlay, toggleMute, setVolume, seek, seekSeconds, setIsSeeking,
    setPlaybackRate, videoEvents,
  } = useVideoPlayer({ postId, variant: "watch", title, videoUrl, thumbnailUrl });

  const { open: openMiniPlayer } = useMiniPlayer();
  const autoQuality = useNetworkQuality();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStableVolumeEnabled(localStorage.getItem("fx_stable_volume_enabled") === "true");
    const strength = localStorage.getItem("fx_stable_volume_strength");
    if (strength === "low" || strength === "medium" || strength === "high") {
      setStableVolumeStrength(strength);
    }
  }, []);

  // ── Quality ───────────────────────────────────────────────────────────────
  const availableQualities = useMemo(() => {
    if (!videoQualities) return [];
    const qualities = Object.keys(videoQualities);
    qualities.sort((a, b) => parseInt(b.replace('p', '')) - parseInt(a.replace('p', '')));
    return ["auto", ...qualities];
  }, [videoQualities]);

  const autoQualitySrc = useMemo(() => {
    if (!videoQualities || Object.keys(videoQualities).length === 0) return videoUrl;
    const sortedAvailable = Object.keys(videoQualities).sort(
      (a, b) => parseInt(b.replace('p', '')) - parseInt(a.replace('p', ''))
    );
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

  // ── Viewport detection ────────────────────────────────────────────────────
  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setPlayerHeight(rect.height);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    const ro =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(updateViewport)
        : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [videoRef, volume]);

  useStableVolume({
    mediaElementRef: videoRef,
    enabled: stableVolumeEnabled,
    strength: stableVolumeStrength,
    baseVolume: volume,
  });

  // Ambient canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = wrapperRef.current?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }, [ambientMode, playerHeight]);

  // Quality switch: preserve playback position
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

  // Loop
  useEffect(() => {
    if (videoRef.current) videoRef.current.loop = isLooping;
  }, [isLooping, videoRef]);

  // Captions
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

  // Ambient mode
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(24px) saturate(1.65) brightness(0.85)";
      if (!video.paused && !video.ended) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ambientFrameRef.current = requestAnimationFrame(draw);
    };
    ambientFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(ambientFrameRef.current);
  }, [ambientMode, videoRef]);

  // Picture-in-Picture
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const wasInPiP = !!document.pictureInPictureElement;
    try {
      if (wasInPiP) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
      toast({ title: wasInPiP ? "Picture-in-Picture off" : "Picture-in-Picture on" });
    } catch {}
  }, [toast, videoRef]);

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

  const handleToggleCaptions = useCallback((value: boolean) => {
    setCaptionsEnabled(value);
    toast({ title: value ? "Captions enabled" : "Captions disabled" });
  }, [toast]);

  const handleToggleAmbient = useCallback((value: boolean) => {
    setAmbientMode(value);
    toast({ title: value ? "Ambient mode on" : "Ambient mode off" });
  }, [toast]);

  const handleToggleLoop = useCallback((value: boolean) => {
    setIsLooping(value);
    toast({ title: value ? "Loop enabled" : "Loop disabled" });
  }, [toast]);

  const handleQualityChange = useCallback((quality: string) => {
    setSelectedQuality(quality);
    toast({
      title: "Quality updated",
      description: quality === "auto"
        ? `Auto · ${activeQualityLabel}`
        : `Switched to ${quality}`,
    });
  }, [activeQualityLabel, toast]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    toast({ title: rate === 1 ? "Normal speed" : `${rate}× speed` });
  }, [setPlaybackRate, toast]);

  const handleBrightnessChange = useCallback((value: number) => {
    setBrightnessLevel(value);
  }, []);

  const handleStableVolumeChange = useCallback((value: boolean) => {
    setStableVolumeEnabled(value);
    localStorage.setItem("fx_stable_volume_enabled", String(value));
    toast({ title: value ? "Stable Volume on" : "Stable Volume off" });
  }, [toast]);

  const handleStableVolumeStrengthChange = useCallback((value: StableVolumeStrength) => {
    setStableVolumeStrength(value);
    localStorage.setItem("fx_stable_volume_strength", value);
    toast({ title: "Stable Volume strength updated", description: value[0].toUpperCase() + value.slice(1) });
  }, [toast]);

  const handleResetStableVolume = useCallback(() => {
    setStableVolumeEnabled(false);
    setStableVolumeStrength("medium");
    localStorage.setItem("fx_stable_volume_enabled", "false");
    localStorage.setItem("fx_stable_volume_strength", "medium");
    toast({ title: "Stable Volume reset" });
  }, [toast]);

  // Fullscreen
  const lockLandscapeIfUseful = useCallback(async () => {
    if (isPortrait) return;
    try {
      const orientation = screen.orientation as any;
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

  const handleFullscreen = useCallback(async () => {
    setShowSettings(false);
    const wasFullscreen = !!document.fullscreenElement;
    await toggleFullScreen();
    toast({ title: wasFullscreen ? "Fullscreen off" : "Fullscreen on" });
  }, [toast, toggleFullScreen]);

  useEffect(() => {
    const h = () => {
      const fullScreen = !!document.fullscreenElement;
      setIsFullScreen(fullScreen);
      if (!fullScreen) { try { (screen.orientation as any).unlock?.(); } catch {} }
    };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (videoRef.current && !videoRef.current.paused) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), isMobile ? 2000 : 2500);
    }
  }, [isMobile, videoRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const hide = () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); setShowControls(false); };
    el.addEventListener("mousemove", resetControlsTimer);
    el.addEventListener("mouseleave", hide);
    return () => {
      el.removeEventListener("mousemove", resetControlsTimer);
      el.removeEventListener("mouseleave", hide);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // Keyboard
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

  useEffect(() => {
    if (!showSettings || isMobile) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-watch-settings]")) setShowSettings(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showSettings, isMobile]);

  const clamp = useCallback((value: number, min: number, max: number) => Math.max(min, Math.min(max, value)), []);

  const flashSeek = (dir: "left" | "right") => {
    setSeekIndicator(dir);
    setTimeout(() => setSeekIndicator(null), 700);
  };

  const setGestureState = useCallback((type: "seek" | "volume" | "brightness", label: string, value: string) => {
    setGestureOverlay({ type, label, value });
  }, []);

  const clearGestureState = useCallback(() => {
    setGestureOverlay(null);
    setIsSeeking(false);
  }, [setIsSeeking]);

  // Touch gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showSettings) return;
    const touch = e.touches[0];
    resetControlsTimer();
    gestureRef.current = {
      active: true,
      mode: null,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      startVolume: volume,
      startBrightness: brightnessLevel,
      startPosition: videoRef.current?.currentTime ?? 0,
    };
  }, [brightnessLevel, resetControlsTimer, showSettings, videoRef, volume]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.active || showSettings) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    const video = videoRef.current;
    if (!rect || !video) return;

    const dx = touch.clientX - gesture.startX;
    const dy = touch.clientY - gesture.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!gesture.mode && (absX > 8 || absY > 8)) {
      gesture.mode = absX >= absY ? "seek" : (gesture.startX > rect.width * 0.58 ? "volume" : "brightness");
      if (gesture.mode === "seek") setIsSeeking(true);
      e.preventDefault();
    }

    if (!gesture.mode) return;
    resetControlsTimer();

    if (gesture.mode === "seek") {
      const targetTime = clamp(gesture.startPosition + dx * 0.18, 0, duration || video.duration || 0);
      video.currentTime = targetTime;
      const seconds = Math.round(Math.abs(targetTime - gesture.startPosition));
      setGestureState("seek", dx < 0 ? "Rewind" : "Forward", `${seconds || 0}s`);
      if (dx < 0) flashSeek("left"); else flashSeek("right");
      e.preventDefault();
    } else if (gesture.mode === "volume") {
      const next = clamp(gesture.startVolume - dy / 280, 0, 1);
      setVolume(next);
      setGestureState("volume", "Volume", `${Math.round(next * 100)}%`);
      e.preventDefault();
    } else if (gesture.mode === "brightness") {
      const next = clamp(gesture.startBrightness - dy / 320, 0.65, 1);
      setBrightnessLevel(next);
      setGestureState("brightness", "Brightness", `${Math.round(next * 100)}%`);
      e.preventDefault();
    }
  }, [brightnessLevel, clamp, duration, setGestureState, setIsSeeking, setVolume, showSettings, videoRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const gesture = gestureRef.current;
    const touch = e.changedTouches[0];
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (gesture.active && gesture.mode) {
      clearGestureState();
      gesture.active = false;
      gesture.mode = null;
      resetControlsTimer();
      return;
    }

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
    gesture.active = false;
    gesture.mode = null;
  }, [clearGestureState, resetControlsTimer, seekSeconds, togglePlay]);

  const effectiveVolume = isMuted ? 0 : volume;
  const visible = showControls || !isPlaying || showSettings;
  const canUsePiP = typeof document !== "undefined" && "pictureInPictureEnabled" in document;

  /*
   * PLAYER ASPECT RATIO
   * ─────────────────────────────────────────────────────────────────────────
   * Always aspect-video (16:9) for the container — same as YouTube.
   * Portrait videos render with `object-contain` (set on the <video> element)
   * which letterboxes them inside the 16:9 black container.
   *
   * WHY: using aspect-[9/16] made the container NARROW (246px on a 400px
   * screen), exposing the purple page background on the sides. YouTube never
   * does this — it always uses a full-width 16:9 container.
   *
   * Fullscreen is the only exception: use the full viewport height.
   */
  const playerAspectClass = isFullScreen ? "h-[100svh]" : "aspect-video";

  const settingsTopOffset = isMobile ? playerHeight : 0;

  return (
    <TheaterModeContainer isTheaterMode={isTheaterMode}>
      {/*
       * WRAPPER
       * mt-0 / pt-0 override any margin/padding that TheaterModeContainer or
       * the watch-theater-expand CSS class may inject above the player.
       */}
      <div ref={wrapperRef} className="relative w-full overflow-visible mt-0 pt-0">
        {ambientMode && (
          <canvas
            ref={canvasRef}
            width={480} height={270}
            className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] -z-10 opacity-70 pointer-events-none"
            style={{ filter: "blur(42px) saturate(1.6) brightness(0.92)", transform: "scale(1.04)" }}
          />
        )}

        <div
          ref={containerRef}
          className={[
            "video-player relative w-full bg-black select-none",
            "transition-[height] duration-300 ease-out",
            "overflow-hidden",
            playerAspectClass,
            !visible ? "cursor-none" : "cursor-default",
          ].join(" ")}
          onDoubleClick={!isMobile ? toggleFullScreen : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            gestureRef.current.active = false;
            gestureRef.current.mode = null;
            clearGestureState();
          }}
          style={{ touchAction: "none" }}
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
            className="w-full h-full object-contain bg-black"
            playsInline
            preload="metadata"
            controlsList="nodownload"
            {...videoEvents}
          />
          <Watermark isAnimated={isPlaying} />

          {/* Brightness overlay */}
          {brightnessLevel < 1 && (
            <div
              className="absolute inset-0 z-[9] pointer-events-none bg-black"
              style={{ opacity: Math.min(0.45, (1 - brightnessLevel) * 1.15) }}
            />
          )}

          {/* Gesture overlay */}
          {gestureOverlay && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              <div className="rounded-3xl border border-white/10 bg-black/60 px-4 py-3 text-center backdrop-blur-xl shadow-2xl">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">{gestureOverlay.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{gestureOverlay.value}</p>
              </div>
            </div>
          )}

          {/* Seek flash */}
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

          {/* Click-to-play (desktop) */}
          <div className="absolute inset-0 z-10 hidden md:block" onClick={togglePlay} />

          {/* ── Controls overlay ── */}
          <div
            className={`absolute inset-0 z-20 flex flex-col justify-between pointer-events-none transition-[opacity] duration-300 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Top row: play + volume + quality badge */}
            <div className="px-2 pt-1 md:px-3 md:pt-3 flex items-start justify-between pointer-events-auto">
              <div
                className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Play/pause */}
                <button onClick={togglePlay} className="text-white/90 hover:text-white transition active:scale-90">
                  {isPlaying
                    ? <Pause size={18} className="md:w-5 md:h-5" fill="currentColor" />
                    : <Play  size={18} className="md:w-5 md:h-5" fill="currentColor" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="text-white/80 hover:text-white transition active:scale-90">
                    {effectiveVolume === 0
                      ? <VolumeX size={16} className="md:w-[18px] md:h-[18px]" />
                      : <Volume2 size={16} className="md:w-[18px] md:h-[18px]" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={effectiveVolume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="hidden md:block w-0 group-hover/vol:w-20 h-1 transition-all duration-300 appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.85) ${effectiveVolume*100}%, rgba(255,255,255,0.15) ${effectiveVolume*100}%)`
                    }}
                  />
                </div>
              </div>

              {/* Quality badge */}
              {availableQualities.length > 1 && (
                <div className="hidden sm:flex px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-semibold items-center gap-1">
                  {activeQualityLabel.toUpperCase()}
                  {selectedQuality === "auto" && (
                    <span className="text-[8px] text-accent-cyan/70 uppercase">auto</span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom: progress + controls */}
            <div
              className="bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-4 md:pt-10 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-0 md:px-3 mb-1 md:mb-2">
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

              <div className="flex items-center justify-end px-2 md:px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-3 gap-2 md:gap-3 text-white/85">
                {/* Theater (desktop) */}
                <button
                  onClick={() => setIsTheaterMode(p => !p)}
                  className={`hidden md:flex p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${isTheaterMode ? "text-purple-400" : ""}`}
                  title="Theater mode (T)"
                >
                  <Youtube size={17} />
                </button>

                {/* PiP (desktop) */}
                {canUsePiP && (
                  <button
                    onClick={togglePiP}
                    className={`hidden md:flex p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition ${isPiP ? "text-purple-400" : ""}`}
                    title="Picture in picture"
                  >
                    <PictureInPicture2 size={17} />
                  </button>
                )}

                {/* Mini player (mobile) */}
                <button
                  onClick={() => openMiniPlayer({ postId, videoUrl, title, isFlow: false })}
                  className="flex md:hidden p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition active:scale-90"
                  title="Mini Player"
                >
                  <MiniPlayerIcon />
                </button>

                {/* Mini player (desktop) */}
                <button
                  onClick={() => openMiniPlayer({ postId, videoUrl, title, isFlow: false })}
                  className="hidden md:flex p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
                  title="Mini Player"
                >
                  <MiniPlayerIcon />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullScreen}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition active:scale-90"
                  title="Fullscreen (F)"
                >
                  {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>

                {/* Settings */}
                <button
                  onClick={() => setShowSettings((p) => !p)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  data-watch-settings
                  className={`p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition active:scale-90 ${
                    showSettings ? "text-purple-400 rotate-45" : "text-white/85"
                  } duration-300`}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Settings"
                >
                  <Settings size={17} />
                </button>
              </div>
            </div>

            {/* Settings panel */}
            <div className="pointer-events-none absolute inset-0 z-[60]">
              <WatchSettingsPanel
                open={showSettings}
                isMobile={isMobile}
                topOffset={settingsTopOffset}
                onClose={() => setShowSettings(false)}
                availableQualities={availableQualities}
                selectedQuality={selectedQuality}
                activeQualityLabel={activeQualityLabel}
                onQualityChange={handleQualityChange}
                playbackRate={playbackRate}
                onPlaybackRateChange={handlePlaybackRateChange}
                isLooping={isLooping}
                onLoopChange={handleToggleLoop}
                ambientMode={ambientMode}
                onAmbientChange={handleToggleAmbient}
                captionsUrl={captionsUrl}
                captionsEnabled={captionsEnabled}
                onCaptionsChange={handleToggleCaptions}
                onMiniPlayer={() => {
                  setShowSettings(false);
                  openMiniPlayer({ postId, videoUrl, title, isFlow: false });
                }}
                onFullscreen={handleFullscreen}
                isFullScreen={isFullScreen}
                onPiP={canUsePiP ? () => { setShowSettings(false); void togglePiP(); } : undefined}
                isPiP={isPiP}
                brightnessLevel={brightnessLevel}
                onBrightnessChange={handleBrightnessChange}
                stableVolumeEnabled={stableVolumeEnabled}
                onStableVolumeChange={handleStableVolumeChange}
                stableVolumeStrength={stableVolumeStrength}
                onStableVolumeStrengthChange={handleStableVolumeStrengthChange}
                onResetStableVolume={handleResetStableVolume}
                networkQuality={autoQuality}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .video-player input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.6);
        }
        .video-player input[type="range"]::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #a855f7;
          border: none;
          cursor: pointer;
        }
        .seek-flash {
          animation: seekFlash 0.6s ease-out forwards;
        }
        @keyframes seekFlash {
          0%   { opacity: 1; transform: translateY(-50%) scale(1); }
          60%  { opacity: 0.8; transform: translateY(-50%) scale(1.15); }
          100% { opacity: 0; transform: translateY(-50%) scale(0.9); }
        }
      `}</style>
    </TheaterModeContainer>
  );
}

function MiniPlayerIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <rect x="12" y="10" width="9" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.5"/>
    </svg>
  );
}
