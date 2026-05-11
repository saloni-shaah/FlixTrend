'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full bg-white/70 transition-all ${
            playing ? 'animate-wave' : 'h-1 opacity-40'
          }`}
          style={{
            animationDelay: `${i * 0.12}s`,
            height: playing ? undefined : '4px',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; opacity: 0.5; }
          50%       { height: 14px; opacity: 1; }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function AudioPlayer({ src, isUser }: { src: string; isUser: boolean }) {
  const audioRef    = useRef<HTMLAudioElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [speed,     setSpeed]     = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [ripple,    setRipple]    = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDuration(a.duration);
    const onTime = () => { if (!dragging) setProgress(a.currentTime); };
    const onEnd  = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate',     onTime);
    a.addEventListener('ended',          onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate',     onTime);
      a.removeEventListener('ended',          onEnd);
    };
  }, [dragging]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const seekTo = useCallback((clientX: number) => {
    const a   = audioRef.current;
    const bar = barRef.current;
    if (!a || !bar || !duration) return;
    const r = bar.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration;
    a.currentTime = t;
    setProgress(t);
  }, [duration]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragging(true);
    seekTo(e.clientX);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => seekTo(e.clientX);
    const onUp   = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [dragging, seekTo]);

  const applySpeed = (s: number) => {
    setSpeed(s);
    setSpeedOpen(false);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const remaining = duration - progress;

  return (
    <div
      className="flex items-center gap-2.5 min-w-[220px] max-w-sm select-none"
      onClick={e => e.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Play/Pause with ripple */}
      <button
        onClick={toggle}
        className="relative p-2 rounded-full flex-shrink-0 hover:bg-white/15 active:scale-90 transition-all duration-150"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        {ripple && (
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {/* Waveform + Time row */}
        <div className="flex items-center justify-between">
          <WaveformBars playing={playing} />
          <span className="text-[10px] font-mono opacity-50 tabular-nums">
            {fmt(progress)} / {fmt(duration)}
          </span>
        </div>

        {/* Seek bar */}
        <div
          ref={barRef}
          className="h-1.5 rounded-full bg-white/15 cursor-pointer relative group"
          onMouseDown={onMouseDown}
        >
          {/* Buffered shimmer effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>

          {/* Progress fill */}
          <div
            className="h-1.5 rounded-full relative overflow-hidden"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-white/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-glint" />
          </div>

          {/* Thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none transition-transform duration-100 ${
              dragging ? 'scale-125' : 'scale-100 group-hover:scale-110'
            }`}
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
      </div>

      {/* Speed selector */}
      <div className="relative flex-shrink-0">
        <button
          onClick={e => { e.stopPropagation(); setSpeedOpen(o => !o); }}
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors tracking-tight"
        >
          {speed}×
        </button>
        {speedOpen && (
          <div className="absolute bottom-full right-0 mb-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); applySpeed(s); }}
                className={`block w-full text-left px-3 py-1 text-[11px] font-mono hover:bg-white/10 transition-colors ${
                  s === speed ? 'text-white font-bold' : 'text-white/60'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes glint {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 2s linear infinite; }
        .animate-glint   { animation: glint 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}