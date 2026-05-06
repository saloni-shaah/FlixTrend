'use client';
import { useState, useRef, useCallback, useEffect } from "react";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { trackView } from "@/lib/viewProcessor";

const db = getFirestore(app);

let _activeVideo: HTMLVideoElement | null = null;

export const setGlobalActiveVideo = (video: HTMLVideoElement | null) => {
  if (_activeVideo && _activeVideo !== video) {
    _activeVideo.pause();
  }
  _activeVideo = video;
};

export type PlayerVariant = "feed" | "flow" | "watch" | "mini";

interface UseVideoPlayerOptions {
  postId: string;
  variant: PlayerVariant;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export function useVideoPlayer({
  postId,
  variant,
  title,
  videoUrl,
  thumbnailUrl,
}: UseVideoPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const viewTrackedRef = useRef(false);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHistoryUpdateRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMutedState] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("fx_muted") === "true";
  });
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 1;
    return parseFloat(localStorage.getItem("fx_volume") || "1");
  });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [error, setError] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // ─── View tracking (7s threshold via API → processor) ──────────────────
  const startViewTimer = useCallback(() => {
    if (viewTrackedRef.current || !postId) return;
    if (viewTimerRef.current) return;
    viewTimerRef.current = setTimeout(() => {
      if (!viewTrackedRef.current) {
        viewTrackedRef.current = true;
        trackView(postId, auth.currentUser?.uid);
      }
    }, 7000);
  }, [postId]);

  const cancelViewTimer = useCallback(() => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  }, []);

  // ─── Watch history (long-form only) ────────────────────────────────────
  const updateWatchHistory = useCallback(async () => {
    if (variant !== "watch") return;
    const user = auth.currentUser;
    const video = videoRef.current;
    if (!user || !video || !postId || video.duration <= 0) return;

    const now = Date.now();
    const isComplete = video.currentTime >= video.duration - 5;
    if (!isComplete && now - lastHistoryUpdateRef.current < 15000) return;
    lastHistoryUpdateRef.current = now;

    const today = new Date().toISOString().slice(0, 10);
    await setDoc(
      doc(db, "users", user.uid, "watchHistory", today),
      {
        [postId]: {
          lastPosition: Math.floor(video.currentTime),
          watched: isComplete,
          watchedAt: new Date().toISOString(),
          title: title || "",
          videoUrl: videoUrl || "",
          thumbnailUrl: thumbnailUrl || "",
        },
      },
      { merge: true }
    ).catch(() => {});
  }, [postId, variant, title, videoUrl, thumbnailUrl]);

  // ─── Playback helpers ───────────────────────────────────────────────────
  const safePlay = useCallback(async (video: HTMLVideoElement) => {
    try {
      await video.play();
    } catch (e: any) {
      if (e.name === "AbortError") return;
      if (e.name === "NotAllowedError") {
        video.muted = true;
        setIsMutedState(true);
        localStorage.setItem("fx_muted", "true");
        try { await video.play(); } catch {}
      }
    }
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setGlobalActiveVideo(video);
    safePlay(video);
  }, [safePlay]);

  const pause = useCallback(() => videoRef.current?.pause(), []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? play() : pause();
  }, [play, pause]);

  const setMuted = useCallback((muted: boolean) => {
    const video = videoRef.current;
    if (video) video.muted = muted;
    setIsMutedState(muted);
    localStorage.setItem("fx_muted", String(muted));
  }, []);

  const toggleMute = useCallback(() => setMuted(!isMuted), [isMuted, setMuted]);

  const setVolume = useCallback(
    (vol: number) => {
      const video = videoRef.current;
      if (video) video.volume = vol;
      setVolumeState(vol);
      localStorage.setItem("fx_volume", String(vol));
      setMuted(vol === 0);
    },
    [setMuted]
  );

  const seek = useCallback((pct: number) => {
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = (pct / 100) * video.duration;
      setProgress(pct);
    }
  }, []);

  const seekSeconds = useCallback((delta: number) => {
    const video = videoRef.current;
    if (video)
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next =
      PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(playbackRate) + 1) % PLAYBACK_RATES.length];
    video.playbackRate = next;
    setPlaybackRateState(next);
  }, [playbackRate]);

  // ─── Tap helper ─────────────────────────────────────────────────────────
  const handleTap = useCallback(
    (onSingle: () => void, onDouble: () => void) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (tapTimeout.current) {
          clearTimeout(tapTimeout.current);
          tapTimeout.current = null;
          onDouble();
          return;
        }
        tapTimeout.current = setTimeout(() => {
          onSingle();
          tapTimeout.current = null;
        }, 250);
      },
    []
  );

  // ─── Video event handlers ────────────────────────────────────────────────
  const videoEvents = {
    onPlay: () => {
      setIsPlaying(true);
      startViewTimer();
    },
    onPause: () => {
      setIsPlaying(false);
      cancelViewTimer();
    },
    onEnded: () => {
      setIsPlaying(false);
      cancelViewTimer();
    },
    onTimeUpdate: () => {
      const video = videoRef.current;
      if (!video || !video.duration || isSeeking) return;
      setProgress((video.currentTime / video.duration) * 100);
      setCurrentTime(video.currentTime);
      updateWatchHistory();
    },
    onLoadedMetadata: () => {
      const video = videoRef.current;
      if (!video) return;
      setDuration(video.duration);
      setIsVertical(video.videoHeight > video.videoWidth);
      setIsLoading(false);
    },
    onWaiting: () => setIsLoading(true),
    onPlaying: () => {
      setIsLoading(false);
      setIsSeeking(false);
    },
    onProgress: () => {
      const video = videoRef.current;
      if (!video || !video.duration || !video.buffered.length) return;
      setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
    },
    onError: () => setError(true),
    onSeeked: () => setIsSeeking(false),
  };

  // ─── Effect Hooks ────────────────────────────────────────────────────────
  useEffect(() => {
    if (variant !== "feed") return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGlobalActiveVideo(video);
          video.muted = isMuted;
          safePlay(video);
        } else {
          video.pause();
          setIsPlaying(false);
          cancelViewTimer();
        }
      },
      { threshold: 0.7 }
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      if (_activeVideo === video) _activeVideo = null;
    };
  }, [variant, safePlay, isMuted, cancelViewTimer]);

  useEffect(() => {
      const video = videoRef.current;
      if (video) video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => () => cancelViewTimer(), [cancelViewTimer]);

  return {
    videoRef,
    isPlaying,
    isMuted,
    volume,
    progress,
    currentTime,
    duration,
    buffered,
    isLoading,
    isSeeking,
    isVertical,
    error,
    playbackRate,
    play,
    pause,
    togglePlay,
    toggleMute,
    setMuted,
    setVolume,
    seek,
    seekSeconds,
    setIsSeeking,
    cyclePlaybackRate,
    handleTap,
    videoEvents,
  };
}
