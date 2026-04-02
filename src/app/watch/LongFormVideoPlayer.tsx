"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, Clock, Loader2, AlertTriangle, Youtube
} from 'lucide-react';
import { OptimizedVideo } from '@/components/OptimizedVideo';
import { Watermark } from '@/components/video/Watermark';
import { TheaterModeContainer } from '@/components/video/TheaterModeContainer';
import { doc, updateDoc, increment, getFirestore } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';

const db = getFirestore(app);
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface LongFormVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  postId: string;
  title?: string;
}

export function LongFormVideoPlayer({ videoUrl, thumbnailUrl, postId, title }: LongFormVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- States ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [error, setError] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // --- Analytics ---
  const logView = useCallback(() => {
    if (!postId || typeof window === 'undefined') return;
    try {
      const viewed = JSON.parse(localStorage.getItem('viewed_ids') || '[]');
      if (viewed.includes(postId)) return;

      const postRef = doc(db, 'posts', postId);
      updateDoc(postRef, { viewCount: increment(1) }).then(() => {
        localStorage.setItem('viewed_ids', JSON.stringify([...viewed, postId]));
      });
    } catch (e) { console.error("Analytics Error:", e); }
  }, [postId]);

  // --- Action Handlers ---
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    }
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Failed to enter fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleTheaterMode = () => setIsTheaterMode(prev => !prev);

  const handlePlaybackRateChange = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const nextRate = PLAYBACK_RATES[nextIndex];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && duration > 0) {
      const time = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Effects & Listeners ---
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onSeeked = () => setIsSeeking(false);
    const updateBuffer = () => {
      if (v.duration > 0 && v.buffered.length > 0) {
        setBuffer((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) return;
      
      const lowerKey = e.key.toLowerCase();
      if (lowerKey !== ' ' && !/^[fkmtlj]$/.test(lowerKey) && !/^[0-9]$/.test(lowerKey) && !/arrow(left|right)/.test(lowerKey)) return;
      
      e.preventDefault();
      switch (lowerKey) {
        case ' ': case 'k': togglePlay(); break;
        case 'm': setIsMuted(prev => !prev); break;
        case 'f': toggleFullScreen(); break;
        case 't': toggleTheaterMode(); break;
        case 'arrowright': case 'l': v.currentTime = Math.min(v.duration, v.currentTime + 5); break;
        case 'arrowleft': case 'j': v.currentTime = Math.max(0, v.currentTime - 5); break;
        case '0': v.currentTime = 0; break;
        case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
          v.currentTime = v.duration * (parseInt(e.key) / 10); break;
      }
    };

    window.addEventListener('keydown', onKey);
    v.addEventListener('progress', updateBuffer);
    v.addEventListener('seeked', onSeeked);
    return () => {
      window.removeEventListener('keydown', onKey);
      v.removeEventListener('progress', updateBuffer);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [duration, togglePlay, toggleFullScreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const hide = () => setShowControls(false);

    const handler = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(hide, 2500); // Shortened timeout
      }
    };

    container.addEventListener('mousemove', handler);
    container.addEventListener('mouseleave', hide);
    return () => {
      container.removeEventListener('mousemove', handler);
      container.removeEventListener('mouseleave', hide);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const showSpinner = isLoading || isSeeking;

  return (
    <TheaterModeContainer isTheaterMode={isTheaterMode}>
      <div 
        ref={containerRef}
        className={`relative w-full aspect-video bg-black overflow-hidden group select-none ${!showControls && isPlaying && !showSpinner ? 'cursor-none' : 'cursor-default'}`}
        onDoubleClick={toggleFullScreen}
      >
        {showSpinner && !error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
            <AlertTriangle className="text-yellow-500 mb-2" size={40} />
            <p>Video failed to load</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm underline opacity-70 hover:opacity-100">Try again</button>
          </div>
        )}

        <OptimizedVideo
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-contain"
          onPlay={() => { setIsPlaying(true); logView(); }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => { setDuration(videoRef.current?.duration || 0); setIsLoading(false); }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => { setIsLoading(false); setIsSeeking(false); }}
          onError={() => setError(true)}
        />
        <Watermark isAnimated={isPlaying} />

        {/* Click-to-Play Overlay */}
        <div 
          className="absolute inset-0 z-10"
          onClick={togglePlay}
        />

        {/* Controls Overlay */}
        <div 
          className={`absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="px-4 mb-2" onMouseDown={(e) => e.stopPropagation()}>
            <div className="relative w-full h-1.5 group/progress cursor-pointer flex items-center">
              <div className="absolute h-full bg-white/20 rounded-full w-full" />
              <div className="absolute h-full bg-white/40 rounded-full transition-all" style={{ width: `${buffer}%` }} />
              <div className="absolute h-full bg-cyan-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cyan-500 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg" />
              </div>
              <input 
                type="range" min="0" max="100" step="0.1"
                value={(currentTime / duration) * 100 || 0}
                onMouseDown={() => setIsSeeking(true)}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-3" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-cyan-500 transition">
                {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
              </button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={() => setIsMuted(!isMuted)}>
                  {isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                </button>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (videoRef.current) videoRef.current.volume = val;
                    setIsMuted(val === 0);
                  }}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-cyan-500"
                />
              </div>
              <div className="text-sm font-medium font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handlePlaybackRateChange}
                className="flex items-center gap-1 text-sm font-bold bg-transparent px-2 py-1 rounded transition-colors"
                title="Playback Speed"
              >
                <span className="w-10 text-center">{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
              </button>
              <button onClick={toggleTheaterMode} title="Theater Mode (t)" className="hover:text-cyan-500 transition">
                <Youtube size={20} className={isTheaterMode ? 'text-cyan-500' : ''}/>
              </button>
              <button onClick={toggleFullScreen} title="Fullscreen (f)" className="hover:scale-110 transition">
                {isFullScreen ? <Minimize size={20}/> : <Maximize size={20}/>}
              </button>
              <button title="Settings" className="hover:rotate-45 transition">
                <Settings size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TheaterModeContainer>
  );
}
