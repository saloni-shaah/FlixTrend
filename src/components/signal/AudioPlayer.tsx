'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

export function AudioPlayer({ src, isUser }: { src: string; isUser: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDuration(a.duration);
    const onTime = () => setProgress(a.currentTime);
    const onEnd  = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate',     onTime);
    a.addEventListener('ended',          onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate',     onTime);
      a.removeEventListener('ended',          onEnd);
    };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a || !duration) return;
    const r   = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * duration;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-2 min-w-[180px] max-w-xs"
      onClick={e => e.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        onClick={toggle}
        className="p-1.5 rounded-full flex-shrink-0 hover:bg-white/10 transition-colors"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Seek bar */}
      <div
        className="flex-1 h-1.5 rounded-full bg-white/20 cursor-pointer relative"
        onClick={seek}
      >
        <div
          className="h-1.5 rounded-full bg-white/80 transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      <span className="text-[11px] font-mono opacity-40 w-10 text-right flex-shrink-0">
        {fmt(duration - progress)}
      </span>
    </div>
  );
}